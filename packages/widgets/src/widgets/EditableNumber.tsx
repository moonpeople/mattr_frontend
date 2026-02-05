import { Input } from 'ui'

import type { WidgetDefinition } from '../types'
import { normalizeString } from '../helpers'

type EditableNumberProps = {
  label: string
  placeholder: string
  value: string
  min?: number
  max?: number
  step?: number
  helperText: string
  disabled: boolean
  events: string
}

export const EditableNumberWidget: WidgetDefinition<EditableNumberProps> = {
  type: 'EditableNumber',
  label: 'Editable Number',
  category: 'inputs',
  description: 'Inline editable number',
  defaultProps: {
    label: 'Label',
    placeholder: 'Enter value',
    value: '',
    min: undefined,
    max: undefined,
    step: 1,
    helperText: '',
    disabled: false,
    events: '[]',
  },
  fields: [
    { key: 'label', label: 'Label', type: 'text', placeholder: 'Label' },
    { key: 'placeholder', label: 'Placeholder', type: 'text', placeholder: 'Enter value' },
    { key: 'value', label: 'Value', type: 'text', placeholder: 'Default value' },
    { key: 'min', label: 'Min', type: 'number' },
    { key: 'max', label: 'Max', type: 'number' },
    { key: 'step', label: 'Step', type: 'number', min: 0, step: 1 },
    { key: 'helperText', label: 'Helper text', type: 'text', placeholder: 'Help text' },
    { key: 'disabled', label: 'Disabled', type: 'boolean' },
    {
      key: 'events',
      label: 'Events (JSON)',
      type: 'json',
      placeholder: '[{\"event\":\"change\",\"type\":\"query\",\"queryName\":\"onEdit\"}]',
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
