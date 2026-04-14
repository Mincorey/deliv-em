'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function toggleFavoriteCourier(courierId: string, isFav: boolean) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  if (isFav) {
    await supabase
      .from('favorite_couriers')
      .delete()
      .eq('customer_id', user.id)
      .eq('courier_id', courierId)
  } else {
    await supabase
      .from('favorite_couriers')
      .insert({ customer_id: user.id, courier_id: courierId })
  }

  revalidatePath('/couriers')
  revalidatePath('/favorites')
  return { success: true }
}
