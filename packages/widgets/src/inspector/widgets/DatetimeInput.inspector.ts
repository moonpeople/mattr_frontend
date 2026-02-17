import type { WidgetInspectorConfig } from '../../types'
import { buildInspectorConfig } from '../fieldRegistry'

const fieldKeys = [
  'label',
  'labelVariant',
  'mode',
  'displayMode',
  'placeholder',
  'value',
  'startDate',
  'endDate',
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
  'showRangePresets',
  'rangePresets',
  'minuteStep',
  'hour12',
  'showTimeSlots',
  'timeSlots',
  'helperText',
  'disabled',
  'required',
  'events',
]

export const DatetimeInputInspector: WidgetInspectorConfig = buildInspectorConfig(fieldKeys, {
  label: {
    section: 'Content',
    placeholder: 'Label',
  },
  labelVariant: { section: 'Content' },
  mode: {
    section: 'Content',
  },
  displayMode: { section: 'Appearance' },
  placeholder: { section: 'Content', placeholder: 'Select value' },
  value: {
    section: 'Content',
    placeholder: 'YYYY-MM-DD',
    valueType: ['string', 'void'],
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
