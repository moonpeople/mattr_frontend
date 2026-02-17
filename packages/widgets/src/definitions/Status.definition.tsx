import { Badge } from 'ui'

import { createWidgetDefinition } from '../types'

export type StatusProps = {
  label: string
  value: string
  variant: 'default' | 'success' | 'warning' | 'destructive'
}

const variantFromValue = (value: string): StatusProps['variant'] => {
  const normalized = value.toLowerCase()
  if (['success', 'completed', 'done', 'ok'].includes(normalized)) {
    return 'success'
  }
  if (['warning', 'pending', 'in progress'].includes(normalized)) {
    return 'warning'
  }
  if (['danger', 'error', 'failed', 'canceled', 'cancelled'].includes(normalized)) {
    return 'destructive'
  }
  return 'default'
}

export const StatusDefinition = createWidgetDefinition<StatusProps>({
  type: 'Status',
  label: 'Status',
  category: 'presentation',
  description: 'Status badge',
  defaultProps: {
    label: 'Status',
    value: 'Completed',
    variant: 'default',
  },
  render: (props) => {
    const variant = props.variant === 'default' ? variantFromValue(props.value) : props.variant
    return (
      <div className="space-y-1">
        {props.label && <div className="text-xs text-muted-foreground">{props.label}</div>}
        <Badge variant={variant}>{props.value}</Badge>
      </div>
    )
  },
})
