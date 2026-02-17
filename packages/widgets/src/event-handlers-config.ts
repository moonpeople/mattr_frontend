import type { WidgetCategory, WidgetDefinition, WidgetFieldOption } from './types'

const EVENT_LABELS: Record<string, string> = {
  action: 'Action',
  apply: 'Apply',
  blur: 'Blur',
  change: 'Change',
  click: 'Click',
  focus: 'Focus',
  reorder: 'Reorder',
  rowClick: 'Row click',
  rowSelect: 'Row select',
  sortChange: 'Sort change',
  pageChange: 'Page change',
  scan: 'Scan',
  select: 'Select',
  send: 'Send',
  stepChange: 'Step change',
  submit: 'Submit',
  toggle: 'Toggle',
}

const ACTION_OPTIONS_FULL: WidgetFieldOption[] = [
  { value: 'controlComponent', label: 'Control component' },
  { value: 'query', label: 'Control query' },
  { value: 'js', label: 'Run script' },
  { value: 'goToApp', label: 'Go to app' },
  { value: 'goToPage', label: 'Go to page' },
  { value: 'openUrl', label: 'Go to URL' },
  { value: 'notification', label: 'Show notification' },
  { value: 'setState', label: 'Set variable' },
  { value: 'setUrlParams', label: 'Set URL params' },
  { value: 'setLocalStorage', label: 'Set local storage' },
  { value: 'copyToClipboard', label: 'Copy to clipboard' },
  { value: 'exportData', label: 'Export data' },
  { value: 'confetti', label: 'Confetti' },
]

const ACTION_OPTIONS_BY_VALUE = ACTION_OPTIONS_FULL.reduce(
  (acc, option) => {
    acc[option.value] = option
    return acc
  },
  {} as Record<string, WidgetFieldOption>
)

const pickActionOptions = (values: string[]): WidgetFieldOption[] =>
  values
    .map((value) => ACTION_OPTIONS_BY_VALUE[value])
    .filter((option): option is WidgetFieldOption => Boolean(option))

const ACTION_OPTIONS_DISPLAY = pickActionOptions([
  'controlComponent',
  'query',
  'js',
  'goToApp',
  'goToPage',
  'openUrl',
  'notification',
  'setState',
  'setUrlParams',
  'setLocalStorage',
  'copyToClipboard',
  'confetti',
])

const ACTION_OPTIONS_INPUT = pickActionOptions([
  'controlComponent',
  'query',
  'js',
  'goToApp',
  'goToPage',
  'openUrl',
  'notification',
  'setState',
  'setUrlParams',
  'setLocalStorage',
  'copyToClipboard',
  'confetti',
])

const ACTION_OPTIONS_SUBMIT = pickActionOptions([
  'query',
  'js',
  'controlComponent',
  'notification',
  'setState',
  'setUrlParams',
  'setLocalStorage',
  'copyToClipboard',
  'goToPage',
  'goToApp',
  'openUrl',
  'confetti',
])

const ACTION_OPTIONS_DATA = pickActionOptions([
  'controlComponent',
  'query',
  'js',
  'goToApp',
  'goToPage',
  'openUrl',
  'notification',
  'setState',
  'setUrlParams',
  'setLocalStorage',
  'copyToClipboard',
  'exportData',
  'confetti',
])

const ACTION_OPTIONS_BY_PROFILE: Record<string, WidgetFieldOption[]> = {
  full: ACTION_OPTIONS_FULL,
  data: ACTION_OPTIONS_DATA,
  display: ACTION_OPTIONS_DISPLAY,
  input: ACTION_OPTIONS_INPUT,
  submit: ACTION_OPTIONS_SUBMIT,
  none: [],
}

const ACTION_PROFILE_BY_CATEGORY: Partial<Record<WidgetCategory, string>> = {
  buttons: 'display',
  charts: 'display',
  containers: 'input',
  custom: 'input',
  data: 'data',
  globals: 'full',
  inputs: 'input',
  navigation: 'display',
  presentation: 'display',
}

const ACTION_PROFILE_BY_WIDGET_TYPE: Record<string, string> = {
  AgentChat: 'submit',
  AuthLogin: 'submit',
  Breadcrumbs: 'display',
  Button: 'display',
  ButtonGroup: 'display',
  Calendar: 'input',
  CalendarInput: 'input',
  Cascader: 'input',
  Chat: 'submit',
  Checkbox: 'input',
  CheckboxGroup: 'input',
  CheckboxTree: 'input',
  CloseButton: 'display',
  CollapsibleContainer: 'input',
  ColorInput: 'input',
  CommentThread: 'submit',
  Currency: 'input',
  Date: 'input',
  DatePicker: 'input',
  DateRange: 'input',
  DateRangePicker: 'input',
  DateTime: 'input',
  DateTimePicker: 'input',
  DatetimeInput: 'input',
  Day: 'input',
  DropdownButton: 'display',
  EditableNumber: 'input',
  EditableText: 'input',
  EditableTextArea: 'input',
  Email: 'input',
  FileUpload: 'input',
  Filter: 'submit',
  Form: 'submit',
  JsonEditor: 'data',
  JsonSchemaForm: 'submit',
  Link: 'display',
  LinkCard: 'display',
  LinkList: 'display',
  Listbox: 'input',
  Microphone: 'input',
  Month: 'input',
  MultiSelect: 'input',
  MultiSelectListbox: 'input',
  Navigation: 'display',
  NumberInput: 'input',
  OtpInput: 'input',
  PageInput: 'input',
  Pagination: 'input',
  PasswordInput: 'input',
  Percent: 'input',
  PhoneNumberInput: 'input',
  ProgressBar: 'display',
  RadioGroup: 'input',
  RangeSlider: 'input',
  Rating: 'input',
  ReorderableList: 'data',
  Scanner: 'input',
  SegmentedControl: 'input',
  Select: 'input',
  SignaturePad: 'input',
  Slider: 'input',
  SplitButton: 'display',
  Statistic: 'display',
  SteppedContainer: 'input',
  Steps: 'input',
  Switch: 'input',
  SwitchGroup: 'input',
  TabbedContainer: 'input',
  Table: 'data',
  Tags: 'display',
  TextArea: 'input',
  TextEditor: 'data',
  TextInput: 'input',
  Time: 'input',
  TimePicker: 'input',
  ToggleButton: 'input',
  ToggleLink: 'display',
  Url: 'input',
  Wizard: 'input',
  Year: 'input',
}

const EVENT_KEYS_BY_WIDGET_TYPE: Record<string, string[]> = {
  AgentChat: ['send'],
  AuthLogin: ['submit'],
  Breadcrumbs: ['click'],
  Button: ['click'],
  ButtonGroup: ['click'],
  Calendar: ['change'],
  CalendarInput: ['change'],
  Cascader: ['change'],
  Chat: ['send'],
  Checkbox: ['change'],
  CheckboxGroup: ['change'],
  CheckboxTree: ['change'],
  CloseButton: ['click'],
  CollapsibleContainer: ['toggle'],
  ColorInput: ['change'],
  CommentThread: ['submit'],
  Currency: ['change', 'focus', 'blur'],
  Date: ['change'],
  DatePicker: ['change'],
  DateRange: ['change'],
  DateRangePicker: ['change'],
  DateTime: ['change'],
  DateTimePicker: ['change'],
  DatetimeInput: ['change'],
  Day: ['change'],
  DropdownButton: ['click', 'select'],
  EditableNumber: ['change', 'focus', 'blur'],
  EditableText: ['change', 'focus', 'blur'],
  EditableTextArea: ['change', 'focus', 'blur'],
  Email: ['change', 'focus', 'blur', 'submit', 'action'],
  FileUpload: ['change'],
  Filter: ['change', 'apply'],
  Form: ['submit'],
  JsonEditor: ['change', 'focus', 'blur'],
  JsonSchemaForm: ['submit'],
  Link: ['click'],
  LinkCard: ['click'],
  LinkList: ['click'],
  Listbox: ['change'],
  Microphone: ['change'],
  Month: ['change'],
  MultiSelect: ['change'],
  MultiSelectListbox: ['change'],
  Navigation: ['click'],
  NumberInput: ['change', 'focus', 'blur'],
  OtpInput: ['change'],
  PageInput: ['change'],
  Pagination: ['change'],
  PasswordInput: ['change', 'focus', 'blur', 'submit', 'action'],
  Percent: ['change', 'focus', 'blur'],
  PhoneNumberInput: ['change', 'focus', 'blur'],
  ProgressBar: ['click'],
  RadioGroup: ['change'],
  RangeSlider: ['change'],
  Rating: ['change'],
  ReorderableList: ['change', 'reorder'],
  Scanner: ['change', 'scan'],
  SegmentedControl: ['change'],
  Select: ['change'],
  SignaturePad: ['change'],
  Slider: ['change'],
  SplitButton: ['click', 'select'],
  Statistic: ['click'],
  SteppedContainer: ['change'],
  Steps: ['change'],
  Switch: ['change'],
  SwitchGroup: ['change'],
  TabbedContainer: ['change'],
  Table: ['rowClick', 'rowSelect', 'sortChange', 'pageChange', 'change'],
  Tags: ['click'],
  TextArea: ['change', 'focus', 'blur'],
  TextEditor: ['change'],
  TextInput: ['change', 'focus', 'blur', 'submit', 'action'],
  Time: ['change'],
  TimePicker: ['change'],
  ToggleButton: ['change'],
  ToggleLink: ['change'],
  Url: ['change', 'focus', 'blur', 'submit', 'action'],
  Wizard: ['stepChange'],
  Year: ['change'],
}

const optionsFromKeys = (keys: string[]): WidgetFieldOption[] => {
  const unique = Array.from(new Set(keys.filter(Boolean)))
  return unique.map((value) => ({
    value,
    label:
      EVENT_LABELS[value] ??
      value
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/^./, (char) => char.toUpperCase()),
  }))
}

export const resolveWidgetEventOptions = (
  definition: WidgetDefinition
): WidgetFieldOption[] => {
  if (Array.isArray(definition.builder?.eventOptions)) {
    return definition.builder.eventOptions
  }
  const keys = Array.isArray(definition.events)
    ? definition.events
    : (EVENT_KEYS_BY_WIDGET_TYPE[definition.type] ?? [])
  return optionsFromKeys(keys)
}

export const resolveWidgetEventActionOptions = (
  definition: WidgetDefinition
): WidgetFieldOption[] => {
  if (Array.isArray(definition.builder?.eventActionOptions)) {
    return definition.builder.eventActionOptions
  }
  const widgetEventKeys = Array.isArray(definition.events)
    ? definition.events
    : (EVENT_KEYS_BY_WIDGET_TYPE[definition.type] ?? [])
  if (widgetEventKeys.length === 0) {
    return []
  }
  const profile =
    ACTION_PROFILE_BY_WIDGET_TYPE[definition.type] ??
    ACTION_PROFILE_BY_CATEGORY[definition.category] ??
    'full'
  return ACTION_OPTIONS_BY_PROFILE[profile] ?? ACTION_OPTIONS_FULL
}
