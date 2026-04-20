'use client'

import { useState, forwardRef } from 'react'
import { CitySelect } from '@/components/ui/CitySelect'
import { FadeSection, ErrorMsg, formatPhone } from './landing-utils'
import { loginAction, registerAction } from '@/app/(auth)/auth/actions'
import { useToast } from '@/components/ui/Toast'
import type { UserRole, TransportType } from '@/lib/types'

const TRANSPORT_OPTIONS: { value: TransportType; icon: string; label: string }[] = [
  { value: 'foot', icon: 'directions_walk', label: 'Пешком' },
  { value: 'bicycle', icon: 'directions_bike', label: 'Велосипед' },
  { value: 'car', icon: 'directions_car', label: 'Авто' },
]

interface Props {
  activeTab: 'login' | 'register'
  onTabChange: (tab: 'login' | 'register') => void
}

export const LandingAuth = forwardRef<HTMLDivElement, Props>(function LandingAuth({ activeTab, onTabChange }, ref) {
  const toast = useToast()
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState('')

  const [loginEmail, setLoginEmail] = useState('')
  const [loginPass, setLoginPass] = useState('')
  const [showPass, setShowPass] = useState(false)

  const [role, setRole] = useState<UserRole>('customer')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [city, setCity] = useState('Сухум')
  const [regPass, setRegPass] = useState('')
  const [transport, setTransport] = useState<TransportType>('foot')
  const [showRegPass, setShowRegPass] = useState(false)

  function switchTab(t: 'login' | 'register') {
    setFormError('')
    onTabChange(t)
  }

  async function handleLogin() {
    if (!loginEmail.trim()) { setFormError('Введите email'); return }
    setFormError(''); setLoading(true)
    const result = await loginAction(loginEmail.trim(), loginPass)
    setLoading(false)
    if (result.error) { setFormError(result.error); toast.show(result.error, 'error') }
    else window.location.href = '/dashboard'
  }

  async function handleRegister() {
    if (!firstName || !phone || !regEmail || !regPass) { setFormError('Заполните все обязательные поля'); return }
    if (regPass.length < 8) { setFormError('Пароль минимум 8 символов'); return }
    setFormError(''); setLoading(true)
    const result = await registerAction({
      email: regEmail.trim(), password: regPass,
      fullName: `${firstName} ${lastName}`.trim(),
      phone, city, role,
      transportType: role === 'courier' ? transport : undefined,
    })
    setLoading(false)
    if (result.error) { setFormError(result.error); toast.show(result.error, 'error') }
    else window.location.href = '/dashboard'
  }

  return (
    <section style={{ padding: 'clamp(60px, 8vw, 100px) clamp(1rem, 5vw, 3rem)' }}>
      <div style={{ maxWidth: 520, margin: '0 auto' }} ref={ref}>
        <FadeSection>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--brand-soft)', borderRadius: 9999, padding: '5px 14px', marginBottom: 14 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'var(--brand)' }}>login</span>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--brand)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Начать работу</span>
            </div>
            <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 900, letterSpacing: '-0.025em', color: 'var(--text-1)' }}>
              Присоединяйся<br />к Deliv&apos;em
            </h2>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-3)', marginTop: 10 }}>
              Регистрация занимает меньше минуты
            </p>
          </div>
        </FadeSection>

        <FadeSection delay={100}>
          <div className="glass" style={{ borderRadius: '1.75rem', padding: 'clamp(1.5rem, 5vw, 2rem)' }}>
            <div className="flex gap-2 mb-6 rounded-full p-1" style={{ background: 'var(--surface-alt)' }}>
              <button onClick={() => switchTab('login')}
                className="flex-1 py-2 rounded-full text-sm font-bold transition-all"
                style={activeTab === 'login'
                  ? { background: 'var(--surface)', color: 'var(--brand-text)', boxShadow: '0 1px 4px rgba(0,0,0,.08)' }
                  : { color: 'var(--text-3)', fontWeight: 600 }}>
                Войти
              </button>
              <button onClick={() => switchTab('register')}
                className="flex-1 py-2 rounded-full text-sm font-bold transition-all"
                style={activeTab === 'register'
                  ? { background: 'var(--surface)', color: 'var(--brand-text)', boxShadow: '0 1px 4px rgba(0,0,0,.08)' }
                  : { color: 'var(--text-3)', fontWeight: 600 }}>
                Регистрация
              </button>
            </div>

            {activeTab === 'login' && (
              <div className="flex flex-col gap-4">
                <div>
                  <label className="label-sm">Email</label>
                  <input className="input-field" type="email" placeholder="alex@mail.ru"
                    value={loginEmail} onChange={e => setLoginEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleLogin()} />
                </div>
                <div>
                  <label className="label-sm">Пароль</label>
                  <div className="relative">
                    <input className="input-field" style={{ paddingRight: 48 }}
                      type={showPass ? 'text' : 'password'} placeholder="••••••••"
                      value={loginPass} onChange={e => setLoginPass(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleLogin()} />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      className="absolute right-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-3)' }}>
                      <span className="material-symbols-outlined text-base">{showPass ? 'visibility_off' : 'visibility'}</span>
                    </button>
                  </div>
                </div>
                {formError && <ErrorMsg msg={formError} />}
                <button className="btn-primary w-full mt-2" style={{ fontSize: '0.95rem', padding: '14px', justifyContent: 'center' }}
                  onClick={handleLogin} disabled={loading}>
                  {loading ? 'Вход...' : 'Войти'}
                </button>
                <p className="text-center text-sm" style={{ color: 'var(--text-3)' }}>
                  Нет аккаунта?{' '}
                  <button onClick={() => switchTab('register')} className="font-bold" style={{ color: 'var(--green)' }}>
                    Зарегистрироваться
                  </button>
                </p>
              </div>
            )}

            {activeTab === 'register' && (
              <div className="flex flex-col gap-4">
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
                    <input className="input-field" type="text" placeholder="Алексей"
                      value={firstName} onChange={e => setFirstName(e.target.value)} />
                  </div>
                  <div>
                    <label className="label-sm">Фамилия</label>
                    <input className="input-field" type="text" placeholder="Гицба"
                      value={lastName} onChange={e => setLastName(e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="label-sm">Телефон *</label>
                  <input className="input-field" type="tel" placeholder="+7 (940) 000-00-00"
                    value={phone} onChange={e => setPhone(formatPhone(e.target.value))} inputMode="numeric" />
                </div>
                <div>
                  <label className="label-sm">Email *</label>
                  <input className="input-field" type="email" placeholder="alex@mail.ru"
                    value={regEmail} onChange={e => setRegEmail(e.target.value)} />
                </div>
                <div>
                  <label className="label-sm">Город</label>
                  <CitySelect value={city} onChange={setCity} />
                </div>
                <div>
                  <label className="label-sm">Пароль * (мин. 8 символов)</label>
                  <div className="relative">
                    <input className="input-field" style={{ paddingRight: 48 }}
                      type={showRegPass ? 'text' : 'password'} placeholder="Минимум 8 символов"
                      value={regPass} onChange={e => setRegPass(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleRegister()} />
                    <button type="button" onClick={() => setShowRegPass(!showRegPass)}
                      className="absolute right-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-3)' }}>
                      <span className="material-symbols-outlined text-base">{showRegPass ? 'visibility_off' : 'visibility'}</span>
                    </button>
                  </div>
                </div>
                {role === 'courier' && (
                  <div>
                    <label className="label-sm">Тип транспорта</label>
                    <div className="grid grid-cols-3 gap-2">
                      {TRANSPORT_OPTIONS.map(t => (
                        <button key={t.value} onClick={() => setTransport(t.value)}
                          className={`type-btn text-xs ${transport === t.value ? 'selected' : ''}`}>
                          <span className="material-symbols-outlined">{t.icon}</span>
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {formError && <ErrorMsg msg={formError} />}
                <button className="btn-primary w-full mt-1" style={{ fontSize: '0.95rem', padding: '14px', justifyContent: 'center' }}
                  onClick={handleRegister} disabled={loading}>
                  {loading ? 'Создаём аккаунт...' : 'Создать аккаунт'}
                </button>
                <p className="text-center text-sm" style={{ color: 'var(--text-3)' }}>
                  Уже есть аккаунт?{' '}
                  <button onClick={() => switchTab('login')} className="font-bold" style={{ color: 'var(--green)' }}>
                    Войти
                  </button>
                </p>
              </div>
            )}
          </div>
        </FadeSection>
      </div>
    </section>
  )
})
