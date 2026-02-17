import type { WidgetInspectorConfig } from '../../types'
import { buildInspectorConfig } from '../fieldRegistry'

const fieldKeys = [
  'label',
  'labelVariant',
  'value',
  'options',
  'groupLayout',
  'required',
  'minCount',
  'maxCount',
  'helperText',
  'disabled',
  'events',
]

export const SwitchGroupInspector: WidgetInspectorConfig = buildInspectorConfig(fieldKeys, {
  label: {
    section: 'Content',
    placeholder: 'Label',
  },
  labelVariant: {
    section: 'Content',
  },
  value: {
    label: 'Value (JSON)',
    placeholder: '["option_1","option_2"]',
    valueType: ['array', 'string', 'void'],
  },
  options: {
    placeholder: '[{"label":"Option 1","value":"option_1"}]',
  },
  groupLayout: {
    section: 'Appearance',
  },
  required: {
    section: 'Interaction',
  },
  minCount: {
    section: 'Interaction',
    min: 0,
    max: 500,
    step: 1,
  },
  maxCount: {
    section: 'Interaction',
    min: 0,
    max: 500,
    step: 1,
  },
  helperText: {
    section: 'Add-ons',
    placeholder: 'Help text',
  },
  events: {
    section: 'Interaction',
    placeholder: '[{"event":"change","type":"query","queryName":"onChange"}]',
  },
})
