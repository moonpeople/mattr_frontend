import { normalizeArray, normalizeString, parseMaybeJson } from '../helpers'
import { createWidgetDefinition } from '../types'

export type MapProps = {
  latitude: string
  longitude: string
  zoom: string
  points: string
}

const parseNumber = (value: string, fallback: number) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const zoomDelta = (zoom: number) => {
  const safeZoom = Math.min(Math.max(zoom, 1), 18)
  return 0.5 / Math.pow(2, safeZoom - 1)
}

export const MapDefinition = createWidgetDefinition<MapProps>({
  type: 'Map',
  label: 'Map',
  category: 'data',
  description: 'Map preview',
  defaultProps: {
    latitude: '37.7577',
    longitude: '-122.4376',
    zoom: '8',
    points: '[]',
  },
  render: (props) => {
    const points = normalizeArray<{ latitude?: string | number; longitude?: string | number }>(
      parseMaybeJson(props.points),
      []
    )
    const fallbackLat = parseNumber(normalizeString(props.latitude, ''), 0)
    const fallbackLng = parseNumber(normalizeString(props.longitude, ''), 0)
    const primaryPoint = points[0]
    const lat =
      primaryPoint?.latitude !== undefined
        ? parseNumber(String(primaryPoint.latitude), fallbackLat)
        : fallbackLat
    const lng =
      primaryPoint?.longitude !== undefined
        ? parseNumber(String(primaryPoint.longitude), fallbackLng)
        : fallbackLng
    const zoom = parseNumber(normalizeString(props.zoom, ''), 8)
    const delta = zoomDelta(zoom)
    const left = lng - delta
    const right = lng + delta
    const top = lat + delta
    const bottom = lat - delta
    const src = `https://www.openstreetmap.org/export/embed.html?bbox=${left}%2C${bottom}%2C${right}%2C${top}&layer=mapnik&marker=${lat}%2C${lng}`

    return (
      <div className="space-y-2">
        <div className="aspect-video w-full overflow-hidden rounded border border-border/40 bg-card">
          <iframe title="Map" src={src} className="h-full w-full" />
        </div>
        {points.length > 0 && (
          <div className="text-xs text-muted-foreground">
            Points: {points.map((point) => `${point.latitude}, ${point.longitude}`).join(' · ')}
          </div>
        )}
      </div>
    )
  },
})
