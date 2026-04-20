'use client'

import { FadeSection } from './landing-utils'

const STEPS = [
  { n: '01', icon: 'add_circle', color: 'var(--brand)', label: 'Создай задание', desc: 'Опиши что нужно сделать, укажи маршрут, дедлайн и цену — это займёт меньше минуты' },
  { n: '02', icon: 'handshake', color: 'var(--green)', label: 'Курьер берётся', desc: 'Проверенные курьеры рядом с тобой откликнутся на задание. Выбери подходящего' },
  { n: '03', icon: 'verified', color: '#f59e0b', label: 'Готово!', desc: 'Курьер выполнил поручение — договоритесь об оплате любым удобным способом и оставьте отзыв' },
]

export function LandingSteps() {
  return (
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

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24, position: 'relative' }}>
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
  )
}
