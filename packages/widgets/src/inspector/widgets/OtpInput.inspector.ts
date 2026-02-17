import type { WidgetInspectorConfig } from '../../types'
import { buildInspectorConfig } from '../fieldRegistry'

const fieldKeys = ['label', 'value', 'length', 'groupSize', 'helperText', 'disabled', 'events']

export const OtpInputInspector: WidgetInspectorConfig = buildInspectorConfig(fieldKeys, {
  label: {
    section: 'Content',
    placeholder: 'Label',
  },
  value: {
    section: 'Content',
    placeholder: 'Default value',
  },
  length: {
    type: 'number',
    min: 1,
    step: 1,
  },
  groupSize: {
    type: 'number',
    min: 0,
    step: 1,
    label: 'Group size',
  },
  helperText: {
    section: 'Add-ons',
    placeholder: 'Help text',
  },
  events: {
    placeholder: '[{"event":"change","type":"query","queryName":"onChange"}]',
  },
})
