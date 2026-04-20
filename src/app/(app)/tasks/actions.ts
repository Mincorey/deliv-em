'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'

// Service-role client — bypasses RLS for task status mutations
function adminClient() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// ── Create task ──────────────────────────────────────────────────────────────

interface CreateTaskInput {
  title: string
  description: string
  task_type: string
  reward: number
  city: string
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
      city: input.city,
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

const MAX_ACTIVE_TASKS = 2

export async function acceptTask(taskId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  const admin = adminClient()

  // Check active task limit
  const { count } = await admin
    .from('tasks')
    .select('id', { count: 'exact', head: true })
    .eq('courier_id', user.id)
    .in('status', ['matched', 'in_progress'])

  if ((count ?? 0) >= MAX_ACTIVE_TASKS) {
    return { error: `Нельзя взять больше ${MAX_ACTIVE_TASKS} поручений одновременно. Завершите текущие задания.` }
  }

  // Atomic update: only succeeds if status is still 'published' at the moment of write
  // This prevents race conditions when multiple couriers click "Accept" simultaneously
  const { data: updated, error } = await admin
    .from('tasks')
    .update({ courier_id: user.id, status: 'matched' })
    .eq('id', taskId)
    .eq('status', 'published')
    .select('customer_id, title')
    .single()

  if (error || !updated) {
    // Could not update — either task doesn't exist or was already accepted
    const { data: existing } = await admin
      .from('tasks')
      .select('status, courier:profiles!tasks_courier_id_fkey(full_name)')
      .eq('id', taskId)
      .single()

    if (!existing) return { error: 'Поручение не найдено' }
    return { error: `Поручение уже взял другой курьер` }
  }

  await admin.from('notifications').insert({
    user_id: updated.customer_id,
    type: 'task_accepted',
    title: 'Курьер принял ваше поручение',
    body: updated.title,
    task_id: taskId,
  })

  revalidatePath('/tasks')
  revalidatePath(`/tasks/${taskId}`)
  return { success: true }
}

// ── Start task (courier) ─────────────────────────────────────────────────────

export async function startTask(taskId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  const { error } = await adminClient()
    .from('tasks')
    .update({ status: 'in_progress', started_at: new Date().toISOString() })
    .eq('id', taskId)
    .eq('courier_id', user.id)
  if (error) return { error: error.message }

  revalidatePath(`/tasks/${taskId}`)
  return { success: true }
}

// ── Complete task (courier marks done → awaiting customer confirmation) ──────

export async function completeTask(taskId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  const admin = adminClient()
  const { data: task } = await admin.from('tasks').select('customer_id, title').eq('id', taskId).single()
  if (!task) return { error: 'Поручение не найдено' }

  const { error } = await admin
    .from('tasks')
    .update({ status: 'awaiting_confirmation' })
    .eq('id', taskId)
    .eq('courier_id', user.id)
    .eq('status', 'in_progress')
  if (error) return { error: error.message }

  // Notify customer to confirm
  await admin.from('notifications').insert({
    user_id: task.customer_id,
    type: 'task_completed',
    title: 'Курьер завершил поручение',
    body: `Подтвердите выполнение: ${task.title}`,
    task_id: taskId,
  })

  revalidatePath(`/tasks/${taskId}`)
  revalidatePath('/tasks')
  return { success: true }
}

// ── Confirm completion (customer confirms → completed) ───────────────────────

export async function confirmTask(taskId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  const admin = adminClient()
  const { data: task } = await admin.from('tasks').select('courier_id, title').eq('id', taskId).single()
  if (!task) return { error: 'Поручение не найдено' }

  const { error } = await admin
    .from('tasks')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('id', taskId)
    .eq('customer_id', user.id)
    .eq('status', 'awaiting_confirmation')
  if (error) return { error: error.message }

  if (task.courier_id) {
    // Recalculate counters from tasks table (source of truth) to avoid stale increment bugs
    const [{ count: completedCount }, { count: totalCount }] = await Promise.all([
      admin.from('tasks').select('id', { count: 'exact', head: true })
        .eq('courier_id', task.courier_id).eq('status', 'completed'),
      admin.from('tasks').select('id', { count: 'exact', head: true })
        .eq('courier_id', task.courier_id),
    ])

    await admin.from('courier_profiles')
      .upsert({
        id: task.courier_id,
        completed_tasks: completedCount ?? 0,
        total_tasks:     totalCount     ?? 0,
      }, { onConflict: 'id' })

    await admin.from('notifications').insert({
      user_id: task.courier_id,
      type: 'task_completed',
      title: 'Заказчик подтвердил выполнение',
      body: task.title,
      task_id: taskId,
    })
  }

  revalidatePath(`/tasks/${taskId}`)
  revalidatePath('/tasks')
  return { success: true }
}

// ── Reject completion (customer rejects → back to in_progress) ───────────────

export async function rejectCompletion(taskId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  const admin = adminClient()
  const { data: task } = await admin.from('tasks').select('courier_id, title').eq('id', taskId).single()
  if (!task) return { error: 'Поручение не найдено' }

  const { error } = await admin
    .from('tasks')
    .update({ status: 'in_progress' })
    .eq('id', taskId)
    .eq('customer_id', user.id)
    .eq('status', 'awaiting_confirmation')
  if (error) return { error: error.message }

  if (task.courier_id) {
    await admin.from('notifications').insert({
      user_id: task.courier_id,
      type: 'task_rejected',
      title: 'Заказчик отклонил выполнение',
      body: `Продолжите работу над: ${task.title}`,
      task_id: taskId,
    })
  }

  revalidatePath(`/tasks/${taskId}`)
  revalidatePath('/tasks')
  return { success: true }
}

// ── Cancel task (customer) ───────────────────────────────────────────────────

const TASK_FEE = 100

export async function cancelTask(taskId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  const admin = adminClient()

  // Atomic cancel — returns task data only if status was published/matched
  const { data: cancelled, error } = await admin
    .from('tasks')
    .update({ status: 'cancelled' })
    .eq('id', taskId)
    .eq('customer_id', user.id)
    .in('status', ['published', 'matched'])
    .select('courier_id, title')
    .single()

  if (error || !cancelled) return { error: 'Поручение не найдено или не может быть отменено' }

  // Refund the placement fee to customer
  const { data: profile } = await admin
    .from('profiles')
    .select('wallet_balance')
    .eq('id', user.id)
    .single()

  if (profile) {
    const newBalance = Number(profile.wallet_balance) + TASK_FEE

    await admin.from('profiles')
      .update({ wallet_balance: newBalance })
      .eq('id', user.id)

    await admin.from('transactions').insert({
      user_id      : user.id,
      type         : 'refund',
      amount       : TASK_FEE,
      balance_after: newBalance,
      description  : `Возврат комиссии за отменённое поручение: ${cancelled.title}`,
    })

    await admin.from('notifications').insert({
      user_id: user.id,
      type   : 'wallet',
      title  : 'Возврат средств',
      body   : `${TASK_FEE} ₽ возвращены за отмену поручения «${cancelled.title}»`,
    })
  }

  // Notify courier if task was already matched
  if (cancelled.courier_id) {
    await admin.from('notifications').insert({
      user_id: cancelled.courier_id,
      type   : 'task_cancelled',
      title  : 'Поручение отменено заказчиком',
      body   : cancelled.title,
      task_id: taskId,
    })
  }

  revalidatePath('/tasks')
  revalidatePath(`/tasks/${taskId}`)
  return { success: true }
}

// ── Update task (customer edits published task) ──────────────────────────────

interface UpdateTaskInput {
  title: string
  description: string
  task_type: string
  reward: number
  from_address: string
  to_address: string
  deadline: string | null
}

export async function updateTask(taskId: string, input: UpdateTaskInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  const { data: existing } = await supabase
    .from('tasks')
    .select('customer_id, status')
    .eq('id', taskId)
    .single()

  if (!existing) return { error: 'Поручение не найдено' }
  if (existing.customer_id !== user.id) return { error: 'Нет доступа' }
  if (existing.status !== 'published') return { error: 'Редактировать можно только опубликованные поручения' }

  const { error } = await supabase
    .from('tasks')
    .update({
      title:        input.title,
      description:  input.description || null,
      task_type:    input.task_type,
      reward:       input.reward,
      from_address: input.from_address,
      to_address:   input.to_address,
      deadline:     input.deadline || null,
    })
    .eq('id', taskId)
    .eq('customer_id', user.id)
    .eq('status', 'published')

  if (error) return { error: error.message }

  revalidatePath('/tasks')
  revalidatePath(`/tasks/${taskId}`)
  revalidatePath('/dashboard')
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
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  // Verify task is completed and user is a participant
  const { data: task } = await supabase
    .from('tasks').select('customer_id, courier_id, status').eq('id', input.taskId).single()
  if (!task) return { error: 'Поручение не найдено' }
  if (task.status !== 'completed') return { error: 'Поручение ещё не завершено' }

  const isCustomer = task.customer_id === user.id
  const isCourier  = task.courier_id  === user.id
  if (!isCustomer && !isCourier) return { error: 'Вы не участник этого поручения' }

  // Cross-role check: customer rates courier and vice versa
  const expectedTarget = isCustomer ? task.courier_id : task.customer_id
  if (input.toUserId !== expectedTarget) return { error: 'Некорректный получатель оценки' }

  // Check for duplicate
  const { data: existing } = await supabase
    .from('ratings').select('id').eq('task_id', input.taskId).eq('from_user_id', user.id).maybeSingle()
  if (existing) return { error: 'Вы уже оценили этого участника' }

  const { error } = await supabase.from('ratings').insert({
    task_id:      input.taskId,
    from_user_id: user.id,
    to_user_id:   input.toUserId,
    score:        input.score,
    comment:      input.comment || null,
  })
  if (error) return { error: error.message }

  // Rating recalculation is handled atomically by the DB trigger
  // recalc_courier_rating (AFTER INSERT ON ratings) — no manual update needed

  revalidatePath(`/tasks/${input.taskId}`)
  revalidatePath(`/profile/${input.toUserId}`)
  return { success: true }
}
