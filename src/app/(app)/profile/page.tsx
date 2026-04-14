'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/Toast'
import { CITIES, TRANSPORT_META } from '@/lib/types'
import type { Profile, CourierProfile, TransportType } from '@/lib/types'

/* ── Phone formatter ── */
function formatPhone(input: string): string {
  const digits = input.replace(/\D/g, '').replace(/^[78]/, '').slice(0, 10)
  if (digits.length === 0) return ''
  let result = '+7 (' + digits.slice(0, Math.min(3, digits.length))
  if (digits.length > 3) result += ') ' + digits.slice(3, Math.min(6, digits.length))
  if (digits.length > 6) result += '-' + digits.slice(6, Math.min(8, digits.length))
  if (digits.length > 8) result += '-' + digits.slice(8, 10)
  return result
}

/* ── Birth date mask: ДД.ММ.ГГГГ ── */
function formatBirthDate(input: string): string {
  const d = input.replace(/\D/g, '').slice(0, 8)
  let r = d.slice(0, Math.min(2, d.length))
  if (d.length > 2) r += '.' + d.slice(2, Math.min(4, d.length))
  if (d.length > 4) r += '.' + d.slice(4, 8)
  return r
}
/* Convert ДД.ММ.ГГГГ → YYYY-MM-DD for DB */
function birthDateToISO(display: string): string | null {
  const parts = display.split('.')
  if (parts.length !== 3 || parts[2].length !== 4) return null
  return `${parts[2]}-${parts[1]}-${parts[0]}`
}
/* Convert YYYY-MM-DD → ДД.ММ.ГГГГ for display */
function isoToBirthDisplay(iso: string): string {
  const parts = iso.split('-')
  if (parts.length !== 3) return ''
  return `${parts[2]}.${parts[1]}.${parts[0]}`
}

/* ── Custom city dropdown ── */
function CitySelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="input-field"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', textAlign: 'left' }}
      >
        <span>{value}</span>
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 18, color: 'var(--text-3)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
        >
          expand_more
        </span>
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
          background: 'var(--surface)', border: '1.5px solid var(--border)',
          borderRadius: '1rem', boxShadow: 'var(--shadow-md)', zIndex: 50,
          overflow: 'hidden', animation: 'fadeInUp 0.18s cubic-bezier(0.22,1,0.36,1) both',
        }}>
          {CITIES.map((c, i) => (
            <button
              key={c} type="button"
              onClick={() => { onChange(c); setOpen(false) }}
              style={{
                display: 'block', width: '100%', padding: '10px 20px', textAlign: 'left',
                background: value === c ? 'var(--brand-soft)' : 'transparent',
                color: value === c ? 'var(--brand-text)' : 'var(--text-1)',
                fontWeight: value === c ? 700 : 400, fontSize: '0.9rem',
                cursor: 'pointer', border: 'none',
                borderTop: i > 0 ? '1px solid var(--border)' : 'none',
                transition: 'background 0.15s',
              }}
            >
              {c}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Toggle switch ── */
function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <div
      className="input-field"
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', padding: '12px 20px' }}
      onClick={() => onChange(!value)}
    >
      <span style={{ fontSize: '0.9rem', color: 'var(--text-1)', fontWeight: value ? 600 : 400 }}>{label}</span>
      <div style={{
        width: 48, height: 26, borderRadius: 9999, flexShrink: 0,
        background: value ? 'var(--green)' : 'var(--surface-variant)',
        border: '1.5px solid ' + (value ? 'var(--green)' : 'var(--border)'),
        position: 'relative', transition: 'background 0.2s, border-color 0.2s',
      }}>
        <div style={{
          position: 'absolute', top: 2, left: value ? 22 : 2,
          width: 18, height: 18, borderRadius: 9999, background: '#fff',
          boxShadow: '0 1px 3px rgba(0,0,0,.25)',
          transition: 'left 0.2s cubic-bezier(0.22,1,0.36,1)',
        }} />
      </div>
    </div>
  )
}

/* ── Page ── */
export default function ProfilePage() {
  const router = useRouter()
  const toast = useToast()
  const supabase = createClient()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [courierProfile, setCourierProfile] = useState<CourierProfile | null>(null)
  const [loading, setLoading] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)

  const [firstName, setFirstName]   = useState('')
  const [lastName, setLastName]     = useState('')
  const [phone, setPhone]           = useState('')
  const [city, setCity]             = useState('Сухум')
  const [bio, setBio]               = useState('')
  const [birthDate, setBirthDate]   = useState('')
  const [hasCar, setHasCar]         = useState(false)
  const [transport, setTransport]   = useState<TransportType>('foot')

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }

      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(prof as Profile)
      if (prof) {
        const parts = (prof.full_name ?? '').split(' ')
        setFirstName(parts[0] ?? '')
        setLastName(parts.slice(1).join(' '))
        setPhone(prof.phone ?? '')
        setCity(prof.city ?? 'Сухум')
        setBio(prof.bio ?? '')
        setBirthDate(prof.birth_date ? isoToBirthDisplay(prof.birth_date) : '')
        setHasCar(prof.has_car ?? false)
      }
      if (prof?.role === 'courier') {
        const { data: cp } = await supabase.from('courier_profiles').select('*').eq('id', user.id).single()
        setCourierProfile(cp as CourierProfile)
        if (cp) setTransport(cp.transport_type)
      }
    }
    load()
  }, [])

  /* ── Avatar upload ── */
  async function handleAvatarFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !profile) return
    setAvatarUploading(true)
    const ext = file.name.split('.').pop() ?? 'jpg'
    const path = `${profile.id}/avatar.${ext}`
    const { error: uploadErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
    if (uploadErr) { toast.show('Ошибка загрузки фото', 'error'); setAvatarUploading(false); return }
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
    await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', profile.id)
    setProfile((p) => p ? { ...p, avatar_url: publicUrl } : p)
    setAvatarUploading(false)
    toast.show('Фото обновлено', 'success')
  }

  /* ── Save ── */
  async function handleSave() {
    if (!profile) return
    setLoading(true)
    const fullName = `${firstName} ${lastName}`.trim()

    // Base fields — always exist in DB
    const { error } = await supabase.from('profiles')
      .update({ full_name: fullName, phone, city, bio: bio || null })
      .eq('id', profile.id)
    if (error) { toast.show(error.message, 'error'); setLoading(false); return }

    // Extended fields — require migration; fail gracefully
    const isoDate = birthDateToISO(birthDate)
    const { error: extErr } = await supabase.from('profiles')
      .update({ birth_date: isoDate, has_car: hasCar })
      .eq('id', profile.id)
    if (extErr) {
      toast.show('Выполните в Supabase SQL Editor:\nALTER TABLE public.profiles ADD COLUMN birth_date DATE;\nALTER TABLE public.profiles ADD COLUMN has_car BOOLEAN NOT NULL DEFAULT FALSE;', 'error')
    }

    if (profile.role === 'courier') {
      await supabase.from('courier_profiles').update({ transport_type: transport }).eq('id', profile.id)
    }

    setProfile((p) => p ? { ...p, full_name: fullName, phone, city, bio: bio || null, birth_date: isoDate, has_car: hasCar } : p)
    setLoading(false)
    if (!extErr) toast.show('Профиль сохранён', 'success')
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/auth')
  }

  const transportOptions = Object.entries(TRANSPORT_META) as [TransportType, (typeof TRANSPORT_META)[TransportType]][]
  const initials = ((firstName[0] ?? '') + (lastName[0] ?? '')).toUpperCase() || '?'
  const roleLabel = profile?.role === 'customer' ? 'Заказчик' : 'Курьер'

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mb-5" style={{ color: 'var(--text-1)' }}>Настройки профиля</h2>

      {/* Main card */}
      <div className="rounded-2xl p-6 mb-4" style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>

        {/* Avatar row */}
        <div className="flex items-center gap-4 mb-6">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleAvatarFile}
          />
          {/* Avatar circle — clickable */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={avatarUploading}
            style={{
              position: 'relative', width: 72, height: 72, borderRadius: 9999,
              border: '2px solid var(--border)', overflow: 'hidden', cursor: 'pointer',
              background: 'var(--brand-soft)', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            title="Изменить фото"
          >
            {profile?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--brand-text)' }}>{initials}</span>
            )}
            {/* Overlay on hover */}
            <div style={{
              position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.38)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: avatarUploading ? 1 : 0, transition: 'opacity 0.2s',
            }}
              className="avatar-overlay"
            >
              <span className="material-symbols-outlined text-white" style={{ fontSize: 22 }}>
                {avatarUploading ? 'hourglass_empty' : 'photo_camera'}
              </span>
            </div>
          </button>

          <div>
            <p className="font-bold" style={{ color: 'var(--text-1)', fontSize: '1rem' }}>
              {`${firstName} ${lastName}`.trim() || '—'}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
              {roleLabel} · {city}
            </p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs font-bold mt-1"
              style={{ color: 'var(--green)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              {avatarUploading ? 'Загружаем...' : 'Изменить фото'}
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {/* Name */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-sm">Имя</label>
              <input className="input-field" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>
            <div>
              <label className="label-sm">Фамилия</label>
              <input className="input-field" value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
          </div>

          {/* Birth date */}
          <div>
            <label className="label-sm">Дата рождения</label>
            <input
              className="input-field"
              type="text"
              inputMode="numeric"
              placeholder="ДД.ММ.ГГГГ"
              value={birthDate}
              onChange={(e) => setBirthDate(formatBirthDate(e.target.value))}
              maxLength={10}
            />
          </div>

          {/* Phone */}
          <div>
            <label className="label-sm">Телефон</label>
            <input
              className="input-field"
              type="tel"
              inputMode="numeric"
              placeholder="+7 (940) 000-00-00"
              value={phone}
              onChange={(e) => setPhone(formatPhone(e.target.value))}
            />
          </div>

          {/* Email */}
          <div>
            <label className="label-sm">Email</label>
            <input
              className="input-field"
              type="email"
              value={profile?.email ?? ''}
              disabled
              style={{ opacity: 0.5, cursor: 'not-allowed' }}
            />
          </div>

          {/* City */}
          <div>
            <label className="label-sm">Город</label>
            <CitySelect value={city} onChange={setCity} />
          </div>

          {/* Has car toggle */}
          <div>
            <label className="label-sm">Дополнительно</label>
            <Toggle value={hasCar} onChange={setHasCar} label="Есть личный автомобиль" />
          </div>

          {/* Courier-only fields */}
          {profile?.role === 'courier' && (
            <>
              <div>
                <label className="label-sm">Тип транспорта</label>
                <div className="grid grid-cols-3 gap-2">
                  {transportOptions.map(([t, meta]) => (
                    <button key={t} onClick={() => setTransport(t)} className={`type-btn text-xs ${transport === t ? 'selected' : ''}`}>
                      <span className="material-symbols-outlined">{meta.icon}</span>
                      {meta.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label-sm">О себе</label>
                <textarea
                  className="textarea-field" rows={3}
                  placeholder="Расскажите заказчикам о себе..."
                  value={bio} onChange={(e) => setBio(e.target.value)}
                />
              </div>
              {courierProfile && (
                <div className="rounded-xl p-4 flex gap-4" style={{ background: 'var(--surface-alt)', border: '1.5px solid var(--border)' }}>
                  <div className="text-center flex-1">
                    <p className="text-2xl font-black" style={{ color: '#f59e0b' }}>{courierProfile.rating?.toFixed(1)}</p>
                    <p className="text-xs" style={{ color: 'var(--text-3)' }}>Рейтинг</p>
                  </div>
                  <div className="text-center flex-1">
                    <p className="text-2xl font-black" style={{ color: 'var(--green)' }}>{courierProfile.completed_tasks}</p>
                    <p className="text-xs" style={{ color: 'var(--text-3)' }}>Выполнено</p>
                  </div>
                  <div className="text-center flex-1">
                    <p className="text-2xl font-black" style={{ color: 'var(--text-1)' }}>{courierProfile.total_tasks}</p>
                    <p className="text-xs" style={{ color: 'var(--text-3)' }}>Всего</p>
                  </div>
                </div>
              )}
            </>
          )}

          <button
            className="btn-primary"
            style={{ justifyContent: 'center', padding: '14px' }}
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? 'Сохраняем...' : 'Сохранить изменения'}
          </button>
        </div>
      </div>

      {/* Logout — no frame, just the button */}
      <button
        onClick={handleLogout}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '11px 22px', borderRadius: 9999,
          border: '1.5px solid rgba(186,26,26,0.4)',
          background: 'rgba(186,26,26,0.08)',
          color: '#e53935', fontWeight: 700, fontSize: '0.875rem',
          cursor: 'pointer', transition: 'background 0.18s, border-color 0.18s',
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget
          el.style.background = '#e53935'
          el.style.color = '#fff'
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget
          el.style.background = 'rgba(186,26,26,0.08)'
          el.style.color = '#e53935'
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>logout</span>
        Выйти из аккаунта
      </button>

      {/* Camera overlay hover via CSS */}
      <style>{`
        button:hover .avatar-overlay { opacity: 1 !important; }
      `}</style>
    </div>
  )
}
