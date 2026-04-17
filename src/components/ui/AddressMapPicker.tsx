'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

/* ── Config ── */
const YMAPS_KEY       = process.env.NEXT_PUBLIC_YANDEX_MAPS_KEY
const ABKHAZIA_CENTER : [number, number]                        = [43.0013, 41.0234]
const ABKHAZIA_ZOOM   = 10
// Approximate bounding box for suggest results
const ABKHAZIA_BOUNDS : [[number, number], [number, number]]    = [[42.3, 39.9], [43.7, 42.3]]

interface Suggest { value: string }

export interface AddressMapPickerProps {
  fromAddress : string
  toAddress   : string
  onFromChange: (v: string) => void
  onToChange  : (v: string) => void
}

/* ── Yandex Maps global declaration ── */
declare global {
  interface Window { ymaps: any }
}

/* ── Load script once across mounts ── */
let _ymapsReady: Promise<void> | null = null
function loadYmaps(): Promise<void> {
  if (_ymapsReady) return _ymapsReady
  _ymapsReady = new Promise<void>((resolve) => {
    if (typeof window === 'undefined') return
    if (window.ymaps?.ready) { window.ymaps.ready(resolve); return }
    const s   = document.createElement('script')
    s.src     = `https://api-maps.yandex.ru/2.1/?apikey=${YMAPS_KEY}&lang=ru_RU`
    s.async   = true
    s.onerror = () => { _ymapsReady = null } // allow retry on error
    s.onload  = () => window.ymaps.ready(resolve)
    document.head.appendChild(s)
  })
  return _ymapsReady
}

/* ══════════════════════════════════════════
   Main component
══════════════════════════════════════════ */
export function AddressMapPicker({
  fromAddress, toAddress, onFromChange, onToChange,
}: AddressMapPickerProps) {
  const mapDivRef   = useRef<HTMLDivElement>(null)
  const mapRef      = useRef<any>(null)
  const fromMarkRef = useRef<any>(null)
  const toMarkRef   = useRef<any>(null)
  const routeRef    = useRef<any>(null)
  const activeRef   = useRef<'from' | 'to'>('from')

  const [activeField, setActiveField] = useState<'from' | 'to'>('from')
  const [fromVal,  setFromVal]        = useState(fromAddress)
  const [toVal,    setToVal]          = useState(toAddress)
  const [fromSugg, setFromSugg]       = useState<Suggest[]>([])
  const [toSugg,   setToSugg]         = useState<Suggest[]>([])
  const [mapReady, setMapReady]       = useState(false)
  const [loadError, setLoadError]     = useState(false)

  // Keep activeRef in sync with state (avoids stale closure in map click)
  useEffect(() => { activeRef.current = activeField }, [activeField])

  /* ── Marker + route helpers (defined before map init) ── */
  const updateMarker = useCallback((which: 'from' | 'to', coords: [number, number]) => {
    const ym    = window.ymaps
    const map   = mapRef.current
    if (!ym || !map) return
    const ref   = which === 'from' ? fromMarkRef : toMarkRef
    const color = which === 'from' ? '#e04040'   : '#1db87a'

    if (ref.current) {
      ref.current.geometry.setCoordinates(coords)
    } else {
      const mark = new ym.Placemark(
        coords,
        { iconContent: which === 'from' ? 'A' : 'B' },
        { preset: 'islands#circleIcon', iconColor: color },
      )
      map.geoObjects.add(mark)
      ref.current = mark
    }

    // Draw / redraw dashed line between markers
    const fromCoords = fromMarkRef.current?.geometry?.getCoordinates()
    const toCoords   = toMarkRef.current?.geometry?.getCoordinates()
    if (fromCoords && toCoords) {
      if (routeRef.current) map.geoObjects.remove(routeRef.current)
      const line = new ym.Polyline(
        [fromCoords, toCoords],
        {},
        { strokeColor: '#2dd4a066', strokeWidth: 2, strokeStyle: 'dash' },
      )
      map.geoObjects.add(line)
      routeRef.current = line
      map.setBounds(
        ym.util.bounds.fromPoints([fromCoords, toCoords]),
        { checkZoomRange: true, zoomMargin: 80, duration: 400 },
      )
    } else {
      map.setCenter(coords, 15, { duration: 400 })
    }
  }, [])

  const geocodeAndMark = useCallback(async (which: 'from' | 'to', addr: string) => {
    const ym = window.ymaps
    if (!ym || !mapRef.current || !addr.trim()) return
    try {
      const res = await ym.geocode(addr, { results: 1 })
      const obj = res.geoObjects.get(0)
      if (obj) updateMarker(which, obj.geometry.getCoordinates())
    } catch { /* ignore */ }
  }, [updateMarker])

  /* ── Init map ── */
  useEffect(() => {
    loadYmaps()
      .then(() => {
        if (!mapDivRef.current || mapRef.current) return
        const ym = window.ymaps

        const map = new ym.Map(
          mapDivRef.current,
          { center: ABKHAZIA_CENTER, zoom: ABKHAZIA_ZOOM, controls: ['zoomControl', 'geolocationControl'] },
          { suppressMapOpenBlock: true },
        )
        mapRef.current = map
        setMapReady(true)

        // Click → reverse geocode → fill active field
        map.events.add('click', async (e: any) => {
          const coords: [number, number] = e.get('coords')
          try {
            const res  = await ym.geocode(coords, { results: 1 })
            const obj  = res.geoObjects.get(0)
            const addr = obj?.getAddressLine() ?? coords.map((c: number) => c.toFixed(5)).join(', ')
            if (activeRef.current === 'from') {
              setFromVal(addr); onFromChange(addr)
            } else {
              setToVal(addr); onToChange(addr)
            }
            updateMarker(activeRef.current, coords)
          } catch { /* ignore */ }
        })
      })
      .catch(() => setLoadError(true))

    return () => {
      mapRef.current?.destroy()
      mapRef.current   = null
      fromMarkRef.current = null
      toMarkRef.current   = null
      routeRef.current    = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* ── Suggest helpers ── */
  const getSuggests = useCallback(async (query: string): Promise<Suggest[]> => {
    const ym = window.ymaps
    if (!ym || query.length < 2) return []
    try {
      const res = await ym.suggest(query, { boundedBy: ABKHAZIA_BOUNDS, results: 5 })
      return res.map((r: any) => ({ value: r.value }))
    } catch { return [] }
  }, [])

  const handleFromInput = useCallback(async (val: string) => {
    setFromVal(val)
    onFromChange(val)
    setFromSugg(await getSuggests(val))
  }, [onFromChange, getSuggests])

  const handleToInput = useCallback(async (val: string) => {
    setToVal(val)
    onToChange(val)
    setToSugg(await getSuggests(val))
  }, [onToChange, getSuggests])

  const pickSuggest = useCallback(async (which: 'from' | 'to', val: string) => {
    if (which === 'from') { setFromVal(val); onFromChange(val); setFromSugg([]) }
    else                  { setToVal(val);   onToChange(val);   setToSugg([]) }
    await geocodeAndMark(which, val)
  }, [onFromChange, onToChange, geocodeAndMark])

  /* ── Render ── */
  return (
    <div style={{
      background: 'var(--surface)', border: '1.5px solid var(--border)',
      boxShadow: 'var(--shadow-sm)', borderRadius: '1rem', overflow: 'hidden',
    }}>
      {/* ── Address inputs ── */}
      <div style={{ padding: '1.25rem 1.25rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>

        {/* FROM */}
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <MarkerDot color="#e04040" active={activeField === 'from'} glowColor="rgba(224,64,64,0.25)" />
            <span className="label-sm" style={{ color: '#e04040', marginBottom: 0 }}>Откуда забрать</span>
          </div>
          <input
            className="input-field"
            placeholder="Адрес, ориентир или место в Абхазии"
            value={fromVal}
            autoComplete="off"
            onFocus={() => { setActiveField('from'); setToSugg([]) }}
            onChange={(e) => handleFromInput(e.target.value)}
            onBlur={() => { if (!fromSugg.length && fromVal) geocodeAndMark('from', fromVal) }}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); setFromSugg([]); if (fromVal) geocodeAndMark('from', fromVal) } }}
            style={activeField === 'from' ? { borderColor: '#e04040', boxShadow: '0 0 0 3px rgba(224,64,64,0.12)' } : {}}
          />
          {fromSugg.length > 0 && (
            <SuggestDropdown items={fromSugg} onSelect={(v) => pickSuggest('from', v)} onClose={() => setFromSugg([])} />
          )}
        </div>

        {/* Separator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--green)' }}>arrow_downward</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>

        {/* TO */}
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <MarkerDot color="var(--green)" active={activeField === 'to'} glowColor="var(--green-soft)" />
            <span className="label-sm" style={{ color: 'var(--green)', marginBottom: 0 }}>Куда доставить</span>
          </div>
          <input
            className="input-field"
            placeholder="Адрес получателя"
            value={toVal}
            autoComplete="off"
            onFocus={() => { setActiveField('to'); setFromSugg([]) }}
            onChange={(e) => handleToInput(e.target.value)}
            onBlur={() => { if (!toSugg.length && toVal) geocodeAndMark('to', toVal) }}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); setToSugg([]); if (toVal) geocodeAndMark('to', toVal) } }}
            style={activeField === 'to' ? { borderColor: 'var(--green)', boxShadow: '0 0 0 3px var(--green-soft)' } : {}}
          />
          {toSugg.length > 0 && (
            <SuggestDropdown items={toSugg} onSelect={(v) => pickSuggest('to', v)} onClose={() => setToSugg([])} />
          )}
        </div>

        {/* Hint */}
        <p style={{ fontSize: '0.7rem', color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 4, margin: 0 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>touch_app</span>
          Нажмите на карту, чтобы указать точку «{activeField === 'from' ? 'Откуда' : 'Куда'}»
        </p>
      </div>

      {/* ── Map ── */}
      <div style={{ position: 'relative', height: 380 }}>
        <div ref={mapDivRef} style={{ width: '100%', height: '100%' }} />

        {/* Loading overlay */}
        {!mapReady && !loadError && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            background: 'var(--surface-alt)', gap: 10,
          }}>
            <span className="material-symbols-outlined icon-float" style={{ fontSize: '2.8rem', color: 'var(--text-3)' }}>map</span>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-3)' }}>Загружаем карту…</p>
          </div>
        )}

        {/* Error overlay */}
        {loadError && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            background: 'var(--surface-alt)', gap: 10,
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '2.5rem', color: 'var(--text-3)' }}>wifi_off</span>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-3)' }}>Не удалось загрузить карту</p>
          </div>
        )}

        {/* Active field badge overlay on map */}
        {mapReady && (
          <div style={{
            position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)',
            background: 'var(--glass-bg)', backdropFilter: 'blur(10px)',
            border: '1px solid var(--border-soft)',
            borderRadius: 9999, padding: '4px 12px',
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-2)',
            pointerEvents: 'none',
          }}>
            <span style={{
              width: 8, height: 8, borderRadius: 9999, flexShrink: 0,
              background: activeField === 'from' ? '#e04040' : 'var(--green)',
            }} />
            Ставим точку «{activeField === 'from' ? 'Откуда' : 'Куда'}»
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Small coloured dot next to label ── */
function MarkerDot({ color, active, glowColor }: { color: string; active: boolean; glowColor: string }) {
  return (
    <div style={{
      width: 10, height: 10, borderRadius: 9999,
      background: color, flexShrink: 0,
      boxShadow: active ? `0 0 0 3px ${glowColor}` : 'none',
      transition: 'box-shadow 0.2s',
    }} />
  )
}

/* ── Suggest dropdown ── */
function SuggestDropdown({
  items, onSelect, onClose,
}: { items: Suggest[]; onSelect: (v: string) => void; onClose: () => void }) {
  return (
    <>
      {/* Invisible backdrop to close on outside click */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 49 }} onMouseDown={onClose} />
      <div style={{
        position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
        background: 'var(--surface)', border: '1.5px solid var(--border)',
        borderRadius: '1rem', boxShadow: 'var(--shadow-md)',
        zIndex: 50, overflow: 'hidden',
        animation: 'fadeInUp 0.18s cubic-bezier(0.22,1,0.36,1) both',
      }}>
        {items.map((s, i) => (
          <button
            key={i}
            type="button"
            onMouseDown={(e) => { e.preventDefault(); onSelect(s.value) }}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, width: '100%',
              padding: '10px 16px', textAlign: 'left', border: 'none',
              borderTop: i > 0 ? '1px solid var(--border)' : 'none',
              background: 'transparent', color: 'var(--text-1)',
              fontSize: '0.875rem', cursor: 'pointer', transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-alt)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 15, color: 'var(--text-3)', flexShrink: 0 }}>
              location_on
            </span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {s.value}
            </span>
          </button>
        ))}
      </div>
    </>
  )
}
