import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { TaskCard } from '@/components/tasks/TaskCard'
import { FeedFilters } from './FeedFilters'
import type { TaskWithProfiles } from '@/lib/types'

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; city?: string; min_reward?: string }>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const params = await searchParams

  if (profile?.role === 'courier') {
    return <CourierFeed userId={user.id} params={params} />
  }

  return <CustomerActiveTasks userId={user.id} />
}

async function CustomerActiveTasks({ userId }: { userId: string }) {
  const supabase = await createClient()

  const { data: tasks } = await supabase
    .from('tasks')
    .select(
      `*, customer:profiles!tasks_customer_id_fkey(*), courier:profiles!tasks_courier_id_fkey(*)`
    )
    .eq('customer_id', userId)
    .in('status', ['published', 'matched', 'in_progress'])
    .order('created_at', { ascending: false })

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-xl font-bold">Активные поручения</h2>
        <Link href="/tasks/create">
          <button className="btn-green text-sm">
            <span className="material-symbols-outlined text-base">add</span> Создать
          </button>
        </Link>
      </div>
      <p className="text-sm mb-5" style={{ color: '#757682' }}>
        Поручения, которые выполняются прямо сейчас
      </p>

      {(tasks?.length ?? 0) > 0 ? (
        <div className="flex flex-col gap-4">
          {tasks!.map((task) => (
            <TaskCard
              key={task.id}
              task={task as unknown as TaskWithProfiles}
              showCourier
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <span className="material-symbols-outlined" style={{ fontSize: '4rem', color: '#c5c5d3' }}>
            rocket_launch
          </span>
          <p className="font-bold mt-3" style={{ color: '#757682' }}>Нет активных поручений</p>
          <p className="text-sm mt-1 mb-5" style={{ color: '#c5c5d3' }}>
            Создайте новое — курьеры уже готовы
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

async function CourierFeed({
  userId,
  params,
}: {
  userId: string
  params: { type?: string; city?: string; min_reward?: string }
}) {
  const supabase = await createClient()

  let query = supabase
    .from('tasks')
    .select(
      `*, customer:profiles!tasks_customer_id_fkey(*), courier:profiles!tasks_courier_id_fkey(*)`
    )
    .eq('status', 'published')
    .neq('customer_id', userId)
    .order('created_at', { ascending: false })

  if (params.type && params.type !== 'all') {
    query = query.eq('task_type', params.type)
  }
  if (params.min_reward) {
    query = query.gte('reward', parseInt(params.min_reward))
  }

  const { data: tasks } = await query

  const TASK_TYPES = [
    { value: 'all', label: 'Все типы' },
    { value: 'documents', label: 'Документы' },
    { value: 'groceries', label: 'Продукты' },
    { value: 'materials', label: 'Материалы' },
    { value: 'gift', label: 'Подарок' },
    { value: 'meeting', label: 'Встреча' },
    { value: 'parcel', label: 'Посылка' },
  ]

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-xl font-bold mb-1">Поиск заданий</h2>
      <p className="text-sm mb-4" style={{ color: '#757682' }}>
        Свободные поручения от заказчиков
      </p>

      <Suspense fallback={null}>
        <FeedFilters currentType={params.type} currentMinReward={params.min_reward} />
      </Suspense>

      {(tasks?.length ?? 0) > 0 ? (
        <div className="flex flex-col gap-3">
          {tasks!.map((task) => (
            <TaskCard
              key={task.id}
              task={task as unknown as TaskWithProfiles}
              showCustomer
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <span className="material-symbols-outlined" style={{ fontSize: '4rem', color: '#c5c5d3' }}>
            search
          </span>
          <p className="font-bold mt-3" style={{ color: '#757682' }}>Нет доступных заданий</p>
          <p className="text-sm mt-1" style={{ color: '#c5c5d3' }}>
            Попробуйте изменить фильтры или вернитесь позже
          </p>
        </div>
      )}
    </div>
  )
}
