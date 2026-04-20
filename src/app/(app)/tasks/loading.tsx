import { Skeleton } from '@/components/ui/Skeleton'

export default function TasksLoading() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-2">
        <Skeleton style={{ height: 22, width: 176 }} />
        <Skeleton style={{ height: 34, width: 96, borderRadius: 9999 }} />
      </div>
      <Skeleton style={{ height: 12, width: 220, marginBottom: 20 }} />

      {/* Filter bar */}
      <div className="rounded-2xl p-4 mb-5 flex gap-3" style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
        <Skeleton style={{ height: 34, width: 110, borderRadius: 9999 }} />
        <Skeleton style={{ height: 34, width: 96, borderRadius: 9999 }} />
      </div>

      <div className="flex flex-col gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-2xl p-4" style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
            <div className="flex items-start justify-between gap-3 mb-3">
              <Skeleton style={{ height: 16, width: 220 }} />
              <Skeleton style={{ height: 22, width: 68, borderRadius: 9999 }} />
            </div>
            <div className="flex gap-3 mb-2">
              <Skeleton style={{ height: 12, width: 100 }} />
              <Skeleton style={{ height: 12, width: 80 }} />
            </div>
            <Skeleton style={{ height: 12, width: 140 }} />
          </div>
        ))}
      </div>
    </div>
  )
}
