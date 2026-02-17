import type { WidgetInspectorConfig } from '../../types'
import { buildInspectorConfig } from '../fieldRegistry'

const fieldKeys = ['text', 'labels']

export const TextAnnotationInspector: WidgetInspectorConfig = buildInspectorConfig(fieldKeys, {
  text: {
    type: 'textarea',
    placeholder: 'Text to annotate',
  },
  labels: {
    label: 'Labels (JSON)',
    placeholder: '["label1","label2"]',
  },
})
