import { cn } from 'ui'

import type { WidgetDefinition } from '../types'
import { normalizeArray, parseMaybeJson } from '../helpers'

type ImageGridItem = {
  src: string
  alt?: string
  caption?: string
}

type ImageGridProps = {
  images: string
  columns: number
  gap: number
  aspectRatio: number
}

const normalizeImages = (raw: unknown): ImageGridItem[] => {
  const parsed = normalizeArray<ImageGridItem | string>(parseMaybeJson(raw), [])
  if (parsed.length === 0) {
    return []
  }
  if (typeof parsed[0] === 'string') {
    return (parsed as string[]).map((src) => ({ src }))
  }
  return (parsed as ImageGridItem[]).map((item) => ({
    src: item.src,
    alt: item.alt,
    caption: item.caption,
  }))
}

export const ImageGridWidget: WidgetDefinition<ImageGridProps> = {
  type: 'ImageGrid',
  label: 'Image Grid',
  category: 'presentation',
  description: 'Grid of images',
  defaultProps: {
    images: JSON.stringify(
      [
        { src: 'https://picsum.photos/id/1062/800/600' },
        { src: 'https://picsum.photos/id/1025/800/600' },
        { src: 'https://picsum.photos/id/837/400/300' },
      ],
      null,
      2
    ),
    columns: 3,
    gap: 8,
    aspectRatio: 1,
  },
  fields: [
    {
      key: 'images',
      label: 'Images (JSON)',
      type: 'json',
      placeholder: '[{\"src\":\"https://...\",\"caption\":\"\"}]',
    },
    { key: 'columns', label: 'Columns', type: 'number', min: 1, max: 6, step: 1 },
    { key: 'gap', label: 'Gap', type: 'number', min: 0, max: 24, step: 2 },
    { key: 'aspectRatio', label: 'Aspect ratio', type: 'number', min: 0.5, max: 2, step: 0.1 },
  ],
  render: (props) => {
    const images = normalizeImages(props.images)
    const items =
      images.length > 0
        ? images
        : [
            { src: 'https://picsum.photos/id/1062/800/600' },
            { src: 'https://picsum.photos/id/1025/800/600' },
            { src: 'https://picsum.photos/id/837/400/300' },
          ]

    return (
      <div
        className="grid w-full"
        style={{
          gridTemplateColumns: `repeat(${props.columns}, minmax(0, 1fr))`,
          gap: `${props.gap}px`,
        }}
      >
        {items.map((item, index) => (
          <div key={`${item.src}-${index}`} className="space-y-1">
            <div className="overflow-hidden rounded-md border border-input bg-muted/40">
              <img
                src={item.src}
                alt={item.alt ?? 'Image'}
                className={cn('h-full w-full object-cover')}
                style={{ aspectRatio: String(props.aspectRatio) }}
              />
            </div>
            {item.caption && <div className="text-xs text-foreground-muted">{item.caption}</div>}
          </div>
        ))}
      </div>
    )
  },
}
