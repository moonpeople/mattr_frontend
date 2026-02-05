import { Checkbox_Shadcn_ } from 'ui'

import type { WidgetDefinition } from '../types'

type CheckboxProps = {
  label: string
  checked: boolean
  helperText: string
  disabled: boolean
  events: string
}

export const CheckboxWidget: WidgetDefinition<CheckboxProps> = {
  type: 'Checkbox',
  label: 'Checkbox',
  category: 'inputs',
  description: 'Boolean checkbox',
  defaultProps: {
    label: 'Label',
    checked: false,
    helperText: '',
    disabled: false,
    events: '[]',
  },
  fields: [
    { key: 'label', label: 'Label', type: 'text', placeholder: 'Label' },
    { key: 'checked', label: 'Checked', type: 'boolean' },
    { key: 'helperText', label: 'Helper text', type: 'text', placeholder: 'Help text' },
    { key: 'disabled', label: 'Disabled', type: 'boolean' },
    {
      key: 'events',
      label: 'Events (JSON)',
      type: 'json',
      placeholder: '[{\"event\":\"change\",\"type\":\"query\",\"queryName\":\"onToggle\"}]',
    },
  ],
  render: (props, context) => (
    <div className="space-y-1">
      <label className="flex items-center gap-2 text-sm text-foreground">
        <Checkbox_Shadcn_
          checked={Boolean(context?.state?.checked ?? props.checked)}
          disabled={props.disabled}
          onCheckedChange={(checked) => {
            const next = checked === true
            context?.setState?.({ checked: next })
            context?.runActions?.('change', { checked: next })
          }}
        />
        <span>{props.label}</span>
      </label>
      {props.helperText && <div className="text-xs text-foreground-muted">{props.helperText}</div>}
    </div>
  ),
}
