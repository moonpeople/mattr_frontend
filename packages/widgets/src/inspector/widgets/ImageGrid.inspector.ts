import type { WidgetInspectorConfig } from '../../types'
import { buildInspectorConfig } from '../fieldRegistry'

const fieldKeys = ['images', 'columns', 'gap', 'aspectRatio']

export const ImageGridInspector: WidgetInspectorConfig = buildInspectorConfig(fieldKeys, {
  columns: {
    type: 'number',
    section: 'Content',
    min: 1,
    max: 6,
    step: 1,
  },
  gap: {
    section: 'Appearance',
    min: 0,
    max: 24,
    step: 2,
  },
  aspectRatio: {
    section: 'Appearance',
    min: 0.5,
    max: 2,
    step: 0.1,
  },
})
