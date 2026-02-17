import type { WidgetInspectorConfig } from '../../types'
import { buildInspectorConfig } from '../fieldRegistry'

const fieldKeys = ['text', 'size', 'tone', 'align']

export const TextInspector: WidgetInspectorConfig = buildInspectorConfig(fieldKeys, {
  text: {
    type: 'textarea',
    placeholder: 'Enter text',
  },
  size: {
    type: 'select',
    options: [
      { label: 'Small', value: 'sm' },
      { label: 'Medium', value: 'md' },
      { label: 'Large', value: 'lg' },
    ],
  },
})
