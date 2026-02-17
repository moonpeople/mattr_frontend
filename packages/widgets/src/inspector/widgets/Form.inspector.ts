import type { WidgetInspectorConfig } from '../../types'
import { buildInspectorConfig } from '../fieldRegistry'

const fieldKeys = ['title', 'fields', 'submitLabel', 'events']

export const FormInspector: WidgetInspectorConfig = buildInspectorConfig(fieldKeys, {
  fields: {
    placeholder: '[{"label":"Name","type":"text"}]',
  },
  submitLabel: {
    placeholder: 'Submit',
  },
  events: {
    placeholder: '[{"event":"submit","type":"query","queryName":"saveForm"}]',
  },
})
