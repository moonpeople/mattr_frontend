import type { WidgetInspectorConfig } from '../../types'
import { buildInspectorConfig } from '../fieldRegistry'

const fieldKeys = ['items', 'helperText', 'disabled', 'events']

export const ReorderableListInspector: WidgetInspectorConfig = buildInspectorConfig(fieldKeys, {
  items: {
    placeholder: '["Item 1","Item 2"]',
  },
  helperText: {
    section: 'Add-ons',
    placeholder: 'Help text',
  },
  events: {
    section: 'Interaction',
    placeholder: '[{"event":"reorder","type":"query","queryName":"onReorder"}]',
  },
})
