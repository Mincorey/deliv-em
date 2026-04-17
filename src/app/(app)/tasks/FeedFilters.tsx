'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useTransition, useState, useRef, useEffect } from 'react'

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
  const [open, setOpen] = useState(false)
  const dropRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [])

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

  const selectedLabel = TASK_TYPES.find((t) => t.value === currentType)?.label ?? 'Все типы'

  return (
    <div className="glass rounded-2xl p-4 mb-5 flex flex-wrap gap-3 items-end">
      {/* Type dropdown */}
      <div style={{ minWidth: 180 }}>
        <label className="label-sm">Тип</label>
        <div ref={dropRef} style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="input-field"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              cursor: 'pointer', textAlign: 'left', width: '100%', gap: 8,
            }}
          >
            <span style={{ fontSize: '0.875rem' }}>{selectedLabel}</span>
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: 18, color: 'var(--text-3)', flexShrink: 0,
                transform: open ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.2s',
              }}
            >
              expand_more
            </span>
          </button>

          {open && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
              background: 'var(--surface)', border: '1.5px solid var(--border)',
              borderRadius: '1rem', boxShadow: 'var(--shadow-md)', zIndex: 100,
              overflow: 'hidden', animation: 'fadeInUp 0.18s cubic-bezier(0.22,1,0.36,1) both',
            }}>
              {TASK_TYPES.map((t, i) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => { update('type', t.value); setOpen(false) }}
                  style={{
                    display: 'block', width: '100%', padding: '10px 16px', textAlign: 'left',
                    background: currentType === t.value ? 'var(--brand-soft)' : 'transparent',
                    color: currentType === t.value ? 'var(--brand-text)' : 'var(--text-1)',
                    fontWeight: currentType === t.value ? 700 : 400, fontSize: '0.875rem',
                    cursor: 'pointer', border: 'none',
                    borderTop: i > 0 ? '1px solid var(--border)' : 'none',
                    transition: 'background 0.15s',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Min reward input */}
      <div style={{ minWidth: 160 }}>
        <label className="label-sm">Мин. оплата (₽)</label>
        <div style={{ position: 'relative' }}>
          <span style={{
            position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
            fontSize: '0.875rem', color: 'var(--text-3)', pointerEvents: 'none',
          }}>₽</span>
          <input
            type="number"
            defaultValue={currentMinReward}
            placeholder="0"
            className="input-field"
            style={{ paddingLeft: 30, width: '100%' }}
            onBlur={(e) => update('min_reward', e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') update('min_reward', (e.target as HTMLInputElement).value)
            }}
          />
        </div>
      </div>

      {/* Reset button */}
      {(currentType !== 'all' || currentMinReward) && (
        <div>
          <button
            className="btn-ghost text-xs"
            style={{ padding: '10px 18px' }}
            onClick={() => router.push('/tasks')}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
            Сбросить
          </button>
        </div>
      )}
    </div>
  )
}
