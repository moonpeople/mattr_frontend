import type { WidgetInspectorConfig } from '../../types'
import { buildInspectorConfig } from '../fieldRegistry'

const fieldKeys = ['label', 'value', 'variant']

export const StatusInspector: WidgetInspectorConfig = buildInspectorConfig(fieldKeys, {
  label: {
    section: 'Content',
    placeholder: 'Status',
  },
  value: {
    section: 'Content',
    placeholder: 'Completed',
  },
  variant: {
    type: 'select',
    section: 'Appearance',
    options: [
      { label: 'Default', value: 'default' },
      { label: 'Success', value: 'success' },
      { label: 'Warning', value: 'warning' },
      { label: 'Destructive', value: 'destructive' },
    ],
  },
})
