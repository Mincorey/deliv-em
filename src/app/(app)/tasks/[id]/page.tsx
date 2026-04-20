'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { RatingBlock } from '@/components/tasks/RatingBlock'
import { useToast } from '@/components/ui/Toast'
import { acceptTask, startTask, completeTask, confirmTask, rejectCompletion, cancelTask } from '../actions'
import { TASK_TYPE_META, STATUS_META, type TaskWithProfiles, type Profile } from '@/lib/types'
import { formatDate } from '@/lib/utils'
import { TaskRouteMap } from '@/components/ui/TaskRouteMap'
import { AnimatedPage, AnimatedItem } from '@/components/ui/Animated'

export default function TaskDetailPage() {
  const params = useParams()
  const router = useRouter()
  const toast = useToast()
  const supabase = createClient()

  const [task, setTask]               = useState<TaskWithProfiles | null>(null)
  const [currentUser, setCurrentUser] = useState<Profile | null>(null)
  const [loading, setLoading]         = useState(true)
  const [myRating, setMyRating]       = useState<number | null>(null)
  // Live courier position (lat/lng for map, null = not tracking)
  const [courierCoords, setCourierCoords] = useState<[number, number] | null>(null)
  const [tracking, setTracking]           = useState(false)  // courier: is sharing?

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }
      const [{ data: profile }, { data: taskData }, { data: existingRating }] = await Promise.all([
        supabase.from('profiles').select('id, full_name, role, wallet_balance, city, avatar_url, phone, bio, birth_date, privacy_settings').eq('id', user.id).single(),
        supabase.from('tasks')
          .select(`*, customer:profiles!tasks_customer_id_fkey(id, full_name, avatar_url, role, city), courier:profiles!tasks_courier_id_fkey(id, full_name, avatar_url, role, city)`)
          .eq('id', params.id as string)
          .single(),
        supabase.from('ratings').select('score')
          .eq('task_id', params.id as string)
          .eq('from_user_id', user.id)
          .maybeSingle(),
      ])
      setCurrentUser(profile as Profile)
      setTask(taskData as unknown as TaskWithProfiles)
      if (existingRating) setMyRating(existingRating.score)

      setLoading(false)
    }
    load()
  }, [params.id])

  // Realtime: live task status updates (no page refresh needed)
  useEffect(() => {
    const channel = supabase
      .channel(`task:${params.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'tasks',
        filter: `id=eq.${params.id}`,
      }, async () => {
        const { data } = await supabase
          .from('tasks')
          .select(`*, customer:profiles!tasks_customer_id_fkey(id, full_name, avatar_url, role, city), courier:profiles!tasks_courier_id_fkey(id, full_name, avatar_url, role, city)`)
          .eq('id', params.id as string)
          .single()
        if (data) setTask(data as unknown as TaskWithProfiles)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [params.id])

  /* ── Courier: share live location while task is in_progress ── */
  useEffect(() => {
    if (!task || !currentUser) return
    if (task.status !== 'in_progress') return
    if (currentUser.id !== task.courier_id) return
    if (!navigator?.geolocation) return

    setTracking(true)
    const taskId    = task.id
    const courierId = currentUser.id

    const send = () => {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        await supabase.from('courier_locations').upsert({
          courier_id: courierId,
          task_id:    taskId,
          lat:        pos.coords.latitude,
          lng:        pos.coords.longitude,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'courier_id' })
      }, () => { /* ignore single error */ })
    }

    send() // immediate first update
    const interval = setInterval(send, 10000)

    return () => {
      clearInterval(interval)
      setTracking(false)
      // Clean up location row when courier leaves/stops
      supabase.from('courier_locations').delete().eq('courier_id', courierId).eq('task_id', taskId)
    }
  }, [task?.status, task?.courier_id, currentUser?.id])

  /* ── Customer: subscribe to courier location updates ── */
  useEffect(() => {
    if (!task || !currentUser) return
    if (task.status !== 'in_progress') return
    if (currentUser.id !== task.customer_id) return
    if (!task.courier_id) return

    const courierId = task.courier_id

    // Load current position first
    supabase.from('courier_locations')
      .select('lat, lng')
      .eq('courier_id', courierId)
      .eq('task_id', task.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setCourierCoords([data.lat, data.lng])
      })

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`courier-loc:${courierId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table:  'courier_locations',
        filter: `courier_id=eq.${courierId}`,
      }, (payload) => {
        const row = payload.new as { lat: number; lng: number } | null
        if (row?.lat) setCourierCoords([row.lat, row.lng])
        else setCourierCoords(null)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      setCourierCoords(null)
    }
  }, [task?.status, task?.courier_id, task?.customer_id, currentUser?.id])

  if (loading) return (
    <div className="p-6 max-w-3xl mx-auto flex justify-center py-20">
      <span className="material-symbols-outlined animate-spin" style={{ fontSize: 32, color: 'var(--text-4)' }}>progress_activity</span>
    </div>
  )

  if (!task) return (
    <div className="p-6 max-w-3xl mx-auto text-center py-20">
      <p className="font-bold" style={{ color: 'var(--text-3)' }}>Поручение не найдено</p>
      <Link href="/tasks" className="text-sm mt-3 font-bold" style={{ color: 'var(--green)', display: 'block' }}>← Назад</Link>
    </div>
  )

  const typeMeta  = TASK_TYPE_META[task.task_type]
  const statusMeta = STATUS_META[task.status]
  const isCustomer = currentUser?.id === task.customer_id
  const isCourier  = currentUser?.id === task.courier_id

  async function handle(action: () => Promise<{ error?: string; success?: boolean }>) {
    const res = await action()
    if (res.error) {
      toast.show(res.error, 'error')
    } else {
      toast.show('Готово!', 'success')
      const { data } = await supabase
        .from('tasks')
        .select(`*, customer:profiles!tasks_customer_id_fkey(id, full_name, avatar_url, role, city), courier:profiles!tasks_courier_id_fkey(id, full_name, avatar_url, role, city)`)
        .eq('id', task!.id).single()
      setTask(data as unknown as TaskWithProfiles)
    }
  }

  const card = {
    background: 'var(--surface)',
    border: '1.5px solid var(--border)',
    boxShadow: 'var(--shadow-sm)',
    borderRadius: '1rem',
    padding: '1.25rem',
  }

  return (
    <AnimatedPage className="p-6 max-w-3xl mx-auto">
      <AnimatedItem className="flex items-center gap-3 mb-6">
        <Link href="/tasks" style={{ color: 'var(--text-3)' }}>
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <h2 className="text-xl font-bold flex-1" style={{ color: 'var(--text-1)' }}>Детали поручения</h2>
        {isCustomer && task.status === 'published' && (
          <Link href={`/tasks/${task.id}/edit`} style={{ textDecoration: 'none' }}>
            <button
              className="btn-ghost"
              style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>edit</span>
              Изменить
            </button>
          </Link>
        )}
        <Badge cls={statusMeta.cls}>{statusMeta.label}</Badge>
      </AnimatedItem>

      <div className="flex flex-col gap-4">
        {/* Header */}
        <AnimatedItem style={card}>
          <div className="flex items-start gap-3 mb-4">
            <div style={{ width: 48, height: 48, borderRadius: '0.875rem', flexShrink: 0, background: typeMeta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-symbols-outlined" style={{ color: typeMeta.color, fontSize: 28 }}>{typeMeta.icon}</span>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold" style={{ color: 'var(--text-1)' }}>{task.title}</h3>
              <Badge cls="badge-blue mt-1">{typeMeta.label}</Badge>
            </div>
            <div className="text-right">
              <div className="text-2xl font-black" style={{ color: 'var(--green)' }}>{task.reward} ₽</div>
              <p className="text-xs" style={{ color: 'var(--text-3)' }}>вознаграждение</p>
            </div>
          </div>

          {/* Route */}
          <div className="rounded-xl" style={{ background: 'var(--surface-alt)', border: '1.5px solid var(--border)', padding: '1rem 1.25rem' }}>
            <div className="flex items-center gap-4 text-sm">
              <div style={{ flex: 1 }}>
                <p className="label-sm">Откуда</p>
                <p className="font-semibold" style={{ color: 'var(--text-1)', wordBreak: 'break-word' }}>{task.from_address}</p>
              </div>
              <span className="material-symbols-outlined flex-shrink-0" style={{ color: 'var(--green)' }}>arrow_forward</span>
              <div style={{ flex: 1, textAlign: 'right' }}>
                <p className="label-sm">Куда</p>
                <p className="font-semibold" style={{ color: 'var(--text-1)', wordBreak: 'break-word' }}>{task.to_address}</p>
              </div>
            </div>
          </div>

          {task.deadline && (
            <div className="mt-3 flex items-center gap-2 text-sm" style={{ color: 'var(--text-3)' }}>
              <span className="material-symbols-outlined text-sm">schedule</span>
              до {formatDate(task.deadline)}
            </div>
          )}
        </AnimatedItem>

        {/* Route map */}
        {(task.from_address || task.to_address) && (
          <AnimatedItem style={card}>
            {/* Courier tracking indicator */}
            {isCourier && task.status === 'in_progress' && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                marginBottom: 12, padding: '8px 12px',
                background: tracking ? 'rgba(29,184,122,0.1)' : 'var(--surface-alt)',
                border: `1.5px solid ${tracking ? 'rgba(29,184,122,0.35)' : 'var(--border)'}`,
                borderRadius: '0.75rem',
              }}>
                <span style={{
                  width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                  background: tracking ? '#1db87a' : 'var(--text-4)',
                  boxShadow: tracking ? '0 0 0 3px rgba(29,184,122,0.25)' : 'none',
                  animation: tracking ? 'pulse 1.5s infinite' : 'none',
                }} />
                <span style={{ fontSize: '0.8rem', color: tracking ? 'var(--green)' : 'var(--text-3)', fontWeight: 600 }}>
                  {tracking ? 'Геолокация передаётся заказчику' : 'Геолокация недоступна'}
                </span>
              </div>
            )}
            {/* Customer: show tracking status */}
            {isCustomer && task.status === 'in_progress' && task.courier_id && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                marginBottom: 12, padding: '8px 12px',
                background: courierCoords ? 'rgba(14,165,233,0.08)' : 'var(--surface-alt)',
                border: `1.5px solid ${courierCoords ? 'rgba(14,165,233,0.3)' : 'var(--border)'}`,
                borderRadius: '0.75rem',
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16, color: courierCoords ? '#0ea5e9' : 'var(--text-4)' }}>
                  delivery_truck_speed
                </span>
                <span style={{ fontSize: '0.8rem', color: courierCoords ? '#0ea5e9' : 'var(--text-3)', fontWeight: 600 }}>
                  {courierCoords ? 'Курьер на карте — позиция обновляется' : 'Ожидаем геолокацию курьера…'}
                </span>
              </div>
            )}
            <TaskRouteMap
              fromAddress={task.from_address}
              toAddress={task.to_address}
              courierCoords={isCustomer ? courierCoords : null}
            />
          </AnimatedItem>
        )}

        {/* Description */}
        {task.description && (
          <AnimatedItem style={card}>
            <p className="label-sm">Описание</p>
            <p className="text-sm mt-2" style={{ color: 'var(--text-2)', whiteSpace: 'pre-wrap' }}>{task.description}</p>
          </AnimatedItem>
        )}

        {/* Participants */}
        {(task.customer || task.courier) && (
          <AnimatedItem style={{ ...card, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {task.customer && (
              <Link href={`/profile/${task.customer.id}`} style={{ textDecoration: 'none' }}>
                <div className="flex items-center gap-3" style={{
                  padding: '0.5rem', borderRadius: '0.75rem', margin: '-0.5rem',
                  transition: 'background 0.15s', cursor: 'pointer',
                }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-variant)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <Avatar name={task.customer.full_name} avatarUrl={task.customer.avatar_url} />
                  <div className="flex-1">
                    <p className="label-sm">Заказчик</p>
                    <p className="font-bold text-sm" style={{ color: 'var(--text-1)' }}>{task.customer.full_name}</p>
                    <p className="text-xs" style={{ color: 'var(--text-3)' }}>{task.customer.city}</p>
                  </div>
                  <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--text-4)' }}>chevron_right</span>
                </div>
              </Link>
            )}
            {task.courier && (
              <Link href={`/profile/${task.courier.id}`} style={{ textDecoration: 'none' }}>
                <div className="flex items-center gap-3" style={{
                  borderTop: task.customer ? '1px solid var(--border)' : 'none',
                  paddingTop: task.customer ? '0.75rem' : 0,
                  padding: '0.5rem', borderRadius: '0.75rem', margin: '-0.5rem',
                  marginTop: task.customer ? 'calc(0.75rem - 0.5rem)' : '-0.5rem',
                  transition: 'background 0.15s', cursor: 'pointer',
                }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-variant)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <Avatar name={task.courier.full_name} avatarUrl={task.courier.avatar_url} />
                  <div className="flex-1">
                    <p className="label-sm">Курьер</p>
                    <p className="font-bold text-sm" style={{ color: 'var(--text-1)' }}>{task.courier.full_name}</p>
                    <p className="text-xs" style={{ color: 'var(--text-3)' }}>{task.courier.city}</p>
                  </div>
                  <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--text-4)' }}>chevron_right</span>
                </div>
              </Link>
            )}
          </div>
        )}

        {/* Progress */}
        {task.status === 'in_progress' && (
          <div style={card}>
            <div className="flex justify-between mb-2">
              <p className="label-sm">Выполнение</p>
              <p className="text-xs font-bold" style={{ color: 'var(--green)' }}>В процессе</p>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: '60%' }} />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3">
          {/* Courier: accept published task */}
          {!isCustomer && task.status === 'published' && (
            <button className="btn-green w-full" style={{ justifyContent: 'center', padding: '14px' }}
              onClick={() => handle(() => acceptTask(task.id))}>
              <span className="material-symbols-outlined text-base">check_circle</span>
              Принять поручение
            </button>
          )}

          {/* Courier: start matched task */}
          {isCourier && task.status === 'matched' && (
            <button className="btn-primary w-full" style={{ justifyContent: 'center', padding: '14px' }}
              onClick={() => handle(() => startTask(task.id))}>
              <span className="material-symbols-outlined text-base">rocket_launch</span>
              Начать выполнение
            </button>
          )}

          {/* Courier: mark done → awaiting confirmation */}
          {isCourier && task.status === 'in_progress' && (
            <button className="btn-green w-full" style={{ justifyContent: 'center', padding: '14px' }}
              onClick={() => handle(() => completeTask(task.id))}>
              <span className="material-symbols-outlined text-base">task_alt</span>
              Отметить как выполненное
            </button>
          )}

          {/* Courier: waiting banner */}
          {isCourier && task.status === 'awaiting_confirmation' && (
            <div style={{
              background: 'var(--surface-variant)', border: '1.5px solid var(--border)',
              borderRadius: '1rem', padding: '14px', textAlign: 'center',
              color: 'var(--text-3)', fontSize: '0.875rem', fontWeight: 600,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>hourglass_empty</span>
              Ожидаем подтверждения заказчика
            </div>
          )}

          {/* Customer: confirm or reject */}
          {isCustomer && task.status === 'awaiting_confirmation' && (
            <>
              <div style={{
                background: 'rgba(45,212,160,0.08)', border: '1.5px solid rgba(45,212,160,0.3)',
                borderRadius: '1rem', padding: '12px 16px',
                color: 'var(--text-2)', fontSize: '0.875rem', lineHeight: 1.5,
                display: 'flex', alignItems: 'flex-start', gap: 10,
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#2dd4a0', flexShrink: 0, marginTop: 1 }}>info</span>
                Курьер отметил поручение как выполненное. Проверьте и подтвердите или отклоните.
              </div>
              <div className="flex gap-3">
                <button className="btn-ghost flex-1" style={{ justifyContent: 'center', padding: '14px', color: '#ba1a1a' }}
                  onClick={() => handle(() => rejectCompletion(task.id))}>
                  <span className="material-symbols-outlined text-base">cancel</span>
                  Отклонить
                </button>
                <button className="btn-green flex-1" style={{ justifyContent: 'center', padding: '14px' }}
                  onClick={() => handle(() => confirmTask(task.id))}>
                  <span className="material-symbols-outlined text-base">verified</span>
                  Подтвердить
                </button>
              </div>
            </>
          )}

          {/* Customer: cancel while open */}
          {isCustomer && ['published', 'matched'].includes(task.status) && (
            <button className="btn-ghost w-full" style={{ color: '#ba1a1a', justifyContent: 'center', padding: '14px' }}
              onClick={() => handle(() => cancelTask(task.id))}>
              <span className="material-symbols-outlined text-base">cancel</span>
              Отменить поручение
            </button>
          )}

          {/* Chat */}
          {task.courier_id && (
            <Link href={`/messages/${task.id}`}>
              <button className="btn-ghost w-full" style={{ justifyContent: 'center', padding: '14px' }}>
                <span className="material-symbols-outlined text-base">chat_bubble</span>
                Чат по заданию
              </button>
            </Link>
          )}
        </div>

        {/* Inline rating block — shown after completion */}
        {task.status === 'completed' && isCustomer && task.courier && (
          <RatingBlock
            taskId={task.id}
            target={task.courier}
            roleLabel="Курьер"
            existingScore={myRating}
          />
        )}
        {task.status === 'completed' && isCourier && task.customer && (
          <RatingBlock
            taskId={task.id}
            target={task.customer}
            roleLabel="Заказчик"
            existingScore={myRating}
          />
        )}
      </div>
    </div>
  )
}
