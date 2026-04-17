'use client'

import { createContext, useContext, useState, useCallback } from 'react'

type ToastType = 'default' | 'error' | 'success'

interface ToastCtx {
  show: (msg: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastCtx>({ show: () => {} })

const TOAST_CONFIG: Record<ToastType, { bg: string; border: string; icon: string; iconColor: string }> = {
  success: {
    bg        : 'var(--surface)',
    border    : 'rgba(45,212,160,0.35)',
    icon      : 'check_circle',
    iconColor : '#2dd4a0',
  },
  error: {
    bg        : 'var(--surface)',
    border    : 'rgba(186,26,26,0.35)',
    icon      : 'error',
    iconColor : '#f87171',
  },
  default: {
    bg        : 'var(--surface)',
    border    : 'var(--border)',
    icon      : 'info',
    iconColor : 'var(--brand)',
  },
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<{ id: number; msg: string; type: ToastType }[]>([])

  const show = useCallback((msg: string, type: ToastType = 'default') => {
    const id = Date.now()
    setToasts((t) => [...t, { id, msg, type }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500)
  }, [])

  const dismiss = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ show }}>
      {children}

      {/* Top-right stack, below topbar */}
      <div
        style={{
          position: 'fixed',
          top: 80,
          right: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          zIndex: 9999,
          pointerEvents: 'none',
          width: 320,
        }}
      >
        {toasts.map((t) => {
          const cfg = TOAST_CONFIG[t.type]
          return (
            <div
              key={t.id}
              style={{
                background    : cfg.bg,
                border        : `1.5px solid ${cfg.border}`,
                borderRadius  : '1rem',
                boxShadow     : 'var(--shadow-md)',
                padding       : '12px 14px',
                display       : 'flex',
                alignItems    : 'flex-start',
                gap           : 10,
                pointerEvents : 'all',
                animation     : 'slideInRight 0.3s cubic-bezier(0.22,1,0.36,1) both',
              }}
            >
              {/* Icon */}
              <span
                className="material-symbols-outlined fill-icon flex-shrink-0"
                style={{ fontSize: 20, color: cfg.iconColor, marginTop: 1 }}
              >
                {cfg.icon}
              </span>

              {/* Message */}
              <p style={{ flex: 1, fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-1)', lineHeight: 1.45 }}>
                {t.msg}
              </p>

              {/* Dismiss */}
              <button
                onClick={() => dismiss(t.id)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-3)', display: 'flex', flexShrink: 0,
                  padding: 0, marginTop: 1,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
