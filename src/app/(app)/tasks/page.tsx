import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { TaskCard } from '@/components/tasks/TaskCard'
import { CourierFeed } from './CourierFeed'
import { AnimatedPage, AnimatedItem, AnimatedList } from '@/components/ui/Animated'
import type { TaskWithProfiles } from '@/lib/types'

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{
    type?: string; city?: string; min_reward?: string; max_reward?: string
    urgent?: string; sort?: string; filter?: string
  }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const params = await searchParams

  if (profile?.role === 'courier') {
    const feedKey = [params.type, params.city, params.min_reward, params.max_reward, params.urgent, params.sort].join('-')
    return (
      <Suspense fallback={null}>
        <CourierFeed
          key={feedKey}
          userId={user.id}
          initialType={params.type}
          initialCity={params.city}
          initialMinReward={params.min_reward}
          initialMaxReward={params.max_reward}
          initialUrgent={params.urgent}
          initialSort={params.sort}
        />
      </Suspense>
    )
  }

  return <CustomerActiveTasks userId={user.id} highlightFilter={params.filter} />
}

async function CustomerActiveTasks({ userId, highlightFilter }: { userId: string; highlightFilter?: string }) {
  const supabase = await createClient()

  const { data: tasks } = await supabase
    .from('tasks')
    .select(`id, title, from_address, to_address, status, task_type, reward, deadline, customer_id, courier_id, city, created_at, completed_at,
      customer:profiles!tasks_customer_id_fkey(id, full_name, avatar_url),
      courier:profiles!tasks_courier_id_fkey(id, full_name, avatar_url)`)
    .eq('customer_id', userId)
    .in('status', ['published', 'matched', 'in_progress', 'awaiting_confirmation'])
    .order('created_at', { ascending: false })
    .limit(50)

  // If filter=awaiting_confirmation — show those first
  const sorted = highlightFilter === 'awaiting_confirmation' && tasks
    ? [...tasks].sort((a, b) =>
        (a.status === 'awaiting_confirmation' ? 0 : 1) - (b.status === 'awaiting_confirmation' ? 0 : 1))
    : tasks

  const pendingCount = tasks?.filter(t => t.status === 'awaiting_confirmation').length ?? 0

  return (
    <AnimatedPage className="p-6 max-w-4xl mx-auto">
      <AnimatedItem className="flex items-center justify-between mb-1 page-header">
        <h2 className="text-xl font-bold">Активные поручения</h2>
        <Link href="/tasks/create">
          <button className="btn-green text-sm">
            <span className="material-symbols-outlined text-base">add</span> Создать
          </button>
        </Link>
      </AnimatedItem>
      <AnimatedItem>
        <p className="text-sm mb-5" style={{ color: 'var(--text-3)' }}>
          Поручения, которые выполняются прямо сейчас
        </p>
      </AnimatedItem>

      {pendingCount > 0 && (
        <AnimatedItem>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.25rem',
            padding: '10px 16px',
            background: 'rgba(245,158,11,0.08)', border: '1.5px solid rgba(245,158,11,0.35)',
            borderRadius: '0.875rem',
          }}>
            <span className="material-symbols-outlined fill-icon" style={{ color: '#f59e0b', fontSize: 20 }}>task_alt</span>
            <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-1)' }}>
              {pendingCount === 1
                ? 'Одно поручение ожидает вашего подтверждения'
                : `${pendingCount} поручения ожидают вашего подтверждения`}
            </p>
          </div>
        </AnimatedItem>
      )}

      {(sorted?.length ?? 0) > 0 ? (
        <AnimatedList className="flex flex-col gap-4">
          {sorted!.map((task) => (
            <AnimatedItem key={task.id}>
              <TaskCard
                task={task as unknown as TaskWithProfiles}
                showCourier
                currentUserId={userId}
              />
            </AnimatedItem>
          ))}
        </AnimatedList>
      ) : (
        <AnimatedItem className="text-center py-16">
          <span className="material-symbols-outlined icon-float" style={{ fontSize: '4rem', color: 'var(--text-3)' }}>
            rocket_launch
          </span>
          <p className="font-bold mt-3" style={{ color: 'var(--text-2)' }}>Нет активных поручений</p>
          <p className="text-sm mt-1 mb-5" style={{ color: 'var(--text-3)' }}>
            Создайте новое — курьеры уже готовы
          </p>
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
