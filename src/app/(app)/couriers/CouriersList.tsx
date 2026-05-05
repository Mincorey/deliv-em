'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Avatar } from '@/components/ui/Avatar'
import { FavoriteButton } from './FavoriteButton'
import { TRANSPORT_META } from '@/lib/types'
import type { Profile, CourierProfile } from '@/lib/types'

const PAGE_SIZE = 15

type CourierRow = Profile & { courier_profile: CourierProfile | null }

interface Props {
  currentUserId: string
}

export function CouriersList({ currentUserId }: Props) {
  const [couriers, setCouriers]       = useState<CourierRow[]>([])
  const [favIds, setFavIds]           = useState<Set<string>>(new Set())
  const [avgRatingMap, setAvgRatingMap] = useState<Record<string, number | null>>({})
  const [completedMap, setCompletedMap] = useState<Record<string, number>>({})
  const [loading, setLoading]         = useState(true)
  const [hasMore, setHasMore]         = useState(true)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const stateRef    = useRef({ page: 0, loading: false, hasMore: true })

  const supabase = createClient()

  async function fetchNext() {
    const s = stateRef.current
    if (s.loading || !s.hasMore) return
    s.loading = true
    setLoading(true)

    const from = s.page * PAGE_SIZE
    const to   = from + PAGE_SIZE - 1

    const res = await fetch(`/api/couriers?from=${from}&to=${to}`)
    if (!res.ok) {
      s.loading = false
      setLoading(false)
      return
    }
    const newCouriers = await res.json()
    const rows = (Array.isArray(newCouriers) ? newCouriers : newCouriers.data ?? []) as CourierRow[]
    const ids  = rows.map((c) => c.id)

    if (ids.length > 0) {
      const [ratingsRes, tasksRes] = await Promise.all([
        fetch('/api/ratings/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ courierIds: ids }),
        }),
        fetch('/api/tasks/completed', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ courierIds: ids }),
        }),
      ])

      const ratings = await ratingsRes.json()
      const tasks = await tasksRes.json()

      setAvgRatingMap(prev => {
        const next = { ...prev }
        const sums: Record<string, number> = {}
        const cnts: Record<string, number> = {}
        for (const r of Array.isArray(ratings) ? ratings : []) {
          sums[r.to_user_id] = (sums[r.to_user_id] ?? 0) + r.score
          cnts[r.to_user_id] = (cnts[r.to_user_id] ?? 0) + 1
        }
        for (const id of ids) {
          next[id] = cnts[id] ? Math.round(sums[id] / cnts[id] * 10) / 10 : null
        }
        return next
      })

      setCompletedMap(prev => {
        const next = { ...prev }
        for (const t of Array.isArray(tasks) ? tasks : []) {
          if (t.courier_id) next[t.courier_id] = (next[t.courier_id] ?? 0) + 1
        }
        return next
      })
    }

    setCouriers(prev => [...prev, ...rows])
    s.page    += 1
    s.hasMore  = rows.length === PAGE_SIZE
    s.loading  = false
    setHasMore(s.hasMore)
    setLoading(false)
  }

  // Fetch favorites once on mount
  useEffect(() => {
    supabase
      .from('favorite_couriers')
      .select('courier_id')
      .eq('customer_id', currentUserId)
      .then(({ data }) => {
        setFavIds(new Set(data?.map((f) => f.courier_id) ?? []))
      })
    fetchNext()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) fetchNext() },
      { rootMargin: '300px' }
    )
    const el = sentinelRef.current
    if (el) observer.observe(el)
    return () => { if (el) observer.unobserve(el) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const isEmpty = !loading && couriers.length === 0

  // Sort current page by live rating descending
  const sorted = [...couriers].sort((a, b) => (avgRatingMap[b.id] ?? 0) - (avgRatingMap[a.id] ?? 0))

  return (
    <>
      {sorted.length > 0 && (
        <div className="flex flex-col gap-3">
          {sorted.map((courier) => {
            const cp          = courier.courier_profile
            const isFav       = favIds.has(courier.id)
            const transport   = cp?.transport_type ? TRANSPORT_META[cp.transport_type] : null
            const liveRating  = avgRatingMap[courier.id]
            const liveCompleted = completedMap[courier.id] ?? 0

            return (
              <div key={courier.id} className="courier-card" style={{ position: 'relative' }}>
                <Link
                  href={`/profile/${courier.id}`}
                  className="courier-link"
                  style={{ textDecoration: 'none' }}
                >
                  {/* Avatar */}
                  <Avatar name={courier.full_name} avatarUrl={courier.avatar_url} size={48} />

                  {/* Name */}
                  <p className="courier-name" style={{ color: 'var(--text-1)' }}>{courier.full_name}</p>

                  {/* Location row */}
                  <div className="courier-location">
                    <span className="material-symbols-outlined" style={{ color: 'var(--text-3)', fontSize: 14 }}>location_on</span>
                    <span style={{ color: 'var(--text-3)' }}>{courier.city}</span>
                    {transport && (
                      <>
                        <span style={{ color: 'var(--text-4)' }}>·</span>
                        <span className="material-symbols-outlined" style={{ color: 'var(--text-3)', fontSize: 14 }}>{transport.icon}</span>
                        <span style={{ color: 'var(--text-3)' }}>{transport.label}</span>
                      </>
                    )}
                  </div>

                  {/* Bio (desktop only) */}
                  {courier.bio && (
                    <p className="courier-bio" style={{ color: 'var(--text-3)', maxWidth: 300 }}>{courier.bio}</p>
                  )}

                  {/* Rating row */}
                  <div className="courier-rating">
                    {liveRating !== null ? (
                      <>
                        <span className="font-bold" style={{ color: '#f59e0b' }}>{liveRating.toFixed(1)}</span>
                        <span className="material-symbols-outlined fill-icon" style={{ color: '#f59e0b', fontSize: 14 }}>star</span>
                      </>
                    ) : (
                      <span style={{ color: 'var(--text-4)' }}>Нет оценок</span>
                    )}
                    <span style={{ color: 'var(--text-4)' }}>·</span>
                    <span style={{ color: 'var(--text-3)' }}>{liveCompleted} заданий</span>
                  </div>
                </Link>
                <FavoriteButton courierId={courier.id} isFav={isFav} />
              </div>
            )
          })}
        </div>
      )}

      {hasMore && <div ref={sentinelRef} style={{ height: 1 }} />}

      {loading && (
        <div className="flex justify-center py-8">
          <span
            className="material-symbols-outlined"
            style={{ color: 'var(--text-3)', fontSize: 28, animation: 'spin 0.9s linear infinite' }}
          >
            progress_activity
          </span>
        </div>
      )}

      {!hasMore && couriers.length > 0 && (
        <p className="text-center text-sm py-6" style={{ color: 'var(--text-4)' }}>
          Все курьеры загружены
        </p>
      )}

      {isEmpty && (
        <div className="text-center py-16">
          <span className="material-symbols-outlined icon-float" style={{ fontSize: '4rem', color: 'var(--text-3)' }}>directions_bike</span>
          <p className="font-bold mt-3" style={{ color: 'var(--text-2)' }}>Нет зарегистрированных курьеров</p>
        </div>
      )}
    </>
  )
}
