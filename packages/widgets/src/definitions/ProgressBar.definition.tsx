import { Progress } from 'ui'

import { createWidgetDefinition } from '../types'

export type ProgressBarProps = {
  label: string
  value: number
  showValue: boolean
  helperText: string
  events: string
}

export const ProgressBarDefinition = createWidgetDefinition<ProgressBarProps>({
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
  render: (props, context) => {
    const rawValue = context?.state?.value ?? props.value
    const parsedValue =
      typeof rawValue === 'number'
        ? rawValue
        : Number.isFinite(Number(rawValue))
          ? Number(rawValue)
          : props.value
    const value = Math.min(100, Math.max(0, parsedValue))

    return (
      <div className="space-y-2">
        {(props.label || props.showValue) && (
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{props.label}</span>
            {props.showValue && <span>{Math.round(value)}%</span>}
          </div>
        )}
        <button
          type="button"
          className="w-full"
          onClick={() => context?.runActions?.('click', { value })}
        >
          <Progress value={value} />
        </button>
        {props.helperText && <div className="text-xs text-muted-foreground">{props.helperText}</div>}
      </div>
    )
  },
})
