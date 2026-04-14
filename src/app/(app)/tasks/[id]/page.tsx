'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { RatingModal } from '@/components/tasks/RatingModal'
import { useToast } from '@/components/ui/Toast'
import { acceptTask, startTask, completeTask, cancelTask } from '../actions'
import { TASK_TYPE_META, STATUS_META, type TaskWithProfiles, type Profile } from '@/lib/types'
import { formatDate } from '@/lib/utils'

export default function TaskDetailPage() {
  const params = useParams()
  const router = useRouter()
  const toast = useToast()
  const supabase = createClient()

  const [task, setTask]               = useState<TaskWithProfiles | null>(null)
  const [currentUser, setCurrentUser] = useState<Profile | null>(null)
  const [loading, setLoading]         = useState(true)
  const [ratingOpen, setRatingOpen]   = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setCurrentUser(profile as Profile)
      const { data: taskData } = await supabase
        .from('tasks')
        .select(`*, customer:profiles!tasks_customer_id_fkey(*), courier:profiles!tasks_courier_id_fkey(*)`)
        .eq('id', params.id as string)
        .single()
      setTask(taskData as unknown as TaskWithProfiles)
      setLoading(false)
    }
    load()
  }, [params.id])

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
        .select(`*, customer:profiles!tasks_customer_id_fkey(*), courier:profiles!tasks_courier_id_fkey(*)`)
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

  const ratingTarget = isCustomer ? task.courier : task.customer

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/tasks" style={{ color: 'var(--text-3)' }}>
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <h2 className="text-xl font-bold flex-1" style={{ color: 'var(--text-1)' }}>Детали поручения</h2>
        <Badge cls={statusMeta.cls}>{statusMeta.label}</Badge>
      </div>

      <div className="flex flex-col gap-4">
        {/* Header */}
        <div style={card}>
          <div className="flex items-start gap-3 mb-4">
            <span className="material-symbols-outlined" style={{ color: typeMeta.color, fontSize: 28 }}>{typeMeta.icon}</span>
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
          <div className="rounded-xl p-4" style={{ background: 'var(--surface-alt)', border: '1.5px solid var(--border)' }}>
            <div className="flex justify-between text-sm">
              <div>
                <p className="label-sm">Откуда</p>
                <p className="font-semibold" style={{ color: 'var(--text-1)' }}>{task.from_address}</p>
              </div>
              <span className="material-symbols-outlined" style={{ color: 'var(--green)' }}>arrow_forward</span>
              <div className="text-right">
                <p className="label-sm">Куда</p>
                <p className="font-semibold" style={{ color: 'var(--text-1)' }}>{task.to_address}</p>
              </div>
            </div>
          </div>

          {task.deadline && (
            <div className="mt-3 flex items-center gap-2 text-sm" style={{ color: 'var(--text-3)' }}>
              <span className="material-symbols-outlined text-sm">schedule</span>
              до {formatDate(task.deadline)}
            </div>
          )}
        </div>

        {/* Description */}
        {task.description && (
          <div style={card}>
            <p className="label-sm">Описание</p>
            <p className="text-sm mt-2" style={{ color: 'var(--text-2)' }}>{task.description}</p>
          </div>
        )}

        {/* Participants */}
        <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div className="flex items-center gap-3">
            <Avatar name={task.customer.full_name} avatarUrl={task.customer.avatar_url} />
            <div>
              <p className="label-sm">Заказчик</p>
              <p className="font-bold text-sm" style={{ color: 'var(--text-1)' }}>{task.customer.full_name}</p>
              <p className="text-xs" style={{ color: 'var(--text-3)' }}>{task.customer.city}</p>
            </div>
          </div>
          {task.courier && (
            <div className="flex items-center gap-3" style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
              <Avatar name={task.courier.full_name} avatarUrl={task.courier.avatar_url} />
              <div>
                <p className="label-sm">Курьер</p>
                <p className="font-bold text-sm" style={{ color: 'var(--text-1)' }}>{task.courier.full_name}</p>
                <p className="text-xs" style={{ color: 'var(--text-3)' }}>{task.courier.city}</p>
              </div>
            </div>
          )}
        </div>

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
          {!isCustomer && task.status === 'published' && (
            <button className="btn-green w-full" style={{ justifyContent: 'center', padding: '14px' }}
              onClick={() => handle(() => acceptTask(task.id))}>
              <span className="material-symbols-outlined text-base">check_circle</span>
              Принять задание
            </button>
          )}
          {isCourier && task.status === 'matched' && (
            <button className="btn-primary w-full" style={{ justifyContent: 'center', padding: '14px' }}
              onClick={() => handle(() => startTask(task.id))}>
              <span className="material-symbols-outlined text-base">rocket_launch</span>
              Начать выполнение
            </button>
          )}
          {isCourier && task.status === 'in_progress' && (
            <button className="btn-green w-full" style={{ justifyContent: 'center', padding: '14px' }}
              onClick={() => handle(() => completeTask(task.id))}>
              <span className="material-symbols-outlined text-base">task_alt</span>
              Отметить как выполненное
            </button>
          )}
          {isCustomer && ['published', 'matched'].includes(task.status) && (
            <button className="btn-ghost w-full" style={{ color: '#ba1a1a', justifyContent: 'center', padding: '14px' }}
              onClick={() => handle(() => cancelTask(task.id))}>
              <span className="material-symbols-outlined text-base">cancel</span>
              Отменить поручение
            </button>
          )}
          {task.status === 'completed' && ratingTarget && (
            <button className="btn-primary w-full" style={{ justifyContent: 'center', padding: '14px' }}
              onClick={() => setRatingOpen(true)}>
              <span className="material-symbols-outlined fill-icon text-base">star</span>
              Оставить оценку
            </button>
          )}
          {task.courier_id && (
            <Link href={`/messages/${task.id}`}>
              <button className="btn-ghost w-full" style={{ justifyContent: 'center', padding: '14px' }}>
                <span className="material-symbols-outlined text-base">chat_bubble</span>
                Чат по заданию
              </button>
            </Link>
          )}
        </div>
      </div>

      {ratingTarget && (
        <RatingModal
          open={ratingOpen}
          onClose={() => setRatingOpen(false)}
          taskId={task.id}
          toUserId={ratingTarget.id}
          toUserName={ratingTarget.full_name}
        />
      )}
    </div>
  )
}
