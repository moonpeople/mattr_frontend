import type { WidgetInspectorConfig } from '../../types'
import { buildInspectorConfig } from '../fieldRegistry'

const fieldKeys = ['label', 'variant', 'size', 'loading', 'disabled', 'events']

export const ButtonInspector: WidgetInspectorConfig = buildInspectorConfig(fieldKeys, {
  label: {
    section: 'Content',
    placeholder: 'Button label',
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
