import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CouriersList } from './CouriersList'
import { AnimatedPage, AnimatedItem } from '@/components/ui/Animated'

export default async function CouriersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'customer') redirect('/dashboard')

  return (
    <AnimatedPage className="p-6 max-w-4xl mx-auto">
      <AnimatedItem>
        <h2 className="text-xl font-bold mb-1 page-header" style={{ color: 'var(--text-1)' }}>
          Курьеры сервиса
        </h2>
        <p className="text-sm mb-5" style={{ color: 'var(--text-3)' }}>
          Все курьеры Deliv&apos;em, сортировка по рейтингу
        </p>
      </AnimatedItem>
      <CouriersList currentUserId={user.id} />
    </AnimatedPage>
  )
}
