import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Avatar } from '@/components/ui/Avatar'
import { AnimatedPage, AnimatedItem, AnimatedList } from '@/components/ui/Animated'
import type { Profile, CourierProfile } from '@/lib/types'

const TRANSPORT_LABELS: Record<string, string> = {
  foot:       'Пешком',
  bicycle:    'Велосипед',
  motorcycle: 'Мотоцикл',
  car:        'Автомобиль',
  truck:      'Грузовик',
}

const TRANSPORT_ICONS: Record<string, string> = {
  foot:       'directions_walk',
  bicycle:    'directions_bike',
  motorcycle: 'two_wheeler',
  car:        'directions_car',
  truck:      'local_shipping',
}

function StarRating({ rating }: { rating: number }) {
  const full  = Math.floor(rating)
  const half  = rating - full >= 0.5
  const empty = 5 - full - (half ? 1 : 0)
  return (
    <span style={{ display: 'inline-flex', gap: 1 }}>
      {Array(full).fill(0).map((_, i) => (
        <span key={`f${i}`} className="material-symbols-outlined fill-icon" style={{ fontSize: 14, color: '#f59e0b' }}>star</span>
      ))}
      {half && (
        <span className="material-symbols-outlined fill-icon" style={{ fontSize: 14, color: '#f59e0b' }}>star_half</span>
      )}
      {Array(empty).fill(0).map((_, i) => (
        <span key={`e${i}`} className="material-symbols-outlined" style={{ fontSize: 14, color: 'var(--text-4)' }}>star</span>
      ))}
    </span>
  )
}

interface CourierWithProfile extends Profile {
  courier_profiles: CourierProfile | null
  completed_count: number
}

interface CustomerWithCount extends Profile {
  completed_count: number
}

export default async function RatingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const params  = await searchParams
  const tab     = params.tab === 'customers' ? 'customers' : 'couriers'

  // ── Couriers ──────────────────────────────────────────────────
  const { data: couriersRaw } = await supabase
    .from('profiles')
    .select(`*, courier_profiles(*)`)
    .eq('role', 'courier')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(100)

  // Count completed tasks directly from tasks table (source of truth)
  const courierIds = (couriersRaw ?? []).map((p: any) => p.id)
  const { data: courierTaskCounts } = courierIds.length
    ? await supabase
        .from('tasks')
        .select('courier_id')
        .in('courier_id', courierIds)
        .eq('status', 'completed')
    : { data: [] }

  const courierCountMap: Record<string, number> = {}
  for (const t of courierTaskCounts ?? []) {
    if (t.courier_id) courierCountMap[t.courier_id] = (courierCountMap[t.courier_id] ?? 0) + 1
  }

  const couriers: CourierWithProfile[] = (couriersRaw ?? []).map((p: any) => ({
    ...p,
    courier_profiles: p.courier_profiles ?? null,
    completed_count:  courierCountMap[p.id] ?? 0,
  }))
  couriers.sort((a, b) => (b.courier_profiles?.rating ?? 0) - (a.courier_profiles?.rating ?? 0))

  // ── Customers ─────────────────────────────────────────────────
  const { data: customersRaw } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'customer')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(100)

  // Count completed tasks per customer
  const customerIds = (customersRaw ?? []).map((p: any) => p.id)
  const { data: taskCounts } = customerIds.length
    ? await supabase
        .from('tasks')
        .select('customer_id')
        .in('customer_id', customerIds)
        .eq('status', 'completed')
    : { data: [] }

  const countMap: Record<string, number> = {}
  for (const t of taskCounts ?? []) {
    countMap[t.customer_id] = (countMap[t.customer_id] ?? 0) + 1
  }

  const customers: CustomerWithCount[] = (customersRaw ?? []).map((p: any) => ({
    ...p,
    completed_count: countMap[p.id] ?? 0,
  }))
  customers.sort((a, b) => b.completed_count - a.completed_count)

  return (
    <AnimatedPage className="p-6 max-w-4xl mx-auto">
      <AnimatedItem>
        <h2 className="text-xl font-bold mb-1 page-header">Рейтинги</h2>
        <p className="text-sm mb-5" style={{ color: 'var(--text-3)' }}>
          Лучшие участники платформы
        </p>
      </AnimatedItem>

      {/* Tabs */}
      <AnimatedItem>
      <div className="flex gap-2 mb-6">
        <Link href="/ratings?tab=couriers">
          <button
            className={tab === 'couriers' ? 'btn-green' : 'btn-ghost'}
            style={{ fontSize: '0.875rem' }}
          >
            <span className="material-symbols-outlined text-base">directions_bike</span>
            Курьеры
          </button>
        </Link>
        <Link href="/ratings?tab=customers">
          <button
            className={tab === 'customers' ? 'btn-green' : 'btn-ghost'}
            style={{ fontSize: '0.875rem' }}
          >
            <span className="material-symbols-outlined text-base">person</span>
            Заказчики
          </button>
        </Link>
      </div>
      </AnimatedItem>

      {/* ── Couriers tab ── */}
      {tab === 'couriers' && (
        <AnimatedList className="flex flex-col gap-3">
          {couriers.length === 0 && (
            <AnimatedItem><EmptyState icon="directions_bike" text="Нет зарегистрированных курьеров" /></AnimatedItem>
          )}
          {couriers.map((courier, index) => (
            <AnimatedItem key={courier.id}>
            <Link href={`/profile/${courier.id}`} style={{ textDecoration: 'none' }}>
              <div
                className="glass rounded-2xl p-4 flex items-center gap-4"
                style={{ transition: 'box-shadow 0.15s', cursor: 'pointer' }}
              >
                {/* Rank */}
                <div style={{
                  width: 32, height: 32, borderRadius: 9999, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: index < 3 ? 'linear-gradient(135deg,#f59e0b,#d97706)' : 'var(--surface-alt)',
                  color: index < 3 ? '#fff' : 'var(--text-3)',
                  fontWeight: 800, fontSize: '0.8rem',
                }}>
                  {index + 1}
                </div>

                <Avatar name={courier.full_name} avatarUrl={courier.avatar_url} size={44} />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold" style={{ color: 'var(--text-1)' }}>{courier.full_name}</span>
                    {courier.is_verified && (
                      <span className="material-symbols-outlined fill-icon" style={{ fontSize: 16, color: 'var(--brand)' }}>verified</span>
                    )}
                    {courier.courier_profiles?.is_available && (
                      <span style={{
                        fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px',
                        borderRadius: 9999, background: 'var(--green-soft)', color: 'var(--green)',
                      }}>онлайн</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    <StarRating rating={courier.courier_profiles?.rating ?? 5} />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>
                      {(courier.courier_profiles?.rating ?? 5).toFixed(1)}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>·</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>
                      {courier.courier_profiles?.completed_tasks ?? 0} выполнено
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>·</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>{courier.city}</span>
                  </div>
                </div>

                {/* Transport */}
                {courier.courier_profiles?.transport_type && (
                  <div style={{ flexShrink: 0, textAlign: 'center' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 22, color: 'var(--text-3)' }}>
                      {TRANSPORT_ICONS[courier.courier_profiles.transport_type] ?? 'directions_walk'}
                    </span>
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-4)' }}>
                      {TRANSPORT_LABELS[courier.courier_profiles.transport_type] ?? ''}
                    </div>
                  </div>
                )}

                <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--text-4)', flexShrink: 0 }}>
                  chevron_right
                </span>
              </div>
            </Link>
            </AnimatedItem>
          ))}
        </AnimatedList>
      )}

      {/* ── Customers tab ── */}
      {tab === 'customers' && (
        <AnimatedList className="flex flex-col gap-3">
          {customers.length === 0 && (
            <AnimatedItem><EmptyState icon="person" text="Нет зарегистрированных заказчиков" /></AnimatedItem>
          )}
          {customers.map((customer, index) => (
            <AnimatedItem key={customer.id}>
            <Link href={`/profile/${customer.id}`} style={{ textDecoration: 'none' }}>
              <div
                className="glass rounded-2xl p-4 flex items-center gap-4"
                style={{ cursor: 'pointer' }}
              >
                {/* Rank */}
                <div style={{
                  width: 32, height: 32, borderRadius: 9999, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: index < 3 ? 'linear-gradient(135deg,#00236f,#1e3a8a)' : 'var(--surface-alt)',
                  color: index < 3 ? '#fff' : 'var(--text-3)',
                  fontWeight: 800, fontSize: '0.8rem',
                }}>
                  {index + 1}
                </div>

                <Avatar name={customer.full_name} avatarUrl={customer.avatar_url} size={44} />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold" style={{ color: 'var(--text-1)' }}>{customer.full_name}</span>
                    {customer.is_verified && (
                      <span className="material-symbols-outlined fill-icon" style={{ fontSize: 16, color: 'var(--brand)' }}>verified</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>
                      {customer.completed_count} завершённых поручений
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>·</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>{customer.city}</span>
                  </div>
                </div>

                <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--text-4)', flexShrink: 0 }}>
                  chevron_right
                </span>
              </div>
            </Link>
            </AnimatedItem>
          ))}
        </AnimatedList>
      )}
    </AnimatedPage>
  )
}

function EmptyState({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="text-center py-16">
      <span className="material-symbols-outlined icon-float" style={{ fontSize: '4rem', color: 'var(--text-3)' }}>
        {icon}
      </span>
      <p className="font-bold mt-3" style={{ color: 'var(--text-2)' }}>{text}</p>
    </div>
  )
}
