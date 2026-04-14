export default function TaskDetailLoading() {
  return (
    <div className="p-6 max-w-2xl mx-auto animate-pulse">
      {/* Back link */}
      <div className="h-4 w-28 rounded bg-[var(--surface-variant)] mb-5" />

      {/* Title + badge */}
      <div className="flex items-center gap-3 mb-2">
        <div className="h-6 w-48 rounded bg-[var(--surface-variant)]" />
        <div className="h-5 w-20 rounded-full bg-[var(--surface-variant)]" />
      </div>

      {/* Meta row */}
      <div className="flex gap-4 mb-6">
        <div className="h-4 w-24 rounded bg-[var(--surface-variant)]" />
        <div className="h-4 w-20 rounded bg-[var(--surface-variant)]" />
      </div>

      {/* Main card */}
      <div className="glass rounded-2xl p-5 mb-4 h-48" />

      {/* Courier / customer card */}
      <div className="glass rounded-2xl p-5 mb-4 h-24" />

      {/* Action button */}
      <div className="h-11 w-full rounded-full bg-[var(--surface-variant)]" />
    </div>
  )
}
