import type { WidgetInspectorConfig } from '../../types'
import { buildInspectorConfig } from '../fieldRegistry'

const fieldKeys = ['label', 'items', 'underline', 'disabled', 'events']

export const LinkListInspector: WidgetInspectorConfig = buildInspectorConfig(fieldKeys, {
  label: {
    section: 'Content',
    placeholder: 'Links',
  },
  items: {
    placeholder: '["Action 1","Action 2"]',
  },
  events: {
    section: 'Interaction',
    placeholder: '[{"event":"click","type":"query","queryName":"onClick"}]',
  },
})
