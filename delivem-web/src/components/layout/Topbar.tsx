'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Avatar } from '@/components/ui/Avatar'
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

  return (
    <header
      className="h-14 flex items-center justify-between px-5 flex-shrink-0 glass"
      style={{ borderBottom: '1px solid rgba(197,197,211,.18)', position: 'sticky', top: 0, zIndex: 20 }}
    >
      {/* Search placeholder */}
      <div className="flex items-center gap-3 flex-1 max-w-sm">
        <span className="material-symbols-outlined text-lg" style={{ color: '#757682' }}>
          search
        </span>
        <input
          className="bg-transparent border-none outline-none text-sm flex-1"
          placeholder="Поиск..."
          type="text"
          style={{ color: '#191c1e' }}
        />
      </div>

      <div className="flex items-center gap-3">
        {/* Messages */}
        <Link
          href="/messages"
          className="relative p-1.5 rounded-full transition-colors"
          style={{ ':hover': { background: '#eceef0' } } as React.CSSProperties}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#757682' }}>
            chat_bubble
          </span>
          {unreadMessages > 0 && (
            <span
              className="absolute top-0 right-0 flex items-center justify-center text-white rounded-full"
              style={{
                width: 16,
                height: 16,
                background: '#006c49',
                fontSize: '0.55rem',
                fontWeight: 800,
              }}
            >
              {unreadMessages}
            </span>
          )}
        </Link>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative p-1.5 rounded-full hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#757682' }}>
              notifications
            </span>
            {unreadNotifs > 0 && (
              <span
                className="absolute top-0 right-0 rounded-full"
                style={{ width: 10, height: 10, background: '#ba1a1a' }}
              />
            )}
          </button>

          {notifOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setNotifOpen(false)}
              />
              <div
                className="absolute right-0 top-10 w-80 bg-white rounded-2xl shadow-xl z-50 overflow-hidden"
                style={{ border: '1px solid #eceef0' }}
              >
                <div className="px-4 py-3 border-b" style={{ borderColor: '#eceef0' }}>
                  <h3 className="font-bold text-sm">Уведомления</h3>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="text-center text-sm py-6" style={{ color: '#757682' }}>
                      Уведомлений нет
                    </p>
                  ) : (
                    notifications.slice(0, 10).map((n) => (
                      <div
                        key={n.id}
                        className="px-4 py-3 hover:bg-surface-container-low transition-colors"
                        style={{
                          background: n.is_read ? undefined : '#f0f4ff',
                          borderBottom: '1px solid #f2f4f6',
                        }}
                      >
                        <p className="text-sm font-semibold" style={{ color: '#191c1e' }}>
                          {n.title}
                        </p>
                        {n.body && (
                          <p className="text-xs mt-0.5" style={{ color: '#757682' }}>
                            {n.body}
                          </p>
                        )}
                        <p className="text-xs mt-1" style={{ color: '#c5c5d3' }}>
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

        <div className="w-px h-5" style={{ background: '#c5c5d3', opacity: 0.4 }} />

        <Link href="/profile">
          <Avatar name={profile.full_name} avatarUrl={profile.avatar_url} size={32} />
        </Link>
      </div>
    </header>
  )
}
