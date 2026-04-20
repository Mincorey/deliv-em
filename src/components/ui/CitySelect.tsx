'use client'

import { useState, useRef, useEffect } from 'react'
import { CITIES } from '@/lib/types'

export function CitySelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="input-field"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', textAlign: 'left', width: '100%', gap: 8 }}
      >
        <span style={{ fontSize: '0.9rem' }}>{value}</span>
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 18, color: 'var(--text-3)', flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
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
          {CITIES.map((c, i) => (
            <button
              key={c}
              type="button"
              onClick={() => { onChange(c); setOpen(false) }}
              style={{
                display: 'block', width: '100%', padding: '10px 16px', textAlign: 'left',
                background: value === c ? 'var(--brand-soft)' : 'transparent',
                color: value === c ? 'var(--brand-text)' : 'var(--text-1)',
                fontWeight: value === c ? 700 : 400, fontSize: '0.9rem',
                cursor: 'pointer', border: 'none',
                borderTop: i > 0 ? '1px solid var(--border)' : 'none',
                transition: 'background 0.15s',
              }}
            >
              {c}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
