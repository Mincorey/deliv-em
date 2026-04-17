'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { TRANSPORT_META } from '@/lib/types'
import type { Profile, CourierProfile } from '@/lib/types'

function pad2(n: number) { return String(n).padStart(2, '0') }
function formatJoined(iso: string) {
  const d = new Date(iso)
  return `${pad2(d.getDate())}.${pad2(d.getMonth() + 1)}.${d.getFullYear()}`
}
function calcAge(isoDate: string) {
  const birth = new Date(isoDate)
  const now   = new Date()
  let age = now.getFullYear() - birth.getFullYear()
  if (now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) age--
  return age
}

export default function PublicProfilePage() {
  const params   = useParams()
  const router   = useRouter()
  const supabase = createClient()

  const [profile,        setProfile]        = useState<Profile | null>(null)
  const [courierProfile, setCourierProfile] = useState<CourierProfile | null>(null)
  const [loading,        setLoading]        = useState(true)
  const [notFound,       setNotFound]       = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }

      // Redirect own profile to settings
      if (params.id === user.id) { router.replace('/profile'); return }

      const { data: prof } = await supabase
        .from('profiles').select('*').eq('id', params.id as string).single()

      if (!prof) { setNotFound(true); setLoading(false); return }
      setProfile(prof as Profile)

      if (prof.role === 'courier') {
        const { data: cp } = await supabase
          .from('courier_profiles').select('*').eq('id', params.id as string).single()
        if (cp) setCourierProfile(cp as CourierProfile)
      }
      setLoading(false)
    }
    load()
  }, [params.id])

  if (loading) return (
    <div className="p-6 max-w-2xl mx-auto flex justify-center py-20">
      <span className="material-symbols-outlined animate-spin" style={{ fontSize: 32, color: 'var(--text-4)' }}>progress_activity</span>
    </div>
  )

  if (notFound) return (
    <div className="p-6 max-w-2xl mx-auto text-center py-20">
      <p className="font-bold" style={{ color: 'var(--text-3)' }}>Профиль не найден</p>
      <button onClick={() => router.back()} className="text-sm mt-3 font-bold" style={{ color: 'var(--green)', background: 'none', border: 'none', cursor: 'pointer' }}>← Назад</button>
    </div>
  )

  const p        = profile!
  const privacy  = p.privacy_settings ?? {}
  const initials = (p.full_name ?? '').split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase() || '?'
  const roleLabel = p.role === 'customer' ? 'Заказчик' : 'Курьер'
  const transport = courierProfile ? TRANSPORT_META[courierProfile.transport_type] : null
  const hasVehicle = courierProfile && courierProfile.transport_type !== 'foot'

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 mb-5"
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', fontWeight: 600, fontSize: '0.9rem', padding: 0 }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_back</span>
        Назад
      </button>

      {/* Hero card */}
      <div className="rounded-2xl mb-4" style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>

        {/* Banner + avatar row */}
        <div style={{
          position: 'relative', height: 96,
          background: p.role === 'courier'
            ? 'linear-gradient(135deg, #006c49 0%, #00a86b 100%)'
            : 'linear-gradient(135deg, #00236f 0%, #1e3a8a 100%)',
        }}>
          {/* Watermark icon */}
          <span
            className="material-symbols-outlined fill-icon"
            style={{
              position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)',
              fontSize: 72, opacity: 0.15, color: '#fff', userSelect: 'none', pointerEvents: 'none',
            }}
          >
            {p.role === 'courier' ? 'directions_bike' : 'assignment'}
          </span>

          {/* Avatar — centered vertically on the banner bottom edge */}
          <div style={{
            position: 'absolute', bottom: -36, left: 24,
            width: 72, height: 72, borderRadius: 9999,
            border: '3px solid var(--surface)', overflow: 'hidden',
            background: 'var(--brand-soft)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
          }}>
            {p.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--brand-text)' }}>{initials}</span>
            )}
          </div>
        </div>

        {/* Content — top padding makes room for the avatar */}
        <div style={{ padding: '44px 1.5rem 1.5rem' }}>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-1)' }}>{p.full_name}</h2>
            {p.is_verified && (
              <span className="material-symbols-outlined fill-icon" style={{ fontSize: 18, color: 'var(--green)' }} title="Верифицирован">verified</span>
            )}
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Role badge */}
            <span style={{
              fontSize: '0.73rem', fontWeight: 700, padding: '3px 10px', borderRadius: 9999,
              background: p.role === 'courier' ? 'rgba(0,108,73,0.12)' : 'rgba(0,35,111,0.1)',
              color: p.role === 'courier' ? 'var(--green)' : 'var(--brand-text)',
              border: `1px solid ${p.role === 'courier' ? 'rgba(0,108,73,0.25)' : 'rgba(0,35,111,0.2)'}`,
            }}>
              {roleLabel}
            </span>

            {/* City */}
            <span className="flex items-center gap-1" style={{ fontSize: '0.82rem', color: 'var(--text-3)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>location_on</span>
              {p.city}
            </span>

            {/* Age */}
            {privacy.show_birth_date && p.birth_date && (
              <span style={{ fontSize: '0.82rem', color: 'var(--text-3)' }}>
                {calcAge(p.birth_date)} лет
              </span>
            )}
          </div>

            {/* Phone */}
            {privacy.show_phone && p.phone && (
              <a href={`tel:${p.phone}`} className="flex items-center gap-2 mt-2" style={{ color: 'var(--brand)', fontSize: '0.875rem', fontWeight: 600, textDecoration: 'none' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>phone</span>
                {p.phone}
              </a>
            )}
        </div>
      </div>

      {/* Bio */}
      {privacy.show_bio && p.bio && (
        <div className="rounded-2xl p-5 mb-4" style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
          <p className="label-sm mb-2">О себе</p>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-2)', lineHeight: 1.65 }}>{p.bio}</p>
        </div>
      )}

      {/* Courier stats block */}
      {courierProfile && (
        <div className="rounded-2xl p-5 mb-4" style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
          <p className="label-sm mb-3">Статистика курьера</p>

          {/* Stats row */}
          <div className="rounded-xl p-4 flex gap-4 mb-4" style={{ background: 'var(--surface-alt)', border: '1.5px solid var(--border)' }}>
            <div className="text-center flex-1">
              <p style={{ fontSize: '1.75rem', fontWeight: 900, color: '#f59e0b', lineHeight: 1 }}>{courierProfile.rating?.toFixed(1) ?? '—'}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>Рейтинг</p>
            </div>
            <div className="text-center flex-1" style={{ borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)' }}>
              <p style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--green)', lineHeight: 1 }}>{courierProfile.completed_tasks}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>Выполнено</p>
            </div>
            <div className="text-center flex-1">
              <p style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-1)', lineHeight: 1 }}>{courierProfile.total_tasks}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>Всего задач</p>
            </div>
          </div>

          {/* Tags row */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Availability */}
            <div className="flex items-center gap-2 rounded-full px-3 py-1.5" style={{
              background: courierProfile.is_available ? 'rgba(45,212,160,0.1)' : 'var(--surface-variant)',
              border: `1.5px solid ${courierProfile.is_available ? 'rgba(45,212,160,0.3)' : 'var(--border)'}`,
            }}>
              <div style={{
                width: 7, height: 7, borderRadius: 9999,
                background: courierProfile.is_available ? 'var(--green)' : 'var(--text-4)',
              }} />
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: courierProfile.is_available ? 'var(--green)' : 'var(--text-3)' }}>
                {courierProfile.is_available ? 'Доступен' : 'Недоступен'}
              </span>
            </div>

            {/* Transport */}
            {hasVehicle && transport && (
              <div className="flex items-center gap-2 rounded-full px-3 py-1.5" style={{ background: 'var(--surface-variant)', border: '1.5px solid var(--border)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 15, color: 'var(--text-2)' }}>{transport.icon}</span>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-2)' }}>{transport.label}</span>
              </div>
            )}

            {!hasVehicle && (
              <div className="flex items-center gap-2 rounded-full px-3 py-1.5" style={{ background: 'var(--surface-variant)', border: '1.5px solid var(--border)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 15, color: 'var(--text-2)' }}>directions_walk</span>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-2)' }}>Пешком</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Member since */}
      <div className="flex items-center gap-2 justify-center" style={{ color: 'var(--text-4)', fontSize: '0.78rem' }}>
        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>calendar_today</span>
        На сервисе с {formatJoined(p.created_at)}
      </div>
    </div>
  )
}
