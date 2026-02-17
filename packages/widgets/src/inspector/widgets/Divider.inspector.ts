import type { WidgetInspectorConfig } from '../../types'
import { buildInspectorConfig } from '../fieldRegistry'

const fieldKeys = ['text']

export const DividerInspector: WidgetInspectorConfig = buildInspectorConfig(fieldKeys, {
  text: {
    label: 'Text',
    placeholder: 'Optional label',
  },
})
