import type { WidgetInspectorConfig } from '../../types'
import { buildInspectorConfig } from '../fieldRegistry'

const fieldKeys = [
  'label',
  'labelVariant',
  'value',
  'options',
  'groupLayout',
  'required',
  'helperText',
  'disabled',
  'events',
]

export const RadioGroupInspector: WidgetInspectorConfig = buildInspectorConfig(fieldKeys, {
  label: {
    section: 'Content',
    placeholder: 'Label',
  },
  labelVariant: {
    section: 'Content',
  },
  value: {
    section: 'Content',
    placeholder: 'Selected value',
    valueType: ['string', 'void'],
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
  helperText: {
    section: 'Add-ons',
    placeholder: 'Help text',
  },
  events: {
    section: 'Interaction',
    placeholder: '[{"event":"change","type":"query","queryName":"onSelect"}]',
  },
})
