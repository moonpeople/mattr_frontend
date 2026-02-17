import rawPresets from './coss-input-presets.json'
import rawAnalysis from './coss-input-analysis.json'

export type CossInputPreset = {
  name: string
  label?: string
  widgetType: string
  props?: Record<string, unknown>
  notes?: string[]
}

const presets = (rawPresets as { presets?: CossInputPreset[] }).presets ?? []
const calendarPresets: CossInputPreset[] = [
  {
    name: 'comp-487',
    label: 'Calendar input (popover)',
    widgetType: 'CalendarInput',
    props: {
      label: 'Date',
      mode: 'date',
      displayMode: 'popover',
      showCalendarIcon: true,
      showClearButton: true,
    },
  },
  {
    name: 'comp-488',
    label: 'Calendar inline',
    widgetType: 'Calendar',
    props: {
      displayMode: 'inline',
      numberOfMonths: 1,
      showOutsideDays: true,
    },
  },
  {
    name: 'comp-489',
    label: 'Calendar inline + input',
    widgetType: 'Calendar',
    props: {
      displayMode: 'inline',
      showInlineInput: true,
      numberOfMonths: 1,
    },
  },
  {
    name: 'comp-490',
    label: 'Date range (popover)',
    widgetType: 'DateRange',
    props: {
      displayMode: 'popover',
      numberOfMonths: 2,
      showRangePresets: true,
      showClearButton: true,
    },
  },
  {
    name: 'comp-491',
    label: 'Date range inline',
    widgetType: 'DateRange',
    props: {
      displayMode: 'inline',
      numberOfMonths: 2,
      showRangePresets: true,
      showInlineInput: true,
    },
  },
  {
    name: 'comp-492',
    label: 'Date time (popover)',
    widgetType: 'DateTime',
    props: {
      displayMode: 'popover',
      minuteStep: 15,
      showTimeSlots: true,
      showCalendarIcon: true,
    },
  },
  {
    name: 'comp-493',
    label: 'Date time inline',
    widgetType: 'DateTime',
    props: {
      displayMode: 'inline',
      minuteStep: 15,
      showTimeSlots: true,
      showInlineInput: true,
    },
  },
  {
    name: 'comp-494',
    label: 'Calendar with week numbers',
    widgetType: 'Calendar',
    props: {
      displayMode: 'inline',
      showWeekNumber: true,
      weekStartsOn: 1,
    },
  },
  {
    name: 'comp-495',
    label: 'Calendar month/year dropdown',
    widgetType: 'Calendar',
    props: {
      displayMode: 'inline',
      calendarCaptionLayout: 'dropdown',
      fromYear: 2015,
      toYear: 2035,
    },
  },
  {
    name: 'comp-496',
    label: 'Calendar year dropdown',
    widgetType: 'Calendar',
    props: {
      displayMode: 'inline',
      calendarCaptionLayout: 'dropdown-years',
      fromYear: 2010,
      toYear: 2040,
    },
  },
  {
    name: 'comp-497',
    label: 'Calendar disabled weekends',
    widgetType: 'Calendar',
    props: {
      displayMode: 'inline',
      disabledDates: '[{"weekdays":[0,6]}]',
    },
  },
  {
    name: 'comp-498',
    label: 'Calendar disabled holidays',
    widgetType: 'Calendar',
    props: {
      displayMode: 'inline',
      disabledDates: '["2026-01-01","2026-12-25"]',
    },
  },
  {
    name: 'comp-499',
    label: 'Date input (native)',
    widgetType: 'Date',
    props: {
      displayMode: 'input',
      placeholder: 'YYYY-MM-DD',
      showCalendarIcon: false,
    },
  },
  {
    name: 'comp-500',
    label: 'Date input (popover no icon)',
    widgetType: 'Date',
    props: {
      displayMode: 'popover',
      showCalendarIcon: false,
      showClearButton: true,
    },
  },
  {
    name: 'comp-501',
    label: 'Time input 24h',
    widgetType: 'Time',
    props: {
      displayMode: 'input',
      hour12: false,
      minuteStep: 5,
    },
  },
  {
    name: 'comp-502',
    label: 'Time input 12h',
    widgetType: 'Time',
    props: {
      displayMode: 'input',
      hour12: true,
      minuteStep: 5,
    },
  },
  {
    name: 'comp-503',
    label: 'Month input',
    widgetType: 'Month',
    props: {
      displayMode: 'input',
      placeholder: 'YYYY-MM',
    },
  },
  {
    name: 'comp-504',
    label: 'Year input',
    widgetType: 'Year',
    props: {
      displayMode: 'input',
      placeholder: 'YYYY',
    },
  },
  {
    name: 'comp-505',
    label: 'Day input',
    widgetType: 'Day',
    props: {
      displayMode: 'input',
      placeholder: 'DD',
    },
  },
  {
    name: 'comp-506',
    label: 'Date range custom presets',
    widgetType: 'DateRange',
    props: {
      displayMode: 'popover',
      showRangePresets: true,
      rangePresets:
        '[{"label":"Last 7 days","days":6},{"label":"Last 30 days","days":29},{"label":"Q1 2026","startDate":"2026-01-01","endDate":"2026-03-31"}]',
    },
  },
  {
    name: 'comp-507',
    label: 'Date with year bounds',
    widgetType: 'Date',
    props: {
      displayMode: 'popover',
      fromYear: 2020,
      toYear: 2030,
      calendarCaptionLayout: 'dropdown',
    },
  },
  {
    name: 'comp-508',
    label: 'Date time with slots',
    widgetType: 'DateTime',
    props: {
      displayMode: 'popover',
      showTimeSlots: true,
      timeSlots: '["08:00","10:00","12:00","14:00","16:00","18:00"]',
    },
  },
  {
    name: 'comp-509',
    label: 'Calendar 2 months',
    widgetType: 'Calendar',
    props: {
      displayMode: 'inline',
      numberOfMonths: 2,
      showOutsideDays: true,
    },
  },
  {
    name: 'comp-510',
    label: 'Calendar compact (no outside days)',
    widgetType: 'Calendar',
    props: {
      displayMode: 'inline',
      numberOfMonths: 1,
      showOutsideDays: false,
      weekStartsOn: 1,
    },
  },
]
const analysisEntries = (rawAnalysis as { components?: { name: string; features?: string[] }[] })
  .components ?? []
const featuresByName = new Map(
  analysisEntries.map((entry) => [entry.name, new Set(entry.features ?? [])])
)

export const cossInputPresets = [...presets, ...calendarPresets]
export const cossInputPresetsByName = new Map(
  cossInputPresets.map((preset) => [preset.name, preset])
)

const presetTypeAliases: Record<string, { props?: Record<string, unknown> }> = {
  DatePicker: {
    props: {
      mode: 'date',
    },
  },
  DateTimePicker: {
    props: {
      mode: 'datetime',
    },
  },
}

const separateWidgetTypes = new Set([
  'TextArea',
  'PhoneNumberInput',
  'OtpInput',
  'Tags',
  'StripeCardForm',
  'DateRangePicker',
  'TimePicker',
  'DatetimeInput',
  'Calendar',
  'CalendarInput',
  'Date',
  'DateRange',
  'DateTime',
  'Day',
  'Month',
  'Time',
  'Year',
])

export const resolveCossPresetWidgetType = (preset: CossInputPreset) => {
  if (separateWidgetTypes.has(preset.widgetType)) {
    return preset.widgetType
  }
  if (preset.widgetType === 'EditableNumber') {
    return 'EditableNumber'
  }
  if (preset.widgetType === 'DatePicker' || preset.widgetType === 'DateTimePicker') {
    return 'DatetimeInput'
  }
  return 'TextInput'
}

const resolvePresetFeatureProps = (preset: CossInputPreset) => {
  const features = featuresByName.get(preset.name)
  if (!features) {
    return {}
  }

  const props: Record<string, unknown> = {}
  if (features.has('required_state')) {
    props.required = true
  }
  if (features.has('helper_text')) {
    props.helperText = 'Helper text'
  }
  if (features.has('tooltip')) {
    props.tooltip = 'Tooltip'
  }
  return props
}

export const resolveCossPresetAliasProps = (preset: CossInputPreset) => ({
  ...resolvePresetFeatureProps(preset),
  ...(presetTypeAliases[preset.widgetType]?.props ?? {}),
})

type CossInputPresetGroupConfig = {
  key: string
  label: string
  widgetTypes?: string[]
}

const presetGroupConfig: CossInputPresetGroupConfig[] = [
  { key: 'text', label: 'Text input', widgetTypes: ['TextInput'] },
  { key: 'number', label: 'Number input', widgetTypes: ['EditableNumber'] },
  { key: 'datetime', label: 'Datetime input', widgetTypes: ['DatetimeInput'] },
  {
    key: 'calendar',
    label: 'Date & time',
    widgetTypes: [
      'Calendar',
      'CalendarInput',
      'Date',
      'DateRange',
      'DateTime',
      'Day',
      'Month',
      'Time',
      'Year',
      'DatePicker',
      'DateRangePicker',
      'DateTimePicker',
      'TimePicker',
    ],
  },
  { key: 'text-area', label: 'Text area', widgetTypes: ['TextArea'] },
  { key: 'phone', label: 'Phone', widgetTypes: ['PhoneNumberInput'] },
  { key: 'otp', label: 'OTP', widgetTypes: ['OtpInput'] },
  { key: 'tags', label: 'Tags', widgetTypes: ['Tags'] },
  { key: 'payments', label: 'Payments', widgetTypes: ['StripeCardForm'] },
  { key: 'date-range', label: 'Date range', widgetTypes: ['DateRangePicker'] },
  { key: 'time', label: 'Time', widgetTypes: ['TimePicker'] },
  { key: 'other', label: 'Other' },
]

export type CossInputPresetGroup = {
  key: string
  label: string
  presets: CossInputPreset[]
}

export const groupCossInputPresets = (items: CossInputPreset[]): CossInputPresetGroup[] => {
  const groupMap = new Map(
    presetGroupConfig.map((group) => [group.key, { ...group, presets: [] as CossInputPreset[] }])
  )

  items.forEach((preset) => {
    const resolvedType = resolveCossPresetWidgetType(preset)
    const group = presetGroupConfig.find((entry) =>
      entry.widgetTypes?.includes(resolvedType)
    )
    const targetKey = group?.key ?? 'other'
    const target = groupMap.get(targetKey)
    if (!target) {
      return
    }
    target.presets.push(preset)
  })

  return presetGroupConfig
    .map((group) => {
      const entry = groupMap.get(group.key)
      if (!entry) {
        return null
      }
      return { key: group.key, label: group.label, presets: entry.presets }
    })
    .filter(Boolean) as CossInputPresetGroup[]
}
