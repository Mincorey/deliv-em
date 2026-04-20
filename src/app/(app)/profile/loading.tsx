import { Skeleton } from '@/components/ui/Skeleton'

export default function ProfileLoading() {
  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Avatar + name */}
      <div className="flex flex-col items-center mb-8">
        <Skeleton circle style={{ width: 80, height: 80, marginBottom: 12 }} />
        <Skeleton style={{ height: 18, width: 144, marginBottom: 8 }} />
        <Skeleton style={{ height: 12, width: 96 }} />
      </div>

      {/* Form card */}
      <div className="rounded-2xl p-6 flex flex-col gap-5" style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
        {[...Array(5)].map((_, i) => (
          <div key={i}>
            <Skeleton style={{ height: 12, width: 80, marginBottom: 8 }} />
            <Skeleton style={{ height: 40, width: '100%', borderRadius: '1rem' }} />
          </div>
        ))}
        <Skeleton style={{ height: 44, width: '100%', borderRadius: 9999, marginTop: 8 }} />
      </div>
    </div>
  )
}
