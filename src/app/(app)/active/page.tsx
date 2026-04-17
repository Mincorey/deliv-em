'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { TaskCard } from '@/components/tasks/TaskCard'
import type { TaskWithProfiles } from '@/lib/types'

export default function ActiveTasksPage() {
  const router = useRouter()

  const [tasks, setTasks]     = useState<TaskWithProfiles[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()

    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }

      const { data, error: qErr } = await supabase
        .from('tasks')
        .select(`*, customer:profiles!tasks_customer_id_fkey(*), courier:profiles!tasks_courier_id_fkey(*)`)
        .eq('courier_id', user.id)
        .in('status', ['matched', 'in_progress', 'awaiting_confirmation'])
        .order('created_at', { ascending: false })

      if (qErr) {
        setError(qErr.message)
        setLoading(false)
        return
      }

      setTasks((data ?? []) as unknown as TaskWithProfiles[])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return (
    <div className="p-6 flex justify-center py-20">
      <span className="material-symbols-outlined animate-spin" style={{ fontSize: 32, color: 'var(--text-4)' }}>progress_activity</span>
    </div>
  )

  if (error) return (
    <div className="p-6 max-w-3xl mx-auto">
      <h2 className="text-xl font-bold mb-4 page-header">Активные поручения</h2>
      <div style={{
        background: 'rgba(186,26,26,0.06)', border: '1.5px solid rgba(186,26,26,0.2)',
        borderRadius: '1rem', padding: '1rem 1.25rem',
        color: '#ba1a1a', fontSize: '0.875rem',
        display: 'flex', alignItems: 'flex-start', gap: 10,
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: 20, flexShrink: 0 }}>error</span>
        <span>{error}</span>
      </div>
    </div>
  )

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h2 className="text-xl font-bold mb-1 page-header">Активные поручения</h2>
      <p className="text-sm mb-5" style={{ color: 'var(--text-3)' }}>Принятые вами задания в работе</p>

      {tasks.length === 0 ? (
        <div className="text-center py-20">
          <span className="material-symbols-outlined icon-float" style={{ fontSize: '4rem', color: 'var(--text-3)' }}>rocket_launch</span>
          <p className="font-bold mt-4" style={{ color: 'var(--text-2)' }}>Нет активных поручений</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-3)' }}>
            Перейдите в «Поиск заданий», чтобы принять поручение
          </p>
          <button
            className="btn-primary mt-5"
            style={{ padding: '10px 20px' }}
            onClick={() => router.push('/tasks')}
          >
            <span className="material-symbols-outlined text-base">search</span>
            Найти задания
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} showCustomer />
          ))}
        </div>
      )}
    </div>
  )
}
