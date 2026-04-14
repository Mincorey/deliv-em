export default function WalletLoading() {
  return (
    <div className="p-6 max-w-2xl mx-auto animate-pulse">
      <div className="h-6 w-28 rounded bg-[var(--surface-variant)] mb-1" />
      <div className="h-3 w-44 rounded bg-[var(--surface-variant)] mb-6" />

      {/* Balance card */}
      <div className="glass rounded-2xl p-6 mb-4 h-36" />

      {/* Quick amounts */}
      <div className="flex gap-2 mb-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-9 flex-1 rounded-full bg-[var(--surface-variant)]" />
        ))}
      </div>

      {/* Custom input */}
      <div className="h-11 rounded-2xl bg-[var(--surface-variant)] mb-6" />

      {/* History */}
      <div className="h-5 w-32 rounded bg-[var(--surface-variant)] mb-3" />
      <div className="flex flex-col gap-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="glass rounded-2xl p-4 h-16" />
        ))}
      </div>
    </div>
  )
}
