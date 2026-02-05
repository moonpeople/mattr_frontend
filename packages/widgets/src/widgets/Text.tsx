import { cn } from 'ui'

import type { WidgetDefinition } from '../types'

type TextProps = {
  text: string
  size: 'sm' | 'md' | 'lg'
  tone: 'default' | 'muted'
  align: 'left' | 'center' | 'right'
}

const sizeClasses: Record<TextProps['size'], string> = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
}

const toneClasses: Record<TextProps['tone'], string> = {
  default: 'text-foreground',
  muted: 'text-foreground-muted',
}

const alignClasses: Record<TextProps['align'], string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
}

export const TextWidget: WidgetDefinition<TextProps> = {
  type: 'Text',
  label: 'Text',
  category: 'presentation',
  description: 'Simple text block',
  defaultProps: {
    text: 'Edit this text',
    size: 'md',
    tone: 'default',
    align: 'left',
  },
  fields: [
    { key: 'text', label: 'Text', type: 'textarea', placeholder: 'Enter text' },
    {
      key: 'size',
      label: 'Size',
      type: 'select',
      options: [
        { label: 'Small', value: 'sm' },
        { label: 'Medium', value: 'md' },
        { label: 'Large', value: 'lg' },
      ],
    },
    {
      key: 'tone',
      label: 'Tone',
      type: 'select',
      options: [
        { label: 'Default', value: 'default' },
        { label: 'Muted', value: 'muted' },
      ],
    },
    {
      key: 'align',
      label: 'Align',
      type: 'select',
      options: [
        { label: 'Left', value: 'left' },
        { label: 'Center', value: 'center' },
        { label: 'Right', value: 'right' },
      ],
    },
  ],
  render: (props) => (
    <p
      className={cn(
        'leading-relaxed',
        sizeClasses[props.size],
        toneClasses[props.tone],
        alignClasses[props.align]
      )}
    >
      {props.text}
    </p>
  ),
}
