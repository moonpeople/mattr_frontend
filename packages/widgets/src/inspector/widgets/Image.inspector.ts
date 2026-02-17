import type { WidgetInspectorConfig } from '../../types'
import { buildInspectorConfig } from '../fieldRegistry'

const fieldKeys = ['src', 'alt', 'width', 'height', 'rounded', 'fit']

export const ImageInspector: WidgetInspectorConfig = buildInspectorConfig(fieldKeys, {
  src: {
    label: 'Source URL',
    placeholder: 'https://...',
  },
  height: {
    type: 'number',
    section: 'Content',
    min: 40,
    max: 2000,
    step: 10,
    source: 'props',
    segmentedFx: undefined,
  },
})
