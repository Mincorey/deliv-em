'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Avatar } from '@/components/ui/Avatar'
import { useToast } from '@/components/ui/Toast'
import { CITIES, TRANSPORT_META } from '@/lib/types'
import type { Profile, CourierProfile, TransportType } from '@/lib/types'

export default function ProfilePage() {
  const router = useRouter()
  const toast = useToast()
  const supabase = createClient()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [courierProfile, setCourierProfile] = useState<CourierProfile | null>(null)
  const [loading, setLoading] = useState(false)

  // Form state
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [city, setCity] = useState('Сухум')
  const [bio, setBio] = useState('')
  const [transport, setTransport] = useState<TransportType>('foot')

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }

      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      setProfile(prof as Profile)
      if (prof) {
        const parts = (prof.full_name ?? '').split(' ')
        setFirstName(parts[0] ?? '')
        setLastName(parts.slice(1).join(' '))
        setPhone(prof.phone ?? '')
        setCity(prof.city ?? 'Сухум')
        setBio(prof.bio ?? '')
      }

      if (prof?.role === 'courier') {
        const { data: cp } = await supabase
          .from('courier_profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        setCourierProfile(cp as CourierProfile)
        if (cp) setTransport(cp.transport_type)
      }
    }
    load()
  }, [])

  async function handleSave() {
    if (!profile) return
    setLoading(true)
    const fullName = `${firstName} ${lastName}`.trim()

    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName, phone, city, bio: bio || null })
      .eq('id', profile.id)

    if (error) {
      toast.show(error.message, 'error')
      setLoading(false)
      return
    }

    if (profile.role === 'courier') {
      await supabase
        .from('courier_profiles')
        .update({ transport_type: transport })
        .eq('id', profile.id)
    }

    setProfile((p) => p ? { ...p, full_name: fullName, phone, city, bio: bio || null } : p)
    setLoading(false)
    toast.show('Профиль сохранён', 'success')
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/auth')
  }

  const transportOptions = Object.entries(TRANSPORT_META) as [
    TransportType,
    (typeof TRANSPORT_META)[TransportType]
  ][]

  const initials = profile
    ? (firstName[0] ?? '') + (lastName[0] ?? '')
    : '?'

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mb-5">Настройки профиля</h2>

      <div className="bg-white rounded-2xl p-6 mb-4">
        {/* Avatar */}
        <div className="flex items-center gap-4 mb-6">
          <div
            className="avatar"
            style={{ width: 72, height: 72, fontSize: '1.6rem' }}
          >
            {profile?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: '1.6rem' }}>{initials.toUpperCase()}</span>
            )}
          </div>
          <div>
            <p className="font-bold">{`${firstName} ${lastName}`.trim()}</p>
            <p className="text-xs" style={{ color: '#757682' }}>
              {profile?.role === 'customer' ? 'Заказчик' : 'Курьер'} · {city}
            </p>
            <button className="text-xs font-bold mt-1" style={{ color: '#006c49' }}>
              Изменить фото
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-sm">Имя</label>
              <input
                className="input-field"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div>
              <label className="label-sm">Фамилия</label>
              <input
                className="input-field"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="label-sm">Телефон</label>
            <input
              className="input-field"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div>
            <label className="label-sm">Email</label>
            <input
              className="input-field"
              type="email"
              value={profile?.email ?? ''}
              disabled
              style={{ opacity: 0.6, cursor: 'not-allowed' }}
            />
          </div>

          <div>
            <label className="label-sm">Город</label>
            <select
              className="input-field"
              style={{ cursor: 'pointer' }}
              value={city}
              onChange={(e) => setCity(e.target.value)}
            >
              {CITIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>

          {profile?.role === 'courier' && (
            <>
              <div>
                <label className="label-sm">Тип транспорта</label>
                <div className="grid grid-cols-3 gap-2">
                  {transportOptions.map(([t, meta]) => (
                    <button
                      key={t}
                      onClick={() => setTransport(t)}
                      className={`type-btn text-xs ${transport === t ? 'selected' : ''}`}
                    >
                      <span className="material-symbols-outlined">{meta.icon}</span>
                      {meta.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label-sm">О себе</label>
                <textarea
                  className="textarea-field"
                  rows={3}
                  placeholder="Расскажите заказчикам о себе..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                />
              </div>
              {courierProfile && (
                <div className="rounded-xl p-4 flex gap-4" style={{ background: '#f2f4f6' }}>
                  <div className="text-center flex-1">
                    <p className="text-2xl font-black" style={{ color: '#f59e0b' }}>
                      {courierProfile.rating?.toFixed(1)}
                    </p>
                    <p className="text-xs" style={{ color: '#757682' }}>Рейтинг</p>
                  </div>
                  <div className="text-center flex-1">
                    <p className="text-2xl font-black" style={{ color: '#006c49' }}>
                      {courierProfile.completed_tasks}
                    </p>
                    <p className="text-xs" style={{ color: '#757682' }}>Выполнено</p>
                  </div>
                  <div className="text-center flex-1">
                    <p className="text-2xl font-black" style={{ color: '#191c1e' }}>
                      {courierProfile.total_tasks}
                    </p>
                    <p className="text-xs" style={{ color: '#757682' }}>Всего</p>
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

      <div className="bg-white rounded-2xl p-5">
        <h3 className="font-bold mb-3" style={{ color: '#ba1a1a' }}>Опасная зона</h3>
        <button
          className="btn-ghost"
          style={{ color: '#ba1a1a' }}
          onClick={handleLogout}
        >
          <span className="material-symbols-outlined text-base">logout</span>
          Выйти из аккаунта
        </button>
      </div>
    </div>
  )
}
