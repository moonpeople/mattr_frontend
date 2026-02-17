import type { WidgetInspectorConfig } from '../../types'
import { buildInspectorConfig } from '../fieldRegistry'

const fieldKeys = ['items', 'selectedIndex', 'disabled', 'events']

export const SplitButtonInspector: WidgetInspectorConfig = buildInspectorConfig(fieldKeys, {
  items: {
    placeholder: '["Option 1","Option 2"]',
  },
  selectedIndex: {
    type: 'number',
    min: 0,
    step: 1,
  },
  events: {
    placeholder: '[{"event":"select","type":"query","queryName":"onSelect"}]',
  },
})
