'use client'

import { AnimCounter, FadeSection } from './landing-utils'

interface Props {
  stats: { customers: number; couriers: number; completedTasks: number; cities: number }
}

export function LandingStats({ stats }: Props) {
  const items = [
    { icon: 'person', color: 'var(--brand)', label: 'Заказчиков', value: stats.customers, suffix: '+' },
    { icon: 'delivery_dining', color: 'var(--green)', label: 'Курьеров', value: stats.couriers, suffix: '+' },
    { icon: 'check_circle', color: '#f59e0b', label: 'Выполнено заданий', value: stats.completedTasks, suffix: '+' },
    { icon: 'location_city', color: '#ec4899', label: 'Городов', value: stats.cities, suffix: '' },
  ]

  return (
    <section style={{
      padding: 'clamp(60px, 8vw, 100px) clamp(1rem, 5vw, 3rem)',
      background: 'linear-gradient(135deg, #00236f 0%, #004d33 100%)',
      position: 'relative', overflow: 'hidden',
    }}>
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

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 20 }}>
          {items.map((s, i) => (
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
  )
}
