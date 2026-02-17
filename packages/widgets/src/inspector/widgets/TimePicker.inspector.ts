import type { WidgetInspectorConfig } from '../../types'
import { buildInspectorConfig } from '../fieldRegistry'

const fieldKeys = [
  'label',
  'labelVariant',
  'placeholder',
  'value',
  'minuteStep',
  'hour12',
  'required',
  'helperText',
  'disabled',
  'events',
]

export const TimePickerInspector: WidgetInspectorConfig = buildInspectorConfig(fieldKeys, {
  label: {
    section: 'Content',
    placeholder: 'Label',
  },
  labelVariant: { section: 'Content' },
  placeholder: { section: 'Content', placeholder: 'HH:mm' },
  value: { section: 'Content', placeholder: 'HH:mm', valueType: ['string', 'void'] },
  helperText: {
    section: 'Add-ons',
    placeholder: 'Help text',
  },
  events: {
    section: 'Interaction',
    placeholder: '[{"event":"change","type":"query","queryName":"onChange"}]',
  },
})
