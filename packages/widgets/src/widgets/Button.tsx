import { Button } from 'ui'

import type { WidgetDefinition } from '../types'

type ButtonProps = {
  label: string
  variant: 'primary' | 'default' | 'secondary' | 'outline'
  size: 'tiny' | 'small' | 'medium'
  loading: boolean
  disabled: boolean
  events: string
}

export const ButtonWidget: WidgetDefinition<ButtonProps> = {
  type: 'Button',
  label: 'Button',
  category: 'buttons',
  description: 'Clickable button',
  defaultProps: {
    label: 'Click me',
    variant: 'primary',
    size: 'small',
    loading: false,
    disabled: false,
    events: '[]',
  },
  fields: [
    { key: 'label', label: 'Label', type: 'text', placeholder: 'Button label' },
    {
      key: 'variant',
      label: 'Variant',
      type: 'select',
      options: [
        { label: 'Primary', value: 'primary' },
        { label: 'Default', value: 'default' },
        { label: 'Secondary', value: 'secondary' },
        { label: 'Outline', value: 'outline' },
      ],
    },
    {
      key: 'size',
      label: 'Size',
      type: 'select',
      options: [
        { label: 'Tiny', value: 'tiny' },
        { label: 'Small', value: 'small' },
        { label: 'Medium', value: 'medium' },
      ],
    },
    { key: 'loading', label: 'Loading', type: 'boolean' },
    { key: 'disabled', label: 'Disabled', type: 'boolean' },
    {
      key: 'events',
      label: 'Events (JSON)',
      type: 'json',
      placeholder: '[{\"event\":\"click\",\"type\":\"query\",\"queryName\":\"getUsers\"}]',
    },
  ],
  render: (props, context) => (
    <Button
      type={props.variant}
      size={props.size}
      htmlType="button"
      loading={props.loading}
      disabled={props.disabled}
      onClick={() => context?.runActions?.('click')}
    >
      {props.label}
    </Button>
  ),
}
