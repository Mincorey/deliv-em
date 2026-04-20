'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useTransition, useState, useRef, useEffect } from 'react'

const TASK_TYPES = [
  { value: 'all', label: 'Все типы' },
  { value: 'documents', label: 'Документы' },
  { value: 'groceries', label: 'Продукты' },
  { value: 'materials', label: 'Материалы' },
  { value: 'gift',      label: 'Подарок' },
  { value: 'meeting',   label: 'Встреча' },
  { value: 'parcel',    label: 'Посылка' },
]

const CITIES = [
  'Все города', 'Гагра', 'Пицунда', 'Гудаута', 'Новый Афон',
  'Сухум', 'Агудзера', 'Очамчыра', 'Ткуарчал', 'Гал',
]

const SORT_OPTIONS = [
  { value: 'newest',     label: 'Новые сначала' },
  { value: 'reward_asc', label: 'Оплата ↑' },
  { value: 'reward_desc',label: 'Оплата ↓' },
]

export interface FeedFiltersProps {
  currentType?:       string
  currentCity?:       string
  currentMinReward?:  string
  currentMaxReward?:  string
  currentUrgent?:     string
  currentSort?:       string
}

function Dropdown({
  label, value, options, onChange,
}: {
  label: string
  value: string
  options: { value: string; label: string }[]
  onChange: (v: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onMD(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onMD)
    return () => document.removeEventListener('mousedown', onMD)
  }, [])

  const selected = options.find((o) => o.value === value)?.label ?? options[0].label

  return (
    <div style={{ minWidth: 160 }}>
      <label className="label-sm">{label}</label>
      <div ref={ref} style={{ position: 'relative' }}>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="input-field"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            cursor: 'pointer', textAlign: 'left', width: '100%', gap: 8,
          }}
        >
          <span style={{ fontSize: '0.875rem' }}>{selected}</span>
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
            {options.map((o, i) => (
              <button
                key={o.value}
                type="button"
                onClick={() => { onChange(o.value); setOpen(false) }}
                style={{
                  display: 'block', width: '100%', padding: '10px 16px', textAlign: 'left',
                  background: value === o.value ? 'var(--brand-soft)' : 'transparent',
                  color: value === o.value ? 'var(--brand-text)' : 'var(--text-1)',
                  fontWeight: value === o.value ? 700 : 400, fontSize: '0.875rem',
                  cursor: 'pointer', border: 'none',
                  borderTop: i > 0 ? '1px solid var(--border)' : 'none',
                  transition: 'background 0.15s',
                }}
              >
                {o.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export function FeedFilters({
  currentType      = 'all',
  currentCity      = 'all',
  currentMinReward = '',
  currentMaxReward = '',
  currentUrgent    = '',
  currentSort      = 'newest',
}: FeedFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== 'all' && value !== 'newest' && value !== '') {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    startTransition(() => {
      router.push(`/tasks?${params.toString()}`)
    })
  }

  function toggleUrgent() {
    const params = new URLSearchParams(searchParams.toString())
    if (currentUrgent) {
      params.delete('urgent')
    } else {
      params.set('urgent', '1')
    }
    startTransition(() => {
      router.push(`/tasks?${params.toString()}`)
    })
  }

  const hasFilters = currentType !== 'all' || (currentCity && currentCity !== 'all') ||
    currentMinReward || currentMaxReward || currentUrgent || currentSort !== 'newest'

  return (
    <div className="glass rounded-2xl p-4 mb-5">
      <div className="flex flex-wrap gap-3 items-end">

        {/* City */}
        <Dropdown
          label="Город"
          value={currentCity || 'all'}
          options={CITIES.map((c) => ({ value: c === 'Все города' ? 'all' : c, label: c }))}
          onChange={(v) => update('city', v)}
        />

        {/* Type */}
        <Dropdown
          label="Тип"
          value={currentType}
          options={TASK_TYPES}
          onChange={(v) => update('type', v)}
        />

        {/* Min reward */}
        <div style={{ minWidth: 120 }}>
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

        {/* Max reward */}
        <div style={{ minWidth: 120 }}>
          <label className="label-sm">Макс. оплата (₽)</label>
          <div style={{ position: 'relative' }}>
            <span style={{
              position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
              fontSize: '0.875rem', color: 'var(--text-3)', pointerEvents: 'none',
            }}>₽</span>
            <input
              type="number"
              defaultValue={currentMaxReward}
              placeholder="∞"
              className="input-field"
              style={{ paddingLeft: 30, width: '100%' }}
              onBlur={(e) => update('max_reward', e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') update('max_reward', (e.target as HTMLInputElement).value)
              }}
            />
          </div>
        </div>

        {/* Sort */}
        <Dropdown
          label="Сортировка"
          value={currentSort || 'newest'}
          options={SORT_OPTIONS}
          onChange={(v) => update('sort', v)}
        />

        {/* Urgent toggle */}
        <div>
          <label className="label-sm" style={{ opacity: 0 }}>.</label>
          <button
            type="button"
            onClick={toggleUrgent}
            className={currentUrgent ? 'btn-green text-xs' : 'btn-ghost text-xs'}
            style={{ padding: '10px 18px', height: 42 }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>bolt</span>
            Срочные
          </button>
        </div>

        {/* Reset */}
        {hasFilters && (
          <div>
            <label className="label-sm" style={{ opacity: 0 }}>.</label>
            <button
              className="btn-ghost text-xs"
              style={{ padding: '10px 18px', height: 42 }}
              onClick={() => router.push('/tasks')}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
              Сбросить
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
