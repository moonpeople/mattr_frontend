import { cn } from 'ui'

import type { WidgetDefinition } from '../types'
import { normalizeArray, parseMaybeJson } from '../helpers'

type ChartDatum = {
  label: string
  value: number
}

type ChartProps = {
  title: string
  data: string
  variant: 'bar' | 'line'
}

export const ChartWidget: WidgetDefinition<ChartProps> = {
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
  fields: [
    { key: 'title', label: 'Title', type: 'text', placeholder: 'Chart title' },
    {
      key: 'data',
      label: 'Data (JSON)',
      type: 'json',
      placeholder: '[{\"label\":\"Jan\",\"value\":40}]',
    },
    {
      key: 'variant',
      label: 'Variant',
      type: 'select',
      options: [
        { label: 'Bar', value: 'bar' },
        { label: 'Line', value: 'line' },
      ],
    },
  ],
  render: (props) => {
    const data = normalizeArray<ChartDatum>(parseMaybeJson(props.data), [])
    const maxValue = Math.max(1, ...data.map((item) => item.value ?? 0))

    if (data.length === 0) {
      return (
        <div className="rounded-md border border-dashed border-foreground-muted/40 px-3 py-6 text-center text-xs text-foreground-muted">
          Provide chart data to preview.
        </div>
      )
    }

    return (
      <div className="rounded-md border border-foreground-muted/30 bg-surface-100 p-4">
        {props.title && <div className="text-sm font-medium text-foreground">{props.title}</div>}
        <div className="mt-4 space-y-2">
          {data.map((item, index) => {
            const width = Math.round((item.value / maxValue) * 100)
            return (
              <div key={`${item.label}-${index}`} className="space-y-1">
                <div className="flex items-center justify-between text-xs text-foreground-muted">
                  <span>{item.label}</span>
                  <span>{item.value}</span>
                </div>
                <div className="h-2 rounded-full bg-surface-200">
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
}
