import type { WidgetInspectorConfig } from '../../types'
import { buildInspectorConfig } from '../fieldRegistry'

const fieldKeys = ['label', 'value', 'searchable', 'helperText']

export const JsonExplorerInspector: WidgetInspectorConfig = buildInspectorConfig(fieldKeys, {
  value: {
    type: 'textarea',
    placeholder: '{\n  "key": "value"\n}',
  },
  searchable: {
    label: 'Searchable',
    section: 'Content',
  },
  helperText: {
    section: 'Add-ons',
    placeholder: 'Help text',
  },
})
