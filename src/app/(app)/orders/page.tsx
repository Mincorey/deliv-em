'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { TaskCard } from '@/components/tasks/TaskCard'
import { AnimatedPage, AnimatedItem, AnimatedList } from '@/components/ui/Animated'
import type { TaskWithProfiles } from '@/lib/types'

type Filter = 'all' | 'completed' | 'cancelled'

const FILTERS: { value: Filter; label: string; cls: string }[] = [
  { value: 'all',       label: 'Все',       cls: 'badge-blue' },
  { value: 'completed', label: 'Выполнены', cls: 'badge-green' },
  { value: 'cancelled', label: 'Отменены',  cls: 'badge-red' },
]

export default function OrdersPage() {
  const router      = useRouter()
  const searchParams = useSearchParams()
  const supabase    = createClient()

  const [tasks,      setTasks]      = useState<TaskWithProfiles[]>([])
  const [isCustomer, setIsCustomer] = useState(true)
  const [loading,    setLoading]    = useState(true)
  const [filter,     setFilter]     = useState<Filter>((searchParams.get('filter') as Filter) ?? 'all')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }

      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      const customer = profile?.role === 'customer'
      setIsCustomer(customer)

      const q = supabase
        .from('tasks')
        .select(`id, title, from_address, to_address, status, task_type, reward, deadline, customer_id, courier_id, city, created_at, completed_at, customer:profiles!tasks_customer_id_fkey(id, full_name, avatar_url), courier:profiles!tasks_courier_id_fkey(id, full_name, avatar_url)`)
        .in('status', ['completed', 'cancelled'])
        .order('created_at', { ascending: false })

      const { data } = await (customer ? q.eq('customer_id', user.id) : q.eq('courier_id', user.id))
      setTasks((data ?? []) as unknown as TaskWithProfiles[])
      setLoading(false)
    }
    load()
  }, [])

  const visible = filter === 'all'
    ? tasks
    : tasks.filter((t) => t.status === filter)

  const handleFilter = useCallback((f: Filter) => {
    setFilter(f)
    router.replace(`/orders?filter=${f}`, { scroll: false })
  }, [router])

  return (
    <AnimatedPage className="p-6 max-w-4xl mx-auto">
      <AnimatedItem>
        <h2 className="text-xl font-bold mb-1 page-header" style={{ color: 'var(--text-1)' }}>Архив поручений</h2>
        <p className="text-sm mb-5" style={{ color: 'var(--text-3)' }}>Все ваши завершённые и отменённые поручения</p>
        <div className="orders-filters flex gap-2 mb-5 pb-1">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => handleFilter(f.value)}
              className={`filter-btn badge cursor-pointer ${filter === f.value ? f.cls : 'badge-gray'}`}
              style={{ padding: '6px 14px', border: 'none' }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </AnimatedItem>

      {loading ? (
        <div className="flex justify-center py-20">
          <span className="material-symbols-outlined animate-spin" style={{ fontSize: 32, color: 'var(--text-4)' }}>progress_activity</span>
        </div>
      ) : visible.length > 0 ? (
        <AnimatedList className="flex flex-col gap-3">
          {visible.map((task) => (
            <AnimatedItem key={task.id}>
              <TaskCard task={task} showCourier={isCustomer} showCustomer={!isCustomer} />
            </AnimatedItem>
          ))}
        </AnimatedList>
      ) : (
        <AnimatedItem className="text-center py-16">
          <span className="material-symbols-outlined icon-float" style={{ fontSize: '4rem', color: 'var(--text-3)' }}>history</span>
          <p className="font-bold mt-3" style={{ color: 'var(--text-2)' }}>Архив пуст</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-3)' }}>Завершённые поручения появятся здесь</p>
        </AnimatedItem>
      )}
    </AnimatedPage>
  )
}
