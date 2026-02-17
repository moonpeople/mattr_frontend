import type { WidgetInspectorConfig } from '../../types'
import { buildInspectorConfig } from '../fieldRegistry'

const fieldKeys = [
  'data',
  'columnsMode',
  'columns',
  'primaryKey',
  'filterStack',
  'showHeader',
  'striped',
  'searchable',
  'rowLimit',
  'events',
]

export const TableInspector: WidgetInspectorConfig = buildInspectorConfig(fieldKeys, {
  data: {
    label: 'Data',
    placeholder: '[{"name":"Acme","status":"Active","seats":12}]',
    supportsFx: true,
    valueType: ['array', 'object'],
    dependsOn: undefined,
  },
  columnsMode: {
    label: 'Columns mode',
    section: 'Content',
  },
  columns: {
    label: 'Columns',
    control: 'collectionColumns',
    placeholder:
      '[{\"id\":\"column1\",\"source\":\"id\",\"label\":\"ID\",\"format\":\"Number\"},{\"id\":\"column2\",\"source\":\"name\",\"label\":\"User\",\"format\":\"String\"}]',
    supportsFx: true,
    valueType: ['array', 'object', 'string', 'undefined'],
    dependsOn: { key: 'columnsMode', value: 'manual' },
  },
  primaryKey: {
    label: 'Primary key',
    options: [],
    supportsFx: true,
    valueType: ['string', 'undefined'],
    dependsOn: undefined,
  },
  filterStack: {
    label: 'Filter stack (JSON)',
    placeholder: '{"operator":"and","filters":[{"columnId":"status","operator":"is","value":"Active"}]}',
    dependsOn: undefined,
  },
})
