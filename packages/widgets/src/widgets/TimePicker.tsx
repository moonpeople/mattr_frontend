import { Input } from 'ui'

import type { WidgetDefinition } from '../types'
import { normalizeString } from '../helpers'

type TimePickerProps = {
  label: string
  value: string
  helperText: string
  disabled: boolean
  events: string
}

export const TimePickerWidget: WidgetDefinition<TimePickerProps> = {
  type: 'TimePicker',
  label: 'Time Picker',
  category: 'inputs',
  description: 'Select a time',
  defaultProps: {
    label: 'Label',
    value: '',
    helperText: '',
    disabled: false,
    events: '[]',
  },
  fields: [
    { key: 'label', label: 'Label', type: 'text', placeholder: 'Label' },
    { key: 'value', label: 'Value', type: 'text', placeholder: 'HH:mm' },
    { key: 'helperText', label: 'Helper text', type: 'text', placeholder: 'Help text' },
    { key: 'disabled', label: 'Disabled', type: 'boolean' },
    {
      key: 'events',
      label: 'Events (JSON)',
      type: 'json',
      placeholder: '[{\"event\":\"change\",\"type\":\"query\",\"queryName\":\"onChange\"}]',
    },
  ],
  render: (props, context) => (
    <div className="space-y-1">
      {props.label && (
        <label className="text-xs font-medium text-foreground">{props.label}</label>
      )}
      <Input
        type="time"
        value={normalizeString(context?.state?.value ?? props.value)}
        disabled={props.disabled}
        onChange={(event) => {
          const next = event.target.value
          context?.setState?.({ value: next })
          context?.runActions?.('change', { value: next })
        }}
      />
      {props.helperText && <div className="text-xs text-foreground-muted">{props.helperText}</div>}
    </div>
  ),
}
