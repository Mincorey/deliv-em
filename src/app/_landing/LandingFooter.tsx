'use client'

export function LandingFooter() {
  return (
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
  )
}
