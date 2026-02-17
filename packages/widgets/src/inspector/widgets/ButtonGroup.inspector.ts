import type { WidgetInspectorConfig } from '../../types'
import { buildInspectorConfig } from '../fieldRegistry'

const fieldKeys = ['items', 'selectedIndex', 'events']

export const ButtonGroupInspector: WidgetInspectorConfig = buildInspectorConfig(fieldKeys, {
  items: {
    placeholder: '[{"label":"Solid","variant":"primary"}]',
  },
  selectedIndex: {
    min: -1,
    step: 1,
  },
  events: {
    section: 'Interaction',
    placeholder: '[{"event":"click","type":"query","queryName":"onClick"}]',
  },
})
