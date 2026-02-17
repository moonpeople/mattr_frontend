import type { WidgetInspectorConfig } from '../../types'
import { buildInspectorConfig } from '../fieldRegistry'

const fieldKeys = ['value', 'max', 'disabled', 'events']

export const PaginationInspector: WidgetInspectorConfig = buildInspectorConfig(fieldKeys, {
  value: {
    type: 'number',
    section: 'Content',
    min: 1,
    step: 1,
  },
  max: {
    type: 'number',
    section: 'Content',
    min: 1,
    step: 1,
  },
  events: {
    section: 'Interaction',
    placeholder: '[{"event":"change","type":"query","queryName":"onPage"}]',
  },
})
