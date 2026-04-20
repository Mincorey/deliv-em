'use client'

import { ThemeToggle } from '@/components/layout/ThemeToggle'

interface Props {
  scrollToAuth: (tab?: 'login' | 'register') => void
}

export function LandingHeader({ scrollToAuth }: Props) {
  return (
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
  )
}
