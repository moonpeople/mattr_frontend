import type { WidgetDefinition } from '../types'
import { normalizeString } from '../helpers'

type StatisticProps = {
  label: string
  value: string
  prefix: string
  suffix: string
  caption: string
  helperText: string
  events: string
}

export const StatisticWidget: WidgetDefinition<StatisticProps> = {
  type: 'Statistic',
  label: 'Statistic',
  category: 'data',
  description: 'Highlight a key metric',
  defaultProps: {
    label: 'Metric',
    value: '0',
    prefix: '',
    suffix: '',
    caption: '',
    helperText: '',
    events: '[]',
  },
  fields: [
    { key: 'label', label: 'Label', type: 'text', placeholder: 'Metric' },
    { key: 'value', label: 'Value', type: 'text', placeholder: '0' },
    { key: 'prefix', label: 'Prefix', type: 'text', placeholder: '$' },
    { key: 'suffix', label: 'Suffix', type: 'text', placeholder: '%' },
    { key: 'caption', label: 'Caption', type: 'text', placeholder: 'Since last month' },
    { key: 'helperText', label: 'Helper text', type: 'text', placeholder: 'Help text' },
    {
      key: 'events',
      label: 'Events (JSON)',
      type: 'json',
      placeholder: '[{\"event\":\"click\",\"type\":\"query\",\"queryName\":\"onClick\"}]',
    },
  ],
  render: (props, context) => {
    const value = normalizeString(context?.state?.value ?? props.value, '0')
    const displayValue = `${props.prefix}${value}${props.suffix}`

    return (
      <button
        type="button"
        className="w-full text-left space-y-1 rounded-md border border-transparent hover:border-border hover:bg-muted/40 transition-colors"
        onClick={() => context?.runActions?.('click', { value })}
      >
        {props.label && <div className="text-xs text-foreground-muted">{props.label}</div>}
        <div className="text-2xl font-semibold text-foreground">{displayValue}</div>
        {props.caption && <div className="text-xs text-foreground-muted">{props.caption}</div>}
        {props.helperText && <div className="text-xs text-foreground-muted">{props.helperText}</div>}
      </button>
    )
  },
}
