import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'
import { TASK_TYPE_META, STATUS_META } from '@/lib/types'
import type { TaskWithProfiles } from '@/lib/types'
import { formatDate } from '@/lib/utils'

interface TaskCardProps {
  task: TaskWithProfiles
  showCourier?: boolean
  showCustomer?: boolean
}

export function TaskCard({ task, showCourier, showCustomer }: TaskCardProps) {
  const typeMeta = TASK_TYPE_META[task.task_type]
  const statusMeta = STATUS_META[task.status]

  return (
    <Link href={`/tasks/${task.id}`} className="task-card block">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <span
            className="material-symbols-outlined mt-0.5 flex-shrink-0"
            style={{ color: typeMeta.color, fontSize: 20 }}
          >
            {typeMeta.icon}
          </span>
          <div className="flex-1 min-w-0">
            <p
              className="font-bold text-sm truncate"
              style={{ color: '#191c1e' }}
            >
              {task.title}
            </p>
            <div className="flex items-center gap-1 mt-0.5 text-xs" style={{ color: '#757682' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 12 }}>
                location_on
              </span>
              <span className="truncate">
                {task.from_address} → {task.to_address}
              </span>
            </div>
            {showCourier && task.courier && (
              <p className="text-xs mt-1" style={{ color: '#757682' }}>
                Курьер: {task.courier.full_name}
              </p>
            )}
            {showCustomer && task.customer && (
              <p className="text-xs mt-1" style={{ color: '#757682' }}>
                Заказчик: {task.customer.full_name}
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <Badge cls={statusMeta.cls}>{statusMeta.label}</Badge>
          <span className="font-bold text-sm" style={{ color: '#006c49' }}>
            {task.reward} ₽
          </span>
          {task.deadline && (
            <span className="text-xs" style={{ color: '#757682' }}>
              до {formatDate(task.deadline)}
            </span>
          )}
        </div>
      </div>

      {/* Progress bar for in_progress */}
      {task.status === 'in_progress' && (
        <div className="progress-bar mt-3">
          <div className="progress-fill" style={{ width: '50%' }} />
        </div>
      )}
    </Link>
  )
}
