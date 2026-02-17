import type { WidgetInspectorConfig } from '../../types'
import { buildInspectorConfig } from '../fieldRegistry'

const fieldKeys = ['label', 'emptyMessage', 'showClear', 'disabled']

export const SignaturePadInspector: WidgetInspectorConfig = buildInspectorConfig(fieldKeys, {
  label: {
    section: 'Content',
    placeholder: 'Signature',
  },
  emptyMessage: {
    placeholder: 'Sign here',
  },
})
