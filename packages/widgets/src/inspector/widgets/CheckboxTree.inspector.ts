import type { WidgetInspectorConfig } from '../../types'
import { buildInspectorConfig } from '../fieldRegistry'

const fieldKeys = [
  'label',
  'labelVariant',
  'value',
  'options',
  'checkStrictly',
  'required',
  'minCount',
  'maxCount',
  'helperText',
  'disabled',
  'events',
]

export const CheckboxTreeInspector: WidgetInspectorConfig = buildInspectorConfig(fieldKeys, {
  labelVariant: {
    section: 'Content',
  },
  value: {
    label: 'Value (JSON)',
    type: 'json',
    placeholder: '["athletic","bags"]',
    valueType: ['array', 'string', 'void'],
  },
  options: {
    placeholder: '[{"label":"Shoes","children":[{"label":"Athletic","value":"athletic"}]}]',
  },
  checkStrictly: {
    section: 'Content',
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
    placeholder: '[{"event":"change","type":"query","queryName":"onChange"}]',
  },
})
