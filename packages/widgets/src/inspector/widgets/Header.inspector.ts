import type { WidgetInspectorConfig } from '../../types'
import { buildInspectorConfig } from '../fieldRegistry'

const fieldKeys = ['title']

export const HeaderInspector: WidgetInspectorConfig = buildInspectorConfig(fieldKeys, {
  title: {
    placeholder: 'Header title',
  },
})
