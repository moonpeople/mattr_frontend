import { cn } from 'ui'

import { normalizeArray, parseMaybeJson } from '../helpers'
import { createWidgetDefinition } from '../types'

export type ChartDatum = {
  label: string
  value: number
}

export type ChartProps = {
  title: string
  data: string
  variant: 'bar' | 'line'
}

export const ChartDefinition = createWidgetDefinition<ChartProps>({
  type: 'Chart',
  label: 'Chart',
  category: 'charts',
  description: 'Simple chart preview',
  defaultProps: {
    title: 'Chart title',
    data: JSON.stringify(
      [
        { label: 'Jan', value: 40 },
        { label: 'Feb', value: 65 },
        { label: 'Mar', value: 30 },
      ],
      null,
      2
    ),
    variant: 'bar',
  },
  render: (props) => {
    const data = normalizeArray<ChartDatum>(parseMaybeJson(props.data), [])
    const maxValue = Math.max(1, ...data.map((item) => item.value ?? 0))

    if (data.length === 0) {
      return (
        <div className="rounded-md border border-dashed border-border/40 px-3 py-6 text-center text-xs text-muted-foreground">
          Provide chart data to preview.
        </div>
      )
    }

    return (
      <div className="rounded-md border border-border/30 bg-card p-4">
        {props.title && <div className="text-sm font-medium text-foreground">{props.title}</div>}
        <div className="mt-4 space-y-2">
          {data.map((item, index) => {
            const width = Math.round((item.value / maxValue) * 100)
            return (
              <div key={`${item.label}-${index}`} className="space-y-1">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{item.label}</span>
                  <span>{item.value}</span>
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div
                    className={cn('h-2 rounded-full bg-brand-600', props.variant === 'line' && 'bg-brand-500')}
                    style={{ width: `${width}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  },
})
