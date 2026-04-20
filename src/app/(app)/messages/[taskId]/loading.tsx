import { Skeleton } from '@/components/ui/Skeleton'

export default function ChatLoading() {
  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Chat header */}
      <div className="p-4 flex items-center gap-3" style={{ borderBottom: '1px solid var(--border)' }}>
        <Skeleton style={{ height: 14, width: 64 }} />
        <Skeleton circle style={{ width: 36, height: 36 }} />
        <div className="flex flex-col gap-1.5">
          <Skeleton style={{ height: 14, width: 120 }} />
          <Skeleton style={{ height: 10, width: 72 }} />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 flex flex-col gap-3 overflow-hidden">
        <div className="flex justify-start">
          <Skeleton style={{ height: 40, width: 210, borderRadius: '1rem' }} />
        </div>
        <div className="flex justify-end">
          <Skeleton style={{ height: 40, width: 160, borderRadius: '1rem' }} />
        </div>
        <div className="flex justify-start">
          <Skeleton style={{ height: 56, width: 256, borderRadius: '1rem' }} />
        </div>
        <div className="flex justify-end">
          <Skeleton style={{ height: 40, width: 144, borderRadius: '1rem' }} />
        </div>
        <div className="flex justify-start">
          <Skeleton style={{ height: 40, width: 192, borderRadius: '1rem' }} />
        </div>
      </div>

      {/* Input */}
      <div className="p-4 flex gap-2" style={{ borderTop: '1px solid var(--border)' }}>
        <Skeleton style={{ flex: 1, height: 44, borderRadius: 9999 }} />
        <Skeleton circle style={{ width: 44, height: 44 }} />
      </div>
    </div>
  )
}
