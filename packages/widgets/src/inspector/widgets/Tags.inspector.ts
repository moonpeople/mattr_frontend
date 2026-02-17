import type { WidgetInspectorConfig } from '../../types'
import { buildInspectorConfig } from '../fieldRegistry'

const fieldKeys = ['values', 'allowWrap', 'events']

export const TagsInspector: WidgetInspectorConfig = buildInspectorConfig(fieldKeys, {
  values: {
    label: 'Tags (JSON)',
    placeholder: '["Tag 1","Tag 2"]',
  },
  allowWrap: {
    section: 'Appearance',
  },
  events: {
    section: 'Interaction',
    placeholder: '[{"event":"click","type":"query","queryName":"onTag"}]',
  },
})
