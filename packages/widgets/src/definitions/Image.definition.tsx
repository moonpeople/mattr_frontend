import { cn } from 'ui'

import { createWidgetDefinition } from '../types'

export type ImageProps = {
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

export const ImageDefinition = createWidgetDefinition<ImageProps>({
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
  render: (props) => (
    <div className="overflow-hidden rounded-md border border-border/30 bg-card">
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
})
