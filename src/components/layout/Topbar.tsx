'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { Avatar } from '@/components/ui/Avatar'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { createClient } from '@/lib/supabase/client'
import type { Profile, Notification } from '@/lib/types'
import { formatDate } from '@/lib/utils'
import { deleteOldNotifications, clearAllNotifications } from '@/app/(app)/notifications-actions'

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000

interface TopbarProps {
  profile: Profile
  notifications: Notification[]
  unreadMessages: number
}

export function Topbar({ profile, notifications, unreadMessages }: TopbarProps) {
  const [notifOpen,   setNotifOpen]   = useState(false)
  const [localNotifs, setLocalNotifs] = useState<Notification[]>(notifications)
  const notifRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const now = Date.now()
    const fresh = notifications.filter(n => now - new Date(n.created_at).getTime() < ONE_WEEK_MS)
    setLocalNotifs(fresh)
    // Silently delete stale ones from DB
    if (fresh.length < notifications.length) {
      deleteOldNotifications(profile.id)
    }
  }, [notifications, profile.id])

  async function handleClearAll() {
    setLocalNotifs([])
    await clearAllNotifications(profile.id)
  }

  // Close on click outside the notification widget
  useEffect(() => {
    if (!notifOpen) return
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [notifOpen])

  const unreadNotifs = localNotifs.filter((n) => !n.is_read).length
  const firstName    = profile.full_name.split(' ')[0]

  async function handleOpenNotifs() {
    setNotifOpen((prev) => !prev)
    if (unreadNotifs === 0) return

    // Optimistically mark all as read in local state immediately
    setLocalNotifs((prev) => prev.map((n) => ({ ...n, is_read: true })))

    // Persist to DB (fire-and-forget — user sees result instantly from local state)
    const supabase = createClient()
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', profile.id)
      .eq('is_read', false)
  }

  return (
    <header
      className="topbar-safe flex items-center justify-between px-6"
      style={{
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(14px)',
        borderBottom: '1.5px solid var(--topbar-border)',
        position: 'sticky',
        top: 0,
        zIndex: 20,
      }}
    >
      {/* Search — hidden on mobile */}
      <div
        className="topbar-search flex items-center gap-2 flex-1 max-w-sm rounded-full px-4"
        style={{ background: 'var(--surface-alt)', border: '1.5px solid var(--border)', height: 42 }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 19, color: 'var(--text-3)' }}>search</span>
        <input
          className="bg-transparent border-none outline-none flex-1"
          placeholder="Поиск..."
          type="text"
          style={{ color: 'var(--text-1)', fontSize: '0.925rem' }}
        />
      </div>

      {/* Brand logo — shown only on mobile */}
      <div
        className="topbar-brand-mobile"
        style={{ alignItems: 'center', gap: 10, flex: 1 }}
      >
        <div style={{
          width: 32, height: 32, borderRadius: 9, flexShrink: 0,
          background: 'linear-gradient(135deg,#00236f,#006c49)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#fff' }}>local_shipping</span>
        </div>
        <span style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--brand-text)', letterSpacing: '-0.02em' }}>
          Deliv&apos;em
        </span>
      </div>

      <div className="flex items-center gap-3">
        <ThemeToggle />

        <div style={{ width: 1, height: 24, background: 'var(--border)', margin: '0 2px' }} />

        {/* Messages */}
        <Link
          href="/messages"
          className="btn-icon relative"
          style={{ width: 38, height: 38, color: 'var(--text-3)' }}
        >
          <span
            className={`material-symbols-outlined ${unreadMessages > 0 ? 'fill-icon' : ''}`}
            style={{ fontSize: 23, color: unreadMessages > 0 ? 'var(--brand)' : 'var(--text-3)' }}
          >
            chat_bubble
          </span>
          {unreadMessages > 0 && (
            <span
              className="absolute flex items-center justify-center text-white rounded-full"
              style={{ top: 2, right: 2, width: 14, height: 14, background: 'var(--green)', fontSize: '0.5rem', fontWeight: 800, lineHeight: 1 }}
            >
              {unreadMessages > 9 ? '9+' : unreadMessages}
            </span>
          )}
        </Link>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={handleOpenNotifs}
            className="btn-icon relative"
            style={{ width: 38, height: 38 }}
          >
            <span
              className={`material-symbols-outlined ${unreadNotifs > 0 ? 'fill-icon' : ''}`}
              style={{ fontSize: 23, color: unreadNotifs > 0 ? '#f59e0b' : 'var(--text-3)' }}
            >
              notifications
            </span>
            {unreadNotifs > 0 && (
              <span
                className="absolute rounded-full"
                style={{ top: 3, right: 3, width: 8, height: 8, background: '#ba1a1a', border: '1.5px solid var(--glass-bg)' }}
              />
            )}
          </button>

          {notifOpen && (
            <>
              <div
                className="absolute right-0 top-10 w-80 rounded-2xl shadow-xl z-50 overflow-hidden"
                style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}
              >
                <div
                  className="px-4 py-3 flex items-center justify-between"
                  style={{ borderBottom: '1px solid var(--border)' }}
                >
                  <h3 className="font-bold text-sm" style={{ color: 'var(--text-1)' }}>Уведомления</h3>
                  <div className="flex items-center gap-1">
                    {localNotifs.length > 0 && (
                      <button
                        onClick={handleClearAll}
                        title="Очистить историю"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', display: 'flex', padding: 4, borderRadius: 6 }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#ba1a1a')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-3)')}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete</span>
                      </button>
                    )}
                    <button
                      onClick={() => setNotifOpen(false)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', display: 'flex', padding: 4 }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
                    </button>
                  </div>
                </div>

                <div className="max-h-80 overflow-y-auto">
                  {localNotifs.length === 0 ? (
                    <div className="text-center py-8">
                      <span className="material-symbols-outlined" style={{ fontSize: 32, color: 'var(--text-3)' }}>
                        notifications_none
                      </span>
                      <p className="text-sm mt-2" style={{ color: 'var(--text-3)' }}>Уведомлений нет</p>
                    </div>
                  ) : (
                    localNotifs.slice(0, 10).map((n) => (
                      <div
                        key={n.id}
                        className="px-4 py-3 transition-colors"
                        style={{
                          background: n.is_read ? 'transparent' : 'var(--brand-soft)',
                          borderBottom: '1px solid var(--border)',
                        }}
                      >
                        <div className="flex items-start gap-2">
                          <span
                            className="material-symbols-outlined flex-shrink-0 mt-0.5"
                            style={{ fontSize: 16, color: notifIconColor(n.type) }}
                          >
                            {notifIcon(n.type)}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>{n.title}</p>
                            {n.body && (
                              <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>{n.body}</p>
                            )}
                            <p className="text-xs mt-1" style={{ color: 'var(--text-4)' }}>{formatDate(n.created_at)}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Avatar + name — hidden on mobile (profile accessible via BottomNav → Ещё) */}
        <div className="topbar-avatar-group" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 1, height: 24, background: 'var(--border)', margin: '0 2px' }} />
          <Link
            href="/profile"
            className="flex items-center gap-2 rounded-full px-2 py-1 transition-colors"
            style={{ textDecoration: 'none', background: 'transparent' }}
          >
            <Avatar name={profile.full_name} avatarUrl={profile.avatar_url} size={34} />
            <span
              className="font-semibold hidden sm:block"
              style={{ color: 'var(--text-1)', maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.925rem' }}
            >
              {firstName}
            </span>
          </Link>
        </div>
      </div>
    </header>
  )
}

function notifIcon(type: string): string {
  const map: Record<string, string> = {
    wallet:         'account_balance_wallet',
    task_published: 'task_alt',
    task_accepted:  'handshake',
    task_completed: 'check_circle',
    message:        'chat_bubble',
    new_message:    'chat_bubble',
    rating:         'star',
  }
  return map[type] ?? 'notifications'
}

function notifIconColor(type: string): string {
  const map: Record<string, string> = {
    wallet:         'var(--green)',
    task_published: 'var(--brand)',
    task_accepted:  'var(--brand)',
    task_completed: 'var(--green)',
    message:        'var(--brand)',
    new_message:    'var(--brand)',
    rating:         '#f59e0b',
  }
  return map[type] ?? 'var(--text-3)'
}
