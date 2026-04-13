'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

// ── Create task ──────────────────────────────────────────────────────────────

interface CreateTaskInput {
  title: string
  description: string
  task_type: string
  reward: number
  from_address: string
  to_address: string
  deadline: string | null
  is_private: boolean
  invited_couriers: string[]
}

export async function createTask(input: CreateTaskInput) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  // Check wallet balance
  const { data: profile } = await supabase
    .from('profiles')
    .select('wallet_balance')
    .eq('id', user.id)
    .single()

  if (!profile || profile.wallet_balance < 100) {
    return { error: 'Недостаточно средств на кошельке (нужно 100 ₽)' }
  }

  // Create task
  const { data: task, error } = await supabase
    .from('tasks')
    .insert({
      customer_id: user.id,
      title: input.title,
      description: input.description || null,
      task_type: input.task_type,
      reward: input.reward,
      from_address: input.from_address,
      to_address: input.to_address,
      deadline: input.deadline || null,
      is_private: input.is_private,
      status: 'published',
      placement_fee: 100,
    })
    .select()
    .single()

  if (error) return { error: error.message }

  // Deduct 100₽ fee
  const newBalance = profile.wallet_balance - 100
  await supabase
    .from('profiles')
    .update({ wallet_balance: newBalance })
    .eq('id', user.id)

  await supabase.from('transactions').insert({
    user_id: user.id,
    task_id: task.id,
    type: 'task_fee',
    amount: -100,
    balance_after: newBalance,
    description: `Комиссия: ${input.title}`,
  })

  // Invite specific couriers
  if (input.invited_couriers.length > 0) {
    await supabase.from('task_invitations').insert(
      input.invited_couriers.map((courier_id) => ({
        task_id: task.id,
        courier_id,
      }))
    )
  }

  // Notify couriers about new task
  await supabase.from('notifications').insert({
    user_id: user.id,
    type: 'task_published',
    title: 'Поручение опубликовано',
    body: input.title,
    task_id: task.id,
  })

  revalidatePath('/tasks')
  revalidatePath('/dashboard')
  return { taskId: task.id }
}

// ── Accept task (courier) ────────────────────────────────────────────────────

export async function acceptTask(taskId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  const { data: task } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', taskId)
    .single()

  if (!task) return { error: 'Поручение не найдено' }
  if (task.status !== 'published') return { error: 'Поручение уже недоступно' }

  const { error } = await supabase
    .from('tasks')
    .update({ courier_id: user.id, status: 'matched' })
    .eq('id', taskId)

  if (error) return { error: error.message }

  // Notify customer
  await supabase.from('notifications').insert({
    user_id: task.customer_id,
    type: 'task_accepted',
    title: 'Курьер принял ваше поручение',
    body: task.title,
    task_id: taskId,
  })

  revalidatePath('/tasks')
  revalidatePath(`/tasks/${taskId}`)
  return { success: true }
}

// ── Start task (courier) ─────────────────────────────────────────────────────

export async function startTask(taskId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  const { error } = await supabase
    .from('tasks')
    .update({ status: 'in_progress', started_at: new Date().toISOString() })
    .eq('id', taskId)
    .eq('courier_id', user.id)

  if (error) return { error: error.message }

  revalidatePath(`/tasks/${taskId}`)
  return { success: true }
}

// ── Complete task ────────────────────────────────────────────────────────────

export async function completeTask(taskId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  const { data: task } = await supabase
    .from('tasks')
    .select('*, customer:profiles!tasks_customer_id_fkey(*)')
    .eq('id', taskId)
    .single()

  if (!task) return { error: 'Поручение не найдено' }

  const { error } = await supabase
    .from('tasks')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('id', taskId)
    .eq('courier_id', user.id)

  if (error) return { error: error.message }

  // Payout reward to courier
  if (task.reward > 0) {
    const { data: courierProfile } = await supabase
      .from('profiles')
      .select('wallet_balance')
      .eq('id', user.id)
      .single()

    if (courierProfile) {
      const newBalance = courierProfile.wallet_balance + task.reward
      await supabase
        .from('profiles')
        .update({ wallet_balance: newBalance })
        .eq('id', user.id)

      await supabase.from('transactions').insert({
        user_id: user.id,
        task_id: taskId,
        type: 'payout',
        amount: task.reward,
        balance_after: newBalance,
        description: `Выплата: ${task.title}`,
      })
    }
  }

  // Update courier stats
  await supabase.rpc('increment_courier_tasks', { courier_id: user.id })

  // Notify customer
  await supabase.from('notifications').insert({
    user_id: task.customer_id,
    type: 'task_completed',
    title: 'Поручение выполнено!',
    body: task.title,
    task_id: taskId,
  })

  revalidatePath(`/tasks/${taskId}`)
  revalidatePath('/tasks')
  return { success: true }
}

// ── Cancel task (customer) ───────────────────────────────────────────────────

export async function cancelTask(taskId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  const { error } = await supabase
    .from('tasks')
    .update({ status: 'cancelled' })
    .eq('id', taskId)
    .eq('customer_id', user.id)
    .in('status', ['published', 'matched'])

  if (error) return { error: error.message }

  revalidatePath('/tasks')
  revalidatePath(`/tasks/${taskId}`)
  return { success: true }
}

// ── Submit rating ────────────────────────────────────────────────────────────

interface RatingInput {
  taskId: string
  toUserId: string
  score: number
  comment: string
}

export async function submitRating(input: RatingInput) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  const { error } = await supabase.from('ratings').insert({
    task_id: input.taskId,
    from_user_id: user.id,
    to_user_id: input.toUserId,
    score: input.score,
    comment: input.comment || null,
  })

  if (error) return { error: error.message }

  revalidatePath(`/tasks/${input.taskId}`)
  return { success: true }
}
