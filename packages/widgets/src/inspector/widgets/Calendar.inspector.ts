import type { WidgetInspectorConfig } from '../../types'
import { buildInspectorConfig } from '../fieldRegistry'

const fieldKeys = [
  'label',
  'labelVariant',
  'displayMode',
  'value',
  'showClearButton',
  'numberOfMonths',
  'showOutsideDays',
  'showWeekNumber',
  'weekStartsOn',
  'calendarCaptionLayout',
  'fromYear',
  'toYear',
  'disabledDates',
  'showInlineInput',
  'closeOnSelect',
  'required',
  'helperText',
  'disabled',
  'events',
]

export const CalendarInspector: WidgetInspectorConfig = buildInspectorConfig(fieldKeys, {
  label: { section: 'Content', placeholder: 'Label' },
  labelVariant: { section: 'Content' },
  value: { section: 'Content', placeholder: 'YYYY-MM-DD', valueType: ['string', 'void'] },
  helperText: { section: 'Add-ons', placeholder: 'Help text' },
  events: {
    section: 'Interaction',
    placeholder: '[{"event":"change","type":"query","queryName":"onChange"}]',
  },
})
