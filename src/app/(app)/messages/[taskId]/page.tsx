'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Avatar } from '@/components/ui/Avatar'
import { sendChatMessage } from '../actions'
import type { Message, Profile } from '@/lib/types'

export default function ChatPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const taskId = params.taskId as string

  const [currentUser, setCurrentUser] = useState<Profile | null>(null)
  const [partner, setPartner]         = useState<Profile | null>(null)
  const [taskTitle, setTaskTitle]     = useState('')
  const [messages, setMessages]       = useState<(Message & { sender: Profile })[]>([])
  const [input, setInput]             = useState('')
  const [loading, setLoading]         = useState(true)
  const [sending, setSending]         = useState(false)
  const [sendError, setSendError]     = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
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

      if (!task) { router.push('/messages'); return }

      setCurrentUser(profile as Profile)
      setTaskTitle(task.title ?? '')

      const partnerProfile =
        task.customer_id === user.id ? task.courier : task.customer
      setPartner(partnerProfile as unknown as Profile)

      // Load existing messages
      const { data: msgs } = await supabase
        .from('messages')
        .select('*, sender:profiles!messages_sender_id_fkey(*)')
        .eq('task_id', taskId)
        .order('created_at', { ascending: true })

      setMessages((msgs ?? []) as (Message & { sender: Profile })[])
      setLoading(false)

      // Mark incoming as read
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
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `task_id=eq.${taskId}` },
        async (payload) => {
          const { data: sender } = await supabase
            .from('profiles').select('*').eq('id', payload.new.sender_id).single()

          const newMsg = { ...payload.new, sender } as Message & { sender: Profile }
          setMessages((prev) => {
            // Already have the real message
            if (prev.find((m) => m.id === newMsg.id)) return prev
            // Replace matching optimistic message from the same sender
            const withoutOptimistic = prev.filter(
              (m) => !(m.id.startsWith('opt_') && m.sender_id === newMsg.sender_id && m.content === newMsg.content)
            )
            return [...withoutOptimistic, newMsg]
          })

          // Mark as read if from partner
          const { data: { user } } = await supabase.auth.getUser()
          if (payload.new.sender_id !== user?.id) {
            await supabase.from('messages').update({ is_read: true }).eq('id', payload.new.id)
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [taskId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = useCallback(async () => {
    const text = input.trim()
    if (!text || sending || !currentUser) return
    setSendError('')
    setSending(true)
    setInput('')

    // Optimistically show the message immediately
    const tempId = `opt_${Date.now()}`
    const optimistic: Message & { sender: Profile } = {
      id: tempId,
      task_id: taskId,
      sender_id: currentUser.id,
      content: text,
      is_read: false,
      created_at: new Date().toISOString(),
      sender: currentUser,
    }
    setMessages((prev) => [...prev, optimistic])

    const res = await sendChatMessage(taskId, text)
    setSending(false)

    if (res.error) {
      // Remove optimistic message on failure, restore input
      setMessages((prev) => prev.filter((m) => m.id !== tempId))
      setSendError(res.error)
      setInput(text)
    }

    inputRef.current?.focus()
  }, [input, sending, taskId, currentUser])

  if (loading) return (
    <div className="p-6 flex items-center justify-center" style={{ minHeight: 300 }}>
      <span className="material-symbols-outlined animate-spin" style={{ fontSize: 32, color: 'var(--text-4)' }}>progress_activity</span>
    </div>
  )

  return (
    <div className="chat-outer">
      {/* Messenger frame */}
      <div className="chat-frame">
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '14px 18px',
          borderBottom: '1.5px solid var(--border)',
          background: 'var(--surface)',
          flexShrink: 0,
        }}>
          <Link href="/messages" style={{ color: 'var(--text-3)', lineHeight: 1 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 22 }}>arrow_back</span>
          </Link>

          {partner && (
            <Link href={`/profile/${partner.id}`} style={{ lineHeight: 0, flexShrink: 0 }}>
              <Avatar name={partner.full_name} avatarUrl={partner.avatar_url} size={38} />
            </Link>
          )}

          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm truncate" style={{ color: 'var(--text-1)', lineHeight: 1.3 }}>
              {partner?.full_name ?? 'Чат'}
            </p>
            <p className="text-xs truncate" style={{ color: 'var(--text-3)', lineHeight: 1.3 }}>
              {taskTitle}
            </p>
          </div>

          <Link href={`/tasks/${taskId}`} style={{ color: 'var(--text-3)', lineHeight: 1 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>open_in_new</span>
          </Link>
        </div>

        {/* Messages area */}
        <div style={{
          flex: 1, overflowY: 'auto',
          padding: '16px 18px',
          display: 'flex', flexDirection: 'column', gap: 6,
          background: 'var(--bg)',
        }}>
          {messages.length === 0 && (
            <div style={{ margin: 'auto', textAlign: 'center', padding: '2rem 0' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '3rem', color: 'var(--text-4)' }}>chat_bubble</span>
              <p className="text-sm mt-2" style={{ color: 'var(--text-3)' }}>Начните переписку</p>
            </div>
          )}

          {messages.map((msg, i) => {
            const isMe = msg.sender_id === currentUser?.id
            const prevMsg = messages[i - 1]
            const sameAuthorAsPrev = prevMsg && prevMsg.sender_id === msg.sender_id
            const time = new Date(msg.created_at).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })

            return (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  flexDirection: isMe ? 'row-reverse' : 'row',
                  alignItems: 'flex-end',
                  gap: 8,
                  marginTop: sameAuthorAsPrev ? 2 : 10,
                }}
              >
                {/* Partner avatar — only on first message in group */}
                {!isMe && (
                  <div style={{ width: 28, flexShrink: 0 }}>
                    {!sameAuthorAsPrev && partner && (
                      <Avatar name={partner.full_name} avatarUrl={partner.avatar_url} size={28} />
                    )}
                  </div>
                )}

                <div style={{ maxWidth: '72%', display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    background: isMe ? 'var(--green)' : 'var(--surface)',
                    color: isMe ? '#fff' : 'var(--text-1)',
                    border: isMe ? 'none' : '1px solid var(--border)',
                    borderRadius: isMe
                      ? (sameAuthorAsPrev ? '18px 6px 6px 18px' : '18px 6px 18px 18px')
                      : (sameAuthorAsPrev ? '6px 18px 18px 6px' : '6px 18px 18px 18px'),
                    padding: '8px 13px',
                    wordBreak: 'break-word',
                    fontSize: '0.875rem',
                    lineHeight: 1.45,
                    boxShadow: isMe ? 'none' : 'var(--shadow-sm)',
                  }}>
                    {msg.content}
                  </div>
                  <p style={{
                    fontSize: '0.65rem', color: 'var(--text-4)',
                    marginTop: 2, paddingLeft: isMe ? 0 : 4, paddingRight: isMe ? 4 : 0,
                  }}>
                    {time}
                  </p>
                </div>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>

        {/* Error message */}
        {sendError && (
          <div style={{
            padding: '6px 18px',
            fontSize: '0.8rem', color: '#ba1a1a',
            background: 'rgba(186,26,26,0.06)',
            borderTop: '1px solid rgba(186,26,26,0.15)',
            flexShrink: 0,
          }}>
            {sendError}
          </div>
        )}

        {/* Input area */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '12px 16px',
          borderTop: '1.5px solid var(--border)',
          background: 'var(--surface)',
          flexShrink: 0,
        }}>
          <input
            ref={inputRef}
            className="input-field flex-1 text-sm"
            style={{ borderRadius: 9999, padding: '9px 16px' }}
            placeholder="Сообщение..."
            value={input}
            onChange={(e) => { setInput(e.target.value); setSendError('') }}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
            disabled={sending}
          />
          <button
            className="btn-primary"
            style={{ padding: '9px 16px', borderRadius: 9999, flexShrink: 0 }}
            onClick={handleSend}
            disabled={sending || !input.trim()}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
              {sending ? 'hourglass_empty' : 'send'}
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
