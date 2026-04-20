'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Avatar } from '@/components/ui/Avatar'
import { AnimatedPage, AnimatedItem, AnimatedList } from '@/components/ui/Animated'

interface TaskRow {
  id: string
  title: string
  status: string
  customer: { id: string; full_name: string; avatar_url: string | null } | null
  courier:  { id: string; full_name: string; avatar_url: string | null } | null
}

interface MsgRow {
  task_id: string
  content: string
  created_at: string
  sender_id: string
  is_read: boolean
}

export default function MessagesPage() {
  const router   = useRouter()
  const supabase = createClient()

  const [userId,      setUserId]      = useState<string | null>(null)
  const [tasks,       setTasks]       = useState<TaskRow[]>([])
  const [lastMsgMap,  setLastMsgMap]  = useState<Map<string, MsgRow>>(new Map())
  const [loading,     setLoading]     = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }
      setUserId(user.id)

      const { data: rawTasks } = await supabase
        .from('tasks')
        .select(`id, title, status,
          customer:profiles!tasks_customer_id_fkey(id, full_name, avatar_url),
          courier:profiles!tasks_courier_id_fkey(id, full_name, avatar_url)`)
        .or(`customer_id.eq.${user.id},courier_id.eq.${user.id}`)
        .not('courier_id', 'is', null)
        .order('updated_at', { ascending: false })

      const taskList = (rawTasks ?? []) as unknown as TaskRow[]
      setTasks(taskList)

      const taskIds = taskList.map((t) => t.id)
      if (taskIds.length > 0) {
        const { data: msgs } = await supabase
          .from('messages')
          .select('task_id, content, created_at, sender_id, is_read')
          .in('task_id', taskIds)
          .order('created_at', { ascending: false })

        const map = new Map<string, MsgRow>()
        for (const msg of (msgs ?? []) as MsgRow[]) {
          if (!map.has(msg.task_id)) map.set(msg.task_id, msg)
        }
        setLastMsgMap(map)
      }
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return (
    <div className="p-6 flex justify-center py-20">
      <span className="material-symbols-outlined animate-spin" style={{ fontSize: 32, color: 'var(--text-4)' }}>progress_activity</span>
    </div>
  )

  return (
    <AnimatedPage style={{ display: 'flex', height: 'calc(100vh - 56px)', flexDirection: 'column', maxWidth: 800, margin: '0 auto', padding: '24px 24px 0' }}>
      <AnimatedItem>
        <h2 className="text-xl font-bold mb-5 page-header">Сообщения</h2>
      </AnimatedItem>

      {tasks.length === 0 ? (
        <AnimatedItem className="text-center py-16">
          <span className="material-symbols-outlined icon-float" style={{ fontSize: '4rem', color: 'var(--text-3)' }}>chat_bubble</span>
          <p className="font-bold mt-3" style={{ color: 'var(--text-2)' }}>Нет переписок</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-3)' }}>
            Чаты открываются автоматически, когда курьер принимает поручение
          </p>
        </AnimatedItem>
      ) : (
        <AnimatedList className="flex flex-col gap-2">
          {tasks.map((task) => {
            const lastMsg = lastMsgMap.get(task.id)
            const partner = task.customer?.id === userId ? task.courier : task.customer
            if (!partner) return null
            const unread = lastMsg && !lastMsg.is_read && lastMsg.sender_id !== userId

            return (
              <AnimatedItem
                key={task.id}
                className="flex items-center gap-3 p-4 rounded-2xl"
                style={{
                  background: unread ? 'var(--brand-soft)' : 'var(--surface)',
                  border: '1.5px solid ' + (unread ? 'var(--brand)' : 'var(--border)'),
                  transition: 'background 0.18s, border-color 0.18s',
                }}
              >
                {/* Clickable avatar → profile */}
                <Link href={`/profile/${partner.id}`} onClick={e => e.stopPropagation()} style={{ flexShrink: 0 }}>
                  <Avatar name={partner.full_name ?? '?'} avatarUrl={partner.avatar_url} />
                </Link>

                {/* Main area → chat */}
                <Link
                  href={`/messages/${task.id}`}
                  className="flex-1 min-w-0"
                  style={{ textDecoration: 'none' }}
                >
                  <div className="flex justify-between items-start">
                    <p className="font-bold text-sm truncate" style={{ color: 'var(--text-1)' }}>{partner.full_name}</p>
                    {lastMsg && (
                      <p className="text-xs flex-shrink-0 ml-2" style={{ color: 'var(--text-3)' }}>
                        {new Date(lastMsg.created_at).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                  </div>
                  <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text-3)' }}>{task.title}</p>
                  {lastMsg && (
                    <p className="text-xs truncate mt-0.5" style={{ color: unread ? 'var(--text-1)' : 'var(--text-3)', fontWeight: unread ? 600 : 400 }}>
                      {lastMsg.content}
                    </p>
                  )}
                </Link>

                {unread && <div style={{ width: 8, height: 8, borderRadius: 9999, background: 'var(--green)', flexShrink: 0 }} />}
              </AnimatedItem>
            )
          })}
        </AnimatedList>
      )}
    </AnimatedPage>
  )
}
