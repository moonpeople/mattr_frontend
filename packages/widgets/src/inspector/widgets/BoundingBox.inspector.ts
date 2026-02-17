import type { WidgetInspectorConfig } from '../../types'
import { buildInspectorConfig } from '../fieldRegistry'

const fieldKeys = ['imageUrl', 'boxes', 'labels']

export const BoundingBoxInspector: WidgetInspectorConfig = buildInspectorConfig(fieldKeys, {
  imageUrl: {
    label: 'Image URL',
    placeholder: 'https://...',
  },
  boxes: {
    placeholder: '[{"x":0,"y":0,"width":100,"height":100}]',
  },
  labels: {
    label: 'Labels (JSON)',
    placeholder: '["Car","Person"]',
  },
})
