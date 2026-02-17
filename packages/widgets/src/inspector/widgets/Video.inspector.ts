import type { WidgetInspectorConfig } from '../../types'
import { buildInspectorConfig } from '../fieldRegistry'

const fieldKeys = ['src', 'autoplay', 'loop', 'showControls', 'helperText']

export const VideoInspector: WidgetInspectorConfig = buildInspectorConfig(fieldKeys, {
  src: {
    label: 'Source URL',
    placeholder: 'https://...',
  },
  helperText: {
    label: 'Helper text',
    placeholder: 'Help text',
  },
})
