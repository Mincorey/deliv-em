'use client'

import { FadeSection } from './landing-utils'

const FEATURES = [
  { icon: 'shield', color: 'var(--brand)', label: 'Безопасность', desc: 'Средства блокируются на счёте до подтверждения выполнения. Никакого риска' },
  { icon: 'star', color: '#f59e0b', label: 'Рейтинги', desc: 'Только проверенные курьеры с реальными отзывами от заказчиков' },
  { icon: 'forum', color: 'var(--green)', label: 'Встроенный чат', desc: 'Обсуждай детали напрямую с курьером — без сторонних мессенджеров' },
  { icon: 'location_on', color: '#ec4899', label: '6+ городов', desc: 'Работаем по всей Абхазии: Сухум, Гагра, Гудаута, Очамчыра и другие' },
]

export function LandingFeatures() {
  return (
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

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
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
  )
}
