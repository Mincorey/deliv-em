export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/layout/AppShell'
import type { Profile, Notification } from '@/lib/types'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    // Sign out so middleware doesn't loop between /dashboard ↔ /auth
    await supabase.auth.signOut()
    redirect('/')
  }

  // Notifications
  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  // Unread messages count
  const { count: unreadMessages } = await supabase
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .eq('is_read', false)
    .neq('sender_id', user.id)
    .in(
      'task_id',
      (
        await supabase
          .from('tasks')
          .select('id')
          .or(`customer_id.eq.${user.id},courier_id.eq.${user.id}`)
      ).data?.map((t) => t.id) ?? []
    )

  return (
    <AppShell
      profile={profile as Profile}
      notifications={(notifications ?? []) as Notification[]}
      initialUnreadMessages={unreadMessages ?? 0}
    >
      {children}
    </AppShell>
  )
}
