'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/Toast'
import { CITIES } from '@/lib/types'
import type { UserRole, TransportType } from '@/lib/types'

type Tab = 'login' | 'register'

export default function AuthPage() {
  const router = useRouter()
  const toast = useToast()
  const supabase = createClient()

  const [tab, setTab] = useState<Tab>('login')
  const [loading, setLoading] = useState(false)

  // Login state
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPass, setLoginPass] = useState('')
  const [showPass, setShowPass] = useState(false)

  // Register state
  const [role, setRole] = useState<UserRole>('customer')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [city, setCity] = useState('Сухум')
  const [regPass, setRegPass] = useState('')
  const [transport, setTransport] = useState<TransportType>('foot')
  const [showRegPass, setShowRegPass] = useState(false)

  async function handleLogin() {
    if (!loginEmail.trim()) {
      toast.show('Введите email', 'error')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail.trim(),
      password: loginPass,
    })
    setLoading(false)
    if (error) {
      toast.show('Неверный email или пароль', 'error')
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  async function handleRegister() {
    if (!firstName || !phone || !regEmail || !regPass) {
      toast.show('Заполните все обязательные поля', 'error')
      return
    }
    if (regPass.length < 8) {
      toast.show('Пароль минимум 8 символов', 'error')
      return
    }
    setLoading(true)

    const fullName = `${firstName} ${lastName}`.trim()

    const { data, error } = await supabase.auth.signUp({
      email: regEmail.trim(),
      password: regPass,
      options: {
        data: {
          full_name: fullName,
          phone,
          city,
          role,
          transport_type: role === 'courier' ? transport : undefined,
        },
      },
    })

    if (error) {
      setLoading(false)
      toast.show(error.message, 'error')
      return
    }

    if (data.user) {
      // Create profile record
      const { error: profErr } = await supabase.from('profiles').insert({
        id: data.user.id,
        role,
        full_name: fullName,
        phone,
        email: regEmail.trim(),
        city,
      })
      if (!profErr && role === 'courier') {
        await supabase.from('courier_profiles').insert({
          id: data.user.id,
          transport_type: transport,
        })
      }
    }

    setLoading(false)
    toast.show('Аккаунт создан! Добро пожаловать!', 'success')
    router.push('/dashboard')
    router.refresh()
  }

  const TRANSPORT_OPTIONS: { value: TransportType; icon: string; label: string }[] = [
    { value: 'foot', icon: 'directions_walk', label: 'Пешком' },
    { value: 'bicycle', icon: 'directions_bike', label: 'Велосипед' },
    { value: 'car', icon: 'directions_car', label: 'Авто' },
  ]

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative overflow-auto py-12"
      style={{ background: '#f7f9fb' }}
    >
      {/* Decorative background blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          style={{
            position: 'absolute',
            top: -120,
            right: -120,
            width: 480,
            height: 480,
            borderRadius: 9999,
            background: 'linear-gradient(135deg,#dce1ff55,#6cf8bb33)',
            filter: 'blur(60px)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -80,
            left: -80,
            width: 360,
            height: 360,
            borderRadius: 9999,
            background: 'linear-gradient(135deg,#6cf8bb22,#dce1ff44)',
            filter: 'blur(50px)',
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-md mx-auto px-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                background: 'linear-gradient(135deg,#00236f,#006c49)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span className="material-symbols-outlined text-white" style={{ fontSize: 24 }}>
                local_shipping
              </span>
            </div>
            <h1
              style={{
                fontSize: '1.8rem',
                fontWeight: 900,
                color: '#00236f',
                letterSpacing: '-0.02em',
              }}
            >
              Deliv&apos;em
            </h1>
          </div>
          <p className="text-sm font-medium" style={{ color: '#757682' }}>
            Сервис микропоручений в Абхазии
          </p>
        </div>

        {/* Card */}
        <div className="glass rounded-2xl p-8">
          {/* Tabs */}
          <div
            className="flex gap-2 mb-6 rounded-full p-1"
            style={{ background: '#f2f4f6' }}
          >
            <button
              onClick={() => setTab('login')}
              className="flex-1 py-2 rounded-full text-sm font-bold transition-all"
              style={
                tab === 'login'
                  ? { background: '#fff', color: '#00236f', boxShadow: '0 1px 4px rgba(0,0,0,.08)' }
                  : { color: '#757682', fontWeight: 600 }
              }
            >
              Войти
            </button>
            <button
              onClick={() => setTab('register')}
              className="flex-1 py-2 rounded-full text-sm font-bold transition-all"
              style={
                tab === 'register'
                  ? { background: '#fff', color: '#00236f', boxShadow: '0 1px 4px rgba(0,0,0,.08)' }
                  : { color: '#757682', fontWeight: 600 }
              }
            >
              Регистрация
            </button>
          </div>

          {/* Login Form */}
          {tab === 'login' && (
            <div className="flex flex-col gap-4">
              <div>
                <label className="label-sm">Email</label>
                <input
                  className="input-field"
                  type="email"
                  placeholder="alex@mail.ru"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                />
              </div>
              <div>
                <label className="label-sm">Пароль</label>
                <div className="relative">
                  <input
                    className="input-field"
                    style={{ paddingRight: 48 }}
                    type={showPass ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={loginPass}
                    onChange={(e) => setLoginPass(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-4 top-1/2 -translate-y-1/2"
                    style={{ color: '#757682' }}
                  >
                    <span className="material-symbols-outlined text-base">
                      {showPass ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>
              <button
                className="btn-primary w-full mt-2"
                style={{ fontSize: '0.95rem', padding: '14px', justifyContent: 'center' }}
                onClick={handleLogin}
                disabled={loading}
              >
                {loading ? 'Вход...' : 'Войти'}
              </button>
              <p className="text-center text-xs" style={{ color: '#757682' }}>
                Нет аккаунта?{' '}
                <button
                  onClick={() => setTab('register')}
                  className="font-bold"
                  style={{ color: '#006c49' }}
                >
                  Зарегистрироваться
                </button>
              </p>
            </div>
          )}

          {/* Register Form */}
          {tab === 'register' && (
            <div className="flex flex-col gap-4">
              {/* Role selector */}
              <div>
                <label className="label-sm text-center block mb-3">Я регистрируюсь как</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setRole('customer')}
                    className={`type-btn flex-col ${role === 'customer' ? 'selected' : ''}`}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '2rem', color: '#00236f' }}>
                      person
                    </span>
                    <span className="text-sm font-bold" style={{ color: '#00236f' }}>Заказчик</span>
                    <span className="text-xs text-center leading-tight" style={{ color: '#757682' }}>
                      Размещаю поручения
                    </span>
                  </button>
                  <button
                    onClick={() => setRole('courier')}
                    className={`type-btn flex-col ${role === 'courier' ? 'selected' : ''}`}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '2rem', color: '#006c49' }}>
                      delivery_dining
                    </span>
                    <span className="text-sm font-bold" style={{ color: '#006c49' }}>Курьер</span>
                    <span className="text-xs text-center leading-tight" style={{ color: '#757682' }}>
                      Выполняю поручения
                    </span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-sm">Имя *</label>
                  <input
                    className="input-field"
                    type="text"
                    placeholder="Алексей"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label-sm">Фамилия</label>
                  <input
                    className="input-field"
                    type="text"
                    placeholder="Гицба"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="label-sm">Телефон *</label>
                <input
                  className="input-field"
                  type="tel"
                  placeholder="+7 (940) 000-00-00"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div>
                <label className="label-sm">Email *</label>
                <input
                  className="input-field"
                  type="email"
                  placeholder="alex@mail.ru"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
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

              <div>
                <label className="label-sm">Пароль * (мин. 8 символов)</label>
                <div className="relative">
                  <input
                    className="input-field"
                    style={{ paddingRight: 48 }}
                    type={showRegPass ? 'text' : 'password'}
                    placeholder="Минимум 8 символов"
                    value={regPass}
                    onChange={(e) => setRegPass(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPass(!showRegPass)}
                    className="absolute right-4 top-1/2 -translate-y-1/2"
                    style={{ color: '#757682' }}
                  >
                    <span className="material-symbols-outlined text-base">
                      {showRegPass ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {role === 'courier' && (
                <div>
                  <label className="label-sm">Тип транспорта</label>
                  <div className="grid grid-cols-3 gap-2">
                    {TRANSPORT_OPTIONS.map((t) => (
                      <button
                        key={t.value}
                        onClick={() => setTransport(t.value)}
                        className={`type-btn text-xs ${transport === t.value ? 'selected' : ''}`}
                      >
                        <span className="material-symbols-outlined">{t.icon}</span>
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button
                className="btn-primary w-full mt-1"
                style={{ fontSize: '0.95rem', padding: '14px', justifyContent: 'center' }}
                onClick={handleRegister}
                disabled={loading}
              >
                {loading ? 'Создаём аккаунт...' : 'Создать аккаунт'}
              </button>
              <p className="text-center text-xs" style={{ color: '#757682' }}>
                Уже есть аккаунт?{' '}
                <button
                  onClick={() => setTab('login')}
                  className="font-bold"
                  style={{ color: '#006c49' }}
                >
                  Войти
                </button>
              </p>
            </div>
          )}
        </div>

        <p className="text-center text-xs mt-4" style={{ color: '#c5c5d3' }}>
          © 2025 Deliv&apos;em · Абхазия
        </p>
      </div>
    </div>
  )
}
