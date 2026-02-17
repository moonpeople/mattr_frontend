import { cn } from 'ui'

import { createWidgetDefinition } from '../types'

export type TextProps = {
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
  muted: 'text-muted-foreground',
}

const alignClasses: Record<TextProps['align'], string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
}

export const TextDefinition = createWidgetDefinition<TextProps>({
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
})
