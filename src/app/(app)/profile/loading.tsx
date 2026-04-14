export default function ProfileLoading() {
  return (
    <div className="p-6 max-w-2xl mx-auto animate-pulse">
      {/* Avatar + name */}
      <div className="flex flex-col items-center mb-8">
        <div className="w-20 h-20 rounded-full bg-[var(--surface-variant)] mb-3" />
        <div className="h-5 w-36 rounded bg-[var(--surface-variant)] mb-1" />
        <div className="h-3 w-24 rounded bg-[var(--surface-variant)]" />
      </div>

      {/* Form card */}
      <div className="glass rounded-2xl p-6 flex flex-col gap-5">
        {[...Array(5)].map((_, i) => (
          <div key={i}>
            <div className="h-3 w-20 rounded bg-[var(--surface-variant)] mb-2" />
            <div className="h-10 rounded-2xl bg-[var(--surface-variant)]" />
          </div>
        ))}
        <div className="h-11 rounded-full bg-[var(--surface-variant)] mt-2" />
      </div>
    </div>
  )
}
