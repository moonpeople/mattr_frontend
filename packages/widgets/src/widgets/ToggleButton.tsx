import { Button } from 'ui'

import type { WidgetDefinition } from '../types'

type ToggleButtonProps = {
  labelOn: string
  labelOff: string
  value: boolean
  disabled: boolean
  events: string
}

export const ToggleButtonWidget: WidgetDefinition<ToggleButtonProps> = {
  type: 'ToggleButton',
  label: 'Toggle Button',
  category: 'buttons',
  description: 'Toggle button',
  defaultProps: {
    labelOn: 'Hide',
    labelOff: 'Show',
    value: false,
    disabled: false,
    events: '[]',
  },
  fields: [
    { key: 'labelOn', label: 'Label (on)', type: 'text', placeholder: 'Hide' },
    { key: 'labelOff', label: 'Label (off)', type: 'text', placeholder: 'Show' },
    { key: 'value', label: 'Value', type: 'boolean' },
    { key: 'disabled', label: 'Disabled', type: 'boolean' },
    {
      key: 'events',
      label: 'Events (JSON)',
      type: 'json',
      placeholder: '[{\"event\":\"change\",\"type\":\"query\",\"queryName\":\"onToggle\"}]',
    },
  ],
  render: (props, context) => {
    const value = Boolean(context?.state?.value ?? props.value)
    return (
      <Button
        type={value ? 'primary' : 'outline'}
        size="tiny"
        disabled={props.disabled}
        onClick={() => {
          const next = !value
          context?.setState?.({ value: next })
          context?.runActions?.('change', { value: next })
        }}
      >
        {value ? props.labelOn : props.labelOff}
      </Button>
    )
  },
}
