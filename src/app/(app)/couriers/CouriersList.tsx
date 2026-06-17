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

interface Filters {
  search: string
  city: string
  customCity: string
  minRating: number
  transport: string
}

const ABKHAZIA_CITIES = [
  'Гагра',
  'Пицунда',
  'Гудаута',
  'Новый Афон',
  'Сухум',
  'Гульрыпш',
  'Агудзера',
  'Очамчыра',
  'Ткуарчал',
  'Гал',
]

const defaultFilters: Filters = { search: '', city: '', customCity: '', minRating: 0, transport: '' }

export function CouriersList({ currentUserId }: Props) {
  const [couriers, setCouriers]       = useState<CourierRow[]>([])
  const [favIds, setFavIds]           = useState<Set<string>>(new Set())
  const [avgRatingMap, setAvgRatingMap] = useState<Record<string, number | null>>({})
  const [completedMap, setCompletedMap] = useState<Record<string, number>>({})
  const [loading, setLoading]         = useState(true)
  const [hasMore, setHasMore]         = useState(true)
  const [filters, setFilters]         = useState<Filters>(() => {
    if (typeof window === 'undefined') return defaultFilters
    const saved = localStorage.getItem('courierFilters')
    return saved ? JSON.parse(saved) : defaultFilters
  })
  const [showFilters, setShowFilters] = useState(false)
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

  // Persist filters to localStorage
  useEffect(() => {
    localStorage.setItem('courierFilters', JSON.stringify(filters))
  }, [filters])

  const isEmpty = !loading && couriers.length === 0

  // Sort current page by live rating descending
  const sorted = [...couriers].sort((a, b) => (avgRatingMap[b.id] ?? 0) - (avgRatingMap[a.id] ?? 0))

  // Apply filters
  const transports = Array.from(new Set(couriers.map(c => c.courier_profile?.transport_type).filter(Boolean)))

  const getSelectedCity = () => {
    if (filters.city === 'other') return filters.customCity
    return filters.city
  }

  const filtered = sorted.filter(courier => {
    const cp = courier.courier_profile
    const liveRating = avgRatingMap[courier.id] ?? 0
    const selectedCity = getSelectedCity()

    if (filters.search && !courier.full_name.toLowerCase().includes(filters.search.toLowerCase())) return false
    if (selectedCity && !courier.city?.toLowerCase().includes(selectedCity.toLowerCase())) return false
    if (filters.minRating > 0 && liveRating < filters.minRating) return false
    if (filters.transport && cp?.transport_type !== filters.transport) return false

    return true
  })

  const displayedCount = filtered.length
  const isFiltered = filters.search || getSelectedCity() || filters.minRating > 0 || filters.transport

  return (
    <>
      {/* Search & Filters */}
      <div style={{ marginBottom: '1.5rem' }}>
        {/* Search bar */}
        <div style={{
          display: 'flex', gap: 10, marginBottom: '1rem',
          background: 'var(--surface-alt)',
          border: '1.5px solid var(--border)',
          borderRadius: '0.75rem',
          padding: '0.5rem 1rem',
          alignItems: 'center',
        }}>
          <span className="material-symbols-outlined" style={{ color: 'var(--text-3)', fontSize: 20, flexShrink: 0 }}>search</span>
          <input
            type="text"
            placeholder="Поиск по имени..."
            value={filters.search}
            onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-1)',
              fontSize: '0.95rem',
            }}
          />
        </div>

        {/* Filter button & active filter count */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => setShowFilters(!showFilters)}
            style={{
              background: showFilters ? 'var(--brand-soft)' : 'var(--surface-alt)',
              border: `1.5px solid ${showFilters ? 'var(--brand)' : 'var(--border)'}`,
              borderRadius: '0.75rem',
              padding: '8px 12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              color: showFilters ? 'var(--brand)' : 'var(--text-2)',
              fontWeight: 600,
              fontSize: '0.85rem',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>tune</span>
            Фильтры
            {isFiltered && (
              <span style={{
                background: 'var(--brand)',
                color: '#fff',
                borderRadius: '50%',
                width: 20,
                height: 20,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.7rem',
                fontWeight: 800,
              }}>
                {[filters.city, filters.minRating > 0, filters.transport].filter(Boolean).length}
              </span>
            )}
          </button>

          {isFiltered && (
            <button
              onClick={() => setFilters(defaultFilters)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-3)',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 600,
                textDecoration: 'underline',
              }}
            >
              Очистить
            </button>
          )}
        </div>

        {/* Filters panel */}
        {showFilters && (
          <div style={{
            marginTop: '1rem',
            background: 'var(--surface)',
            border: '1.5px solid var(--border)',
            borderRadius: '1rem',
            padding: '1.25rem',
          }}>
            {/* City filter */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Город
              </label>
              <select
                value={filters.city}
                onChange={e => setFilters(f => ({ ...f, city: e.target.value, customCity: '' }))}
                style={{
                  width: '100%',
                  background: 'var(--surface-alt)',
                  border: '1.5px solid var(--border)',
                  borderRadius: '0.75rem',
                  padding: '8px 12px',
                  color: 'var(--text-1)',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                <option value="">Все города</option>
                {ABKHAZIA_CITIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
                <option value="other">Другой населенный пункт</option>
              </select>
            </div>

            {/* Custom city input */}
            {filters.city === 'other' && (
              <div style={{ marginBottom: '1rem' }}>
                <input
                  type="text"
                  placeholder="Введите название города..."
                  value={filters.customCity}
                  onChange={e => setFilters(f => ({ ...f, customCity: e.target.value }))}
                  style={{
                    width: '100%',
                    background: 'var(--surface-alt)',
                    border: '1.5px solid var(--border)',
                    borderRadius: '0.75rem',
                    padding: '8px 12px',
                    color: 'var(--text-1)',
                    fontSize: '0.9rem',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            )}

            {/* Rating filter */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Минимальный рейтинг: {filters.minRating > 0 ? filters.minRating.toFixed(1) : 'Любой'}
              </label>
              <input
                type="range"
                min="0"
                max="5"
                step="0.5"
                value={filters.minRating}
                onChange={e => setFilters(f => ({ ...f, minRating: Number(e.target.value) }))}
                style={{
                  width: '100%',
                  cursor: 'pointer',
                  accentColor: 'var(--brand)',
                  height: 6,
                }}
              />
            </div>

            {/* Transport filter */}
            {transports.length > 0 && (
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Тип транспорта
                </label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    onClick={() => setFilters(f => ({ ...f, transport: '' }))}
                    style={{
                      background: filters.transport === '' ? 'var(--brand)' : 'var(--surface-alt)',
                      color: filters.transport === '' ? '#fff' : 'var(--text-2)',
                      border: `1.5px solid ${filters.transport === '' ? 'var(--brand)' : 'var(--border)'}`,
                      borderRadius: '0.6rem',
                      padding: '6px 12px',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      transition: 'all 0.15s',
                    }}
                  >
                    Все
                  </button>
                  {transports.map(t => {
                    const meta = TRANSPORT_META[t as keyof typeof TRANSPORT_META]
                    return (
                      <button
                        key={t}
                        onClick={() => setFilters(f => ({ ...f, transport: filters.transport === t ? '' : t }))}
                        style={{
                          background: filters.transport === t ? 'var(--brand)' : 'var(--surface-alt)',
                          color: filters.transport === t ? '#fff' : 'var(--text-2)',
                          border: `1.5px solid ${filters.transport === t ? 'var(--brand)' : 'var(--border)'}`,
                          borderRadius: '0.6rem',
                          padding: '6px 12px',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          transition: 'all 0.15s',
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{meta.icon}</span>
                        {meta.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Results count */}
      {isFiltered && (
        <p style={{ color: 'var(--text-3)', fontSize: '0.85rem', marginBottom: '1rem' }}>
          Найдено курьеров: <strong style={{ color: 'var(--text-1)' }}>{displayedCount}</strong>
        </p>
      )}

      {filtered.length > 0 && (
        <div className="flex flex-col gap-3">
          {filtered.map((courier) => {
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

      {hasMore && !isFiltered && <div ref={sentinelRef} style={{ height: 1 }} />}

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

      {!hasMore && couriers.length > 0 && !isFiltered && (
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

      {!isEmpty && filtered.length === 0 && isFiltered && (
        <div className="text-center py-16">
          <span className="material-symbols-outlined icon-float" style={{ fontSize: '4rem', color: 'var(--text-3)' }}>travel_explore</span>
          <p className="font-bold mt-3" style={{ color: 'var(--text-2)' }}>Курьеры не найдены</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-3)' }}>Попробуйте изменить фильтры</p>
        </div>
      )}
    </>
  )
}
