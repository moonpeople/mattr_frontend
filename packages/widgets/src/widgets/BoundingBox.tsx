import type { WidgetDefinition } from '../types'
import { normalizeArray, normalizeString, parseMaybeJson } from '../helpers'

type Box = {
  x: number
  y: number
  width: number
  height: number
  label?: string
}

type BoundingBoxProps = {
  imageUrl: string
  boxes: string
  labels: string
}

const normalizeBoxes = (raw: unknown): Box[] => {
  const parsed = parseMaybeJson(raw)
  const normalized = normalizeArray<Box>(parsed, [])
  return normalized.filter((box) => typeof box.x === 'number' && typeof box.y === 'number')
}

export const BoundingBoxWidget: WidgetDefinition<BoundingBoxProps> = {
  type: 'BoundingBox',
  label: 'Bounding Box',
  category: 'presentation',
  description: 'Image with bounding boxes',
  defaultProps: {
    imageUrl: '',
    boxes: '[]',
    labels: '[]',
  },
  fields: [
    { key: 'imageUrl', label: 'Image URL', type: 'text', placeholder: 'https://...' },
    { key: 'boxes', label: 'Boxes (JSON)', type: 'json', placeholder: '[{"x":0,"y":0,"width":100,"height":100}]' },
    { key: 'labels', label: 'Labels (JSON)', type: 'json', placeholder: '["Car","Person"]' },
  ],
  render: (props) => {
    const boxes = normalizeBoxes(props.boxes)
    const maxX = Math.max(...boxes.map((box) => box.x + box.width), 1)
    const maxY = Math.max(...boxes.map((box) => box.y + box.height), 1)

    return (
      <div className="space-y-2">
        <div className="relative aspect-video w-full overflow-hidden rounded border border-foreground-muted/40 bg-surface-100">
          {props.imageUrl ? (
            <img src={props.imageUrl} alt="Bounding box" className="h-full w-full object-contain" />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-foreground-muted">No image</div>
          )}
          {boxes.length > 0 && (
            <div className="absolute inset-0">
              {boxes.map((box, index) => (
                <div
                  key={`${box.label ?? 'box'}-${index}`}
                  className="absolute border border-primary-500"
                  style={{
                    left: `${(box.x / maxX) * 100}%`,
                    top: `${(box.y / maxY) * 100}%`,
                    width: `${(box.width / maxX) * 100}%`,
                    height: `${(box.height / maxY) * 100}%`,
                  }}
                >
                  {box.label && (
                    <span className="absolute -top-5 left-0 rounded bg-primary-500 px-1 text-[10px] text-white">
                      {box.label}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        {props.labels && (
          <div className="text-xs text-foreground-muted">
            Labels: {normalizeString(props.labels, '')}
          </div>
        )}
      </div>
    )
  },
}
