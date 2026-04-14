'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Avatar } from '@/components/ui/Avatar'
import type { Message, Profile } from '@/lib/types'

export default function ChatPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const taskId = params.taskId as string

  const [currentUser, setCurrentUser] = useState<Profile | null>(null)
  const [partner, setPartner] = useState<Profile | null>(null)
  const [taskTitle, setTaskTitle] = useState('')
  const [messages, setMessages] = useState<(Message & { sender: Profile })[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }

      const [{ data: profile }, { data: task }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase
          .from('tasks')
          .select(`id, title, customer_id, courier_id,
            customer:profiles!tasks_customer_id_fkey(*),
            courier:profiles!tasks_courier_id_fkey(*)`)
          .eq('id', taskId)
          .single(),
      ])

      setCurrentUser(profile as Profile)
      setTaskTitle(task?.title ?? '')

      const partnerProfile =
        task?.customer_id === user.id ? task?.courier : task?.customer
      setPartner(partnerProfile as unknown as Profile)

      // Load existing messages
      const { data: msgs } = await supabase
        .from('messages')
        .select('*, sender:profiles!messages_sender_id_fkey(*)')
        .eq('task_id', taskId)
        .order('created_at', { ascending: true })

      setMessages((msgs ?? []) as (Message & { sender: Profile })[])
      setLoading(false)

      // Mark as read
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('task_id', taskId)
        .neq('sender_id', user.id)
    }

    init()

    // Realtime subscription
    const channel = supabase
      .channel(`chat:${taskId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `task_id=eq.${taskId}`,
        },
        async (payload) => {
          const { data: sender } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', payload.new.sender_id)
            .single()

          const newMsg = { ...payload.new, sender } as Message & { sender: Profile }
          setMessages((prev) => [...prev, newMsg])

          // Mark as read if from partner
          const {
            data: { user },
          } = await supabase.auth.getUser()
          if (payload.new.sender_id !== user?.id) {
            await supabase
              .from('messages')
              .update({ is_read: true })
              .eq('id', payload.new.id)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [taskId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage() {
    if (!input.trim() || !currentUser) return
    const content = input.trim()
    setInput('')

    await supabase.from('messages').insert({
      task_id: taskId,
      sender_id: currentUser.id,
      content,
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <span className="material-symbols-outlined animate-spin" style={{ fontSize: 32, color: '#c5c5d3' }}>
          progress_activity
        </span>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 56px)' }}>
      {/* Header */}
      <div
        className="flex items-center gap-3 p-4"
        style={{ borderBottom: '1px solid #eceef0', background: '#fff', flexShrink: 0 }}
      >
        <Link href="/messages" style={{ color: '#757682' }}>
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        {partner && <Avatar name={partner.full_name} avatarUrl={partner.avatar_url} />}
        <div className="flex-1">
          <p className="font-bold text-sm">{partner?.full_name ?? 'Чат'}</p>
          <p className="text-xs" style={{ color: '#757682' }}>{taskTitle}</p>
        </div>
        <Link href={`/tasks/${taskId}`}>
          <span className="material-symbols-outlined" style={{ color: '#757682', fontSize: 20 }}>
            open_in_new
          </span>
        </Link>
      </div>

      {/* Messages */}
      <div
        style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}
      >
        {messages.length === 0 && (
          <div className="text-center my-auto">
            <span className="material-symbols-outlined" style={{ fontSize: '3rem', color: '#c5c5d3' }}>
              chat_bubble
            </span>
            <p className="text-sm mt-2" style={{ color: '#c5c5d3' }}>
              Начните переписку
            </p>
          </div>
        )}
        {messages.map((msg) => {
          const isMe = msg.sender_id === currentUser?.id
          return (
            <div key={msg.id} style={{ display: 'flex', flexDirection: 'column' }}>
              <div className={isMe ? 'chat-bubble-me' : 'chat-bubble-them'}>
                <p>{msg.content}</p>
                <p
                  className="text-xs mt-1"
                  style={{ opacity: 0.6, textAlign: isMe ? 'right' : 'left' }}
                >
                  {new Date(msg.created_at).toLocaleTimeString('ru', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div
        className="flex gap-3 p-4"
        style={{ borderTop: '1px solid #eceef0', background: '#fff', flexShrink: 0 }}
      >
        <input
          className="input-field flex-1 text-sm"
          style={{ borderRadius: 9999, padding: '10px 18px' }}
          placeholder="Сообщение..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
        />
        <button
          className="btn-primary"
          style={{ padding: '10px 18px', fontSize: '0.85rem' }}
          onClick={sendMessage}
        >
          <span className="material-symbols-outlined text-base">send</span>
        </button>
      </div>
    </div>
  )
}
