'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { TaskCard } from '@/components/tasks/TaskCard'
import { FeedFilters } from './FeedFilters'
import type { TaskWithProfiles } from '@/lib/types'

const PAGE_SIZE = 20

interface Props {
  userId:           string
  initialType?:     string
  initialCity?:     string
  initialMinReward?: string
  initialMaxReward?: string
  initialUrgent?:   string
  initialSort?:     string
}

export function CourierFeed({
  userId,
  initialType,
  initialCity,
  initialMinReward,
  initialMaxReward,
  initialUrgent,
  initialSort = 'newest',
}: Props) {
  const [tasks, setTasks]     = useState<TaskWithProfiles[]>([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const stateRef    = useRef({ page: 0, loading: false, hasMore: true })

  const supabase = createClient()

  async function fetchNext() {
    const s = stateRef.current
    if (s.loading || !s.hasMore) return
    s.loading = true
    setLoading(true)

    const from = s.page * PAGE_SIZE
    const to   = from + PAGE_SIZE - 1

    let query = supabase
      .from('tasks')
      .select(`*, customer:profiles!tasks_customer_id_fkey(*), courier:profiles!tasks_courier_id_fkey(*)`)
      .eq('status', 'published')
      .neq('customer_id', userId)
      .range(from, to)

    if (initialType && initialType !== 'all') query = query.eq('task_type', initialType)
    if (initialCity && initialCity !== 'all') query = query.eq('city', initialCity)
    if (initialMinReward) query = query.gte('reward', parseInt(initialMinReward))
    if (initialMaxReward) query = query.lte('reward', parseInt(initialMaxReward))
    if (initialUrgent) {
      const threshold = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString()
      query = query.not('deadline', 'is', null).lte('deadline', threshold)
    }

    if (initialSort === 'reward_asc') {
      query = query.order('reward', { ascending: true })
    } else if (initialSort === 'reward_desc') {
      query = query.order('reward', { ascending: false })
    } else {
      query = query.order('created_at', { ascending: false })
    }

    const { data } = await query
    const items = (data ?? []) as unknown as TaskWithProfiles[]

    setTasks(prev => [...prev, ...items])
    s.page    += 1
    s.hasMore  = items.length === PAGE_SIZE
    s.loading  = false
    setHasMore(s.hasMore)
    setLoading(false)
  }

  useEffect(() => { fetchNext() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) fetchNext() },
      { rootMargin: '300px' }
    )
    const el = sentinelRef.current
    if (el) observer.observe(el)
    return () => { if (el) observer.unobserve(el) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const isEmpty = !loading && tasks.length === 0

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-xl font-bold mb-1 page-header">Поиск заданий</h2>
      <p className="text-sm mb-4" style={{ color: 'var(--text-3)' }}>
        Свободные поручения от заказчиков
      </p>

      <FeedFilters
        currentType={initialType}
        currentCity={initialCity}
        currentMinReward={initialMinReward}
        currentMaxReward={initialMaxReward}
        currentUrgent={initialUrgent}
        currentSort={initialSort}
      />

      {tasks.length > 0 && (
        <div className="flex flex-col gap-3">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} showCustomer />
          ))}
        </div>
      )}

      {hasMore && <div ref={sentinelRef} style={{ height: 1 }} />}

      {loading && (
        <div className="flex justify-center py-8">
          <span
            className="material-symbols-outlined"
            style={{ color: 'var(--text-3)', fontSize: 28, animation: 'spin 0.9s linear infinite' }}
          >
            progress_activity
          </span>
        </div>
      )}

      {!hasMore && tasks.length > 0 && (
        <p className="text-center text-sm py-6" style={{ color: 'var(--text-4)' }}>
          Все задания загружены
        </p>
      )}

      {isEmpty && (
        <div className="text-center py-16">
          <span className="material-symbols-outlined icon-float" style={{ fontSize: '4rem', color: 'var(--text-3)' }}>
            search
          </span>
          <p className="font-bold mt-3" style={{ color: 'var(--text-2)' }}>Нет доступных заданий</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-3)' }}>
            Попробуйте изменить фильтры или вернитесь позже
          </p>
        </div>
      )}
    </div>
  )
}
