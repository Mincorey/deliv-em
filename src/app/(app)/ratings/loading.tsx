export default function Loading() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div style={{ height: 28, width: 180, borderRadius: 8, background: 'var(--surface-alt)', marginBottom: 8 }} />
      <div style={{ height: 16, width: 260, borderRadius: 6, background: 'var(--surface-alt)', marginBottom: 24 }} />
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {[0, 1].map((i) => (
          <div key={i} style={{ height: 40, width: 120, borderRadius: 12, background: 'var(--surface-alt)' }} />
        ))}
      </div>
      <div className="flex flex-col gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} style={{
            height: 72, borderRadius: 16,
            background: 'var(--surface-alt)',
            animation: `pulse 1.4s ${i * 0.07}s ease-in-out infinite`,
          }} />
        ))}
      </div>
    </div>
  )
}
