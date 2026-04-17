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

async function CustomerDashboard({ profile, userId }: { profile: Profile; userId: string }) {
  const supabase = await createClient()

  const { data: activeTasks } = await supabase
    .from('tasks')
    .select(`*, customer:profiles!tasks_customer_id_fkey(*), courier:profiles!tasks_courier_id_fkey(*)`)
    .eq('customer_id', userId)
    .in('status', ['published', 'matched', 'in_progress', 'awaiting_confirmation'])
    .order('created_at', { ascending: false })
    .limit(10)

  const { data: recentTasks } = await supabase
    .from('tasks')
    .select(`*, customer:profiles!tasks_customer_id_fkey(*), courier:profiles!tasks_courier_id_fkey(*)`)
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
    <div className="mobile-page-pad p-6 max-w-5xl mx-auto">
      <div className="mb-6 page-header">
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--brand-text)', letterSpacing: '-0.02em' }}>
          Добро пожаловать, {firstName}
        </h2>
        <p className="text-sm mt-1" style={{ color: 'var(--text-3)' }}>
          Вот что происходит с вашими поручениями
        </p>
      </div>

      {/* Awaiting confirmation banner */}
      {activeTasks?.filter(t => t.status === 'awaiting_confirmation').map((task) => (
        <Link key={task.id} href={`/tasks/${task.id}`} style={{ textDecoration: 'none', display: 'block', marginBottom: '1rem' }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(245,158,11,0.06))',
            border: '1.5px solid rgba(245,158,11,0.4)',
            borderRadius: '1rem',
            padding: '1rem 1.25rem',
            display: 'flex', alignItems: 'center', gap: 14,
            cursor: 'pointer',
            transition: 'border-color 0.15s',
          }}>
            <span className="material-symbols-outlined fill-icon flex-shrink-0" style={{ fontSize: 28, color: '#f59e0b' }}>
              task_alt
            </span>
            <div className="flex-1 min-w-0">
              <p style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-1)' }}>
                Требует вашего подтверждения
              </p>
              <p className="truncate" style={{ fontSize: '0.8rem', color: 'var(--text-3)', marginTop: 2 }}>
                {(task as unknown as TaskWithProfiles).title}
              </p>
            </div>
            <div style={{
              background: '#f59e0b', color: '#fff',
              borderRadius: '0.6rem', padding: '6px 14px',
              fontSize: '0.8rem', fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0,
            }}>
              Подтвердить →
            </div>
          </div>
        </Link>
      ))}

      {/* Stats — 1 col mobile / 3 col desktop */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        {/* Balance */}
        <div className="stat-card card-enter">
          <p className="label-sm">Баланс кошелька</p>
          <div className="flex items-end gap-1 mt-2">
            <span style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--brand-text)', lineHeight: 1 }}>
              {Math.round(profile.wallet_balance)}
            </span>
            <span className="text-sm font-bold mb-0.5" style={{ color: 'var(--text-3)' }}>₽</span>
          </div>
          <Link href="/wallet">
            <button className="mt-3 btn-ghost text-xs" style={{ padding: '6px 14px' }}>
              Пополнить
            </button>
          </Link>
        </div>

        {/* Active tasks */}
        <div className="stat-card card-enter">
          <p className="label-sm">Активные поручения</p>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--green)', lineHeight: 1 }} className="mt-2">
            {activeTasks?.length ?? 0}
          </div>
          <Link href="/tasks">
            <button className="mt-3 btn-ghost text-xs" style={{ padding: '6px 14px' }}>
              Смотреть
            </button>
          </Link>
        </div>

        {/* Completed */}
        <div className="stat-card card-enter">
          <p className="label-sm">Выполнено всего</p>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-1)', lineHeight: 1 }} className="mt-2">
            {totalCompleted ?? 0}
          </div>
          <Link href="/orders?filter=completed">
            <button className="mt-3 btn-ghost text-xs" style={{ padding: '6px 14px' }}>
              Смотреть
            </button>
          </Link>
        </div>
      </div>

      {/* Active tasks list */}
      {(activeTasks?.length ?? 0) > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-base" style={{ color: 'var(--text-1)' }}>Активные поручения</h3>
            <Link href="/tasks" className="text-xs font-bold" style={{ color: 'var(--green)' }}>
              Все →
            </Link>
          </div>
          <div className="flex flex-col gap-3">
            {activeTasks!.map((task) => (
              <div key={task.id} className="card-enter">
                <TaskCard task={task as unknown as TaskWithProfiles} showCourier currentUserId={userId} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent tasks */}
      {(recentTasks?.length ?? 0) > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-base" style={{ color: 'var(--text-1)' }}>Последние поручения</h3>
            <Link href="/orders" className="text-xs font-bold" style={{ color: 'var(--green)' }}>
              Архив →
            </Link>
          </div>
          <div className="flex flex-col gap-3">
            {recentTasks!.map((task) => (
              <div key={task.id} className="card-enter">
                <TaskCard task={task as unknown as TaskWithProfiles} showCourier />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {(activeTasks?.length ?? 0) === 0 && (recentTasks?.length ?? 0) === 0 && (
        <div className="text-center py-16">
          <span className="material-symbols-outlined icon-float" style={{ fontSize: '4rem', color: 'var(--text-3)' }}>
            task_alt
          </span>
          <p className="font-bold mt-3" style={{ color: 'var(--text-2)' }}>Пока нет поручений</p>
          <p className="text-sm mt-1 mb-5" style={{ color: 'var(--text-3)' }}>
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

async function CourierDashboard({ profile, userId }: { profile: Profile; userId: string }) {
  const supabase = await createClient()

  const { data: courierProfile } = await supabase
    .from('courier_profiles')
    .select('*')
    .eq('id', userId)
    .single()

  const { data: newTasks } = await supabase
    .from('tasks')
    .select(`*, customer:profiles!tasks_customer_id_fkey(*), courier:profiles!tasks_courier_id_fkey(*)`)
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
      <div className="mb-6 page-header">
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--brand-text)', letterSpacing: '-0.02em' }}>
          Привет, {firstName}
        </h2>
        <p className="text-sm mt-1" style={{ color: 'var(--text-3)' }}>
          Ваша статистика и новые задания
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6 sm:grid-cols-4">
        <div className="stat-card card-enter">
          <p className="label-sm">Мой рейтинг</p>
          <div className="flex items-center gap-1 mt-2">
            <span style={{ fontSize: '1.8rem', fontWeight: 900, color: '#f59e0b', lineHeight: 1 }}>
              {cp?.rating?.toFixed(1) ?? '5.0'}
            </span>
            <span className="material-symbols-outlined fill-icon" style={{ color: '#f59e0b', fontSize: 18 }}>star</span>
          </div>
        </div>

        <div className="stat-card card-enter">
          <p className="label-sm">Выполнено</p>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--green)', lineHeight: 1 }} className="mt-2">
            {cp?.completed_tasks ?? 0}
          </div>
        </div>

        <div className="stat-card card-enter">
          <p className="label-sm">Активное задание</p>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-1)' }} className="mt-2">
            {activeTask ? '1 задание' : 'Нет'}
          </div>
          {activeTask && (
            <Link href={`/tasks/${activeTask.id}`}>
              <button className="mt-2 btn-ghost text-xs" style={{ padding: '6px 12px' }}>Открыть</button>
            </Link>
          )}
        </div>

        <div className="stat-card card-enter">
          <p className="label-sm">Статус</p>
          <div className="flex items-center gap-2 mt-3">
            <div className={cp?.is_available ? 'pulse-dot' : ''} style={{
              width: 10, height: 10, borderRadius: 9999,
              background: cp?.is_available ? 'var(--green)' : 'var(--text-4)',
            }} />
            <span className="font-bold text-sm" style={{ color: cp?.is_available ? 'var(--green)' : 'var(--text-3)' }}>
              {cp?.is_available ? 'Онлайн' : 'Оффлайн'}
            </span>
          </div>
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-bold text-base" style={{ color: 'var(--text-1)' }}>Новые поручения</h3>
        <Link href="/tasks" className="text-xs font-bold" style={{ color: 'var(--green)' }}>
          Все задания →
        </Link>
      </div>

      {(newTasks?.length ?? 0) > 0 ? (
        <div className="flex flex-col gap-3">
          {newTasks!.map((task) => (
            <div key={task.id} className="card-enter">
              <TaskCard task={task as unknown as TaskWithProfiles} showCustomer />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <span className="material-symbols-outlined icon-float" style={{ fontSize: '3rem', color: 'var(--text-3)' }}>search</span>
          <p className="font-bold mt-3" style={{ color: 'var(--text-2)' }}>Новых заданий нет</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-3)' }}>Проверьте позже</p>
        </div>
      )}
    </div>
  )
}
