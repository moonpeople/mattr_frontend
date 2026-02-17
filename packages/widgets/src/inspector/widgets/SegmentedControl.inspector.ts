import type { WidgetInspectorConfig } from '../../types'
import { buildInspectorConfig } from '../fieldRegistry'

const fieldKeys = [
  'label',
  'labelVariant',
  'value',
  'options',
  'required',
  'helperText',
  'disabled',
  'events',
]

export const SegmentedControlInspector: WidgetInspectorConfig = buildInspectorConfig(fieldKeys, {
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
    placeholder: '["Left","Right"]',
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
    placeholder: '[{"event":"change","type":"query","queryName":"onChange"}]',
  },
})
