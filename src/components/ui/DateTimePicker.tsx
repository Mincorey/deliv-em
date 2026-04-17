'use client'

import { useState, useRef, useEffect } from 'react'

interface DateTimePickerProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

const MONTHS = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
]
const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

function pad(n: number) { return String(n).padStart(2, '0') }

function toLocalStr(year: number, month: number, day: number, h: number, m: number) {
  // Use local Date constructor so the timezone offset is included in the ISO string,
  // preventing Supabase from treating the value as UTC instead of local time.
  return new Date(year, month, day, h, m).toISOString()
}

function formatDisplay(year: number, month: number, day: number, h: number, m: number) {
  return `${pad(day)}.${pad(month + 1)}.${year} ${pad(h)}:${pad(m)}`
}

export default function DateTimePicker({
  value,
  onChange,
  placeholder = 'Выберите дату и время',
}: DateTimePickerProps) {
  const now = new Date()
  const [open, setOpen] = useState(false)
  const [viewYear, setViewYear] = useState(now.getFullYear())
  const [viewMonth, setViewMonth] = useState(now.getMonth())
  const [selYear, setSelYear] = useState<number | null>(null)
  const [selMonth, setSelMonth] = useState<number | null>(null)
  const [selDay, setSelDay] = useState<number | null>(null)
  const [hour, setHour] = useState(now.getHours())
  const [minute, setMinute] = useState(0)
  const ref = useRef<HTMLDivElement>(null)

  // Parse incoming value once on mount
  useEffect(() => {
    if (!value) return
    const d = new Date(value)
    if (isNaN(d.getTime())) return
    setSelYear(d.getFullYear())
    setSelMonth(d.getMonth())
    setSelDay(d.getDate())
    setViewYear(d.getFullYear())
    setViewMonth(d.getMonth())
    setHour(d.getHours())
    setMinute(d.getMinutes())
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }

  function pickDay(day: number) {
    setSelYear(viewYear)
    setSelMonth(viewMonth)
    setSelDay(day)
    onChange(toLocalStr(viewYear, viewMonth, day, hour, minute))
  }

  function pickHour(h: number) {
    setHour(h)
    if (selYear !== null && selMonth !== null && selDay !== null) {
      onChange(toLocalStr(selYear, selMonth, selDay, h, minute))
    }
  }

  function pickMinute(m: number) {
    setMinute(m)
    if (selYear !== null && selMonth !== null && selDay !== null) {
      onChange(toLocalStr(selYear, selMonth, selDay, hour, m))
    }
  }

  function goToday() {
    const t = new Date()
    setViewYear(t.getFullYear())
    setViewMonth(t.getMonth())
    pickDay(t.getDate())
  }

  function clearValue() {
    setSelYear(null); setSelMonth(null); setSelDay(null)
    onChange('')
  }

  const todayYear = now.getFullYear()
  const todayMonth = now.getMonth()
  const todayDay = now.getDate()

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  // Monday-based offset
  const rawDow = new Date(viewYear, viewMonth, 1).getDay()
  const startOffset = rawDow === 0 ? 6 : rawDow - 1

  const isSelected = (day: number) =>
    selYear === viewYear && selMonth === viewMonth && selDay === day

  const isToday = (day: number) =>
    todayYear === viewYear && todayMonth === viewMonth && todayDay === day

  const displayValue =
    selYear !== null && selMonth !== null && selDay !== null
      ? formatDisplay(selYear, selMonth, selDay, hour, minute)
      : ''

  const navBtnStyle: React.CSSProperties = {
    background: 'var(--surface-alt)',
    border: '1.5px solid var(--border)',
    borderRadius: '50%',
    width: 34,
    height: 34,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--text-2)',
    flexShrink: 0,
  }

  const selectStyle: React.CSSProperties = {
    background: 'var(--surface-alt)',
    border: '1.5px solid var(--border)',
    borderRadius: '0.75rem',
    padding: '6px 10px',
    color: 'var(--text-1)',
    fontWeight: 600,
    fontSize: '0.9rem',
    outline: 'none',
    cursor: 'pointer',
    fontFamily: 'inherit',
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Trigger */}
      <div
        className="input-field"
        style={{
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          userSelect: 'none',
        }}
        onClick={() => setOpen(v => !v)}
      >
        <span style={{ color: displayValue ? 'var(--text-1)' : 'var(--text-3)' }}>
          {displayValue || placeholder}
        </span>
        <span
          className="material-symbols-outlined"
          style={{ fontSize: '1.2rem', color: 'var(--text-3)', flexShrink: 0 }}
        >
          calendar_month
        </span>
      </div>

      {/* Picker panel */}
      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            right: 0,
            background: 'var(--surface)',
            border: '1.5px solid var(--border)',
            borderRadius: '1.25rem',
            boxShadow: 'var(--shadow-md)',
            zIndex: 1000,
            padding: '1.25rem',
          }}
        >
          {/* Month navigation */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <button onClick={prevMonth} style={navBtnStyle}>
              <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>chevron_left</span>
            </button>
            <span style={{ fontWeight: 700, color: 'var(--text-1)', fontSize: '0.95rem' }}>
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <button onClick={nextMonth} style={navBtnStyle}>
              <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>chevron_right</span>
            </button>
          </div>

          {/* Weekday headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
            {WEEKDAYS.map(d => (
              <div
                key={d}
                style={{
                  textAlign: 'center',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  color: 'var(--text-3)',
                  padding: '4px 0',
                }}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
            {Array(startOffset)
              .fill(null)
              .map((_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
              const sel = isSelected(day)
              const tod = isToday(day)
              return (
                <button
                  key={day}
                  onClick={() => pickDay(day)}
                  style={{
                    padding: '7px 0',
                    borderRadius: '50%',
                    border: tod && !sel ? '2px solid var(--brand)' : '2px solid transparent',
                    cursor: 'pointer',
                    background: sel ? 'var(--brand)' : 'transparent',
                    color: sel ? '#fff' : tod ? 'var(--brand)' : 'var(--text-1)',
                    fontWeight: sel || tod ? 700 : 400,
                    fontSize: '0.875rem',
                    transition: 'all 0.12s',
                    fontFamily: 'inherit',
                  }}
                  onMouseEnter={e => {
                    if (!sel) (e.currentTarget as HTMLButtonElement).style.background = 'var(--brand-soft)'
                  }}
                  onMouseLeave={e => {
                    if (!sel) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
                  }}
                >
                  {day}
                </button>
              )
            })}
          </div>

          {/* Time + actions */}
          <div
            style={{
              marginTop: '1rem',
              paddingTop: '1rem',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              flexWrap: 'wrap',
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ color: 'var(--text-3)', fontSize: '1.1rem' }}
            >
              schedule
            </span>

            <select value={hour} onChange={e => pickHour(Number(e.target.value))} style={selectStyle}>
              {Array.from({ length: 24 }, (_, i) => i).map(h => (
                <option key={h} value={h}>{pad(h)}</option>
              ))}
            </select>

            <span style={{ fontWeight: 700, color: 'var(--text-2)', fontSize: '1.1rem' }}>:</span>

            <select value={minute} onChange={e => pickMinute(Number(e.target.value))} style={selectStyle}>
              {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map(m => (
                <option key={m} value={m}>{pad(m)}</option>
              ))}
            </select>

            <div style={{ flex: 1 }} />

            <button
              onClick={goToday}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--brand)',
                fontSize: '0.8rem',
                fontWeight: 600,
                fontFamily: 'inherit',
                padding: '4px 8px',
              }}
            >
              Сегодня
            </button>

            {value && (
              <button
                onClick={clearValue}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-3)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  fontFamily: 'inherit',
                  padding: '4px 8px',
                }}
              >
                Удалить
              </button>
            )}

            <button
              onClick={() => setOpen(false)}
              style={{
                background: 'var(--brand)',
                color: '#fff',
                border: 'none',
                borderRadius: '9999px',
                padding: '6px 18px',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Готово
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
