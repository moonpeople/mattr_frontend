import { TextArea_Shadcn_ } from 'ui'

import { normalizeString } from '../helpers'
import { createWidgetDefinition } from '../types'

export type TextEditorProps = {
  label: string
  placeholder: string
  value: string
  rows: number
  helperText: string
  disabled: boolean
  events: string
}

export const TextEditorDefinition = createWidgetDefinition<TextEditorProps>({
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
  render: (props, context) => (
    <div className="space-y-1">
      {props.label && <label className="text-xs font-medium text-foreground">{props.label}</label>}
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
      {props.helperText && <div className="text-xs text-muted-foreground">{props.helperText}</div>}
    </div>
  ),
})
