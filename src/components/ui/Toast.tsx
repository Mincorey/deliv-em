'use client'

import { createContext, useContext, useState, useCallback } from 'react'

interface ToastCtx {
  show: (msg: string, type?: 'default' | 'error' | 'success') => void
}

const ToastContext = createContext<ToastCtx>({ show: () => {} })

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<
    { id: number; msg: string; type: string }[]
  >([])

  const show = useCallback(
    (msg: string, type: 'default' | 'error' | 'success' = 'default') => {
      const id = Date.now()
      setToasts((t) => [...t, { id, msg, type }])
      setTimeout(() => {
        setToasts((t) => t.filter((x) => x.id !== id))
      }, 3000)
    },
    []
  )

  const bg: Record<string, string> = {
    default: '#191c1e',
    error: '#ba1a1a',
    success: '#006c49',
  }

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex flex-col gap-2 z-[9999] pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            style={{ background: bg[t.type] }}
            className="text-white px-6 py-3 rounded-full text-sm font-semibold shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-300"
          >
            {t.msg}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
