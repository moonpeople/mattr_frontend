import type { WidgetInspectorConfig } from '../../types'
import { buildInspectorConfig } from '../fieldRegistry'

const fieldKeys = ['title', 'data', 'variant']

export const ChartInspector: WidgetInspectorConfig = buildInspectorConfig(fieldKeys, {
  data: {
    label: 'Data (JSON)',
    placeholder: '[{"label":"Jan","value":40}]',
    dependsOn: undefined,
  },
  variant: {
    options: [
      { label: 'Bar', value: 'bar' },
      { label: 'Line', value: 'line' },
    ],
  },
})
