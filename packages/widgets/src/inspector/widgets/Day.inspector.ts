import type { WidgetInspectorConfig } from '../../types'
import { buildInspectorConfig } from '../fieldRegistry'

const fieldKeys = [
  'label',
  'labelVariant',
  'placeholder',
  'value',
  'required',
  'helperText',
  'disabled',
  'events',
]

export const DayInspector: WidgetInspectorConfig = buildInspectorConfig(fieldKeys, {
  label: { section: 'Content', placeholder: 'Label' },
  labelVariant: { section: 'Content' },
  placeholder: { section: 'Content', placeholder: 'DD' },
  value: { section: 'Content', placeholder: '1', valueType: ['number', 'string', 'void'] },
  helperText: { section: 'Add-ons', placeholder: 'Help text' },
  events: { section: 'Interaction', placeholder: '[{"event":"change","type":"query","queryName":"onChange"}]' },
})
