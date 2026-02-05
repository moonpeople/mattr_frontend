import { Input } from 'ui'

import type { WidgetDefinition } from '../types'
import { normalizeString } from '../helpers'

type NumberInputProps = {
  label: string
  placeholder: string
  value: string
  min?: number
  max?: number
  step?: number
  helperText: string
  disabled: boolean
  required: boolean
  events: string
}

export const NumberInputWidget: WidgetDefinition<NumberInputProps> = {
  type: 'NumberInput',
  label: 'Number Input',
  category: 'inputs',
  description: 'Numeric input',
  defaultProps: {
    label: 'Label',
    placeholder: 'Enter number',
    value: '',
    min: undefined,
    max: undefined,
    step: 1,
    helperText: '',
    disabled: false,
    required: false,
    events: '[]',
  },
  fields: [
    { key: 'label', label: 'Label', type: 'text', placeholder: 'Label' },
    { key: 'placeholder', label: 'Placeholder', type: 'text', placeholder: 'Enter number' },
    { key: 'value', label: 'Value', type: 'text', placeholder: 'Default value' },
    { key: 'min', label: 'Min', type: 'number' },
    { key: 'max', label: 'Max', type: 'number' },
    { key: 'step', label: 'Step', type: 'number', min: 0, step: 1 },
    { key: 'helperText', label: 'Helper text', type: 'text', placeholder: 'Help text' },
    { key: 'disabled', label: 'Disabled', type: 'boolean' },
    { key: 'required', label: 'Required', type: 'boolean' },
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
        type="number"
        placeholder={props.placeholder}
        value={normalizeString(context?.state?.value ?? props.value)}
        min={props.min}
        max={props.max}
        step={props.step}
        disabled={props.disabled}
        required={props.required}
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
