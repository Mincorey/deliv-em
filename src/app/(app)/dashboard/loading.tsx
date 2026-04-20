import { Skeleton } from '@/components/ui/Skeleton'

export default function DashboardLoading() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Skeleton circle style={{ width: 48, height: 48, flexShrink: 0 }} />
        <div className="flex flex-col gap-2">
          <Skeleton style={{ height: 18, width: 140 }} />
          <Skeleton style={{ height: 12, width: 88 }} />
        </div>
      </div>

      {/* Balance card */}
      <div className="rounded-2xl p-5 mb-6" style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
        <Skeleton style={{ height: 12, width: 80, marginBottom: 10 }} />
        <Skeleton style={{ height: 36, width: 160, marginBottom: 8 }} />
        <Skeleton style={{ height: 10, width: 120 }} />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-2xl p-4" style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
            <Skeleton style={{ height: 28, width: 48, marginBottom: 6 }} />
            <Skeleton style={{ height: 11, width: 64 }} />
          </div>
        ))}
      </div>

      {/* Section title */}
      <Skeleton style={{ height: 16, width: 160, marginBottom: 16 }} />

      {/* Task cards */}
      <div className="flex flex-col gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-2xl p-4" style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
            <div className="flex items-start justify-between gap-3 mb-3">
              <Skeleton style={{ height: 16, width: 200 }} />
              <Skeleton style={{ height: 22, width: 72, borderRadius: 9999 }} />
            </div>
            <div className="flex gap-3">
              <Skeleton style={{ height: 12, width: 96 }} />
              <Skeleton style={{ height: 12, width: 80 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
