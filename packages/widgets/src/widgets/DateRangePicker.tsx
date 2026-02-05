import { Input } from 'ui'

import type { WidgetDefinition } from '../types'
import { normalizeString } from '../helpers'

type DateRangePickerProps = {
  label: string
  startDate: string
  endDate: string
  helperText: string
  disabled: boolean
  events: string
}

export const DateRangePickerWidget: WidgetDefinition<DateRangePickerProps> = {
  type: 'DateRangePicker',
  label: 'Date Range Picker',
  category: 'inputs',
  description: 'Select a date range',
  defaultProps: {
    label: 'Label',
    startDate: '',
    endDate: '',
    helperText: '',
    disabled: false,
    events: '[]',
  },
  fields: [
    { key: 'label', label: 'Label', type: 'text', placeholder: 'Label' },
    { key: 'startDate', label: 'Start date', type: 'text', placeholder: 'YYYY-MM-DD' },
    { key: 'endDate', label: 'End date', type: 'text', placeholder: 'YYYY-MM-DD' },
    { key: 'helperText', label: 'Helper text', type: 'text', placeholder: 'Help text' },
    { key: 'disabled', label: 'Disabled', type: 'boolean' },
    {
      key: 'events',
      label: 'Events (JSON)',
      type: 'json',
      placeholder: '[{\"event\":\"change\",\"type\":\"query\",\"queryName\":\"onChange\"}]',
    },
  ],
  render: (props, context) => {
    const state = context?.state ?? {}
    const startDate = normalizeString(state.startDate ?? props.startDate)
    const endDate = normalizeString(state.endDate ?? props.endDate)

    const updateRange = (patch: { startDate?: string; endDate?: string }) => {
      const next = { startDate, endDate, ...patch }
      context?.setState?.(next)
      context?.runActions?.('change', next)
    }

    return (
      <div className="space-y-2">
        {props.label && (
          <label className="text-xs font-medium text-foreground">{props.label}</label>
        )}
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={startDate}
            disabled={props.disabled}
            onChange={(event) => updateRange({ startDate: event.target.value })}
          />
          <Input
            type="date"
            value={endDate}
            disabled={props.disabled}
            onChange={(event) => updateRange({ endDate: event.target.value })}
          />
        </div>
        {props.helperText && <div className="text-xs text-foreground-muted">{props.helperText}</div>}
      </div>
    )
  },
}
