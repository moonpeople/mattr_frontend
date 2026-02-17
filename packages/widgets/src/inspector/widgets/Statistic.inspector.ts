import type { WidgetInspectorConfig } from '../../types'
import { buildInspectorConfig } from '../fieldRegistry'

const fieldKeys = ['label', 'value', 'prefix', 'suffix', 'caption', 'helperText', 'events']

export const StatisticInspector: WidgetInspectorConfig = buildInspectorConfig(fieldKeys, {
  label: {
    section: 'Content',
    placeholder: 'Metric',
  },
  value: {
    section: 'Content',
    placeholder: '0',
  },
  prefix: {
    section: 'Content',
    placeholder: '$',
  },
  suffix: {
    section: 'Content',
    placeholder: '%',
  },
  caption: {
    section: 'Content',
    placeholder: 'Since last month',
  },
  helperText: {
    section: 'Add-ons',
    placeholder: 'Help text',
  },
  events: {
    section: 'Interaction',
    placeholder: '[{"event":"click","type":"query","queryName":"onClick"}]',
  },
})
