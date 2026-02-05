import type { WidgetDefinition } from '../types'

type ProgressCircleProps = {
  value: number
  size: number
  strokeWidth: number
  showValue: boolean
}

export const ProgressCircleWidget: WidgetDefinition<ProgressCircleProps> = {
  type: 'ProgressCircle',
  label: 'Progress Circle',
  category: 'presentation',
  description: 'Circular progress indicator',
  defaultProps: {
    value: 60,
    size: 96,
    strokeWidth: 8,
    showValue: true,
  },
  fields: [
    { key: 'value', label: 'Value', type: 'number', min: 0, max: 100, step: 1 },
    { key: 'size', label: 'Size', type: 'number', min: 48, max: 200, step: 4 },
    { key: 'strokeWidth', label: 'Stroke width', type: 'number', min: 4, max: 16, step: 1 },
    { key: 'showValue', label: 'Show value', type: 'boolean' },
  ],
  render: (props) => {
    const value = Math.min(100, Math.max(0, props.value))
    const radius = (props.size - props.strokeWidth) / 2
    const circumference = 2 * Math.PI * radius
    const offset = circumference - (value / 100) * circumference

    return (
      <div className="relative inline-flex items-center justify-center" style={{ width: props.size, height: props.size }}>
        <svg width={props.size} height={props.size}>
          <circle
            cx={props.size / 2}
            cy={props.size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={props.strokeWidth}
            className="text-muted-foreground/20"
            fill="transparent"
          />
          <circle
            cx={props.size / 2}
            cy={props.size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={props.strokeWidth}
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="text-brand-500"
            fill="transparent"
          />
        </svg>
        {props.showValue && (
          <div className="absolute text-sm font-medium text-foreground">{Math.round(value)}%</div>
        )}
      </div>
    )
  },
}
