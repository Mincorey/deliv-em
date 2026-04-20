import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Avatar } from '@/components/ui/Avatar'
import { AnimatedPage, AnimatedItem, AnimatedList } from '@/components/ui/Animated'
import { TRANSPORT_META } from '@/lib/types'
import type { Profile, CourierProfile } from '@/lib/types'

export default async function FavoritesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const isCustomer = profile?.role === 'customer'

  if (isCustomer) {
    const { data: favs } = await supabase
      .from('favorite_couriers')
      .select('courier:profiles!favorite_couriers_courier_id_fkey(*, courier_profile:courier_profiles(*))')
      .eq('customer_id', user.id)

    const couriers = (favs ?? []).map((f) => f.courier) as unknown as (Profile & { courier_profile: CourierProfile | null })[]

    return (
      <AnimatedPage className="p-6 max-w-4xl mx-auto">
        <AnimatedItem>
          <h2 className="text-xl font-bold mb-1 page-header" style={{ color: 'var(--text-1)' }}>Избранные курьеры</h2>
          <p className="text-sm mb-5" style={{ color: 'var(--text-3)' }}>Курьеры, которых вы добавили в избранное</p>
        </AnimatedItem>
        <FavoriteList people={couriers} role="courier" />
      </AnimatedPage>
    )
  }

  const { data: favs } = await supabase
    .from('favorite_customers')
    .select('customer:profiles!favorite_customers_customer_id_fkey(*)')
    .eq('courier_id', user.id)

  const customers = (favs ?? []).map((f) => f.customer) as unknown as Profile[]

  return (
    <AnimatedPage className="p-6 max-w-4xl mx-auto">
      <AnimatedItem>
        <h2 className="text-xl font-bold mb-1 page-header" style={{ color: 'var(--text-1)' }}>Избранные заказчики</h2>
        <p className="text-sm mb-5" style={{ color: 'var(--text-3)' }}>Заказчики, которых вы добавили в избранное</p>
      </AnimatedItem>
      <FavoriteList people={customers} role="customer" />
    </AnimatedPage>
  )
}

function FavoriteList({
  people,
  role,
}: {
  people: (Profile & { courier_profile?: CourierProfile | null })[]
  role: 'courier' | 'customer'
}) {
  if (people.length === 0) {
    return (
      <div className="text-center py-16">
        <span className="material-symbols-outlined icon-float" style={{ fontSize: '4rem', color: 'var(--text-3)' }}>favorite</span>
        <p className="font-bold mt-3" style={{ color: 'var(--text-2)' }}>
          {role === 'courier' ? 'Нет избранных курьеров' : 'Нет избранных заказчиков'}
        </p>
        <p className="text-sm mt-1" style={{ color: 'var(--text-3)' }}>
          {role === 'courier'
            ? 'Добавляйте понравившихся курьеров в избранное в разделе «Курьеры»'
            : 'Избранные заказчики появятся здесь'}
        </p>
      </div>
    )
  }

  return (
    <AnimatedList className="flex flex-col gap-3">
      {people.map((person) => {
        const cp = person.courier_profile
        const transport = cp?.transport_type ? TRANSPORT_META[cp.transport_type] : null
        return (
          <div key={person.id} className="courier-card">
            <Avatar name={person.full_name} avatarUrl={person.avatar_url} size={48} />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm" style={{ color: 'var(--text-1)' }}>{person.full_name}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="material-symbols-outlined" style={{ color: 'var(--text-3)', fontSize: 14 }}>location_on</span>
                <span className="text-xs" style={{ color: 'var(--text-3)' }}>{person.city}</span>
                {transport && (
                  <>
                    <span style={{ color: 'var(--text-4)' }}>·</span>
                    <span className="text-xs" style={{ color: 'var(--text-3)' }}>{transport.label}</span>
                  </>
                )}
              </div>
              {cp && (
                <div className="flex items-center gap-1 mt-1">
                  <span className="font-bold text-xs" style={{ color: '#f59e0b' }}>{cp.rating?.toFixed(1)}</span>
                  <span className="material-symbols-outlined fill-icon" style={{ color: '#f59e0b', fontSize: 12 }}>star</span>
                  <span className="text-xs" style={{ color: 'var(--text-4)' }}>· {cp.completed_tasks} заданий</span>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </AnimatedList>
  )
}
