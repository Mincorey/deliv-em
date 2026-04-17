'use server'

import { createClient } from '@/lib/supabase/server'

/** Delete notifications older than 7 days for a given user */
export async function deleteOldNotifications(userId: string) {
  const supabase = await createClient()
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  await supabase
    .from('notifications')
    .delete()
    .eq('user_id', userId)
    .lt('created_at', cutoff)
}

/** Delete all notifications for a given user */
export async function clearAllNotifications(userId: string) {
  const supabase = await createClient()
  await supabase
    .from('notifications')
    .delete()
    .eq('user_id', userId)
}
