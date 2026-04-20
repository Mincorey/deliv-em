'use client'

import { useEffect, useRef, useState } from 'react'

const YMAPS_KEY      = process.env.NEXT_PUBLIC_YANDEX_MAPS_KEY
const DEFAULT_CENTER : [number, number] = [43.0013, 41.0234]
const DEFAULT_ZOOM   = 10

declare global { interface Window { ymaps: any } }

let _ymapsReady: Promise<void> | null = null
function loadYmaps(): Promise<void> {
  if (_ymapsReady) return _ymapsReady
  _ymapsReady = new Promise<void>((resolve) => {
    if (typeof window === 'undefined') return
    if (window.ymaps?.ready) { window.ymaps.ready(resolve); return }
    const s   = document.createElement('script')
    s.src     = `https://api-maps.yandex.ru/2.1/?apikey=${YMAPS_KEY}&lang=ru_RU`
    s.async   = true
    s.onerror = () => { _ymapsReady = null }
    s.onload  = () => window.ymaps.ready(resolve)
    document.head.appendChild(s)
  })
  return _ymapsReady
}

function applyCourierMarker(map: any, coords: [number, number] | null | undefined) {
  const ym = window.ymaps
  if (!ym) return
  // Stored on the map object to avoid passing refs across calls
  if (!coords) {
    if (map._courierMark) {
      map.geoObjects.remove(map._courierMark)
      map._courierMark = null
    }
    return
  }
  if (map._courierMark) {
    map._courierMark.geometry.setCoordinates(coords)
  } else {
    map._courierMark = new ym.Placemark(
      coords,
      { balloonContent: 'Курьер' },
      { preset: 'islands#blueDeliveryCircleIcon' },
    )
    map.geoObjects.add(map._courierMark)
  }
}

export interface TaskRouteMapProps {
  fromAddress:    string
  toAddress:      string
  courierCoords?: [number, number] | null  // live courier position
}

export function TaskRouteMap({ fromAddress, toAddress, courierCoords }: TaskRouteMapProps) {
  const mapDivRef          = useRef<HTMLDivElement>(null)
  const mapRef             = useRef<any>(null)
  const pendingCoordsRef   = useRef<[number, number] | null | undefined>(undefined)
  const [ready, setReady]  = useState(false)
  const [error, setError]  = useState(false)

  /* ── Init map + draw route once ── */
  useEffect(() => {
    let destroyed = false

    loadYmaps()
      .then(async () => {
        if (destroyed || !mapDivRef.current || mapRef.current) return
        const ym = window.ymaps

        const map = new ym.Map(
          mapDivRef.current,
          { center: DEFAULT_CENTER, zoom: DEFAULT_ZOOM, controls: ['zoomControl'] },
          { suppressMapOpenBlock: true },
        )
        mapRef.current = map
        setReady(true)
        // Apply any courier coords that arrived before the map was ready
        if (pendingCoordsRef.current !== undefined) {
          applyCourierMarker(map, pendingCoordsRef.current)
          pendingCoordsRef.current = undefined
        }

        if (!fromAddress && !toAddress) return

        try {
          // Build real road route
          const route = await ym.route(
            [fromAddress, toAddress].filter(Boolean),
            { routingMode: 'auto', mapStateAutoApply: false },
          )

          // Style the route path
          route.getPaths().options.set({
            strokeColor: '#1db87a',
            strokeWidth: 4,
            opacity: 0.85,
          })

          // Style waypoint markers: A = red, B = green
          const wps = route.getWayPoints()
          wps.options.set({ preset: 'islands#circleIcon' })
          if (wps.getLength() > 0) {
            wps.get(0).options.set({ iconColor: '#e04040' })
            wps.get(0).properties.set({ iconContent: 'A' })
          }
          if (wps.getLength() > 1) {
            wps.get(1).options.set({ iconColor: '#1db87a' })
            wps.get(1).properties.set({ iconContent: 'B' })
          }

          map.geoObjects.add(route)

          const bounds = route.getBounds()
          if (bounds) {
            map.setBounds(bounds, { checkZoomRange: true, zoomMargin: 80, duration: 300 })
          }
        } catch {
          // Fallback: just geocode and show markers with dashed line
          const results = await Promise.allSettled([
            fromAddress ? ym.geocode(fromAddress, { results: 1 }) : null,
            toAddress   ? ym.geocode(toAddress,   { results: 1 }) : null,
          ])
          const coords = results.map(r =>
            r.status === 'fulfilled' && r.value ? r.value.geoObjects.get(0)?.geometry?.getCoordinates() : null
          ) as ([number, number] | null)[]

          coords.forEach((c, i) => {
            if (!c) return
            map.geoObjects.add(new ym.Placemark(c,
              { iconContent: i === 0 ? 'A' : 'B' },
              { preset: 'islands#circleIcon', iconColor: i === 0 ? '#e04040' : '#1db87a' },
            ))
          })
          if (coords[0] && coords[1]) {
            map.geoObjects.add(new ym.Polyline([coords[0], coords[1]], {},
              { strokeColor: '#2dd4a066', strokeWidth: 2, strokeStyle: 'dash' }))
            map.setBounds(ym.util.bounds.fromPoints(coords.filter(Boolean)),
              { checkZoomRange: true, zoomMargin: 80, duration: 300 })
          }
        }
      })
      .catch(() => setError(true))

    return () => {
      destroyed = true
      mapRef.current?.destroy()
      mapRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* ── Update courier marker when live coords change ── */
  useEffect(() => {
    const map = mapRef.current
    if (!map) {
      // Map not ready yet — store coords so the init effect can apply them
      pendingCoordsRef.current = courierCoords
      return
    }
    applyCourierMarker(map, courierCoords)
  }, [courierCoords])  // stable 1-element array, no ready dependency

  return (
    <div style={{ position: 'relative', height: 280, borderRadius: '0.75rem', overflow: 'hidden' }}>
      <div ref={mapDivRef} style={{ width: '100%', height: '100%' }} />

      {!ready && !error && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          background: 'var(--surface-alt)', gap: 8,
        }}>
          <span className="material-symbols-outlined icon-float" style={{ fontSize: '2.5rem', color: 'var(--text-3)' }}>map</span>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-3)' }}>Загружаем карту…</p>
        </div>
      )}
      {error && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          background: 'var(--surface-alt)', gap: 8,
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '2.5rem', color: 'var(--text-3)' }}>wifi_off</span>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-3)' }}>Не удалось загрузить карту</p>
        </div>
      )}
    </div>
  )
}
