import type { WidgetInspectorConfig } from '../../types'
import { buildInspectorConfig } from '../fieldRegistry'

const fieldKeys = ['publishableKey', 'submitText']

export const StripeCardFormInspector: WidgetInspectorConfig = buildInspectorConfig(fieldKeys, {
  publishableKey: {
    placeholder: 'pk_test_...',
  },
  submitText: {
    placeholder: 'Submit',
  },
})
