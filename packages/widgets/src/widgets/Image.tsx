import { cn } from 'ui'

import type { WidgetDefinition } from '../types'

type ImageProps = {
  src: string
  alt: string
  width: number
  height: number
  rounded: boolean
  fit: 'cover' | 'contain'
}

const fitClasses: Record<ImageProps['fit'], string> = {
  cover: 'object-cover',
  contain: 'object-contain',
}

export const ImageWidget: WidgetDefinition<ImageProps> = {
  type: 'Image',
  label: 'Image',
  category: 'presentation',
  description: 'Display an image',
  defaultProps: {
    src: 'https://placehold.co/640x360/png',
    alt: 'Image',
    width: 640,
    height: 360,
    rounded: true,
    fit: 'cover',
  },
  fields: [
    { key: 'src', label: 'Source URL', type: 'text', placeholder: 'https://...' },
    { key: 'alt', label: 'Alt text', type: 'text', placeholder: 'Image' },
    { key: 'width', label: 'Width', type: 'number', min: 40, max: 1200 },
    { key: 'height', label: 'Height', type: 'number', min: 40, max: 900 },
    { key: 'rounded', label: 'Rounded', type: 'boolean' },
    {
      key: 'fit',
      label: 'Object fit',
      type: 'select',
      options: [
        { label: 'Cover', value: 'cover' },
        { label: 'Contain', value: 'contain' },
      ],
    },
  ],
  render: (props) => (
    <div className="overflow-hidden rounded-md border border-foreground-muted/30 bg-surface-100">
      <img
        src={props.src}
        alt={props.alt}
        width={props.width}
        height={props.height}
        className={cn('h-auto w-full', props.rounded ? 'rounded-md' : '', fitClasses[props.fit])}
        style={{ maxHeight: props.height }}
      />
    </div>
  ),
}
