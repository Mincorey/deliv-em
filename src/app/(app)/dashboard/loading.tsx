export default function DashboardLoading() {
  return (
    <div className="p-6 max-w-4xl mx-auto animate-pulse">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-full bg-[var(--surface-variant)]" />
        <div>
          <div className="h-5 w-32 rounded bg-[var(--surface-variant)] mb-1" />
          <div className="h-3 w-20 rounded bg-[var(--surface-variant)]" />
        </div>
      </div>

      {/* Balance card */}
      <div className="glass rounded-2xl p-5 mb-6 h-28" />

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="glass rounded-2xl p-4 h-20" />
        ))}
      </div>

      {/* Section title */}
      <div className="h-5 w-40 rounded bg-[var(--surface-variant)] mb-4" />

      {/* Task cards */}
      <div className="flex flex-col gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="glass rounded-2xl p-4 h-24" />
        ))}
      </div>
    </div>
  )
}
