import type { WidgetInspectorConfig } from '../../types'
import { buildInspectorConfig } from '../fieldRegistry'

const fieldKeys = ['items', 'value', 'showNumbers', 'events']

export const StepsInspector: WidgetInspectorConfig = buildInspectorConfig(fieldKeys, {
  items: {
    label: 'Steps (JSON)',
    placeholder: '["Step 1","Step 2"]',
  },
  value: {
    section: 'Content',
    placeholder: 'Step 1',
  },
  events: {
    section: 'Interaction',
    placeholder: '[{"event":"change","type":"query","queryName":"onStep"}]',
  },
})
