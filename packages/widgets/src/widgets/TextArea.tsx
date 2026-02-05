import { TextArea_Shadcn_ } from 'ui'

import type { WidgetDefinition } from '../types'
import { normalizeString } from '../helpers'

type TextAreaProps = {
  label: string
  placeholder: string
  value: string
  rows: number
  helperText: string
  disabled: boolean
  required: boolean
  events: string
}

export const TextAreaWidget: WidgetDefinition<TextAreaProps> = {
  type: 'TextArea',
  label: 'Text Area',
  category: 'inputs',
  description: 'Multi-line text input',
  defaultProps: {
    label: 'Label',
    placeholder: 'Enter value',
    value: '',
    rows: 4,
    helperText: '',
    disabled: false,
    required: false,
    events: '[]',
  },
  fields: [
    { key: 'label', label: 'Label', type: 'text', placeholder: 'Label' },
    { key: 'placeholder', label: 'Placeholder', type: 'text', placeholder: 'Enter value' },
    { key: 'value', label: 'Value', type: 'text', placeholder: 'Default value' },
    { key: 'rows', label: 'Rows', type: 'number', min: 2, max: 12, step: 1 },
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
      <TextArea_Shadcn_
        rows={props.rows}
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
