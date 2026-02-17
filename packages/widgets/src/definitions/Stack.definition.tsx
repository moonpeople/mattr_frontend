import { cn } from 'ui'

import { createWidgetDefinition } from '../types'

export type StackProps = {
  title: string
  subtitle: string
  orientation: 'horizontal' | 'vertical'
  align: 'left' | 'center' | 'right'
  gap: number
  padding: 'sm' | 'md' | 'lg'
  bordered: boolean
  background: 'surface' | 'muted' | 'transparent'
}

const paddingClasses: Record<StackProps['padding'], string> = {
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
}

const backgroundClasses: Record<StackProps['background'], string> = {
  surface: 'bg-card',
  muted: 'bg-muted',
  transparent: 'bg-transparent',
}

const getAlignClass = (orientation: StackProps['orientation'], align: StackProps['align']) => {
  if (orientation === 'horizontal') {
    if (align === 'center') {
      return 'justify-center'
    }
    if (align === 'right') {
      return 'justify-end'
    }
    return 'justify-start'
  }
  if (align === 'center') {
    return 'items-center'
  }
  if (align === 'right') {
    return 'items-end'
  }
  return 'items-start'
}

export const StackDefinition = createWidgetDefinition<StackProps>({
  type: 'Stack',
  label: 'Stack',
  category: 'containers',
  description: 'Flex stack container',
  supportsChildren: true,
  defaultProps: {
    title: '',
    subtitle: '',
    orientation: 'vertical',
    align: 'left',
    gap: 8,
    padding: 'md',
    bordered: true,
    background: 'transparent',
  },
  render: (props, context) => {
    const gap = Number.isFinite(props.gap) ? Math.max(0, Number(props.gap)) : 8
    const hasChildren = Boolean(context?.children)
    const orientationClass = props.orientation === 'horizontal' ? 'flex-row' : 'flex-col'

    return (
      <div
        className={cn(
          'rounded-lg',
          backgroundClasses[props.background],
          props.bordered ? 'border border-border/40' : 'border border-transparent'
        )}
      >
        {(props.title || props.subtitle) && (
          <div className="border-b border-border/30 px-4 py-3">
            {props.title ? <div className="text-sm font-medium text-foreground">{props.title}</div> : null}
            {props.subtitle ? <div className="text-xs text-muted-foreground">{props.subtitle}</div> : null}
          </div>
        )}
        <div className={paddingClasses[props.padding]}>
          <div
            className={cn('flex', orientationClass, getAlignClass(props.orientation, props.align))}
            style={{ gap: `${gap}px` }}
          >
            {hasChildren ? (
              context?.children
            ) : (
              <div className="text-xs text-muted-foreground">Stack children</div>
            )}
          </div>
        </div>
      </div>
    )
  },
})

