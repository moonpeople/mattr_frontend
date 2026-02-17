import type { WidgetInspectorConfig } from '../../types'
import { buildInspectorConfig } from '../fieldRegistry'

const fieldKeys = ['icon', 'size', 'color']

export const IconInspector: WidgetInspectorConfig = buildInspectorConfig(fieldKeys, {
  size: {
    min: 12,
    max: 128,
    step: 2,
  },
  color: {
    type: 'color',
  },
})
