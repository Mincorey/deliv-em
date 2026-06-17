'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import type { PrivacySettings } from '@/lib/types'

function adminClient() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

interface UpdateProfileInput {
  full_name: string
  phone: string | null
  city: string
  bio: string | null
  birth_date: string | null
  privacy_settings: PrivacySettings
}

export async function updateProfile(input: UpdateProfileInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  const admin = adminClient()

  // Use admin client to bypass RLS
  const { error } = await admin
    .from('profiles')
    .update({
      full_name: input.full_name,
      phone: input.phone,
      city: input.city,
      bio: input.bio,
      birth_date: input.birth_date,
      privacy_settings: input.privacy_settings,
    })
    .eq('id', user.id)

  if (error) return { error: error.message }
  return { success: true }
}

export async function updateCourierTransport(transportType: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  const admin = adminClient()

  // First try to insert, if it fails due to conflict, update instead
  const { error: insertError } = await admin
    .from('courier_profiles')
    .insert({ id: user.id, transport_type: transportType })

  if (insertError && insertError.code !== '23505') {
    // If error is not unique constraint violation, return it
    return { error: insertError.message }
  }

  if (insertError?.code === '23505') {
    // Unique constraint violation - record exists, so update it
    const { error: updateError } = await admin
      .from('courier_profiles')
      .update({ transport_type: transportType })
      .eq('id', user.id)

    if (updateError) return { error: updateError.message }
  }

  return { success: true }
}
