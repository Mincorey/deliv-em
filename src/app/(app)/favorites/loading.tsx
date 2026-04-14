export default function FavoritesLoading() {
  return (
    <div className="p-6 max-w-4xl mx-auto animate-pulse">
      <div className="h-6 w-36 rounded bg-[var(--surface-variant)] mb-1" />
      <div className="h-3 w-48 rounded bg-[var(--surface-variant)] mb-5" />

      <div className="flex flex-col gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="courier-card" style={{ opacity: 1 }}>
            <div className="w-12 h-12 rounded-full bg-[var(--surface-variant)] flex-shrink-0" />
            <div className="flex-1 flex flex-col gap-2">
              <div className="h-4 w-32 rounded bg-[var(--surface-variant)]" />
              <div className="h-3 w-44 rounded bg-[var(--surface-variant)]" />
            </div>
            <div className="w-8 h-8 rounded-full bg-[var(--surface-variant)]" />
          </div>
        ))}
      </div>
    </div>
  )
}
