'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'
import { TASK_TYPE_META, STATUS_META } from '@/lib/types'
import type { TaskWithProfiles } from '@/lib/types'
import { formatDate } from '@/lib/utils'

interface TaskCardProps {
  task           : TaskWithProfiles
  showCourier   ?: boolean
  showCustomer  ?: boolean
  currentUserId ?: string
}

export function TaskCard({ task, showCourier, showCustomer, currentUserId }: TaskCardProps) {
  const router     = useRouter()
  const typeMeta   = TASK_TYPE_META[task.task_type]
  const statusMeta = STATUS_META[task.status]
  const canEdit    = currentUserId === task.customer_id && task.status === 'published'

  return (
    // div instead of Link to avoid nested <a> tags (profile links are inside)
    <div
      className="task-card block"
      style={{ cursor: 'pointer' }}
      onClick={() => router.push(`/tasks/${task.id}`)}
    >
      <div className="flex items-start justify-between gap-4">

        {/* Left — icon + info */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div
            style={{
              width: 40, height: 40, borderRadius: '0.75rem', flexShrink: 0,
              background: typeMeta.bg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ color: typeMeta.color, fontSize: 22 }}
            >
              {typeMeta.icon}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            {/* Title */}
            <p className="font-bold truncate" style={{ fontSize: '0.95rem', color: 'var(--text-1)', lineHeight: 1.35 }}>
              {task.title}
            </p>

            {/* Route */}
            <div
              className="flex items-center gap-1 mt-1"
              style={{ color: 'var(--text-3)', fontSize: '0.78rem' }}
            >
              <span className="material-symbols-outlined flex-shrink-0" style={{ fontSize: 13 }}>location_on</span>
              <span className="truncate">{task.from_address} → {task.to_address}</span>
            </div>

            {/* Courier / Customer — stop propagation so clicking name doesn't open task */}
            {showCourier && task.courier && (
              <p className="mt-1" style={{ fontSize: '0.78rem', color: 'var(--text-3)' }}>
                Курьер:{' '}
                <Link
                  href={`/profile/${task.courier.id}`}
                  onClick={e => e.stopPropagation()}
                  style={{ color: 'var(--brand)', fontWeight: 600, textDecoration: 'none' }}
                >
                  {task.courier.full_name}
                </Link>
              </p>
            )}
            {showCustomer && task.customer && (
              <p className="mt-1" style={{ fontSize: '0.78rem', color: 'var(--text-3)' }}>
                Заказчик:{' '}
                <Link
                  href={`/profile/${task.customer.id}`}
                  onClick={e => e.stopPropagation()}
                  style={{ color: 'var(--brand)', fontWeight: 600, textDecoration: 'none' }}
                >
                  {task.customer.full_name}
                </Link>
              </p>
            )}
          </div>
        </div>

        {/* Right — status + reward + deadline + edit */}
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          <Badge cls={statusMeta.cls}>{statusMeta.label}</Badge>
          <span className="font-black" style={{ fontSize: '1rem', color: 'var(--green)', lineHeight: 1 }}>
            {task.reward} ₽
          </span>
          {task.deadline && (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>
              до {formatDate(task.deadline)}
            </span>
          )}
          {canEdit && (
            <Link
              href={`/tasks/${task.id}/edit`}
              onClick={(e) => e.stopPropagation()}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                fontSize: '0.72rem', fontWeight: 700, color: 'var(--brand)',
                textDecoration: 'none', marginTop: 2,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>edit</span>
              Изменить
            </Link>
          )}
        </div>
      </div>

      {/* Progress bar for in_progress / awaiting_confirmation */}
      {(task.status === 'in_progress' || task.status === 'awaiting_confirmation') && (
        <div className="progress-bar mt-3">
          <div className="progress-fill" style={{ width: task.status === 'awaiting_confirmation' ? '90%' : '50%' }} />
        </div>
      )}
    </div>
  )
}
