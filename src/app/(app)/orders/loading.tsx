export default function OrdersLoading() {
  return (
    <div className="p-6 max-w-4xl mx-auto animate-pulse">
      <div className="h-6 w-40 rounded bg-[var(--surface-variant)] mb-1" />
      <div className="h-3 w-56 rounded bg-[var(--surface-variant)] mb-5" />

      {/* Tab bar */}
      <div className="flex gap-2 mb-5">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-8 w-24 rounded-full bg-[var(--surface-variant)]" />
        ))}
      </div>

      <div className="flex flex-col gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="glass rounded-2xl p-4 h-28" />
        ))}
      </div>
    </div>
  )
}
