import type { WidgetInspectorConfig } from '../../types'
import { buildInspectorConfig } from '../fieldRegistry'

const fieldKeys = ['height']

export const SpacerInspector: WidgetInspectorConfig = buildInspectorConfig(fieldKeys, {
  height: {
    type: 'number',
    section: 'Content',
    min: 4,
    max: 400,
    step: 4,
    source: 'props',
    segmentedFx: undefined,
  },
})
