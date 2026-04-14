'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'

const TASK_TYPES = [
  { value: 'all', label: 'Все типы' },
  { value: 'documents', label: 'Документы' },
  { value: 'groceries', label: 'Продукты' },
  { value: 'materials', label: 'Материалы' },
  { value: 'gift', label: 'Подарок' },
  { value: 'meeting', label: 'Встреча' },
  { value: 'parcel', label: 'Посылка' },
]

interface FeedFiltersProps {
  currentType?: string
  currentMinReward?: string
}

export function FeedFilters({ currentType = 'all', currentMinReward = '' }: FeedFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== 'all') {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    startTransition(() => {
      router.push(`/tasks?${params.toString()}`)
    })
  }

  return (
    <div className="glass rounded-2xl p-4 mb-5 flex flex-wrap gap-3">
      <div>
        <label className="label-sm">Тип</label>
        <select
          defaultValue={currentType}
          onChange={(e) => update('type', e.target.value)}
          className="input-field text-xs"
          style={{ padding: '8px 14px', borderRadius: 9999, width: 'auto' }}
        >
          {TASK_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="label-sm">Мин. оплата (₽)</label>
        <input
          type="number"
          defaultValue={currentMinReward}
          placeholder="₽"
          className="input-field text-xs"
          style={{ padding: '8px 14px', borderRadius: 9999, width: 100 }}
          onBlur={(e) => update('min_reward', e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') update('min_reward', (e.target as HTMLInputElement).value)
          }}
        />
      </div>

      {(currentType !== 'all' || currentMinReward) && (
        <div className="flex items-end">
          <button
            className="btn-ghost text-xs"
            style={{ padding: '8px 16px' }}
            onClick={() => router.push('/tasks')}
          >
            Сбросить
          </button>
        </div>
      )}
    </div>
  )
}
