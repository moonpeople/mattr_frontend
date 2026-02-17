import type { WidgetInspectorConfig } from '../../types'
import { buildInspectorConfig } from '../fieldRegistry'

const fieldKeys = ['src', 'height', 'showToolbar', 'title']

export const PdfViewerInspector: WidgetInspectorConfig = buildInspectorConfig(fieldKeys, {
  src: {
    label: 'Source URL',
    placeholder: 'https://...',
  },
  height: {
    type: 'number',
    section: 'Content',
    min: 200,
    step: 20,
    source: 'props',
    segmentedFx: undefined,
  },
})
