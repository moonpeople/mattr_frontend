import type { WidgetInspectorConfig } from '../../types'
import { buildInspectorConfig } from '../fieldRegistry'

const fieldKeys = [
  'label',
  'labelVariant',
  'displayMode',
  'placeholder',
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
  'required',
  'helperText',
  'disabled',
  'events',
]

export const DateRangePickerInspector: WidgetInspectorConfig = buildInspectorConfig(fieldKeys, {
  label: {
    section: 'Content',
    placeholder: 'Label',
  },
  labelVariant: { section: 'Content' },
  placeholder: { section: 'Content', placeholder: 'Select date range' },
  startDate: {
    section: 'Content',
    placeholder: 'YYYY-MM-DD',
  },
  endDate: {
    section: 'Content',
    placeholder: 'YYYY-MM-DD',
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
