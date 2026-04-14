export default function ChatLoading() {
  return (
    <div className="flex flex-col h-[calc(100vh-64px)] animate-pulse">
      {/* Chat header */}
      <div className="border-b p-4 flex items-center gap-3" style={{ borderColor: 'var(--outline-variant)' }}>
        <div className="h-4 w-20 rounded bg-[var(--surface-variant)]" />
        <div className="w-9 h-9 rounded-full bg-[var(--surface-variant)]" />
        <div className="h-4 w-28 rounded bg-[var(--surface-variant)]" />
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 flex flex-col gap-3 overflow-hidden">
        <div className="flex justify-start">
          <div className="h-10 w-52 rounded-2xl bg-[var(--surface-variant)]" />
        </div>
        <div className="flex justify-end">
          <div className="h-10 w-40 rounded-2xl bg-[var(--surface-variant)]" />
        </div>
        <div className="flex justify-start">
          <div className="h-14 w-64 rounded-2xl bg-[var(--surface-variant)]" />
        </div>
        <div className="flex justify-end">
          <div className="h-10 w-36 rounded-2xl bg-[var(--surface-variant)]" />
        </div>
      </div>

      {/* Input */}
      <div className="border-t p-4 flex gap-2" style={{ borderColor: 'var(--outline-variant)' }}>
        <div className="flex-1 h-11 rounded-full bg-[var(--surface-variant)]" />
        <div className="w-11 h-11 rounded-full bg-[var(--surface-variant)]" />
      </div>
    </div>
  )
}
