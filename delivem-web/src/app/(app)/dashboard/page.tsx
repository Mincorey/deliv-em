import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { TaskCard } from '@/components/tasks/TaskCard'
import { Avatar } from '@/components/ui/Avatar'
import type { Profile, CourierProfile, TaskWithProfiles } from '@/lib/types'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/auth')

  if (profile.role === 'courier') {
    return <CourierDashboard profile={profile as Profile} userId={user.id} />
  }

  return <CustomerDashboard profile={profile as Profile} userId={user.id} />
}

async function CustomerDashboard({
  profile,
  userId,
}: {
  profile: Profile
  userId: string
}) {
  const supabase = await createClient()

  const { data: activeTasks } = await supabase
    .from('tasks')
    .select(
      `*, customer:profiles!tasks_customer_id_fkey(*), courier:profiles!tasks_courier_id_fkey(*)`
    )
    .eq('customer_id', userId)
    .in('status', ['published', 'matched', 'in_progress'])
    .order('created_at', { ascending: false })
    .limit(5)

  const { data: recentTasks } = await supabase
    .from('tasks')
    .select(
      `*, customer:profiles!tasks_customer_id_fkey(*), courier:profiles!tasks_courier_id_fkey(*)`
    )
    .eq('customer_id', userId)
    .in('status', ['completed', 'cancelled'])
    .order('completed_at', { ascending: false })
    .limit(5)

  const { count: totalCompleted } = await supabase
    .from('tasks')
    .select('id', { count: 'exact', head: true })
    .eq('customer_id', userId)
    .eq('status', 'completed')

  const firstName = profile.full_name.split(' ')[0]

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h2
          style={{
            fontSize: '1.6rem',
            fontWeight: 800,
            color: '#00236f',
            letterSpacing: '-0.02em',
          }}
        >
          Добро пожаловать, {firstName} 👋
        </h2>
        <p className="text-sm mt-1" style={{ color: '#757682' }}>
          Вот что происходит с вашими поручениями
        </p>
      </div>

      {/* Stats */}
      <div
        className="grid gap-4 mb-6"
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}
      >
        <div className="bg-white rounded-2xl p-5">
          <p className="label-sm">Баланс кошелька</p>
          <div className="flex items-end gap-1 mt-1">
            <span style={{ fontSize: '1.8rem', fontWeight: 900, color: '#00236f' }}>
              {Math.round(profile.wallet_balance)}
            </span>
            <span className="text-sm font-bold mb-1" style={{ color: '#757682' }}>₽</span>
          </div>
          <Link href="/wallet">
            <button className="mt-3 btn-ghost text-xs" style={{ padding: '6px 12px' }}>
              Пополнить
            </button>
          </Link>
        </div>

        <div className="bg-white rounded-2xl p-5">
          <p className="label-sm">Активные поручения</p>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#006c49' }} className="mt-1">
            {activeTasks?.length ?? 0}
          </div>
          <Link href="/tasks">
            <button className="mt-3 btn-ghost text-xs" style={{ padding: '6px 12px' }}>
              Смотреть
            </button>
          </Link>
        </div>

        <div className="bg-white rounded-2xl p-5">
          <p className="label-sm">Выполнено всего</p>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#191c1e' }} className="mt-1">
            {totalCompleted ?? 0}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 flex flex-col justify-between">
          <p className="label-sm">Новое поручение</p>
          <Link href="/tasks/create">
            <button className="btn-green text-sm mt-3">
              <span className="material-symbols-outlined text-base">add</span> Создать
            </button>
          </Link>
        </div>
      </div>

      {/* Active tasks */}
      {(activeTasks?.length ?? 0) > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-base">Активные поручения</h3>
            <Link href="/tasks" className="text-xs font-bold" style={{ color: '#006c49' }}>
              Все →
            </Link>
          </div>
          <div className="flex flex-col gap-3">
            {activeTasks!.map((task) => (
              <TaskCard
                key={task.id}
                task={task as unknown as TaskWithProfiles}
                showCourier
              />
            ))}
          </div>
        </div>
      )}

      {/* Recent */}
      {(recentTasks?.length ?? 0) > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-base">Последние поручения</h3>
            <Link href="/orders" className="text-xs font-bold" style={{ color: '#006c49' }}>
              Архив →
            </Link>
          </div>
          <div className="flex flex-col gap-3">
            {recentTasks!.map((task) => (
              <TaskCard key={task.id} task={task as unknown as TaskWithProfiles} showCourier />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {(activeTasks?.length ?? 0) === 0 && (recentTasks?.length ?? 0) === 0 && (
        <div className="text-center py-16">
          <span
            className="material-symbols-outlined"
            style={{ fontSize: '4rem', color: '#c5c5d3' }}
          >
            task_alt
          </span>
          <p className="font-bold mt-3" style={{ color: '#757682' }}>
            Пока нет поручений
          </p>
          <p className="text-sm mt-1 mb-5" style={{ color: '#c5c5d3' }}>
            Создайте первое — курьеры уже готовы помочь
          </p>
          <Link href="/tasks/create">
            <button className="btn-green">
              <span className="material-symbols-outlined text-base">add</span>
              Создать поручение
            </button>
          </Link>
        </div>
      )}
    </div>
  )
}

async function CourierDashboard({
  profile,
  userId,
}: {
  profile: Profile
  userId: string
}) {
  const supabase = await createClient()

  const { data: courierProfile } = await supabase
    .from('courier_profiles')
    .select('*')
    .eq('id', userId)
    .single()

  const { data: newTasks } = await supabase
    .from('tasks')
    .select(
      `*, customer:profiles!tasks_customer_id_fkey(*), courier:profiles!tasks_courier_id_fkey(*)`
    )
    .eq('status', 'published')
    .neq('customer_id', userId)
    .order('created_at', { ascending: false })
    .limit(5)

  const { data: activeTask } = await supabase
    .from('tasks')
    .select('*')
    .eq('courier_id', userId)
    .in('status', ['matched', 'in_progress'])
    .limit(1)
    .single()

  const cp = courierProfile as CourierProfile | null
  const firstName = profile.full_name.split(' ')[0]

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h2
          style={{ fontSize: '1.6rem', fontWeight: 800, color: '#00236f', letterSpacing: '-0.02em' }}
        >
          Привет, {firstName} 👋
        </h2>
        <p className="text-sm mt-1" style={{ color: '#757682' }}>
          Ваша статистика и новые задания
        </p>
      </div>

      <div
        className="grid gap-4 mb-6"
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}
      >
        <div className="bg-white rounded-2xl p-5">
          <p className="label-sm">Мой рейтинг</p>
          <div className="flex items-center gap-1 mt-1">
            <span style={{ fontSize: '1.8rem', fontWeight: 900, color: '#f59e0b' }}>
              {cp?.rating?.toFixed(1) ?? '5.0'}
            </span>
            <span className="material-symbols-outlined fill-icon" style={{ color: '#f59e0b' }}>
              star
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5">
          <p className="label-sm">Выполнено</p>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#006c49' }} className="mt-1">
            {cp?.completed_tasks ?? 0}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5">
          <p className="label-sm">Активное задание</p>
          <div style={{ fontSize: '1.1rem', fontWeight: 700 }} className="mt-1">
            {activeTask ? '1 задание' : 'Нет'}
          </div>
          {activeTask && (
            <Link href={`/tasks/${activeTask.id}`}>
              <button className="mt-2 btn-ghost text-xs" style={{ padding: '6px 12px' }}>
                Открыть
              </button>
            </Link>
          )}
        </div>

        <div className="bg-white rounded-2xl p-5">
          <p className="label-sm">Статус</p>
          <div className="flex items-center gap-2 mt-2">
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: 9999,
                background: cp?.is_available ? '#006c49' : '#757682',
                boxShadow: cp?.is_available ? '0 0 0 3px #6cf8bb55' : 'none',
              }}
            />
            <span className="font-bold text-sm" style={{ color: cp?.is_available ? '#006c49' : '#757682' }}>
              {cp?.is_available ? 'Онлайн' : 'Оффлайн'}
            </span>
          </div>
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-bold text-base">Новые поручения</h3>
        <Link href="/tasks" className="text-xs font-bold" style={{ color: '#006c49' }}>
          Все задания →
        </Link>
      </div>

      {(newTasks?.length ?? 0) > 0 ? (
        <div className="flex flex-col gap-3">
          {newTasks!.map((task) => (
            <TaskCard
              key={task.id}
              task={task as unknown as TaskWithProfiles}
              showCustomer
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <span className="material-symbols-outlined" style={{ fontSize: '3rem', color: '#c5c5d3' }}>
            search
          </span>
          <p className="font-bold mt-3" style={{ color: '#757682' }}>Новых заданий нет</p>
          <p className="text-sm mt-1" style={{ color: '#c5c5d3' }}>Проверьте позже</p>
        </div>
      )}
    </div>
  )
}
