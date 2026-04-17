'use client'

import { useState, useEffect, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { BottomNav } from './BottomNav'
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

  const refreshCount = useCallback(async () => {
    const { data: tasks } = await supabase
      .from('tasks')
      .select('id')
      .or(`customer_id.eq.${profile.id},courier_id.eq.${profile.id}`)

    const taskIds = tasks?.map((t) => t.id) ?? []
    if (taskIds.length === 0) { setUnreadMessages(0); return }

    const { count } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('is_read', false)
      .neq('sender_id', profile.id)
      .in('task_id', taskIds)

    setUnreadMessages(count ?? 0)
  }, [profile.id])

  // Refresh on every page navigation (catches "mark as read" from chat pages)
  useEffect(() => {
    refreshCount()
  }, [pathname])

  // Realtime: catch new incoming messages live
  useEffect(() => {
    const channel = supabase
      .channel('unread-messages-badge')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, refreshCount)
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
