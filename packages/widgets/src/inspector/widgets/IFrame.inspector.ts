import type { WidgetInspectorConfig } from '../../types'
import { buildInspectorConfig } from '../fieldRegistry'

const fieldKeys = ['src', 'title', 'height']

export const IFrameInspector: WidgetInspectorConfig = buildInspectorConfig(fieldKeys, {
  src: {
    label: 'Source URL',
    placeholder: 'https://example.com',
  },
  height: {
    type: 'number',
    section: 'Content',
    min: 120,
    step: 20,
    source: 'props',
    segmentedFx: undefined,
  },
})
