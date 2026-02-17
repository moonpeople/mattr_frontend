const LABEL_ADDON_WIDGETS = new Set([
  'EditableText',
  'EditableTextArea',
  'TextArea',
  'TextInput',
  'NumberInput',
  'Currency',
  'Percent',
  'PhoneNumberInput',
  'Email',
  'Url',
  'PasswordInput',
  'EditableNumber',
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
  'DatetimeInput',
])

export const isLabelAddonWidget = (widgetType?: string) => {
  if (!widgetType) {
    return false
  }
  return LABEL_ADDON_WIDGETS.has(widgetType)
}
