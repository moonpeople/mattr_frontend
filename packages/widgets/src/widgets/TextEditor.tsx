import { TextArea_Shadcn_ } from 'ui'

import type { WidgetDefinition } from '../types'
import { normalizeString } from '../helpers'

type TextEditorProps = {
  label: string
  placeholder: string
  value: string
  rows: number
  helperText: string
  disabled: boolean
  events: string
}

export const TextEditorWidget: WidgetDefinition<TextEditorProps> = {
  type: 'TextEditor',
  label: 'Text Editor',
  category: 'inputs',
  description: 'Rich text input',
  defaultProps: {
    label: 'Label',
    placeholder: 'Enter content',
    value: '',
    rows: 6,
    helperText: '',
    disabled: false,
    events: '[]',
  },
  fields: [
    { key: 'label', label: 'Label', type: 'text', placeholder: 'Label' },
    { key: 'placeholder', label: 'Placeholder', type: 'text', placeholder: 'Enter content' },
    { key: 'value', label: 'Value', type: 'textarea', placeholder: 'Content' },
    { key: 'rows', label: 'Rows', type: 'number', min: 4, max: 20, step: 1 },
    { key: 'helperText', label: 'Helper text', type: 'text', placeholder: 'Help text' },
    { key: 'disabled', label: 'Disabled', type: 'boolean' },
    {
      key: 'events',
      label: 'Events (JSON)',
      type: 'json',
      placeholder: '[{"event":"change","type":"query","queryName":"onChange"}]',
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
        className="font-mono text-xs"
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
