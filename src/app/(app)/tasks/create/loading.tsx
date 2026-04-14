export default function CreateTaskLoading() {
  return (
    <div className="p-6 max-w-2xl mx-auto animate-pulse">
      <div className="h-6 w-40 rounded bg-[var(--surface-variant)] mb-1" />
      <div className="h-3 w-52 rounded bg-[var(--surface-variant)] mb-6" />

      <div className="glass rounded-2xl p-6 flex flex-col gap-5">
        {[...Array(6)].map((_, i) => (
          <div key={i}>
            <div className="h-3 w-24 rounded bg-[var(--surface-variant)] mb-2" />
            <div className="h-10 rounded-2xl bg-[var(--surface-variant)]" />
          </div>
        ))}
        <div className="h-11 rounded-full bg-[var(--surface-variant)] mt-2" />
      </div>
    </div>
  )
}
