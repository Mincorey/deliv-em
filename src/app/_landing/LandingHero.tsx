'use client'

interface Props {
  scrollToAuth: (tab?: 'login' | 'register') => void
}

export function LandingHero({ scrollToAuth }: Props) {
  return (
    <section style={{
      minHeight: '100svh',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden',
      padding: '80px clamp(1rem, 5vw, 3rem) 60px',
    }}>
      {/* Blobs */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: -160, right: -160, width: 600, height: 600, borderRadius: 9999, background: 'linear-gradient(135deg,#dce1ff55,#6cf8bb33)', filter: 'blur(80px)' }} />
        <div style={{ position: 'absolute', bottom: -100, left: -100, width: 500, height: 500, borderRadius: 9999, background: 'linear-gradient(135deg,#6cf8bb22,#dce1ff44)', filter: 'blur(70px)' }} />
        <div style={{ position: 'absolute', top: '40%', left: '30%', width: 300, height: 300, borderRadius: 9999, background: 'rgba(0,108,73,0.07)', filter: 'blur(60px)' }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 680 }}>
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

        <p style={{
          fontSize: 'clamp(1rem, 2.5vw, 1.2rem)', color: 'var(--text-2)', lineHeight: 1.6,
          marginBottom: 36, maxWidth: 520, margin: '0 auto 36px',
          animation: 'fadeInUp 0.7s cubic-bezier(0.22,1,0.36,1) 0.2s both',
        }}>
          Найди курьера за минуты или зарабатывай, выполняя задания — доставка, покупки, мелкие поручения по всей Абхазии.
        </p>

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
  )
}
