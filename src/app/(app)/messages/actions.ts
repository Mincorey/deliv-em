'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'

function adminClient() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function sendChatMessage(taskId: string, content: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }
  if (!content.trim()) return { error: 'Пустое сообщение' }

  const admin = adminClient()

  // Verify user is a participant in this task
  const { data: task } = await admin
    .from('tasks')
    .select('customer_id, courier_id, title')
    .eq('id', taskId)
    .single()

  if (!task) return { error: 'Поручение не найдено' }

  const isParticipant = task.customer_id === user.id || task.courier_id === user.id
  if (!isParticipant) return { error: 'Вы не участник этого поручения' }

  const { error } = await admin.from('messages').insert({
    task_id: taskId,
    sender_id: user.id,
    content: content.trim(),
    is_read: false,
  })

  if (error) return { error: error.message }

  // Notify the other participant
  const recipientId = task.customer_id === user.id ? task.courier_id : task.customer_id
  if (recipientId) {
    await admin.from('notifications').insert({
      user_id: recipientId,
      type: 'new_message',
      title: 'Новое сообщение',
      body: `По поручению: ${task.title}`,
      task_id: taskId,
    })
  }

  return { success: true }
}
