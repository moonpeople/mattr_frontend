import type { WidgetInspectorConfig } from '../../types'
import { buildInspectorConfig } from '../fieldRegistry'

const fieldKeys = ['schema', 'data', 'uiSchema', 'submitText', 'hideSubmit']

export const JsonSchemaFormInspector: WidgetInspectorConfig = buildInspectorConfig(fieldKeys, {
  schema: {
    placeholder: '{"type":"object"}',
  },
  data: {
    label: 'Data',
    type: 'textarea',
    placeholder: '{}',
    dependsOn: undefined,
  },
  uiSchema: {
    placeholder: '{}',
  },
  submitText: {
    placeholder: 'Submit',
  },
})
