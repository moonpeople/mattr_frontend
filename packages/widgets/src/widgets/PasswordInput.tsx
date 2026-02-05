import { Input } from 'ui'

import type { WidgetDefinition } from '../types'
import { normalizeString } from '../helpers'

type PasswordInputProps = {
  label: string
  placeholder: string
  value: string
  helperText: string
  disabled: boolean
  required: boolean
  events: string
}

export const PasswordInputWidget: WidgetDefinition<PasswordInputProps> = {
  type: 'PasswordInput',
  label: 'Password Input',
  category: 'inputs',
  description: 'Password input',
  defaultProps: {
    label: 'Password',
    placeholder: '••••••••',
    value: '',
    helperText: '',
    disabled: false,
    required: false,
    events: '[]',
  },
  fields: [
    { key: 'label', label: 'Label', type: 'text', placeholder: 'Label' },
    { key: 'placeholder', label: 'Placeholder', type: 'text', placeholder: '••••••••' },
    { key: 'value', label: 'Value', type: 'text', placeholder: 'Default value' },
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
        type="password"
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
