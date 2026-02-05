import { Switch } from 'ui'

import type { WidgetDefinition } from '../types'

type SwitchProps = {
  label: string
  checked: boolean
  helperText: string
  disabled: boolean
  events: string
}

export const SwitchWidget: WidgetDefinition<SwitchProps> = {
  type: 'Switch',
  label: 'Switch',
  category: 'inputs',
  description: 'Toggle input',
  defaultProps: {
    label: 'Enable feature',
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
      <label className="flex items-center justify-between gap-3 text-sm">
        <span className="text-foreground">{props.label}</span>
        <Switch
          checked={Boolean(context?.state?.checked ?? props.checked)}
          disabled={props.disabled}
          size="small"
          onCheckedChange={(checked) => {
            context?.setState?.({ checked })
            context?.runActions?.('change', { checked })
          }}
        />
      </label>
      {props.helperText && <div className="text-xs text-foreground-muted">{props.helperText}</div>}
    </div>
  ),
}
