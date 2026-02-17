import type { WidgetInspectorConfig } from '../../types'
import { buildInspectorConfig } from '../fieldRegistry'

const fieldKeys = ['keyTitle', 'valueTitle', 'data']

export const KeyValueMapInspector: WidgetInspectorConfig = buildInspectorConfig(fieldKeys, {
  data: {
    label: 'Data (JSON)',
    type: 'textarea',
    placeholder: '{ "a": 1, "b": 2 }',
    dependsOn: undefined,
  },
})
