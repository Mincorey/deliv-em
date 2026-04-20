import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { TaskCard } from '@/components/tasks/TaskCard'
import { Avatar } from '@/components/ui/Avatar'
import { AnimatedPage, AnimatedItem, AnimatedList, AnimatedStat } from '@/components/ui/Animated'
import type { Profile, TaskWithProfiles } from '@/lib/types'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, full_name, wallet_balance, city')
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

  const TASK_FIELDS = `id, title, from_address, to_address, status, task_type, reward, deadline, customer_id,
    customer:profiles!tasks_customer_id_fkey(id, full_name),
    courier:profiles!tasks_courier_id_fkey(id, full_name)`

  const [
    { data: activeTasks },
    { data: recentTasks },
    { count: totalCompleted },
  ] = await Promise.all([
    supabase.from('tasks').select(TASK_FIELDS)
      .eq('customer_id', userId)
      .in('status', ['published', 'matched', 'in_progress', 'awaiting_confirmation'])
      .order('created_at', { ascending: false })
      .limit(10),
    supabase.from('tasks').select(TASK_FIELDS)
      .eq('customer_id', userId)
      .in('status', ['completed', 'cancelled'])
      .order('completed_at', { ascending: false })
      .limit(5),
    supabase.from('tasks').select('id', { count: 'exact', head: true })
      .eq('customer_id', userId)
      .eq('status', 'completed'),
  ])

  const firstName = profile.full_name.split(' ')[0]

  return (
    <AnimatedPage className="mobile-page-pad p-6 max-w-5xl mx-auto">
      <AnimatedItem className="mb-6 page-header">
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--brand-text)', letterSpacing: '-0.02em' }}>
          Добро пожаловать, {firstName}
        </h2>
        <p className="text-sm mt-1" style={{ color: 'var(--text-3)' }}>
          Вот что происходит с вашими поручениями
        </p>
      </AnimatedItem>

      {/* Awaiting confirmation banners — one per task */}
      {activeTasks?.filter(t => t.status === 'awaiting_confirmation').map((task) => (
        <AnimatedItem key={task.id}>
          <Link href={`/tasks/${task.id}`} style={{ textDecoration: 'none', display: 'block', marginBottom: '1rem' }}>
            <div style={{
              background: 'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(245,158,11,0.06))',
              border: '1.5px solid rgba(245,158,11,0.4)',
              borderRadius: '1rem', padding: '1rem 1.25rem',
              display: 'flex', alignItems: 'center', gap: 14,
              cursor: 'pointer', transition: 'border-color 0.15s',
            }}>
              <span className="material-symbols-outlined fill-icon flex-shrink-0" style={{ fontSize: 28, color: '#f59e0b' }}>task_alt</span>
              <div className="flex-1 min-w-0">
                <p style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-1)' }}>Требует вашего подтверждения</p>
                <p className="truncate" style={{ fontSize: '0.8rem', color: 'var(--text-3)', marginTop: 2 }}>
                  {(task as unknown as TaskWithProfiles).title}
                </p>
              </div>
              <div style={{ background: '#f59e0b', color: '#fff', borderRadius: '0.6rem', padding: '6px 14px', fontSize: '0.8rem', fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0 }}>
                Подтвердить →
              </div>
            </div>
          </Link>
        </AnimatedItem>
      ))}

      {/* Stats */}
      <AnimatedList className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <AnimatedStat className="stat-card">
          <p className="label-sm">Баланс кошелька</p>
          <div className="flex items-center justify-between mt-2 gap-2">
            <div className="flex items-end gap-1 flex-shrink-0">
              <span style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--brand-text)', lineHeight: 1 }}>{Math.round(profile.wallet_balance)}</span>
              <span className="text-sm font-bold mb-0.5" style={{ color: 'var(--text-3)' }}>₽</span>
            </div>
            <Link href="/wallet">
              <button className="btn-green" style={{ padding: '10px 20px', fontSize: '0.9rem', fontWeight: 800, background: 'linear-gradient(135deg,#006c49,#00a86b)', boxShadow: '0 4px 14px rgba(0,108,73,0.35)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add_circle</span>
                Пополнить
              </button>
            </Link>
          </div>
        </AnimatedStat>

        <AnimatedStat>
          <Link href="/tasks" style={{ textDecoration: 'none' }}>
            <div className="stat-card stat-card-link">
              <p className="label-sm">Активные поручения</p>
              <div className="flex items-center justify-between mt-2">
                <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--green)', lineHeight: 1 }}>{activeTasks?.length ?? 0}</div>
                <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--text-4)' }}>arrow_forward</span>
              </div>
            </div>
          </Link>
        </AnimatedStat>

        <AnimatedStat>
          <Link href="/orders?filter=completed" style={{ textDecoration: 'none' }}>
            <div className="stat-card stat-card-link">
              <p className="label-sm">Выполнено всего</p>
              <div className="flex items-center justify-between mt-2">
                <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-1)', lineHeight: 1 }}>{totalCompleted ?? 0}</div>
                <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--text-4)' }}>arrow_forward</span>
              </div>
            </div>
          </Link>
        </AnimatedStat>
      </AnimatedList>

      {/* Active tasks list */}
      {(activeTasks?.length ?? 0) > 0 && (
        <AnimatedItem className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-base" style={{ color: 'var(--text-1)' }}>Активные поручения</h3>
            <Link href="/tasks" className="text-xs font-bold" style={{ color: 'var(--green)' }}>Все →</Link>
          </div>
          <AnimatedList className="flex flex-col gap-3">
            {activeTasks!.map((task) => (
              <AnimatedItem key={task.id}>
                <TaskCard task={task as unknown as TaskWithProfiles} showCourier currentUserId={userId} />
              </AnimatedItem>
            ))}
          </AnimatedList>
        </AnimatedItem>
      )}

      {/* Recent tasks */}
      {(recentTasks?.length ?? 0) > 0 && (
        <AnimatedItem>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-base" style={{ color: 'var(--text-1)' }}>Последние поручения</h3>
            <Link href="/orders" className="text-xs font-bold" style={{ color: 'var(--green)' }}>Архив →</Link>
          </div>
          <AnimatedList className="flex flex-col gap-3">
            {recentTasks!.map((task) => (
              <AnimatedItem key={task.id}>
                <TaskCard task={task as unknown as TaskWithProfiles} showCourier />
              </AnimatedItem>
            ))}
          </AnimatedList>
        </AnimatedItem>
      )}

      {/* Empty state */}
      {(activeTasks?.length ?? 0) === 0 && (recentTasks?.length ?? 0) === 0 && (
        <AnimatedItem className="text-center py-16">
          <span className="material-symbols-outlined icon-float" style={{ fontSize: '4rem', color: 'var(--text-3)' }}>task_alt</span>
          <p className="font-bold mt-3" style={{ color: 'var(--text-2)' }}>Пока нет поручений</p>
          <p className="text-sm mt-1 mb-5" style={{ color: 'var(--text-3)' }}>Создайте первое — курьеры уже готовы помочь</p>
          <Link href="/tasks/create">
            <button className="btn-green">
              <span className="material-symbols-outlined text-base">add</span>
              Создать поручение
            </button>
          </Link>
        </AnimatedItem>
      )}
    </AnimatedPage>
  )
}

async function CourierDashboard({ profile, userId }: { profile: Profile; userId: string }) {
  const supabase = await createClient()

  const [{ data: newTasks }, { data: activeTaskRow }, { data: myRatings }, { count: completedCount }] = await Promise.all([
    supabase.from('tasks')
      .select(`id, title, from_address, to_address, status, task_type, reward, deadline, customer_id,
        customer:profiles!tasks_customer_id_fkey(id, full_name),
        courier:profiles!tasks_courier_id_fkey(id, full_name)`)
      .eq('status', 'published').neq('customer_id', userId)
      .order('created_at', { ascending: false }).limit(5),
    supabase.from('tasks').select('id').eq('courier_id', userId)
      .in('status', ['matched', 'in_progress']).limit(1).maybeSingle(),
    supabase.from('ratings').select('score').eq('to_user_id', userId),
    supabase.from('tasks').select('id', { count: 'exact', head: true })
      .eq('courier_id', userId).eq('status', 'completed'),
  ])

  const avgRating = myRatings && myRatings.length > 0
    ? Math.round(myRatings.reduce((s, r) => s + r.score, 0) / myRatings.length * 10) / 10
    : null
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

      <div className="grid grid-cols-2 gap-4 mb-6 sm:grid-cols-3">
        <div className="stat-card card-enter">
          <p className="label-sm">Мой рейтинг</p>
          <div className="flex items-center gap-1 mt-2">
            <span style={{ fontSize: '1.8rem', fontWeight: 900, color: '#f59e0b', lineHeight: 1 }}>
              {avgRating !== null ? avgRating.toFixed(1) : '—'}
            </span>
            {avgRating !== null && (
              <span className="material-symbols-outlined fill-icon" style={{ color: '#f59e0b', fontSize: 18 }}>star</span>
            )}
          </div>
        </div>

        <div className="stat-card card-enter">
          <p className="label-sm">Выполнено</p>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--green)', lineHeight: 1 }} className="mt-2">
            {completedCount ?? 0}
          </div>
        </div>

        <div className="stat-card card-enter">
          <p className="label-sm">Активное задание</p>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-1)' }} className="mt-2">
            {activeTaskRow ? '1 задание' : 'Нет'}
          </div>
          {activeTaskRow && (
            <Link href={`/tasks/${activeTaskRow.id}`}>
              <button className="mt-2 btn-ghost text-xs" style={{ padding: '6px 12px' }}>Открыть</button>
            </Link>
          )}
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
