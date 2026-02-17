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

export const YearInspector: WidgetInspectorConfig = buildInspectorConfig(fieldKeys, {
  label: { section: 'Content', placeholder: 'Label' },
  labelVariant: { section: 'Content' },
  placeholder: { section: 'Content', placeholder: 'YYYY' },
  value: { section: 'Content', placeholder: 'YYYY', valueType: ['number', 'string', 'void'] },
  helperText: { section: 'Add-ons', placeholder: 'Help text' },
  events: { section: 'Interaction', placeholder: '[{"event":"change","type":"query","queryName":"onChange"}]' },
})
