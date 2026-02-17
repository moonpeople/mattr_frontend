import type { WidgetInspectorConfig } from '../../types'
import { buildInspectorConfig } from '../fieldRegistry'

const fieldKeys = [
  'value',
  'readOnly',
  'formDataKey',
  'events',
]

export const JsonEditorInspector: WidgetInspectorConfig = buildInspectorConfig(fieldKeys, {
  value: {
    type: 'text',
    label: 'Value',
    placeholder: '{\n  "key": "value"\n}',
    valueType: ['object', 'number', 'boolean', 'string', 'void', 'array'],
  },
  events: {
    placeholder: '[{"event":"change","type":"query","queryName":"onChange"}]',
  },
})
