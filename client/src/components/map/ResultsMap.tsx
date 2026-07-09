import { useEffect, useRef, useMemo, memo } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import * as L from 'leaflet'
import type { ResultResponse } from '@/types'
import 'leaflet/dist/leaflet.css'

interface ResultsMapProps {
  results: ResultResponse[]
}

const statusColors: Record<string, string> = {
  no_website: '#10b981',
  has_website: '#64748b',
  pending_verification: '#f59e0b',
}

function createPopupContent(result: ResultResponse): string {
  const bg = result.status === 'no_website' ? 'rgba(16,185,129,0.15)' : result.status === 'has_website' ? 'rgba(100,116,139,0.2)' : 'rgba(245,158,11,0.15)'
  const fg = result.status === 'no_website' ? '#10b981' : result.status === 'has_website' ? '#94a3b8' : '#f59e0b'
  const label = result.status === 'no_website' ? 'No Website' : result.status === 'has_website' ? 'Has Website' : 'Pending'

  let html = `<div style="font-family:Inter,sans-serif;min-width:180px">`
  html += `<div style="font-weight:600;font-size:14px;margin-bottom:4px;color:#e2e8f0">${result.name}</div>`
  if (result.address) html += `<div style="font-size:12px;color:#8b9dc3;margin-bottom:2px">${result.address}</div>`
  if (result.phone) html += `<div style="font-size:12px;color:#8b9dc3;margin-bottom:2px">${result.phone}</div>`
  if (result.rating) html += `<div style="font-size:12px;color:#f59e0b;margin-bottom:2px">★ ${result.rating.toFixed(1)} (${result.total_ratings})</div>`
  if (result.website) html += `<a href="${result.website}" target="_blank" rel="noopener noreferrer" style="font-size:12px;color:#06b6d4;display:inline-flex;align-items:center;gap:4px;margin-top:4px">Website ↗</a>`
  else if (result.network_site) html += `<a href="${result.network_site}" target="_blank" rel="noopener noreferrer" style="font-size:12px;color:#06b6d4;display:inline-flex;align-items:center;gap:4px;margin-top:4px">Profile ↗</a>`
  html += `<div style="margin-top:6px"><span style="font-size:11px;padding:2px 8px;border-radius:9999px;background:${bg};color:${fg}">${label}</span></div>`
  html += `</div>`
  return html
}

function MarkersLayer({ resultsRef }: { resultsRef: React.RefObject<ResultResponse[]> }) {
  const map = useMap()
  const layerRef = useRef<L.LayerGroup | null>(null)

  useEffect(() => {
    const layer = L.layerGroup()
    layer.addTo(map)
    layerRef.current = layer

    const updateMarkers = () => {
      const results = resultsRef.current
      layer.clearLayers()

      const valid = results.filter((r) => r.lat != null && r.lng != null)
      if (valid.length === 0) return

      const bounds = L.latLngBounds([])

      for (const r of valid) {
        const latlng: L.LatLngExpression = [r.lat!, r.lng!]
        bounds.extend(latlng)

        const color = statusColors[r.status] ?? '#64748b'
        const marker = L.circleMarker(latlng, {
          radius: r.status === 'no_website' ? 8 : 6,
          color,
          fillColor: color,
          fillOpacity: 0.8,
          weight: 2,
        }).bindPopup(createPopupContent(r), { className: 'dark-popup' })

        layer.addLayer(marker)
      }

      if (valid.length === 1) {
        map.setView([valid[0].lat!, valid[0].lng!], 14)
      } else {
        map.fitBounds(bounds, { padding: [40, 40] })
      }
    }

    updateMarkers()

    return () => {
      layer.remove()
      layerRef.current = null
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Expose update function via ref on the map container
  useEffect(() => {
    const container = map.getContainer()
    ;(container as any).__updateMarkers = () => {
      if (layerRef.current) {
        layerRef.current.clearLayers()
        const results = resultsRef.current
        const valid = results.filter((r) => r.lat != null && r.lng != null)
        if (valid.length === 0) return

        const bounds = L.latLngBounds([])
        for (const r of valid) {
          const latlng: L.LatLngExpression = [r.lat!, r.lng!]
          bounds.extend(latlng)
          const color = statusColors[r.status] ?? '#64748b'
          const marker = L.circleMarker(latlng, {
            radius: r.status === 'no_website' ? 8 : 6,
            color,
            fillColor: color,
            fillOpacity: 0.8,
            weight: 2,
          }).bindPopup(createPopupContent(r), { className: 'dark-popup' })
          layerRef.current.addLayer(marker)
        }

        if (valid.length === 1) {
          map.setView([valid[0].lat!, valid[0].lng!], 14)
        } else {
          map.fitBounds(bounds, { padding: [40, 40] })
        }
      }
    }
  }, [map, resultsRef])

  return null
}

const StableMapContainer = memo(function StableMapContainer({
  resultsRef,
  center,
}: {
  resultsRef: React.RefObject<ResultResponse[]>
  center: [number, number]
}) {
  return (
    <MapContainer
      center={center}
      zoom={5}
      style={{ height: '100%', width: '100%' }}
      zoomControl={false}
      attributionControl={false}
    >
      <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
      <MarkersLayer resultsRef={resultsRef} />
    </MapContainer>
  )
})

export function ResultsMap({ results }: ResultsMapProps) {
  const validResults = useMemo(
    () => results.filter((r) => r.lat != null && r.lng != null),
    [results]
  )

  const resultsRef = useRef<ResultResponse[]>(validResults)
  const center = useMemo(() => {
    if (validResults.length === 0) return [39.8283, -98.5795] as [number, number]
    const avgLat = validResults.reduce((s, r) => s + r.lat!, 0) / validResults.length
    const avgLng = validResults.reduce((s, r) => s + r.lng!, 0) / validResults.length
    return [avgLat, avgLng] as [number, number]
  }, [validResults])

  // Update ref when results change and trigger marker refresh
  useEffect(() => {
    resultsRef.current = validResults
    // Find map container and call its update function
    const container = document.querySelector('.leaflet-container')
    if (container && (container as any).__updateMarkers) {
      ;(container as any).__updateMarkers()
    }
  }, [validResults])

  if (validResults.length === 0) {
    return (
      <div className="glass-card flex h-[200px] items-center justify-center sm:h-[300px]">
        <p className="text-sm text-text-muted">No locations to display</p>
      </div>
    )
  }

  return (
    <div className="glass-card overflow-hidden h-[250px] sm:h-[350px]">
      <StableMapContainer resultsRef={resultsRef} center={center} />
    </div>
  )
}
