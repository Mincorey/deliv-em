'use client'

import { useState, useEffect, useRef } from 'react'

export function formatPhone(input: string): string {
  const digits = input.replace(/\D/g, '').replace(/^[78]/, '').slice(0, 10)
  if (digits.length === 0) return ''
  let result = '+7 (' + digits.slice(0, Math.min(3, digits.length))
  if (digits.length > 3) result += ') ' + digits.slice(3, Math.min(6, digits.length))
  if (digits.length > 6) result += '-' + digits.slice(6, Math.min(8, digits.length))
  if (digits.length > 8) result += '-' + digits.slice(8, 10)
  return result
}

export function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); obs.disconnect() } },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, inView }
}

export function AnimCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [val, setVal] = useState(0)
  const { ref, inView } = useInView(0.3)
  useEffect(() => {
    if (!inView || target === 0) { if (target === 0) setVal(0); return }
    const duration = 1400
    const start = performance.now()
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1)
      const ease = 1 - Math.pow(1 - p, 3)
      setVal(Math.round(ease * target))
      if (p < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [inView, target])
  return <span ref={ref}>{val}{suffix}</span>
}

export function FadeSection({ children, delay = 0, className = '' }: {
  children: React.ReactNode; delay?: number; className?: string
}) {
  const { ref, inView } = useInView()
  return (
    <div ref={ref} className={className} style={{
      opacity: inView ? 1 : 0,
      transform: inView ? 'translateY(0)' : 'translateY(32px)',
      transition: `opacity 0.7s cubic-bezier(0.22,1,0.36,1) ${delay}ms, transform 0.7s cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
    }}>
      {children}
    </div>
  )
}

export function ErrorMsg({ msg }: { msg: string }) {
  return (
    <div style={{
      background: 'rgba(186,26,26,0.08)', border: '1.5px solid rgba(186,26,26,0.3)',
      borderRadius: '0.75rem', padding: '10px 14px',
      color: '#ba1a1a', fontSize: '0.85rem', fontWeight: 600,
      display: 'flex', alignItems: 'center', gap: 8,
    }}>
      <span className="material-symbols-outlined" style={{ fontSize: 18, flexShrink: 0 }}>error</span>
      {msg}
    </div>
  )
}
