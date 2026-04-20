'use client'

import { useState } from 'react'
import { useToast } from '@/components/ui/Toast'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { CitySelect } from '@/components/ui/CitySelect'
import type { UserRole, TransportType } from '@/lib/types'
import { loginAction, registerAction } from './actions'

type Tab = 'login' | 'register'

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


/* ── Main page ── */
export default function AuthPage() {
  const toast = useToast()

  const [tab, setTab] = useState<Tab>('login')
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState('')

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
    if (!loginEmail.trim()) { setFormError('Введите email'); return }
    setFormError('')
    setLoading(true)
    const result = await loginAction(loginEmail.trim(), loginPass)
    setLoading(false)
    if (result.error) {
      setFormError(result.error)
      toast.show(result.error, 'error')
    } else {
      window.location.href = '/dashboard'
    }
  }

  async function handleRegister() {
    if (!firstName || !phone || !regEmail || !regPass) {
      setFormError('Заполните все обязательные поля'); return
    }
    if (regPass.length < 8) { setFormError('Пароль минимум 8 символов'); return }
    setFormError('')
    setLoading(true)

    const result = await registerAction({
      email:         regEmail.trim(),
      password:      regPass,
      fullName:      `${firstName} ${lastName}`.trim(),
      phone,
      city,
      role,
      transportType: role === 'courier' ? transport : undefined,
    })

    setLoading(false)
    if (result.error) {
      setFormError(result.error)
      toast.show(result.error, 'error')
    } else {
      window.location.href = '/dashboard'
    }
  }

  const TRANSPORT_OPTIONS: { value: TransportType; icon: string; label: string }[] = [
    { value: 'foot',    icon: 'directions_walk', label: 'Пешком' },
    { value: 'bicycle', icon: 'directions_bike',  label: 'Велосипед' },
    { value: 'car',     icon: 'directions_car',   label: 'Авто' },
  ]

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative overflow-auto py-12"
      style={{ background: 'var(--bg)' }}
    >
      {/* Theme toggle — top-right */}
      <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 100 }}>
        <ThemeToggle />
      </div>

      {/* Decorative background blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div style={{ position: 'absolute', top: -120, right: -120, width: 480, height: 480, borderRadius: 9999, background: 'linear-gradient(135deg,#dce1ff55,#6cf8bb33)', filter: 'blur(60px)' }} />
        <div style={{ position: 'absolute', bottom: -80, left: -80, width: 360, height: 360, borderRadius: 9999, background: 'linear-gradient(135deg,#6cf8bb22,#dce1ff44)', filter: 'blur(50px)' }} />
      </div>

      <div className="relative z-10 w-full max-w-md mx-auto px-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg,#00236f,#006c49)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-symbols-outlined text-white" style={{ fontSize: 24 }}>local_shipping</span>
            </div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--brand-text)', letterSpacing: '-0.02em' }}>
              Deliv&apos;em
            </h1>
          </div>
          <p className="text-sm font-medium" style={{ color: 'var(--text-3)' }}>
            Сервис микропоручений в Абхазии
          </p>
        </div>

        {/* Card */}
        <div className="glass rounded-2xl p-8">
          {/* Tabs */}
          <div className="flex gap-2 mb-6 rounded-full p-1" style={{ background: 'var(--surface-alt)' }}>
            <button
              onClick={() => setTab('login')}
              className="flex-1 py-2 rounded-full text-sm font-bold transition-all"
              style={tab === 'login'
                ? { background: 'var(--surface)', color: 'var(--brand-text)', boxShadow: '0 1px 4px rgba(0,0,0,.08)' }
                : { color: 'var(--text-3)', fontWeight: 600 }}
            >
              Войти
            </button>
            <button
              onClick={() => setTab('register')}
              className="flex-1 py-2 rounded-full text-sm font-bold transition-all"
              style={tab === 'register'
                ? { background: 'var(--surface)', color: 'var(--brand-text)', boxShadow: '0 1px 4px rgba(0,0,0,.08)' }
                : { color: 'var(--text-3)', fontWeight: 600 }}
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
                    style={{ color: 'var(--text-3)' }}
                  >
                    <span className="material-symbols-outlined text-base">
                      {showPass ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>
              {formError && (
                <div style={{
                  background: 'rgba(186,26,26,0.08)', border: '1.5px solid rgba(186,26,26,0.3)',
                  borderRadius: '0.75rem', padding: '10px 14px',
                  color: '#ba1a1a', fontSize: '0.85rem', fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18, flexShrink: 0 }}>error</span>
                  {formError}
                </div>
              )}
              <button
                className="btn-primary w-full mt-2"
                style={{ fontSize: '0.95rem', padding: '14px', justifyContent: 'center' }}
                onClick={handleLogin}
                disabled={loading}
              >
                {loading ? 'Вход...' : 'Войти'}
              </button>
              <p className="text-center text-sm" style={{ color: 'var(--text-3)' }}>
                Нет аккаунта?{' '}
                <button onClick={() => setTab('register')} className="font-bold" style={{ color: 'var(--green)' }}>
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
                  <button onClick={() => setRole('customer')} className={`type-btn flex-col ${role === 'customer' ? 'selected' : ''}`}>
                    <span className="material-symbols-outlined" style={{ fontSize: '2rem', color: 'var(--brand-text)' }}>person</span>
                    <span className="text-sm font-bold" style={{ color: 'var(--brand-text)' }}>Заказчик</span>
                    <span className="text-xs text-center leading-tight" style={{ color: 'var(--text-3)' }}>Размещаю поручения</span>
                  </button>
                  <button onClick={() => setRole('courier')} className={`type-btn flex-col ${role === 'courier' ? 'selected' : ''}`}>
                    <span className="material-symbols-outlined" style={{ fontSize: '2rem', color: 'var(--green)' }}>delivery_dining</span>
                    <span className="text-sm font-bold" style={{ color: 'var(--green)' }}>Курьер</span>
                    <span className="text-xs text-center leading-tight" style={{ color: 'var(--text-3)' }}>Выполняю поручения</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-sm">Имя *</label>
                  <input className="input-field" type="text" placeholder="Алексей" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                </div>
                <div>
                  <label className="label-sm">Фамилия</label>
                  <input className="input-field" type="text" placeholder="Гицба" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                </div>
              </div>

              <div>
                <label className="label-sm">Телефон *</label>
                <input
                  className="input-field"
                  type="tel"
                  placeholder="+7 (940) 000-00-00"
                  value={phone}
                  onChange={(e) => setPhone(formatPhone(e.target.value))}
                  inputMode="numeric"
                />
              </div>

              <div>
                <label className="label-sm">Email *</label>
                <input className="input-field" type="email" placeholder="alex@mail.ru" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} />
              </div>

              <div>
                <label className="label-sm">Город</label>
                <CitySelect value={city} onChange={setCity} />
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
                    onKeyDown={(e) => e.key === 'Enter' && handleRegister()}
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPass(!showRegPass)}
                    className="absolute right-4 top-1/2 -translate-y-1/2"
                    style={{ color: 'var(--text-3)' }}
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

              {formError && (
                <div style={{
                  background: 'rgba(186,26,26,0.08)', border: '1.5px solid rgba(186,26,26,0.3)',
                  borderRadius: '0.75rem', padding: '10px 14px',
                  color: '#ba1a1a', fontSize: '0.85rem', fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18, flexShrink: 0 }}>error</span>
                  {formError}
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
              <p className="text-center text-sm" style={{ color: 'var(--text-3)' }}>
                Уже есть аккаунт?{' '}
                <button onClick={() => setTab('login')} className="font-bold" style={{ color: 'var(--green)' }}>
                  Войти
                </button>
              </p>
            </div>
          )}
        </div>

        <p className="text-center text-xs mt-4" style={{ color: 'var(--text-4)' }}>
          © 2025 Deliv&apos;em · Абхазия
        </p>
      </div>
    </div>
  )
}
