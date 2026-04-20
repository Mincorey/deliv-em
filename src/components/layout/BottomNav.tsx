'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import type { Profile } from '@/lib/types'

interface BottomNavProps {
  profile: Profile
  unreadMessages: number
}

const CUSTOMER_PRIMARY = [
  { href: '/dashboard',    icon: 'dashboard',   label: 'Обзор' },
  { href: '/tasks',        icon: 'task_alt',    label: 'Задания' },
  { href: '/tasks/create', icon: 'add',         label: '',        isCreate: true },
  { href: '/profile',      icon: 'person',      label: 'Профиль' },
]
const CUSTOMER_MORE = [
  { href: '/orders',    icon: 'history',                 label: 'Архив' },
  { href: '/couriers',  icon: 'directions_bike',          label: 'Курьеры' },
  { href: '/favorites', icon: 'favorite',                 label: 'Избранные' },
  { href: '/wallet',    icon: 'account_balance_wallet',   label: 'Кошелёк' },
  { href: '/ratings',   icon: 'leaderboard',              label: 'Рейтинги' },
  { href: '/profile',   icon: 'person',                   label: 'Профиль' },
  { href: '/about',     icon: 'info',                     label: 'О сервисе' },
  { href: '/contacts',  icon: 'support_agent',            label: 'Контакты' },
]

const COURIER_PRIMARY = [
  { href: '/dashboard', icon: 'dashboard',     label: 'Обзор' },
  { href: '/tasks',     icon: 'search',        label: 'Задания' },
  { href: '/active',    icon: 'rocket_launch', label: 'Активные' },
  { href: '/profile',   icon: 'person',        label: 'Профиль' },
]
const COURIER_MORE = [
  { href: '/orders',    icon: 'history',       label: 'Архив' },
  { href: '/favorites', icon: 'favorite',      label: 'Избранные' },
  { href: '/ratings',   icon: 'leaderboard',   label: 'Рейтинги' },
  { href: '/profile',   icon: 'person',        label: 'Профиль' },
  { href: '/about',     icon: 'info',          label: 'О сервисе' },
  { href: '/contacts',  icon: 'support_agent', label: 'Контакты' },
]

export function BottomNav({ profile, unreadMessages }: BottomNavProps) {
  const pathname   = usePathname()
  const [moreOpen, setMoreOpen] = useState(false)

  const isCustomer = profile.role === 'customer'
  const primary    = isCustomer ? CUSTOMER_PRIMARY : COURIER_PRIMARY
  const more       = isCustomer ? CUSTOMER_MORE    : COURIER_MORE

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  return (
    <>
      {/* ── Backdrop for "Ещё" sheet ── */}
      {moreOpen && (
        <div
          onClick={() => setMoreOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 59,
            background: 'rgba(0,0,0,0.45)',
          }}
        />
      )}

      {/* ── "Ещё" bottom sheet ── */}
      {moreOpen && (
        <div style={{
          position: 'fixed',
          bottom: 'calc(88px + max(env(safe-area-inset-bottom), 16px))',
          left: 0, right: 0, zIndex: 60,
          background: 'var(--surface)',
          borderRadius: '1.5rem 1.5rem 0 0',
          borderTop: '1.5px solid var(--border)',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.18)',
          padding: '0.75rem 1rem 1.25rem',
          animation: 'slideUp 0.22s cubic-bezier(0.22,1,0.36,1) both',
        }}>
          {/* Handle */}
          <div style={{
            width: 40, height: 4, borderRadius: 9999,
            background: 'var(--border)', margin: '0 auto 1rem',
          }} />
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '0.5rem',
          }}>
            {more.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMoreOpen(false)}
                style={{
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', gap: 6,
                  padding: '0.75rem 0.25rem', borderRadius: '0.875rem',
                  textDecoration: 'none',
                  background: isActive(item.href) ? 'var(--brand-soft)' : 'var(--surface-alt)',
                  color: isActive(item.href) ? 'var(--brand)' : 'var(--text-2)',
                  transition: 'background 0.15s',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
                  {item.icon}
                </span>
                <span style={{ fontSize: '0.65rem', fontWeight: 600, textAlign: 'center', lineHeight: 1.2 }}>
                  {item.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Bottom nav bar ── */}
      <nav
        className="bottom-nav"
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
          height: 'calc(88px + max(env(safe-area-inset-bottom), 16px))',
          paddingBottom: 'max(env(safe-area-inset-bottom), 16px)',
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(16px)',
          borderTop: '1.5px solid var(--border)',
          alignItems: 'stretch',
        }}
      >
        {primary.map((item) => {
          /* ── Create button (centre, raised) ── */
          if ((item as any).isCreate) {
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  flex: 1, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  textDecoration: 'none',
                }}
              >
                <div style={{
                  width: 50, height: 50, borderRadius: 9999,
                  background: 'linear-gradient(135deg,#00236f,#006c49)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 14px rgba(0,35,111,0.4)',
                  marginTop: -10,
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 26, color: '#fff' }}>
                    add
                  </span>
                </div>
              </Link>
            )
          }

          /* ── Regular nav item ── */
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: 3, textDecoration: 'none',
                color: active ? 'var(--brand)' : 'var(--text-3)',
                position: 'relative',
              }}
            >
              {/* Active indicator bar at top */}
              {active && (
                <div style={{
                  position: 'absolute', top: 0, left: '50%',
                  transform: 'translateX(-50%)',
                  width: 24, height: 3,
                  borderRadius: '0 0 3px 3px',
                  background: 'var(--brand)',
                }} />
              )}

              <div style={{ position: 'relative' }}>
                <span
                  className={`material-symbols-outlined ${active ? 'fill-icon' : ''}`}
                  style={{ fontSize: 24 }}
                >
                  {item.icon}
                </span>
                {/* Unread badge on chat */}
                {item.icon === 'chat_bubble' && unreadMessages > 0 && (
                  <span style={{
                    position: 'absolute', top: -3, right: -5,
                    minWidth: 16, height: 16, borderRadius: 9999,
                    background: 'var(--green)', border: '2px solid var(--glass-bg)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.48rem', fontWeight: 800, color: '#fff', padding: '0 3px',
                  }}>
                    {unreadMessages > 9 ? '9+' : unreadMessages}
                  </span>
                )}
              </div>

              <span style={{ fontSize: '0.6rem', fontWeight: active ? 700 : 500, lineHeight: 1 }}>
                {item.label}
              </span>
            </Link>
          )
        })}

        {/* ── "Ещё" button ── */}
        <button
          onClick={() => setMoreOpen((o) => !o)}
          style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: 3, background: 'none', border: 'none', cursor: 'pointer',
            color: moreOpen ? 'var(--brand)' : 'var(--text-3)',
            position: 'relative',
          }}
        >
          {moreOpen && (
            <div style={{
              position: 'absolute', top: 0, left: '50%',
              transform: 'translateX(-50%)',
              width: 24, height: 3,
              borderRadius: '0 0 3px 3px',
              background: 'var(--brand)',
            }} />
          )}
          <span className={`material-symbols-outlined ${moreOpen ? 'fill-icon' : ''}`} style={{ fontSize: 24 }}>
            menu
          </span>
          <span style={{ fontSize: '0.6rem', fontWeight: 500, lineHeight: 1 }}>Ещё</span>
        </button>
      </nav>
    </>
  )
}
