import { Input } from 'ui'

import type { WidgetDefinition } from '../types'
import { normalizeString } from '../helpers'

type PhoneNumberInputProps = {
  label: string
  placeholder: string
  value: string
  helperText: string
  disabled: boolean
  events: string
}

export const PhoneNumberInputWidget: WidgetDefinition<PhoneNumberInputProps> = {
  type: 'PhoneNumberInput',
  label: 'Phone Number',
  category: 'inputs',
  description: 'Phone number input',
  defaultProps: {
    label: 'Label',
    placeholder: '+1 (555) 000-0000',
    value: '',
    helperText: '',
    disabled: false,
    events: '[]',
  },
  fields: [
    { key: 'label', label: 'Label', type: 'text', placeholder: 'Label' },
    { key: 'placeholder', label: 'Placeholder', type: 'text', placeholder: '+1 (555) 000-0000' },
    { key: 'value', label: 'Value', type: 'text', placeholder: 'Default value' },
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
        type="tel"
        placeholder={props.placeholder}
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
