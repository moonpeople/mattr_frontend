import type { WidgetInspectorConfig } from '../../types'
import { buildInspectorConfig } from '../fieldRegistry'

const fieldKeys = ['images', 'fallbacks', 'maxItems', 'size']

export const AvatarGroupInspector: WidgetInspectorConfig = buildInspectorConfig(fieldKeys, {
  maxItems: {
    min: 1,
    max: 12,
    step: 1,
  },
  size: {
    min: 20,
    max: 64,
    step: 4,
  },
})
