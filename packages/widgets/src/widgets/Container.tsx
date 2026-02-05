import { cn } from 'ui'

import type { WidgetDefinition } from '../types'

type ContainerProps = {
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
  surface: 'bg-surface-100',
  muted: 'bg-surface-200',
  transparent: 'bg-transparent',
}

export const ContainerWidget: WidgetDefinition<ContainerProps> = {
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
  fields: [
    { key: 'title', label: 'Title', type: 'text', placeholder: 'Container title' },
    { key: 'subtitle', label: 'Subtitle', type: 'text', placeholder: 'Subtitle' },
    {
      key: 'padding',
      label: 'Padding',
      type: 'select',
      options: [
        { label: 'Small', value: 'sm' },
        { label: 'Medium', value: 'md' },
        { label: 'Large', value: 'lg' },
      ],
    },
    { key: 'bordered', label: 'Border', type: 'boolean' },
    {
      key: 'background',
      label: 'Background',
      type: 'select',
      options: [
        { label: 'Surface', value: 'surface' },
        { label: 'Muted', value: 'muted' },
        { label: 'Transparent', value: 'transparent' },
      ],
    },
  ],
  render: (props, context) => {
    const hasChildren = Boolean(context?.children)
    const content = hasChildren ? (
      <div className="space-y-3">{context?.children}</div>
    ) : (
      <div className="text-xs text-foreground-muted">Container content</div>
    )

    return (
      <div
        className={cn(
          'rounded-lg',
          backgroundClasses[props.background],
          props.bordered ? 'border border-foreground-muted/40' : 'border border-transparent'
        )}
      >
        {(props.title || props.subtitle) && (
          <div className="border-b border-foreground-muted/30 px-4 py-3">
            {props.title && <div className="text-sm font-medium text-foreground">{props.title}</div>}
            {props.subtitle && (
              <div className="text-xs text-foreground-muted">{props.subtitle}</div>
            )}
          </div>
        )}
        <div className={paddingClasses[props.padding]}>{content}</div>
      </div>
    )
  },
}
