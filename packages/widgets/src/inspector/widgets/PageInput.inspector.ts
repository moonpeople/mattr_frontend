import type { WidgetInspectorConfig } from '../../types'
import { buildInspectorConfig } from '../fieldRegistry'

const fieldKeys = ['value', 'max', 'prefix', 'suffix', 'disabled', 'events']

export const PageInputInspector: WidgetInspectorConfig = buildInspectorConfig(fieldKeys, {
  value: {
    type: 'number',
    min: 1,
    step: 1,
  },
  max: {
    type: 'number',
    min: 1,
    step: 1,
  },
  prefix: {
    placeholder: 'Page',
  },
  suffix: {
    placeholder: 'of {{ max }}',
  },
  events: {
    placeholder: '[{"event":"change","type":"query","queryName":"onChange"}]',
  },
})
