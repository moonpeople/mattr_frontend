import { cn } from 'ui'

import { createWidgetDefinition } from '../types'

export type ContainerProps = {
  title: string
  subtitle: string
  padding: 'sm' | 'md' | 'lg'
  bordered: boolean
  background: 'surface' | 'muted' | 'transparent'
}

const paddingClasses: Record<ContainerProps['padding'], string> = {
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
}

const backgroundClasses: Record<ContainerProps['background'], string> = {
  surface: 'bg-card',
  muted: 'bg-muted',
  transparent: 'bg-transparent',
}

export const ContainerDefinition = createWidgetDefinition<ContainerProps>({
  type: 'Container',
  label: 'Container',
  category: 'containers',
  description: 'Panel for grouping content',
  supportsChildren: true,
  defaultProps: {
    title: 'Container title',
    subtitle: '',
    padding: 'md',
    bordered: true,
    background: 'surface',
  },
  render: (props, context) => {
    const hasChildren = Boolean(context?.children)
    const content = hasChildren ? (
      <div className="space-y-3">{context?.children}</div>
    ) : (
      <div className="text-xs text-muted-foreground">Container content</div>
    )

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
            {props.title && <div className="text-sm font-medium text-foreground">{props.title}</div>}
            {props.subtitle && (
              <div className="text-xs text-muted-foreground">{props.subtitle}</div>
            )}
          </div>
        )}
        <div className={paddingClasses[props.padding]}>{content}</div>
      </div>
    )
  },
})
