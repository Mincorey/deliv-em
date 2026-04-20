'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useToast } from '@/components/ui/Toast'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { CITIES } from '@/lib/types'
import type { UserRole, TransportType } from '@/lib/types'
import { loginAction, registerAction } from '@/app/(auth)/auth/actions'

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

/* ── Intersection Observer hook ── */
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); obs.disconnect() } },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, inView }
}

/* ── Animated counter ── */
function AnimCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [val, setVal] = useState(0)
  const { ref, inView } = useInView(0.3)
  useEffect(() => {
    if (!inView || target === 0) { if (target === 0) setVal(0); return }
    const duration = 1400
    const start = performance.now()
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1)
      const ease = 1 - Math.pow(1 - p, 3)
      setVal(Math.round(ease * target))
      if (p < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [inView, target])
  return <span ref={ref}>{val}{suffix}</span>
}

/* ── City dropdown for register ── */
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
      <button type="button" onClick={() => setOpen(o => !o)} className="input-field"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', textAlign: 'left' }}>
        <span>{value}</span>
        <span className="material-symbols-outlined"
          style={{ fontSize: 18, color: 'var(--text-3)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
          expand_more
        </span>
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
          background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: '1rem',
          boxShadow: 'var(--shadow-md)', zIndex: 100, overflow: 'hidden',
          animation: 'fadeInUp 0.18s cubic-bezier(0.22,1,0.36,1) both',
        }}>
          {CITIES.map((c, i) => (
            <button key={c} type="button" onClick={() => { onChange(c); setOpen(false) }}
              style={{
                display: 'block', width: '100%', padding: '10px 20px', textAlign: 'left',
                background: value === c ? 'var(--brand-soft)' : 'transparent',
                color: value === c ? 'var(--brand-text)' : 'var(--text-1)',
                fontWeight: value === c ? 700 : 400, fontSize: '0.9rem', cursor: 'pointer',
                border: 'none', borderTop: i > 0 ? '1px solid var(--border)' : 'none', transition: 'background 0.15s',
              }}>
              {c}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Fade-in section wrapper ── */
function FadeSection({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, inView } = useInView()
  return (
    <div ref={ref} className={className} style={{
      opacity: inView ? 1 : 0,
      transform: inView ? 'translateY(0)' : 'translateY(32px)',
      transition: `opacity 0.7s cubic-bezier(0.22,1,0.36,1) ${delay}ms, transform 0.7s cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
    }}>
      {children}
    </div>
  )
}

/* ── Props ── */
interface LandingProps {
  stats: { customers: number; couriers: number; completedTasks: number; cities: number }
}

/* ── Main component ── */
export function LandingClient({ stats }: LandingProps) {
  const toast = useToast()
  const authRef = useRef<HTMLDivElement>(null)

  const [tab, setTab] = useState<'login' | 'register'>('login')
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

  const scrollToAuth = useCallback((defaultTab?: 'login' | 'register') => {
    if (defaultTab) setTab(defaultTab)
    authRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [])

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

  const TRANSPORT_OPTIONS: { value: TransportType; icon: string; label: string }[] = [
    { value: 'foot', icon: 'directions_walk', label: 'Пешком' },
    { value: 'bicycle', icon: 'directions_bike', label: 'Велосипед' },
    { value: 'car', icon: 'directions_car', label: 'Авто' },
  ]

  const STEPS = [
    { n: '01', icon: 'add_circle', color: 'var(--brand)', label: 'Создай задание', desc: 'Опиши что нужно сделать, укажи маршрут, дедлайн и цену — это займёт меньше минуты' },
    { n: '02', icon: 'handshake', color: 'var(--green)', label: 'Курьер берётся', desc: 'Проверенные курьеры рядом с тобой откликнутся на задание. Выбери подходящего' },
    { n: '03', icon: 'verified', color: '#f59e0b', label: 'Готово!', desc: 'Курьер выполнил поручение — договоритесь об оплате любым удобным способом и оставьте отзыв' },
  ]

  const FEATURES = [
    { icon: 'shield', color: 'var(--brand)', label: 'Безопасность', desc: 'Средства блокируются на счёте до подтверждения выполнения. Никакого риска' },
    { icon: 'star', color: '#f59e0b', label: 'Рейтинги', desc: 'Только проверенные курьеры с реальными отзывами от заказчиков' },
    { icon: 'forum', color: 'var(--green)', label: 'Встроенный чат', desc: 'Обсуждай детали напрямую с курьером — без сторонних мессенджеров' },
    { icon: 'location_on', color: '#ec4899', label: '6+ городов', desc: 'Работаем по всей Абхазии: Сухум, Гагра, Гудаута, Очамчыра и другие' },
  ]

  const STAT_ITEMS = [
    { icon: 'person', color: 'var(--brand)', label: 'Заказчиков', value: stats.customers, suffix: '+' },
    { icon: 'delivery_dining', color: 'var(--green)', label: 'Курьеров', value: stats.couriers, suffix: '+' },
    { icon: 'check_circle', color: '#f59e0b', label: 'Выполнено заданий', value: stats.completedTasks, suffix: '+' },
    { icon: 'location_city', color: '#ec4899', label: 'Городов', value: stats.cities, suffix: '' },
  ]

  return (
    <div style={{ background: 'var(--bg)', color: 'var(--text-1)', overflowX: 'hidden' }}>

      {/* ── Fixed header ── */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
        background: 'var(--glass-bg)', backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-soft)',
        padding: '0 clamp(1rem, 4vw, 2.5rem)',
        height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: 'linear-gradient(135deg,#00236f,#006c49)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <span className="material-symbols-outlined text-white" style={{ fontSize: 18 }}>local_shipping</span>
          </div>
          <span style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--brand-text)', letterSpacing: '-0.02em' }}>
            Deliv&apos;em
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ThemeToggle />
          <button className="btn-ghost" style={{ padding: '7px 16px', fontSize: '0.82rem' }}
            onClick={() => scrollToAuth('login')}>
            Войти
          </button>
          <button className="btn-primary" style={{ padding: '7px 16px', fontSize: '0.82rem' }}
            onClick={() => scrollToAuth('register')}>
            Регистрация
          </button>
        </div>
      </header>

      {/* ══ SECTION 1: HERO ══ */}
      <section style={{
        minHeight: '100svh',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        position: 'relative', overflow: 'hidden',
        paddingTop: 80, paddingBottom: 60,
        padding: '80px clamp(1rem, 5vw, 3rem) 60px',
      }}>
        {/* Blobs */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', top: -160, right: -160, width: 600, height: 600, borderRadius: 9999, background: 'linear-gradient(135deg,#dce1ff55,#6cf8bb33)', filter: 'blur(80px)' }} />
          <div style={{ position: 'absolute', bottom: -100, left: -100, width: 500, height: 500, borderRadius: 9999, background: 'linear-gradient(135deg,#6cf8bb22,#dce1ff44)', filter: 'blur(70px)' }} />
          <div style={{ position: 'absolute', top: '40%', left: '30%', width: 300, height: 300, borderRadius: 9999, background: 'rgba(0,108,73,0.07)', filter: 'blur(60px)' }} />
        </div>

        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 680 }}>
          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 24,
            background: 'var(--green-soft)', border: '1.5px solid rgba(0,108,73,0.2)',
            borderRadius: 9999, padding: '6px 16px',
            animation: 'fadeInDown 0.6s cubic-bezier(0.22,1,0.36,1) both',
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'var(--green)' }}>location_on</span>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--green)', letterSpacing: '0.04em' }}>
              Работаем по всей Абхазии
            </span>
          </div>

          {/* Title */}
          <h1 style={{
            fontSize: 'clamp(1.9rem, 5.5vw, 3.4rem)',
            fontWeight: 900, lineHeight: 1.08, letterSpacing: '-0.03em',
            color: 'var(--text-1)', marginBottom: 20,
            animation: 'fadeInUp 0.7s cubic-bezier(0.22,1,0.36,1) 0.1s both',
          }}>
            Любое поручение —<br />
            <span style={{
              background: 'linear-gradient(135deg,#00236f,#006c49)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>в надёжных руках</span>
          </h1>

          {/* Subtitle */}
          <p style={{
            fontSize: 'clamp(1rem, 2.5vw, 1.2rem)', color: 'var(--text-2)', lineHeight: 1.6,
            marginBottom: 36, maxWidth: 520, margin: '0 auto 36px',
            animation: 'fadeInUp 0.7s cubic-bezier(0.22,1,0.36,1) 0.2s both',
          }}>
            Найди курьера за минуты или зарабатывай, выполняя задания — доставка, покупки, мелкие поручения по всей Абхазии.
          </p>

          {/* CTA buttons */}
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center',
            animation: 'fadeInUp 0.7s cubic-bezier(0.22,1,0.36,1) 0.3s both',
          }}>
            <button className="btn-primary" style={{ fontSize: '1rem', padding: '14px 28px' }}
              onClick={() => scrollToAuth('register')}>
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>add_task</span>
              Разместить поручение
            </button>
            <button className="btn-green" style={{ fontSize: '1rem', padding: '14px 28px' }}
              onClick={() => scrollToAuth('register')}>
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>delivery_dining</span>
              Стать курьером
            </button>
          </div>

          {/* Trust line */}
          <div style={{
            marginTop: 32, display: 'flex', flexWrap: 'wrap', gap: 20, justifyContent: 'center',
            animation: 'fadeInUp 0.7s cubic-bezier(0.22,1,0.36,1) 0.4s both',
          }}>
            {[
              { icon: 'lock', text: 'Безопасная оплата' },
              { icon: 'verified_user', text: 'Проверенные курьеры' },
              { icon: 'bolt', text: 'Быстрый отклик' },
            ].map(item => (
              <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--green)' }}>{item.icon}</span>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-3)', fontWeight: 600 }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <button
          onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
          style={{
            position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)',
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-3)', animation: 'floatIcon 2.5s ease-in-out infinite',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 32 }}>keyboard_arrow_down</span>
        </button>
      </section>

      {/* ══ SECTION 2: HOW IT WORKS ══ */}
      <section id="how-it-works" style={{
        padding: 'clamp(60px, 8vw, 100px) clamp(1rem, 5vw, 3rem)',
        background: 'var(--surface)',
      }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <FadeSection>
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--brand-soft)', borderRadius: 9999, padding: '5px 14px', marginBottom: 14 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'var(--brand)' }}>route</span>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--brand)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Как это работает</span>
              </div>
              <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 900, letterSpacing: '-0.025em', color: 'var(--text-1)' }}>
                Три шага до результата
              </h2>
            </div>
          </FadeSection>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 24, position: 'relative',
          }}>
            {STEPS.map((step, i) => (
              <FadeSection key={step.n} delay={i * 100}>
                <div style={{
                  background: 'var(--surface-alt)', border: '1.5px solid var(--border)',
                  borderRadius: '1.5rem', padding: '2rem 1.5rem', height: '100%',
                  transition: 'transform 0.22s cubic-bezier(.22,1,.36,1), box-shadow 0.2s, border-color 0.2s',
                }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLDivElement
                    el.style.transform = 'translateY(-6px)'
                    el.style.boxShadow = 'var(--shadow-md)'
                    el.style.borderColor = step.color
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLDivElement
                    el.style.transform = 'translateY(0)'
                    el.style.boxShadow = 'none'
                    el.style.borderColor = 'var(--border)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 16 }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
                      background: `${step.color}18`, border: `2px solid ${step.color}30`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 24, color: step.color }}>{step.icon}</span>
                    </div>
                    <span style={{ fontSize: '2.8rem', fontWeight: 900, color: 'var(--border)', lineHeight: 1, letterSpacing: '-0.04em', marginTop: -4 }}>{step.n}</span>
                  </div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-1)', marginBottom: 8 }}>{step.label}</h3>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-3)', lineHeight: 1.6 }}>{step.desc}</p>
                </div>
              </FadeSection>
            ))}
          </div>
        </div>
      </section>

      {/* ══ SECTION 3: FEATURES ══ */}
      <section style={{ padding: 'clamp(60px, 8vw, 100px) clamp(1rem, 5vw, 3rem)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <FadeSection>
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--green-soft)', borderRadius: 9999, padding: '5px 14px', marginBottom: 14 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'var(--green)' }}>auto_awesome</span>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--green)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Преимущества</span>
              </div>
              <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 900, letterSpacing: '-0.025em', color: 'var(--text-1)' }}>
                Почему выбирают Deliv&apos;em
              </h2>
            </div>
          </FadeSection>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 20,
          }}>
            {FEATURES.map((f, i) => (
              <FadeSection key={f.label} delay={i * 80}>
                <div style={{
                  background: 'var(--surface)', border: '1.5px solid var(--border)',
                  borderRadius: '1.5rem', padding: '1.75rem 1.5rem', height: '100%',
                  transition: 'transform 0.22s cubic-bezier(.22,1,.36,1), box-shadow 0.2s, border-color 0.2s',
                }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLDivElement
                    el.style.transform = 'translateY(-4px)'
                    el.style.boxShadow = 'var(--shadow-md)'
                    el.style.borderColor = f.color
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLDivElement
                    el.style.transform = 'translateY(0)'
                    el.style.boxShadow = 'none'
                    el.style.borderColor = 'var(--border)'
                  }}
                >
                  <div style={{
                    width: 52, height: 52, borderRadius: '1rem', marginBottom: 16,
                    background: `${f.color}18`, border: `2px solid ${f.color}25`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span className="material-symbols-outlined fill-icon" style={{ fontSize: 26, color: f.color }}>{f.icon}</span>
                  </div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-1)', marginBottom: 8 }}>{f.label}</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-3)', lineHeight: 1.6 }}>{f.desc}</p>
                </div>
              </FadeSection>
            ))}
          </div>
        </div>
      </section>

      {/* ══ SECTION 4: STATS ══ */}
      <section style={{
        padding: 'clamp(60px, 8vw, 100px) clamp(1rem, 5vw, 3rem)',
        background: 'linear-gradient(135deg, #00236f 0%, #004d33 100%)',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Blobs */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', top: -60, right: -60, width: 300, height: 300, borderRadius: 9999, background: 'rgba(108,248,187,0.10)', filter: 'blur(60px)' }} />
          <div style={{ position: 'absolute', bottom: -40, left: -40, width: 250, height: 250, borderRadius: 9999, background: 'rgba(220,225,255,0.08)', filter: 'blur(50px)' }} />
        </div>

        <div style={{ maxWidth: 900, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <FadeSection>
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
              <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 900, letterSpacing: '-0.025em', color: '#ffffff' }}>
                Сервис в цифрах
              </h2>
              <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.65)', marginTop: 10 }}>
                Присоединяйся к тем, кто уже пользуется Deliv&apos;em
              </p>
            </div>
          </FadeSection>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 20,
          }}>
            {STAT_ITEMS.map((s, i) => (
              <FadeSection key={s.label} delay={i * 80}>
                <div style={{
                  background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)',
                  border: '1.5px solid rgba(255,255,255,0.14)', borderRadius: '1.5rem',
                  padding: '1.75rem 1.5rem', textAlign: 'center',
                  transition: 'background 0.22s, transform 0.22s cubic-bezier(.22,1,.36,1)',
                }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLDivElement
                    el.style.background = 'rgba(255,255,255,0.14)'
                    el.style.transform = 'translateY(-4px)'
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLDivElement
                    el.style.background = 'rgba(255,255,255,0.08)'
                    el.style.transform = 'translateY(0)'
                  }}
                >
                  <div style={{
                    width: 52, height: 52, borderRadius: '50%', margin: '0 auto 14px',
                    background: 'rgba(255,255,255,0.12)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span className="material-symbols-outlined fill-icon" style={{ fontSize: 26, color: '#fff' }}>{s.icon}</span>
                  </div>
                  <div style={{ fontSize: 'clamp(2rem, 5vw, 2.8rem)', fontWeight: 900, color: '#ffffff', lineHeight: 1, letterSpacing: '-0.03em' }}>
                    <AnimCounter target={s.value} suffix={s.suffix} />
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600, marginTop: 8 }}>{s.label}</div>
                </div>
              </FadeSection>
            ))}
          </div>
        </div>
      </section>

      {/* ══ SECTION 5: AUTH ══ */}
      <section style={{ padding: 'clamp(60px, 8vw, 100px) clamp(1rem, 5vw, 3rem)' }}>
        <div style={{ maxWidth: 520, margin: '0 auto' }} ref={authRef}>
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
              {/* Tabs */}
              <div className="flex gap-2 mb-6 rounded-full p-1" style={{ background: 'var(--surface-alt)' }}>
                <button onClick={() => { setTab('login'); setFormError('') }}
                  className="flex-1 py-2 rounded-full text-sm font-bold transition-all"
                  style={tab === 'login'
                    ? { background: 'var(--surface)', color: 'var(--brand-text)', boxShadow: '0 1px 4px rgba(0,0,0,.08)' }
                    : { color: 'var(--text-3)', fontWeight: 600 }}>
                  Войти
                </button>
                <button onClick={() => { setTab('register'); setFormError('') }}
                  className="flex-1 py-2 rounded-full text-sm font-bold transition-all"
                  style={tab === 'register'
                    ? { background: 'var(--surface)', color: 'var(--brand-text)', boxShadow: '0 1px 4px rgba(0,0,0,.08)' }
                    : { color: 'var(--text-3)', fontWeight: 600 }}>
                  Регистрация
                </button>
              </div>

              {/* Login form */}
              {tab === 'login' && (
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
                    <button onClick={() => { setTab('register'); setFormError('') }} className="font-bold" style={{ color: 'var(--green)' }}>
                      Зарегистрироваться
                    </button>
                  </p>
                </div>
              )}

              {/* Register form */}
              {tab === 'register' && (
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
                    <button onClick={() => { setTab('login'); setFormError('') }} className="font-bold" style={{ color: 'var(--green)' }}>
                      Войти
                    </button>
                  </p>
                </div>
              )}
            </div>
          </FadeSection>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{
        padding: '28px clamp(1rem, 5vw, 3rem)',
        borderTop: '1px solid var(--border)',
        background: 'var(--surface)',
        display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: 'linear-gradient(135deg,#00236f,#006c49)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span className="material-symbols-outlined text-white" style={{ fontSize: 15 }}>local_shipping</span>
          </div>
          <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--brand-text)' }}>Deliv&apos;em</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <a href="/contacts" style={{
            fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-3)',
            textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5,
            transition: 'color 0.18s',
          }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--brand-text)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-3)')}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>mail</span>
            Контакты
          </a>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-4)' }}>© 2025 Deliv&apos;em · Абхазия</p>
        </div>
      </footer>

    </div>
  )
}

function ErrorMsg({ msg }: { msg: string }) {
  return (
    <div style={{
      background: 'rgba(186,26,26,0.08)', border: '1.5px solid rgba(186,26,26,0.3)',
      borderRadius: '0.75rem', padding: '10px 14px',
      color: '#ba1a1a', fontSize: '0.85rem', fontWeight: 600,
      display: 'flex', alignItems: 'center', gap: 8,
    }}>
      <span className="material-symbols-outlined" style={{ fontSize: 18, flexShrink: 0 }}>error</span>
      {msg}
    </div>
  )
}
