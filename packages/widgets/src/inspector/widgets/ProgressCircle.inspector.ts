import type { WidgetInspectorConfig } from '../../types'
import { buildInspectorConfig } from '../fieldRegistry'

const fieldKeys = ['value', 'size', 'strokeWidth', 'showValue']

export const ProgressCircleInspector: WidgetInspectorConfig = buildInspectorConfig(fieldKeys, {
  value: {
    type: 'number',
    section: 'Content',
    min: 0,
    max: 100,
    step: 1,
  },
  size: {
    section: 'Content',
    min: 48,
    max: 200,
    step: 4,
  },
  strokeWidth: {
    section: 'Appearance',
    min: 4,
    max: 16,
    step: 1,
  },
})
