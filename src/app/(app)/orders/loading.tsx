import { Skeleton } from '@/components/ui/Skeleton'

export default function OrdersLoading() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Skeleton style={{ height: 22, width: 160, marginBottom: 8 }} />
      <Skeleton style={{ height: 12, width: 220, marginBottom: 20 }} />

      {/* Tab bar */}
      <div className="flex gap-2 mb-5">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} style={{ height: 32, width: 96, borderRadius: 9999 }} />
        ))}
      </div>

      <div className="flex flex-col gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-2xl p-4" style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
            <div className="flex items-start justify-between gap-3 mb-3">
              <Skeleton style={{ height: 16, width: 200 }} />
              <Skeleton style={{ height: 22, width: 80, borderRadius: 9999 }} />
            </div>
            <div className="flex gap-3 mb-2">
              <Skeleton style={{ height: 12, width: 112 }} />
              <Skeleton style={{ height: 12, width: 88 }} />
            </div>
            <Skeleton style={{ height: 12, width: 160 }} />
          </div>
        ))}
      </div>
    </div>
  )
}
