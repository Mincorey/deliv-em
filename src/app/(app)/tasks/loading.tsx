export default function TasksLoading() {
  return (
    <div className="p-6 max-w-4xl mx-auto animate-pulse">
      <div className="flex items-center justify-between mb-1">
        <div className="h-6 w-44 rounded bg-[var(--surface-variant)]" />
        <div className="h-9 w-24 rounded-full bg-[var(--surface-variant)]" />
      </div>
      <div className="h-3 w-56 rounded bg-[var(--surface-variant)] mb-5" />

      {/* Filter bar skeleton */}
      <div className="glass rounded-2xl p-4 mb-5 flex gap-3">
        <div className="h-9 w-28 rounded-full bg-[var(--surface-variant)]" />
        <div className="h-9 w-24 rounded-full bg-[var(--surface-variant)]" />
      </div>

      <div className="flex flex-col gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="glass rounded-2xl p-4 h-28" />
        ))}
      </div>
    </div>
  )
}
