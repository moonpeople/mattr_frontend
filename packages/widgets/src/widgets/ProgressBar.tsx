import { Progress } from 'ui'

import type { WidgetDefinition } from '../types'

type ProgressBarProps = {
  label: string
  value: number
  showValue: boolean
  helperText: string
  events: string
}

export const ProgressBarWidget: WidgetDefinition<ProgressBarProps> = {
  type: 'ProgressBar',
  label: 'Progress Bar',
  category: 'data',
  description: 'Visualize progress',
  defaultProps: {
    label: '',
    value: 50,
    showValue: true,
    helperText: '',
    events: '[]',
  },
  fields: [
    { key: 'label', label: 'Label', type: 'text', placeholder: 'Progress' },
    { key: 'value', label: 'Value', type: 'number', min: 0, max: 100, step: 1 },
    { key: 'showValue', label: 'Show value', type: 'boolean' },
    { key: 'helperText', label: 'Helper text', type: 'text', placeholder: 'Help text' },
    {
      key: 'events',
      label: 'Events (JSON)',
      type: 'json',
      placeholder: '[{\"event\":\"click\",\"type\":\"query\",\"queryName\":\"onClick\"}]',
    },
  ],
  render: (props, context) => {
    const rawValue = context?.state?.value ?? props.value
    const parsedValue =
      typeof rawValue === 'number' ? rawValue : Number.isFinite(Number(rawValue)) ? Number(rawValue) : props.value
    const value = Math.min(100, Math.max(0, parsedValue))

    return (
      <div className="space-y-2">
        {(props.label || props.showValue) && (
          <div className="flex items-center justify-between text-xs text-foreground-muted">
            <span>{props.label}</span>
            {props.showValue && <span>{Math.round(value)}%</span>}
          </div>
        )}
        <button type="button" className="w-full" onClick={() => context?.runActions?.('click', { value })}>
          <Progress value={value} />
        </button>
        {props.helperText && <div className="text-xs text-foreground-muted">{props.helperText}</div>}
      </div>
    )
  },
}
