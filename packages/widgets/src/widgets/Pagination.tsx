import { Button, Input } from 'ui'

import type { WidgetDefinition } from '../types'
import { normalizeString } from '../helpers'

type PaginationProps = {
  value: number
  max: number
  disabled: boolean
  events: string
}

export const PaginationWidget: WidgetDefinition<PaginationProps> = {
  type: 'Pagination',
  label: 'Pagination',
  category: 'navigation',
  description: 'Page navigation controls',
  defaultProps: {
    value: 1,
    max: 10,
    disabled: false,
    events: '[]',
  },
  fields: [
    { key: 'value', label: 'Current page', type: 'number', min: 1, step: 1 },
    { key: 'max', label: 'Total pages', type: 'number', min: 1, step: 1 },
    { key: 'disabled', label: 'Disabled', type: 'boolean' },
    {
      key: 'events',
      label: 'Events (JSON)',
      type: 'json',
      placeholder: '[{\"event\":\"change\",\"type\":\"query\",\"queryName\":\"onPage\"}]',
    },
  ],
  render: (props, context) => {
    const rawValue = context?.state?.value ?? props.value
    const parsedValue =
      typeof rawValue === 'number' ? rawValue : Number.isFinite(Number(rawValue)) ? Number(rawValue) : props.value
    const max = Math.max(1, props.max)
    const value = Math.min(max, Math.max(1, parsedValue))

    const updateValue = (nextValue: number) => {
      const next = Math.min(max, Math.max(1, nextValue))
      context?.setState?.({ value: next })
      context?.runActions?.('change', { value: next, max })
    }

    return (
      <div className="flex items-center gap-2">
        <Button
          type="default"
          size="tiny"
          disabled={props.disabled || value <= 1}
          onClick={() => updateValue(value - 1)}
        >
          Prev
        </Button>
        <Input
          type="number"
          value={normalizeString(value)}
          disabled={props.disabled}
          min={1}
          max={max}
          onChange={(event) => updateValue(Number(event.target.value))}
          className="h-8 w-16 text-center"
        />
        <span className="text-xs text-foreground-muted">of {max}</span>
        <Button
          type="default"
          size="tiny"
          disabled={props.disabled || value >= max}
          onClick={() => updateValue(value + 1)}
        >
          Next
        </Button>
      </div>
    )
  },
}
