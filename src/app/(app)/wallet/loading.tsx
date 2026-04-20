import { Skeleton } from '@/components/ui/Skeleton'

export default function WalletLoading() {
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Skeleton style={{ height: 22, width: 112, marginBottom: 8 }} />
      <Skeleton style={{ height: 12, width: 176, marginBottom: 24 }} />

      {/* Balance card */}
      <div className="rounded-2xl p-6 mb-4" style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
        <Skeleton style={{ height: 12, width: 88, marginBottom: 12 }} />
        <Skeleton style={{ height: 44, width: 180, marginBottom: 10 }} />
        <Skeleton style={{ height: 11, width: 130 }} />
      </div>

      {/* Quick amounts */}
      <div className="flex gap-2 mb-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} style={{ height: 36, flex: 1, borderRadius: 9999 }} />
        ))}
      </div>

      {/* Custom input */}
      <Skeleton style={{ height: 44, width: '100%', borderRadius: '1rem', marginBottom: 24 }} />

      {/* History */}
      <Skeleton style={{ height: 16, width: 128, marginBottom: 12 }} />
      <div className="flex flex-col gap-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="rounded-2xl p-4 flex items-center justify-between gap-3" style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
            <div className="flex flex-col gap-2">
              <Skeleton style={{ height: 14, width: 160 }} />
              <Skeleton style={{ height: 11, width: 96 }} />
            </div>
            <Skeleton style={{ height: 18, width: 64 }} />
          </div>
        ))}
      </div>
    </div>
  )
}
