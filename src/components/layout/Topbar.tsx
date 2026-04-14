'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Avatar } from '@/components/ui/Avatar'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import type { Profile, Notification } from '@/lib/types'
import { formatDate } from '@/lib/utils'

interface TopbarProps {
  profile: Profile
  notifications: Notification[]
  unreadMessages: number
}

export function Topbar({ profile, notifications, unreadMessages }: TopbarProps) {
  const [notifOpen, setNotifOpen] = useState(false)
  const unreadNotifs = notifications.filter((n) => !n.is_read).length
  const firstName = profile.full_name.split(' ')[0]

  return (
    <header
      className="h-[68px] flex items-center justify-between px-6 flex-shrink-0"
      style={{
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(14px)',
        borderBottom: '1.5px solid var(--topbar-border)',
        position: 'sticky',
        top: 0,
        zIndex: 20,
      }}
    >
      {/* Search */}
      <div
        className="flex items-center gap-2 flex-1 max-w-sm rounded-full px-4"
        style={{
          background: 'var(--surface-alt)',
          border: '1.5px solid var(--border)',
          height: 42,
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 19, color: 'var(--text-3)' }}>
          search
        </span>
        <input
          className="bg-transparent border-none outline-none flex-1"
          placeholder="Поиск..."
          type="text"
          style={{ color: 'var(--text-1)', fontSize: '0.925rem' }}
        />
      </div>

      <div className="flex items-center gap-3">
        {/* Theme toggle */}
        <ThemeToggle />

        {/* Divider */}
        <div style={{ width: 1, height: 24, background: 'var(--border)', margin: '0 2px' }} />

        {/* Messages */}
        <Link
          href="/messages"
          className="relative flex items-center justify-center rounded-full transition-colors"
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
              style={{
                top: 2, right: 2,
                width: 14, height: 14,
                background: 'var(--green)',
                fontSize: '0.5rem',
                fontWeight: 800,
                lineHeight: 1,
              }}
            >
              {unreadMessages > 9 ? '9+' : unreadMessages}
            </span>
          )}
        </Link>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative flex items-center justify-center rounded-full transition-colors"
            style={{ width: 38, height: 38, background: 'transparent', border: 'none', cursor: 'pointer' }}
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
                style={{
                  top: 3, right: 3,
                  width: 8, height: 8,
                  background: '#ba1a1a',
                  border: '1.5px solid var(--glass-bg)',
                }}
              />
            )}
          </button>

          {notifOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
              <div
                className="absolute right-0 top-10 w-80 rounded-2xl shadow-xl z-50 overflow-hidden"
                style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}
              >
                <div
                  className="px-4 py-3 flex items-center justify-between"
                  style={{ borderBottom: '1px solid var(--border)' }}
                >
                  <h3 className="font-bold text-sm" style={{ color: 'var(--text-1)' }}>
                    Уведомления
                  </h3>
                  {unreadNotifs > 0 && (
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ background: 'var(--brand-soft)', color: 'var(--brand-text)' }}
                    >
                      {unreadNotifs} новых
                    </span>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="text-center py-8">
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: 32, color: 'var(--text-4)' }}
                      >
                        notifications_none
                      </span>
                      <p className="text-sm mt-2" style={{ color: 'var(--text-3)' }}>
                        Уведомлений нет
                      </p>
                    </div>
                  ) : (
                    notifications.slice(0, 10).map((n) => (
                      <div
                        key={n.id}
                        className="px-4 py-3 transition-colors"
                        style={{
                          background: n.is_read ? 'transparent' : 'var(--brand-soft)',
                          borderBottom: '1px solid var(--border)',
                        }}
                      >
                        <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>
                          {n.title}
                        </p>
                        {n.body && (
                          <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
                            {n.body}
                          </p>
                        )}
                        <p className="text-xs mt-1" style={{ color: 'var(--text-4)' }}>
                          {formatDate(n.created_at)}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 24, background: 'var(--border)', margin: '0 2px' }} />

        {/* Avatar + name */}
        <Link href="/profile" className="flex items-center gap-2 rounded-full px-2 py-1 transition-colors"
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
    </header>
  )
}
