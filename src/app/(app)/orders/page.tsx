import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TaskCard } from '@/components/tasks/TaskCard'
import type { TaskWithProfiles, TaskStatus } from '@/lib/types'

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>
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
  const filter = params.filter ?? 'all'

  let statusFilter: TaskStatus[] = ['completed', 'cancelled']
  if (filter === 'completed') statusFilter = ['completed']
  if (filter === 'cancelled') statusFilter = ['cancelled']

  const isCustomer = profile?.role === 'customer'

  let query = supabase
    .from('tasks')
    .select(
      `*, customer:profiles!tasks_customer_id_fkey(*), courier:profiles!tasks_courier_id_fkey(*)`
    )
    .in('status', statusFilter)
    .order('created_at', { ascending: false })

  if (isCustomer) {
    query = query.eq('customer_id', user.id)
  } else {
    query = query.eq('courier_id', user.id)
  }

  const { data: tasks } = await query

  const filters = [
    { value: 'all', label: 'Все', cls: 'badge-blue' },
    { value: 'completed', label: 'Выполнены', cls: 'badge-green' },
    { value: 'cancelled', label: 'Отменены', cls: 'badge-red' },
  ]

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-xl font-bold mb-1">Архив поручений</h2>
      <p className="text-sm mb-5" style={{ color: '#757682' }}>
        Все ваши завершённые и отменённые поручения
      </p>

      {/* Filters */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {filters.map((f) => (
          <a
            key={f.value}
            href={`/orders?filter=${f.value}`}
            className={`badge cursor-pointer ${filter === f.value ? f.cls : 'badge-gray'}`}
            style={{ padding: '6px 14px' }}
          >
            {f.label}
          </a>
        ))}
      </div>

      {(tasks?.length ?? 0) > 0 ? (
        <div className="flex flex-col gap-3">
          {tasks!.map((task) => (
            <TaskCard
              key={task.id}
              task={task as unknown as TaskWithProfiles}
              showCourier={isCustomer}
              showCustomer={!isCustomer}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <span className="material-symbols-outlined" style={{ fontSize: '4rem', color: '#c5c5d3' }}>
            history
          </span>
          <p className="font-bold mt-3" style={{ color: '#757682' }}>Архив пуст</p>
          <p className="text-sm mt-1" style={{ color: '#c5c5d3' }}>
            Завершённые поручения появятся здесь
          </p>
        </div>
      )}
    </div>
  )
}
