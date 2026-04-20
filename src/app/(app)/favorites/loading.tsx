import { Skeleton } from '@/components/ui/Skeleton'

export default function FavoritesLoading() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Skeleton style={{ height: 22, width: 144, marginBottom: 8 }} />
      <Skeleton style={{ height: 12, width: 192, marginBottom: 20 }} />

      <div className="flex flex-col gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-2xl p-4 flex items-center gap-3" style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
            <Skeleton circle style={{ width: 48, height: 48, flexShrink: 0 }} />
            <div className="flex-1 flex flex-col gap-2">
              <Skeleton style={{ height: 15, width: 128 }} />
              <div className="flex gap-2">
                <Skeleton style={{ height: 11, width: 72 }} />
                <Skeleton style={{ height: 11, width: 56 }} />
              </div>
            </div>
            <Skeleton circle style={{ width: 32, height: 32 }} />
          </div>
        ))}
      </div>
    </div>
  )
}
