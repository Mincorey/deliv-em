'use client'

import { useEffect, useState } from 'react'

export function ThemeToggle() {
  const [dark, setDark] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setDark(document.documentElement.getAttribute('data-theme') === 'dark')
  }, [])

  function toggle() {
    const next = !dark
    setDark(next)
    if (next) {
      document.documentElement.setAttribute('data-theme', 'dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.removeAttribute('data-theme')
      localStorage.setItem('theme', 'light')
    }
  }

  if (!mounted) return <div style={{ width: 32, height: 32 }} />

  return (
    <button
      onClick={toggle}
      title={dark ? 'Светлая тема' : 'Тёмная тема'}
      style={{
        width: 32,
        height: 32,
        borderRadius: 9999,
        border: '1.5px solid var(--border)',
        background: 'var(--surface-alt)',
        color: 'var(--text-3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'background 0.18s, color 0.18s, border-color 0.18s',
        flexShrink: 0,
      }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
        {dark ? 'light_mode' : 'dark_mode'}
      </span>
    </button>
  )
}
