import type { WidgetInspectorConfig } from '../../types'
import { buildInspectorConfig } from '../fieldRegistry'

const fieldKeys = ['value', 'size', 'helperText']

export const QRCodeInspector: WidgetInspectorConfig = buildInspectorConfig(fieldKeys, {
  value: {
    label: 'Value',
    placeholder: 'https://example.com',
  },
  size: {
    min: 80,
    max: 512,
    step: 8,
  },
  helperText: {
    label: 'Helper text',
    placeholder: 'Help text',
  },
})
