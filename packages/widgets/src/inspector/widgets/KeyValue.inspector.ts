import type { WidgetInspectorConfig } from '../../types'
import { buildInspectorConfig } from '../fieldRegistry'

const fieldKeys = ['label', 'data', 'variant', 'showDividers']

export const KeyValueInspector: WidgetInspectorConfig = buildInspectorConfig(fieldKeys, {
  data: {
    label: 'Data (JSON)',
    type: 'textarea',
    placeholder: '{ "key": "value" }',
    dependsOn: undefined,
  },
  variant: {
    label: 'Layout',
    type: 'select',
    section: 'Appearance',
    options: [
      { label: 'Auto', value: 'auto' },
      { label: 'Single column', value: 'single' },
      { label: 'Two columns', value: 'twoColumn' },
      { label: 'Wrap', value: 'wrap' },
    ],
  },
  showDividers: {
    label: 'Show cards',
    section: 'Appearance',
  },
})
