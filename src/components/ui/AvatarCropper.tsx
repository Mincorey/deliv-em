'use client'

import { useState, useRef } from 'react'

interface AvatarCropperProps {
  file: File
  onConfirm: (blob: Blob) => void
  onCancel: () => void
}

const CROP_D   = 260   // crop circle diameter px
const OUT_SIZE = 400   // output jpeg size px

function computeBase(natW: number, natH: number) {
  // Image fills the crop circle: shorter side = CROP_D
  const r = natW / natH
  return r >= 1
    ? { w: CROP_D * r, h: CROP_D }
    : { w: CROP_D,     h: CROP_D / r }
}

export function AvatarCropper({ file, onConfirm, onCancel }: AvatarCropperProps) {
  const [imgSrc,  setImgSrc]  = useState('')
  const [base,    setBase]    = useState({ w: 0, h: 0 })
  const [natural, setNatural] = useState({ w: 0, h: 0 })
  const [scale,   setScale]   = useState(1)
  const [offset,  setOffset]  = useState({ x: 0, y: 0 })
  const imgRef = useRef<HTMLImageElement>(null)
  const overlayMouseDown = useRef(false)

  // Load file once
  useState(() => {
    const reader = new FileReader()
    reader.onload = e => setImgSrc(e.target?.result as string)
    reader.readAsDataURL(file)
  })

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { naturalWidth: w, naturalHeight: h } = e.currentTarget
    setNatural({ w, h })
    setBase(computeBase(w, h))
  }

  // ── Mouse drag ──────────────────────────────────────────────
  function onMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    e.preventDefault()
    const startX = e.clientX, startY = e.clientY
    const ox = offset.x,      oy     = offset.y
    const onMove = (ev: MouseEvent) =>
      setOffset({ x: ox + ev.clientX - startX, y: oy + ev.clientY - startY })
    const onUp = () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  // ── Touch drag + pinch ──────────────────────────────────────
  const lastTouch = useRef<{ x: number; y: number; dist: number | null }>({ x: 0, y: 0, dist: null })
  function onTouchStart(e: React.TouchEvent) {
    e.preventDefault()
    if (e.touches.length === 1) {
      lastTouch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, dist: null }
    } else {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      lastTouch.current = {
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
        dist: Math.sqrt(dx * dx + dy * dy),
      }
    }
  }
  function onTouchMove(e: React.TouchEvent) {
    e.preventDefault()
    if (e.touches.length === 1) {
      const dx = e.touches[0].clientX - lastTouch.current.x
      const dy = e.touches[0].clientY - lastTouch.current.y
      setOffset(o => ({ x: o.x + dx, y: o.y + dy }))
      lastTouch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, dist: null }
    } else if (e.touches.length === 2 && lastTouch.current.dist) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      const newDist = Math.sqrt(dx * dx + dy * dy)
      const ratio = newDist / lastTouch.current.dist
      setScale(s => Math.min(4, Math.max(1, s * ratio)))
      lastTouch.current = {
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
        dist: newDist,
      }
    }
  }

  // ── Confirm: draw visible circle area to canvas ─────────────
  function handleConfirm() {
    if (!imgRef.current || !natural.w) return
    const rendW = base.w * scale
    const rendH = base.h * scale
    // In centered coords (origin = container center):
    //   image top-left = (offset.x - rendW/2, offset.y - rendH/2)
    //   crop  top-left = (-CROP_D/2, -CROP_D/2)
    const relX = (rendW - CROP_D) / 2 - offset.x
    const relY = (rendH - CROP_D) / 2 - offset.y
    const srcX = relX * natural.w / rendW
    const srcY = relY * natural.h / rendH
    const srcW = CROP_D * natural.w / rendW
    const srcH = CROP_D * natural.h / rendH

    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = OUT_SIZE
    const ctx = canvas.getContext('2d')!
    ctx.imageSmoothingQuality = 'high'
    ctx.beginPath()
    ctx.arc(OUT_SIZE / 2, OUT_SIZE / 2, OUT_SIZE / 2, 0, Math.PI * 2)
    ctx.clip()
    ctx.drawImage(imgRef.current, srcX, srcY, srcW, srcH, 0, 0, OUT_SIZE, OUT_SIZE)
    canvas.toBlob(blob => { if (blob) onConfirm(blob) }, 'image/jpeg', 0.88)
  }

  const rendW = base.w * scale
  const rendH = base.h * scale
  const containerH = CROP_D + 40

  return (
    <div
      style={overlayStyle}
      onMouseDown={e => { overlayMouseDown.current = e.target === e.currentTarget }}
      onMouseUp={e => { if (overlayMouseDown.current && e.target === e.currentTarget) onCancel() }}
    >
      <div style={modalStyle}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-1)' }}>Обрезать фото</h3>
          <button onClick={onCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 24 }}>close</span>
          </button>
        </div>

        {/* Viewport */}
        <div
          style={{
            position: 'relative', width: '100%', height: containerH,
            background: '#111', borderRadius: '0.75rem',
            overflow: 'hidden', cursor: 'grab', touchAction: 'none',
            userSelect: 'none',
          }}
          onMouseDown={onMouseDown}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
        >
          {imgSrc && (
            <img
              ref={imgRef}
              src={imgSrc}
              alt=""
              onLoad={onImageLoad}
              draggable={false}
              style={{
                position: 'absolute',
                left: '50%', top: '50%',
                width: rendW || undefined,
                height: rendH || undefined,
                transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
                maxWidth: 'none',
                pointerEvents: 'none',
              }}
            />
          )}
          {/* Dark mask with circle cutout */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'rgba(0,0,0,0.55)',
            WebkitMaskImage: `radial-gradient(circle ${CROP_D / 2}px at 50% 50%, transparent ${CROP_D / 2}px, black ${CROP_D / 2 + 1}px)`,
            maskImage:        `radial-gradient(circle ${CROP_D / 2}px at 50% 50%, transparent ${CROP_D / 2}px, black ${CROP_D / 2 + 1}px)`,
          }} />
          {/* Circle border */}
          <div style={{
            position: 'absolute', left: '50%', top: '50%', pointerEvents: 'none',
            width: CROP_D, height: CROP_D,
            transform: 'translate(-50%, -50%)',
            borderRadius: '50%',
            border: '2px dashed rgba(255,255,255,0.75)',
          }} />
        </div>

        {/* Zoom slider */}
        <div style={{ marginTop: 16 }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Масштаб
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--text-3)' }}>zoom_out</span>
            <input
              type="range" min={1} max={4} step={0.05} value={scale}
              onChange={e => setScale(Number(e.target.value))}
              style={{ flex: 1, accentColor: 'var(--brand)' }}
            />
            <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--text-3)' }}>zoom_in</span>
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button onClick={onCancel} className="btn-ghost"
            style={{ flex: 1, justifyContent: 'center', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
            Отмена
          </button>
          <button onClick={handleConfirm} className="btn-green"
            style={{ flex: 1, justifyContent: 'center', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
            disabled={!imgSrc}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>check</span>
            Применить
          </button>
        </div>
      </div>
    </div>
  )
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed', inset: 0, zIndex: 200,
  background: 'rgba(0,0,0,0.6)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  padding: '1rem',
  backdropFilter: 'blur(4px)',
}

const modalStyle: React.CSSProperties = {
  background: 'var(--surface)',
  borderRadius: '1.5rem',
  padding: '1.5rem',
  width: '100%',
  maxWidth: 480,
  boxShadow: '0 24px 60px rgba(0,0,0,0.3)',
  border: '1.5px solid var(--border)',
}
