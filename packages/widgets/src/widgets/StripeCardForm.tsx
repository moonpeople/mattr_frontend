import { Button, Input } from 'ui'

import type { WidgetDefinition } from '../types'

type StripeCardFormProps = {
  publishableKey: string
  submitText: string
}

export const StripeCardFormWidget: WidgetDefinition<StripeCardFormProps> = {
  type: 'StripeCardForm',
  label: 'Stripe Card Form',
  category: 'inputs',
  description: 'Stripe payment form placeholder',
  defaultProps: {
    publishableKey: 'pk_test_replace_me',
    submitText: 'Submit',
  },
  fields: [
    { key: 'publishableKey', label: 'Publishable key', type: 'text', placeholder: 'pk_test_...' },
    { key: 'submitText', label: 'Submit text', type: 'text', placeholder: 'Submit' },
  ],
  render: (props) => (
    <div className="space-y-2 rounded border border-foreground-muted/40 bg-surface-100 p-3">
      <div className="text-xs font-medium text-foreground">Card details</div>
      <Input placeholder="Card number" />
      <div className="flex gap-2">
        <Input placeholder="MM/YY" />
        <Input placeholder="CVC" />
      </div>
      <Input placeholder="Name on card" />
      <Button type="primary" size="small" htmlType="button">
        {props.submitText}
      </Button>
      {props.publishableKey && <div className="text-xs text-foreground-muted">{props.publishableKey}</div>}
    </div>
  ),
}
