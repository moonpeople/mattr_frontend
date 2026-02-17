import type { WidgetInspectorConfig } from '../../types'
import { buildInspectorConfig } from '../fieldRegistry'

const fieldKeys = [
  'label',
  'labelVariant',
  'displayMode',
  'placeholder',
  'value',
  'showCalendarIcon',
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
  'minuteStep',
  'hour12',
  'showTimeSlots',
  'timeSlots',
  'required',
  'helperText',
  'disabled',
  'events',
]

export const DateTimePickerInspector: WidgetInspectorConfig = buildInspectorConfig(fieldKeys, {
  label: {
    section: 'Content',
    placeholder: 'Label',
  },
  labelVariant: { section: 'Content' },
  placeholder: { section: 'Content', placeholder: 'Select date & time' },
  value: { section: 'Content', placeholder: 'YYYY-MM-DDTHH:mm', valueType: ['string', 'void'] },
  helperText: {
    section: 'Add-ons',
    placeholder: 'Help text',
  },
  events: {
    section: 'Interaction',
    placeholder: '[{"event":"change","type":"query","queryName":"onChange"}]',
  },
})
