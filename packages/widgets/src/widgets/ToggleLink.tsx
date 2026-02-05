import type { WidgetDefinition } from '../types'

type ToggleLinkProps = {
  labelOn: string
  labelOff: string
  value: boolean
  underline: boolean
  disabled: boolean
  events: string
}

export const ToggleLinkWidget: WidgetDefinition<ToggleLinkProps> = {
  type: 'ToggleLink',
  label: 'Toggle Link',
  category: 'navigation',
  description: 'Toggle link',
  defaultProps: {
    labelOn: 'Hide',
    labelOff: 'Show',
    value: false,
    underline: true,
    disabled: false,
    events: '[]',
  },
  fields: [
    { key: 'labelOn', label: 'Label (on)', type: 'text', placeholder: 'Hide' },
    { key: 'labelOff', label: 'Label (off)', type: 'text', placeholder: 'Show' },
    { key: 'value', label: 'Value', type: 'boolean' },
    { key: 'underline', label: 'Underline', type: 'boolean' },
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
    const label = value ? props.labelOn : props.labelOff
    const className = `${props.underline ? 'underline' : 'no-underline'} text-brand-600 text-sm`

    return (
      <button
        type="button"
        className={`${className} ${props.disabled ? 'opacity-50' : ''}`}
        disabled={props.disabled}
        onClick={() => {
          const next = !value
          context?.setState?.({ value: next })
          context?.runActions?.('change', { value: next })
        }}
      >
        {label}
      </button>
    )
  },
}
