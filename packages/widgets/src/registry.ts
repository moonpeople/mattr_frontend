import type { WidgetDefinition, WidgetInspectorConfig } from './types'
import { resolveInspectorFields } from './inspectorFieldRegistry'
import { AgentChatWidget } from './widgets/AgentChat'
import { AuthLoginWidget } from './widgets/AuthLogin'
import { ButtonWidget } from './widgets/Button'
import { ButtonGroupWidget } from './widgets/ButtonGroup'
import { CascaderWidget } from './widgets/Cascader'
import { ChartWidget } from './widgets/Chart'
import { CheckboxWidget } from './widgets/Checkbox'
import { CheckboxGroupWidget } from './widgets/CheckboxGroup'
import { CheckboxTreeWidget } from './widgets/CheckboxTree'
import { ChatWidget } from './widgets/Chat'
import { CommentThreadWidget } from './widgets/CommentThread'
import { BreadcrumbsWidget } from './widgets/Breadcrumbs'
import { ColorInputWidget } from './widgets/ColorInput'
import { ContainerWidget } from './widgets/Container'
import { DatePickerWidget } from './widgets/DatePicker'
import { DateRangePickerWidget } from './widgets/DateRangePicker'
import { DateTimePickerWidget } from './widgets/DateTimePicker'
import { DividerWidget } from './widgets/Divider'
import { DropdownButtonWidget } from './widgets/DropdownButton'
import { EditableNumberWidget } from './widgets/EditableNumber'
import { EditableTextWidget } from './widgets/EditableText'
import { EditableTextAreaWidget } from './widgets/EditableTextArea'
import { EditableTextInspector } from './widgets/EditableText.inspector'
import { EditableTextAreaInspector } from './widgets/EditableTextArea.inspector'
import { AvatarWidget } from './widgets/Avatar'
import { AlertWidget } from './widgets/Alert'
import { AvatarGroupWidget } from './widgets/AvatarGroup'
import { BoundingBoxWidget } from './widgets/BoundingBox'
import { FilterWidget } from './widgets/Filter'
import { FormWidget } from './widgets/Form'
import { JsonSchemaFormWidget } from './widgets/JsonSchemaForm'
import { LookerWidget } from './widgets/Looker'
import { MapWidget } from './widgets/Map'
import { MicrophoneWidget } from './widgets/Microphone'
import { RatingWidget } from './widgets/Rating'
import { QRCodeWidget } from './widgets/QRCode'
import { ReorderableListWidget } from './widgets/ReorderableList'
import { ScannerWidget } from './widgets/Scanner'
import { SignaturePadWidget } from './widgets/SignaturePad'
import { StripeCardFormWidget } from './widgets/StripeCardForm'
import { TextAnnotationWidget } from './widgets/TextAnnotation'
import { TimerWidget } from './widgets/Timer'
import { VideoWidget } from './widgets/Video'
import { WizardWidget } from './widgets/Wizard'
import {
  GlobalDrawerWidget,
  GlobalHeaderWidget,
  GlobalModalWidget,
  GlobalSidebarWidget,
  GlobalSplitPaneWidget,
} from './widgets/GlobalFrame'
import {
  DrawerCloseButtonWidget,
  DrawerFooterWidget,
  DrawerHeaderWidget,
  DrawerTitleWidget,
  ModalCloseButtonWidget,
  ModalFooterWidget,
  ModalHeaderWidget,
  ModalTitleWidget,
} from './widgets/FrameAddons'
import { HtmlWidget } from './widgets/Html'
import { IconWidget } from './widgets/Icon'
import { IFrameWidget } from './widgets/IFrame'
import { ImageWidget } from './widgets/Image'
import { ImageGridWidget } from './widgets/ImageGrid'
import { KeyValueWidget } from './widgets/KeyValue'
import { KeyValueMapWidget } from './widgets/KeyValueMap'
import { ListViewWidget } from './widgets/ListView'
import { ListboxWidget } from './widgets/Listbox'
import { LinkWidget } from './widgets/Link'
import { LinkListWidget } from './widgets/LinkList'
import { ModalWidget } from './widgets/Modal'
import { MultiSelectWidget } from './widgets/MultiSelect'
import { MultiSelectListboxWidget } from './widgets/MultiSelectListbox'
import { NumberInputWidget } from './widgets/NumberInput'
import { PaginationWidget } from './widgets/Pagination'
import { PageInputWidget } from './widgets/PageInput'
import { PasswordInputWidget } from './widgets/PasswordInput'
import { PdfViewerWidget } from './widgets/PdfViewer'
import { SegmentedControlWidget } from './widgets/SegmentedControl'
import { PhoneNumberInputWidget } from './widgets/PhoneNumberInput'
import { ProgressBarWidget } from './widgets/ProgressBar'
import { ProgressCircleWidget } from './widgets/ProgressCircle'
import { RadioGroupWidget } from './widgets/RadioGroup'
import { RangeSliderWidget } from './widgets/RangeSlider'
import { FileUploadWidget } from './widgets/FileUpload'
import { NavigationWidget } from './widgets/Navigation'
import { SelectWidget } from './widgets/Select'
import { SliderWidget } from './widgets/Slider'
import { SpacerWidget } from './widgets/Spacer'
import { SplitButtonWidget } from './widgets/SplitButton'
import { StatisticWidget } from './widgets/Statistic'
import { StatusWidget } from './widgets/Status'
import { SwitchWidget } from './widgets/Switch'
import { SwitchGroupWidget } from './widgets/SwitchGroup'
import { StepsWidget } from './widgets/Steps'
import { TableWidget } from './widgets/Table'
import { TabsWidget } from './widgets/Tabs'
import { TagsWidget } from './widgets/Tags'
import { TextAreaWidget } from './widgets/TextArea'
import { TextEditorWidget } from './widgets/TextEditor'
import { TextWidget } from './widgets/Text'
import { TextInputWidget } from './widgets/TextInput'
import { TimePickerWidget } from './widgets/TimePicker'
import { ToggleButtonWidget } from './widgets/ToggleButton'
import { ToggleLinkWidget } from './widgets/ToggleLink'
import { JsonEditorWidget } from './widgets/JsonEditor'
import { JsonExplorerWidget } from './widgets/JsonExplorer'
import { TimelineWidget } from './widgets/Timeline'

const registry: WidgetDefinition[] = [
  TextWidget,
  AgentChatWidget,
  ChatWidget,
  CommentThreadWidget,
  ButtonWidget,
  ButtonGroupWidget,
  AuthLoginWidget,
  BreadcrumbsWidget,
  LinkWidget,
  LinkListWidget,
  CascaderWidget,
  TextInputWidget,
  ColorInputWidget,
  TextAreaWidget,
  TextEditorWidget,
  NumberInputWidget,
  PasswordInputWidget,
  MicrophoneWidget,
  EditableTextWidget,
  EditableTextAreaWidget,
  EditableNumberWidget,
  SignaturePadWidget,
  PhoneNumberInputWidget,
  SelectWidget,
  SegmentedControlWidget,
  MultiSelectWidget,
  ListboxWidget,
  MultiSelectListboxWidget,
  RadioGroupWidget,
  CheckboxWidget,
  CheckboxGroupWidget,
  CheckboxTreeWidget,
  ToggleButtonWidget,
  ToggleLinkWidget,
  SwitchWidget,
  SwitchGroupWidget,
  SliderWidget,
  RangeSliderWidget,
  DatePickerWidget,
  DateTimePickerWidget,
  DateRangePickerWidget,
  TimePickerWidget,
  FileUploadWidget,
  DropdownButtonWidget,
  SplitButtonWidget,
  StatisticWidget,
  TagsWidget,
  ProgressBarWidget,
  ProgressCircleWidget,
  RatingWidget,
  DividerWidget,
  FilterWidget,
  StepsWidget,
  PaginationWidget,
  PageInputWidget,
  ReorderableListWidget,
  JsonEditorWidget,
  JsonExplorerWidget,
  JsonSchemaFormWidget,
  HtmlWidget,
  IFrameWidget,
  LookerWidget,
  MapWidget,
  PdfViewerWidget,
  ImageGridWidget,
  QRCodeWidget,
  VideoWidget,
  AlertWidget,
  AvatarGroupWidget,
  StripeCardFormWidget,
  StatusWidget,
  TextAnnotationWidget,
  BoundingBoxWidget,
  ScannerWidget,
  TimerWidget,
  TimelineWidget,
  KeyValueWidget,
  KeyValueMapWidget,
  GlobalHeaderWidget,
  GlobalSidebarWidget,
  GlobalDrawerWidget,
  GlobalModalWidget,
  GlobalSplitPaneWidget,
  DrawerHeaderWidget,
  DrawerFooterWidget,
  DrawerTitleWidget,
  DrawerCloseButtonWidget,
  ModalHeaderWidget,
  ModalFooterWidget,
  ModalTitleWidget,
  ModalCloseButtonWidget,
  NavigationWidget,
  ContainerWidget,
  TabsWidget,
  WizardWidget,
  ModalWidget,
  FormWidget,
  TableWidget,
  ListViewWidget,
  ChartWidget,
  ImageWidget,
  AvatarWidget,
  IconWidget,
  SpacerWidget,
]

export const widgetRegistry = [...registry]

const inspectorRegistry = new Map<string, WidgetInspectorConfig>([
  ['EditableText', EditableTextInspector],
  ['EditableTextArea', EditableTextAreaInspector],
])

export const widgetInspectorRegistry = inspectorRegistry

export const getWidgetInspector = (type: string) => {
  const config = inspectorRegistry.get(type)
  if (!config) {
    return undefined
  }
  if (config.fields?.length) {
    return config
  }
  if (!config.fieldKeys?.length) {
    return config
  }
  const fields = resolveInspectorFields(config.fieldKeys, config.fieldOverrides)
  return {
    ...config,
    fields,
  }
}

export const getWidgetDefinition = (type: string) => {
  return registry.find((widget) => widget.type === type)
}

export const widgetCategories = Array.from(
  registry.reduce((acc, widget) => {
    if (!acc.has(widget.category)) {
      acc.set(widget.category, [])
    }
    acc.get(widget.category)?.push(widget)
    return acc
  }, new Map<string, WidgetDefinition[]>())
)
