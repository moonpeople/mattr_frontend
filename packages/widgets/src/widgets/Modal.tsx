import { cn } from 'ui'

import type { WidgetDefinition } from '../types'

type ModalProps = {
  title: string
  body: string
  size: 'sm' | 'md' | 'lg'
  open: boolean
}

const sizeClasses: Record<ModalProps['size'], string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
}

export const ModalWidget: WidgetDefinition<ModalProps> = {
  type: 'Modal',
  label: 'Modal',
  category: 'containers',
  description: 'Dialog preview',
  supportsChildren: true,
  defaultProps: {
    title: 'Modal title',
    body: 'Modal content',
    size: 'md',
    open: true,
  },
  fields: [
    { key: 'title', label: 'Title', type: 'text', placeholder: 'Modal title' },
    { key: 'body', label: 'Body', type: 'textarea', placeholder: 'Modal content' },
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
    { key: 'open', label: 'Open', type: 'boolean' },
  ],
  render: (props, context) => {
    const hasChildren = Boolean(context?.children)
    const bodyContent = hasChildren ? (
      <div className="space-y-3">{context?.children}</div>
    ) : (
      <div className="text-sm text-foreground">{props.body}</div>
    )

    return (
      <div className="relative">
        {props.open ? (
          <div className="rounded-lg border border-foreground-muted/40 bg-surface-100/90 p-4">
            <div className={cn('space-y-2', sizeClasses[props.size])}>
              <div className="text-sm font-medium text-foreground">{props.title}</div>
              {bodyContent}
              <div className="text-xs text-foreground-muted">Modal footer</div>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-foreground-muted/40 bg-surface-100/60 p-4 text-xs text-foreground-muted">
            Modal closed
          </div>
        )}
      </div>
    )
  },
}
