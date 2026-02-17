import type { WidgetInspectorConfig } from '../../types'
import { buildInspectorConfig } from '../fieldRegistry'

const fieldKeys = ['label', 'items', 'disabled', 'events']

export const DropdownButtonInspector: WidgetInspectorConfig = buildInspectorConfig(fieldKeys, {
  label: {
    section: 'Content',
    placeholder: 'Menu',
  },
  items: {
    placeholder: '["Option 1","Option 2"]',
  },
  events: {
    placeholder: '[{"event":"select","type":"query","queryName":"onSelect"}]',
  },
})
