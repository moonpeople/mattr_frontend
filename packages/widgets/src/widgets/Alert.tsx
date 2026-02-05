import { Alert } from 'ui'

import type { WidgetDefinition } from '../types'

type AlertProps = {
  title: string
  description: string
  variant: 'success' | 'danger' | 'warning' | 'info' | 'neutral'
  withIcon: boolean
}

export const AlertWidget: WidgetDefinition<AlertProps> = {
  type: 'Alert',
  label: 'Alert',
  category: 'presentation',
  description: 'Show alert message',
  defaultProps: {
    title: 'Info',
    description: 'Description',
    variant: 'info',
    withIcon: true,
  },
  fields: [
    { key: 'title', label: 'Title', type: 'text', placeholder: 'Title' },
    {
      key: 'description',
      label: 'Description',
      type: 'textarea',
      placeholder: 'Alert description',
    },
    {
      key: 'variant',
      label: 'Variant',
      type: 'select',
      options: [
        { label: 'Info', value: 'info' },
        { label: 'Success', value: 'success' },
        { label: 'Warning', value: 'warning' },
        { label: 'Danger', value: 'danger' },
        { label: 'Neutral', value: 'neutral' },
      ],
    },
    { key: 'withIcon', label: 'Show icon', type: 'boolean' },
  ],
  render: (props) => (
    <Alert title={props.title} variant={props.variant} withIcon={props.withIcon}>
      {props.description}
    </Alert>
  ),
}
