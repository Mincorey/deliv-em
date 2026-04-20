import { Skeleton } from '@/components/ui/Skeleton'

export default function CreateTaskLoading() {
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Skeleton style={{ height: 22, width: 160, marginBottom: 8 }} />
      <Skeleton style={{ height: 12, width: 208, marginBottom: 24 }} />

      <div className="rounded-2xl p-6 flex flex-col gap-5" style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
        {[...Array(6)].map((_, i) => (
          <div key={i}>
            <Skeleton style={{ height: 12, width: 96, marginBottom: 8 }} />
            <Skeleton style={{ height: 40, width: '100%', borderRadius: '1rem' }} />
          </div>
        ))}
        <Skeleton style={{ height: 44, width: '100%', borderRadius: 9999, marginTop: 8 }} />
      </div>
    </div>
  )
}
