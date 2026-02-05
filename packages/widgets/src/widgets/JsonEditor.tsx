import { TextArea_Shadcn_ } from 'ui'

import type { WidgetDefinition } from '../types'
import { normalizeString } from '../helpers'

type JsonEditorProps = {
  label: string
  value: string
  rows: number
  helperText: string
  disabled: boolean
  events: string
}

const normalizeJsonValue = (value: unknown) => {
  if (typeof value === 'string') {
    return value
  }
  try {
    return JSON.stringify(value ?? {}, null, 2)
  } catch {
    return normalizeString(value, '')
  }
}

export const JsonEditorWidget: WidgetDefinition<JsonEditorProps> = {
  type: 'JsonEditor',
  label: 'JSON Editor',
  category: 'data',
  description: 'Edit JSON content',
  defaultProps: {
    label: 'JSON',
    value: '{\n  "key": "value"\n}',
    rows: 10,
    helperText: '',
    disabled: false,
    events: '[]',
  },
  fields: [
    { key: 'label', label: 'Label', type: 'text', placeholder: 'JSON' },
    {
      key: 'value',
      label: 'Value',
      type: 'textarea',
      placeholder: '{\n  "key": "value"\n}',
    },
    { key: 'rows', label: 'Rows', type: 'number', min: 4, max: 20, step: 1 },
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
    const value = normalizeJsonValue(context?.state?.value ?? props.value)

    return (
      <div className="space-y-1">
        {props.label && (
          <label className="text-xs font-medium text-foreground">{props.label}</label>
        )}
        <TextArea_Shadcn_
          rows={props.rows}
          value={value}
          disabled={props.disabled}
          className="font-mono text-xs"
          onChange={(event) => {
            const next = event.target.value
            context?.setState?.({ value: next })
            context?.runActions?.('change', { value: next })
          }}
        />
        {props.helperText && <div className="text-xs text-foreground-muted">{props.helperText}</div>}
      </div>
    )
  },
}
