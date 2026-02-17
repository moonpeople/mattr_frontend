import type { WidgetInspectorConfig } from '../../types'
import { buildInspectorConfig } from '../fieldRegistry'

const fieldKeys = ['label', 'size', 'loading', 'disabled', 'events']

export const OutlineButtonInspector: WidgetInspectorConfig = buildInspectorConfig(fieldKeys, {
  label: {
    section: 'Content',
    placeholder: 'Outline',
  },
  size: {
    type: 'select',
    options: [
      { label: 'Tiny', value: 'tiny' },
      { label: 'Small', value: 'small' },
      { label: 'Medium', value: 'medium' },
    ],
  },
  events: {
    section: 'Interaction',
    placeholder: '[{"event":"click","type":"query","queryName":"onClick"}]',
  },
})
