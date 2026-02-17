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

export const MonthInspector: WidgetInspectorConfig = buildInspectorConfig(fieldKeys, {
  label: { section: 'Content', placeholder: 'Label' },
  labelVariant: { section: 'Content' },
  placeholder: { section: 'Content', placeholder: 'Select month' },
  value: { section: 'Content', placeholder: 'January', valueType: ['string', 'void'] },
  helperText: { section: 'Add-ons', placeholder: 'Help text' },
  events: { section: 'Interaction', placeholder: '[{"event":"change","type":"query","queryName":"onChange"}]' },
})
