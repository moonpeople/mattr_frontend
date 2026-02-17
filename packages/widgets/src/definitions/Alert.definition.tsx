import { Alert } from 'ui'

import { createWidgetDefinition } from '../types'

export type AlertProps = {
  title: string
  description: string
  variant: 'success' | 'danger' | 'warning' | 'info' | 'neutral'
  withIcon: boolean
}

export const AlertDefinition = createWidgetDefinition<AlertProps>({
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
  render: (props) => (
    <Alert title={props.title} variant={props.variant} withIcon={props.withIcon}>
      {props.description}
    </Alert>
  ),
})
