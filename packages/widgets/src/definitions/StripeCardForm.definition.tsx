import { Button, Input } from 'ui'

import { createWidgetDefinition } from '../types'

export type StripeCardFormProps = {
  publishableKey: string
  submitText: string
}

export const StripeCardFormDefinition = createWidgetDefinition<StripeCardFormProps>({
  type: 'StripeCardForm',
  label: 'Stripe Card Form',
  category: 'inputs',
  description: 'Stripe payment form placeholder',
  defaultProps: {
    publishableKey: 'pk_test_replace_me',
    submitText: 'Submit',
  },
  render: (props) => (
    <div className="space-y-2 rounded border border-border/40 bg-card p-3">
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
      {props.publishableKey && <div className="text-xs text-muted-foreground">{props.publishableKey}</div>}
    </div>
  ),
})
