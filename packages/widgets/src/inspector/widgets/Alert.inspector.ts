import type { WidgetInspectorConfig } from '../../types'
import { buildInspectorConfig } from '../fieldRegistry'

const fieldKeys = ['title', 'description', 'variant', 'withIcon']

export const AlertInspector: WidgetInspectorConfig = buildInspectorConfig(fieldKeys, {
  variant: {
    options: [
      { label: 'Info', value: 'info' },
      { label: 'Success', value: 'success' },
      { label: 'Warning', value: 'warning' },
      { label: 'Danger', value: 'danger' },
      { label: 'Neutral', value: 'neutral' },
    ],
  },
})
