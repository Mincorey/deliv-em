'use client'

import { useState, useEffect, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { BottomNav } from './BottomNav'
import { useToast } from '@/components/ui/Toast'
import type { Profile, Notification } from '@/lib/types'

interface AppShellProps {
  profile: Profile
  notifications: Notification[]
  initialUnreadMessages: number
  children: React.ReactNode
}

export function AppShell({ profile, notifications, initialUnreadMessages, children }: AppShellProps) {
  const [unreadMessages, setUnreadMessages] = useState(initialUnreadMessages)
  const supabase = createClient()
  const pathname = usePathname()
  const toast = useToast()

  const refreshCount = useCallback(async () => {
    const { data } = await supabase.rpc('get_unread_message_count', { p_user_id: profile.id })
    setUnreadMessages(data ?? 0)
  }, [profile.id])

  // Refresh on every page navigation (catches "mark as read" when leaving chat)
  useEffect(() => {
    refreshCount()
  }, [pathname])

  // Realtime: new message → increment; message read → full recount
  useEffect(() => {
    const channel = supabase
      .channel('unread-messages-badge')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, refreshCount)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, refreshCount)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [profile.id])

  // Realtime: show toast when a new notification arrives for current user
  useEffect(() => {
    const channel = supabase
      .channel(`notifications:${profile.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${profile.id}`,
      }, (payload) => {
        const n = payload.new as Notification
        toast.show(n.title || n.body, 'default')
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [profile.id])

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar profile={profile} unreadMessages={unreadMessages} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        <div className="mobile-safe-spacer" />
        <Topbar
          profile={profile}
          notifications={notifications}
          unreadMessages={unreadMessages}
        />
        <main className="map-bg mobile-main" style={{ flex: 1, overflowY: 'auto', background: 'var(--bg)' }}>
          {children}
        </main>
      </div>
      <BottomNav profile={profile} unreadMessages={unreadMessages} />
    </div>
  )
}
