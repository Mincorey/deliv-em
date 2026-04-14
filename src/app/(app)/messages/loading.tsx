export default function MessagesLoading() {
  return (
    <div className="p-6 max-w-2xl mx-auto animate-pulse">
      <div className="h-6 w-32 rounded bg-[var(--surface-variant)] mb-1" />
      <div className="h-3 w-48 rounded bg-[var(--surface-variant)] mb-5" />

      <div className="flex flex-col gap-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="glass rounded-2xl p-4 flex items-center gap-3 h-20">
            <div className="w-10 h-10 rounded-full bg-[var(--surface-variant)] flex-shrink-0" />
            <div className="flex-1 flex flex-col gap-2">
              <div className="h-4 w-36 rounded bg-[var(--surface-variant)]" />
              <div className="h-3 w-52 rounded bg-[var(--surface-variant)]" />
            </div>
            <div className="h-3 w-10 rounded bg-[var(--surface-variant)]" />
          </div>
        ))}
      </div>
    </div>
  )
}
