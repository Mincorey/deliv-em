import { Skeleton } from '@/components/ui/Skeleton'

export default function MessagesLoading() {
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Skeleton style={{ height: 22, width: 128, marginBottom: 8 }} />
      <Skeleton style={{ height: 12, width: 192, marginBottom: 20 }} />

      <div className="flex flex-col gap-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="rounded-2xl p-4 flex items-center gap-3" style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
            <Skeleton circle style={{ width: 40, height: 40, flexShrink: 0 }} />
            <div className="flex-1 flex flex-col gap-2 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <Skeleton style={{ height: 14, width: 144 }} />
                <Skeleton style={{ height: 11, width: 40 }} />
              </div>
              <Skeleton style={{ height: 12, width: 210 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
