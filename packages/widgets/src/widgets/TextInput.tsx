import { Input } from 'ui'

import type { WidgetDefinition } from '../types'
import { normalizeString } from '../helpers'

type TextInputProps = {
  label: string
  placeholder: string
  value: string
  type: 'text' | 'email' | 'password' | 'number'
  helperText: string
  disabled: boolean
  required: boolean
  events: string
}

export const TextInputWidget: WidgetDefinition<TextInputProps> = {
  type: 'TextInput',
  label: 'Text Input',
  category: 'inputs',
  description: 'Single-line text input',
  defaultProps: {
    label: 'Label',
    placeholder: 'Enter value',
    value: '',
    type: 'text',
    helperText: '',
    disabled: false,
    required: false,
    events: '[]',
  },
  fields: [
    { key: 'label', label: 'Label', type: 'text', placeholder: 'Label' },
    { key: 'placeholder', label: 'Placeholder', type: 'text', placeholder: 'Enter value' },
    { key: 'value', label: 'Value', type: 'text', placeholder: 'Default value' },
    {
      key: 'type',
      label: 'Type',
      type: 'select',
      options: [
        { label: 'Text', value: 'text' },
        { label: 'Email', value: 'email' },
        { label: 'Password', value: 'password' },
        { label: 'Number', value: 'number' },
      ],
    },
    { key: 'helperText', label: 'Helper text', type: 'text', placeholder: 'Help text' },
    { key: 'disabled', label: 'Disabled', type: 'boolean' },
    { key: 'required', label: 'Required', type: 'boolean' },
    {
      key: 'events',
      label: 'Events (JSON)',
      type: 'json',
      placeholder: '[{\"event\":\"change\",\"type\":\"query\",\"queryName\":\"onInput\"}]',
    },
  ],
  render: (props, context) => (
    <div className="space-y-1">
      {props.label && (
        <label className="text-xs font-medium text-foreground">{props.label}</label>
      )}
      <Input
        type={props.type}
        placeholder={props.placeholder}
        value={normalizeString(context?.state?.value ?? props.value)}
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
