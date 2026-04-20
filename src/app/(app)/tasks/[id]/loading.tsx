import { Skeleton } from '@/components/ui/Skeleton'

export default function TaskDetailLoading() {
  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Back link */}
      <Skeleton style={{ height: 14, width: 112, marginBottom: 20 }} />

      {/* Title + badge */}
      <div className="flex items-center gap-3 mb-2">
        <Skeleton style={{ height: 22, width: 240 }} />
        <Skeleton style={{ height: 22, width: 80, borderRadius: 9999 }} />
      </div>

      {/* Meta row */}
      <div className="flex gap-4 mb-6">
        <Skeleton style={{ height: 13, width: 96 }} />
        <Skeleton style={{ height: 13, width: 80 }} />
      </div>

      {/* Main card */}
      <div className="rounded-2xl p-5 mb-4" style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
        <Skeleton style={{ height: 12, width: 64, marginBottom: 12 }} />
        <Skeleton style={{ height: 14, width: '90%', marginBottom: 8 }} />
        <Skeleton style={{ height: 14, width: '70%', marginBottom: 20 }} />
        <Skeleton style={{ height: 12, width: 80, marginBottom: 8 }} />
        <Skeleton style={{ height: 14, width: '85%', marginBottom: 6 }} />
        <Skeleton style={{ height: 14, width: '60%', marginBottom: 20 }} />
        <div className="flex gap-4">
          <Skeleton style={{ height: 13, width: 100 }} />
          <Skeleton style={{ height: 13, width: 88 }} />
        </div>
      </div>

      {/* Courier / customer card */}
      <div className="rounded-2xl p-4 mb-4 flex items-center gap-3" style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
        <Skeleton circle style={{ width: 40, height: 40 }} />
        <div className="flex flex-col gap-2">
          <Skeleton style={{ height: 14, width: 120 }} />
          <Skeleton style={{ height: 11, width: 80 }} />
        </div>
      </div>

      {/* Action button */}
      <Skeleton style={{ height: 44, width: '100%', borderRadius: 9999 }} />
    </div>
  )
}
