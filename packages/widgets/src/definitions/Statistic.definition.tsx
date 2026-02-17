import { normalizeString } from '../helpers'
import { createWidgetDefinition } from '../types'

export type StatisticProps = {
  label: string
  value: string
  prefix: string
  suffix: string
  caption: string
  helperText: string
  events: string
}

export const StatisticDefinition = createWidgetDefinition<StatisticProps>({
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
  render: (props, context) => {
    const value = normalizeString(context?.state?.value ?? props.value, '0')
    const displayValue = `${props.prefix}${value}${props.suffix}`

    return (
      <button
        type="button"
        className="w-full text-left space-y-1 rounded-md border border-transparent hover:border-border hover:bg-muted/40 transition-colors"
        onClick={() => context?.runActions?.('click', { value })}
      >
        {props.label && <div className="text-xs text-muted-foreground">{props.label}</div>}
        <div className="text-2xl font-semibold text-foreground">{displayValue}</div>
        {props.caption && <div className="text-xs text-muted-foreground">{props.caption}</div>}
        {props.helperText && <div className="text-xs text-muted-foreground">{props.helperText}</div>}
      </button>
    )
  },
})
