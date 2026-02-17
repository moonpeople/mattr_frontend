import type { WidgetInspectorConfig } from '../../types'
import { buildInspectorConfig } from '../fieldRegistry'

const fieldKeys = ['label', 'columns', 'value', 'helperText', 'events']

export const FilterInspector: WidgetInspectorConfig = buildInspectorConfig(fieldKeys, {
  label: {
    section: 'Content',
    placeholder: 'Filters',
  },
  columns: {
    placeholder: '["name","status"]',
  },
  value: {
    label: 'Default filters (JSON)',
    type: 'textarea',
    placeholder: '{"operator":"and","filters":[]}',
    dependsOn: undefined,
  },
  events: {
    section: 'Interaction',
    placeholder: '[{"event":"apply","type":"query","queryName":"onApply"}]',
  },
})
