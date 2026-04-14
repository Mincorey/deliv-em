import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Avatar } from '@/components/ui/Avatar'
import { FavoriteButton } from './FavoriteButton'
import { TRANSPORT_META } from '@/lib/types'
import type { Profile, CourierProfile } from '@/lib/types'

export default async function CouriersPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'customer') redirect('/dashboard')

  const { data: couriers } = await supabase
    .from('profiles')
    .select('*, courier_profile:courier_profiles(*)')
    .eq('role', 'courier')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  const { data: favorites } = await supabase
    .from('favorite_couriers')
    .select('courier_id')
    .eq('customer_id', user.id)

  const favIds = new Set(favorites?.map((f) => f.courier_id) ?? [])

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-xl font-bold mb-1">Курьеры сервиса</h2>
      <p className="text-sm mb-5" style={{ color: '#757682' }}>
        Все курьеры Deliv&apos;em, сортировка по рейтингу
      </p>

      {(couriers?.length ?? 0) > 0 ? (
        <div className="flex flex-col gap-3">
          {(couriers as (Profile & { courier_profile: CourierProfile | null })[])
            .sort((a, b) => (b.courier_profile?.rating ?? 5) - (a.courier_profile?.rating ?? 5))
            .map((courier) => {
              const cp = courier.courier_profile
              const isFav = favIds.has(courier.id)
              const transport = cp?.transport_type ? TRANSPORT_META[cp.transport_type] : null

              return (
                <div key={courier.id} className="courier-card">
                  <Avatar name={courier.full_name} avatarUrl={courier.avatar_url} size={48} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-bold text-sm">{courier.full_name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="material-symbols-outlined" style={{ color: '#757682', fontSize: 14 }}>
                            location_on
                          </span>
                          <span className="text-xs" style={{ color: '#757682' }}>{courier.city}</span>
                          {transport && (
                            <>
                              <span style={{ color: '#c5c5d3' }}>·</span>
                              <span className="material-symbols-outlined" style={{ color: '#757682', fontSize: 14 }}>
                                {transport.icon}
                              </span>
                              <span className="text-xs" style={{ color: '#757682' }}>{transport.label}</span>
                            </>
                          )}
                        </div>
                        {courier.bio && (
                          <p className="text-xs mt-1" style={{ color: '#757682', maxWidth: 300 }}>
                            {courier.bio}
                          </p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0 ml-4">
                        <div className="flex items-center gap-1">
                          <span className="font-bold text-sm" style={{ color: '#f59e0b' }}>
                            {cp?.rating?.toFixed(1) ?? '5.0'}
                          </span>
                          <span className="material-symbols-outlined fill-icon" style={{ color: '#f59e0b', fontSize: 14 }}>
                            star
                          </span>
                        </div>
                        <p className="text-xs" style={{ color: '#757682' }}>
                          {cp?.completed_tasks ?? 0} заданий
                        </p>
                        <div className="flex items-center gap-1 justify-end mt-1">
                          <div
                            style={{
                              width: 6, height: 6, borderRadius: 9999,
                              background: cp?.is_available ? '#006c49' : '#757682',
                            }}
                          />
                          <span className="text-xs" style={{ color: cp?.is_available ? '#006c49' : '#757682' }}>
                            {cp?.is_available ? 'Онлайн' : 'Оффлайн'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <FavoriteButton courierId={courier.id} isFav={isFav} />
                </div>
              )
            })}
        </div>
      ) : (
        <div className="text-center py-16">
          <span className="material-symbols-outlined" style={{ fontSize: '4rem', color: '#c5c5d3' }}>
            directions_bike
          </span>
          <p className="font-bold mt-3" style={{ color: '#757682' }}>
            Нет зарегистрированных курьеров
          </p>
        </div>
      )}
    </div>
  )
}
