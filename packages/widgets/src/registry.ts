import type { WidgetDefinition } from './types'
import { normalizeWidgetType } from './registry-utils'
import {
  resolveWidgetEventActionOptions,
  resolveWidgetEventOptions,
} from './event-handlers-config'
import { AlertDefinition } from './definitions/Alert.definition'
import { AgentChatDefinition } from './definitions/AgentChat.definition'
import { AvatarDefinition } from './definitions/Avatar.definition'
import { AvatarGroupDefinition } from './definitions/AvatarGroup.definition'
import { BreadcrumbsDefinition } from './definitions/Breadcrumbs.definition'
import { ButtonDefinition } from './definitions/Button.definition'
import { ButtonGroupDefinition } from './definitions/ButtonGroup.definition'
import { CloseButtonDefinition } from './definitions/CloseButton.definition'
import { CalendarDefinition } from './definitions/Calendar.definition'
import { CascaderDefinition } from './definitions/Cascader.definition'
import { ChatDefinition } from './definitions/Chat.definition'
import { ChartDefinition } from './definitions/Chart.definition'
import { ColorInputDefinition } from './definitions/ColorInput.definition'
import { CommentThreadDefinition } from './definitions/CommentThread.definition'
import { AuthLoginDefinition } from './definitions/AuthLogin.definition'
import { DropdownButtonDefinition } from './definitions/DropdownButton.definition'
import { DrawerDefinition } from './definitions/Drawer.definition'
import { EditableTextAreaDefinition } from './definitions/EditableTextArea.definition'
import { EditableTextDefinition } from './definitions/EditableText.definition'
import { CurrencyDefinition } from './definitions/Currency.definition'
import { PercentDefinition } from './definitions/Percent.definition'
import { EmailDefinition } from './definitions/Email.definition'
import { FileUploadDefinition } from './definitions/FileUpload.definition'
import { FilterDefinition } from './definitions/Filter.definition'
import { HeaderDefinition } from './definitions/Header.definition'
import { HtmlDefinition } from './definitions/Html.definition'
import { IFrameDefinition } from './definitions/IFrame.definition'
import { ImageGridDefinition } from './definitions/ImageGrid.definition'
import { JsonEditorDefinition } from './definitions/JsonEditor.definition'
import { JsonExplorerDefinition } from './definitions/JsonExplorer.definition'
import { JsonSchemaFormDefinition } from './definitions/JsonSchemaForm.definition'
import { KeyValueDefinition } from './definitions/KeyValue.definition'
import { KeyValueMapDefinition } from './definitions/KeyValueMap.definition'
import { ListViewDefinition } from './definitions/ListView.definition'
import { LinkDefinition } from './definitions/Link.definition'
import { LinkListDefinition } from './definitions/LinkList.definition'
import { LookerDefinition } from './definitions/Looker.definition'
import { MapDefinition } from './definitions/Map.definition'
import { PdfViewerDefinition } from './definitions/PdfViewer.definition'
import { QRCodeDefinition } from './definitions/QRCode.definition'
import { ReorderableListDefinition } from './definitions/ReorderableList.definition'
import { ContainerDefinition } from './definitions/Container.definition'
import { CollapsibleContainerDefinition } from './definitions/CollapsibleContainer.definition'
import { DividerDefinition } from './definitions/Divider.definition'
import { FormDefinition } from './definitions/Form.definition'
import { IconDefinition } from './definitions/Icon.definition'
import { ImageDefinition } from './definitions/Image.definition'
import { LinkCardDefinition } from './definitions/LinkCard.definition'
import { ModalDefinition } from './definitions/Modal.definition'
import { MicrophoneDefinition } from './definitions/Microphone.definition'
import { NavigationDefinition } from './definitions/Navigation.definition'
import { ProgressBarDefinition } from './definitions/ProgressBar.definition'
import { ProgressCircleDefinition } from './definitions/ProgressCircle.definition'
import { RatingDefinition } from './definitions/Rating.definition'
import { ScannerDefinition } from './definitions/Scanner.definition'
import { SignaturePadDefinition } from './definitions/SignaturePad.definition'
import { SplitButtonDefinition } from './definitions/SplitButton.definition'
import { SplitPaneDefinition } from './definitions/SplitPane.definition'
import { SpacerDefinition } from './definitions/Spacer.definition'
import { StatusDefinition } from './definitions/Status.definition'
import { StripeCardFormDefinition } from './definitions/StripeCardForm.definition'
import { TagsDefinition } from './definitions/Tags.definition'
import { TableDefinition } from './definitions/Table.definition'
import { TextDefinition } from './definitions/Text.definition'
import { TextAnnotationDefinition } from './definitions/TextAnnotation.definition'
import { TextEditorDefinition } from './definitions/TextEditor.definition'
import { TimelineDefinition } from './definitions/Timeline.definition'
import { TimerDefinition } from './definitions/Timer.definition'
import { ToggleButtonDefinition } from './definitions/ToggleButton.definition'
import { ToggleLinkDefinition } from './definitions/ToggleLink.definition'
import { UrlDefinition } from './definitions/Url.definition'
import { VideoDefinition } from './definitions/Video.definition'
import { BoundingBoxDefinition } from './definitions/BoundingBox.definition'
import { PhoneNumberInputDefinition } from './definitions/PhoneNumberInput.definition'
import { EditableNumberDefinition } from './definitions/EditableNumber.definition'
import { WizardDefinition } from './definitions/Wizard.definition'
import { CheckboxDefinition } from './definitions/Checkbox.definition'
import { CheckboxGroupDefinition } from './definitions/CheckboxGroup.definition'
import { CheckboxTreeDefinition } from './definitions/CheckboxTree.definition'
import { DatePickerDefinition } from './definitions/DatePicker.definition'
import { DateRangePickerDefinition } from './definitions/DateRangePicker.definition'
import { DateTimePickerDefinition } from './definitions/DateTimePicker.definition'
import { DatetimeInputDefinition } from './definitions/DatetimeInput.definition'
import { CalendarInputDefinition } from './definitions/CalendarInput.definition'
import { DateDefinition } from './definitions/Date.definition'
import { DateRangeDefinition } from './definitions/DateRange.definition'
import { DateTimeDefinition } from './definitions/DateTime.definition'
import { DayDefinition } from './definitions/Day.definition'
import { MonthDefinition } from './definitions/Month.definition'
import { PageInputDefinition } from './definitions/PageInput.definition'
import { PaginationDefinition } from './definitions/Pagination.definition'
import { ListboxDefinition } from './definitions/Listbox.definition'
import { MultiSelectDefinition } from './definitions/MultiSelect.definition'
import { MultiSelectListboxDefinition } from './definitions/MultiSelectListbox.definition'
import { OtpInputDefinition } from './definitions/OtpInput.definition'
import { PasswordInputDefinition } from './definitions/PasswordInput.definition'
import { RadioGroupDefinition } from './definitions/RadioGroup.definition'
import { RangeSliderDefinition } from './definitions/RangeSlider.definition'
import { SelectDefinition } from './definitions/Select.definition'
import { SegmentedControlDefinition } from './definitions/SegmentedControl.definition'
import { SidebarDefinition } from './definitions/Sidebar.definition'
import { SliderDefinition } from './definitions/Slider.definition'
import { StatisticDefinition } from './definitions/Statistic.definition'
import { StackDefinition } from './definitions/Stack.definition'
import { StepsDefinition } from './definitions/Steps.definition'
import { SteppedContainerDefinition } from './definitions/SteppedContainer.definition'
import { SwitchDefinition } from './definitions/Switch.definition'
import { SwitchGroupDefinition } from './definitions/SwitchGroup.definition'
import { TabsDefinition } from './definitions/Tabs.definition'
import { TabbedContainerDefinition } from './definitions/TabbedContainer.definition'
import { TextInputDefinition } from './definitions/TextInput.definition'
import { NumberInputDefinition } from './definitions/NumberInput.definition'
import { OutlineButtonDefinition } from './definitions/OutlineButton.definition'
import { TextAreaDefinition } from './definitions/TextArea.definition'
import { TimePickerDefinition } from './definitions/TimePicker.definition'
import { TimeDefinition } from './definitions/Time.definition'
import {
  GlobalDrawerDefinition,
  GlobalHeaderDefinition,
  GlobalModalDefinition,
  GlobalSidebarDefinition,
  GlobalSplitPaneDefinition,
} from './frames/GlobalFrame.definition'
import {
  DrawerCloseButtonDefinition,
  DrawerFooterDefinition,
  DrawerHeaderDefinition,
  DrawerTitleDefinition,
  ModalCloseButtonDefinition,
  ModalFooterDefinition,
  ModalHeaderDefinition,
  ModalTitleDefinition,
} from './definitions/FrameAddons.definition'
import { YearDefinition } from './definitions/Year.definition'

const registry: WidgetDefinition[] = [
  TextDefinition,
  AgentChatDefinition,
  ChatDefinition,
  CommentThreadDefinition,
  ButtonDefinition,
  OutlineButtonDefinition,
  CloseButtonDefinition,
  ButtonGroupDefinition,
  AuthLoginDefinition,
  BreadcrumbsDefinition,
  LinkDefinition,
  LinkCardDefinition,
  LinkListDefinition,
  CalendarDefinition,
  CascaderDefinition,
  TextInputDefinition,
  NumberInputDefinition,
  CurrencyDefinition,
  PercentDefinition,
  EmailDefinition,
  UrlDefinition,
  ColorInputDefinition,
  TextAreaDefinition,
  TextEditorDefinition,
  EditableNumberDefinition,
  PasswordInputDefinition,
  MicrophoneDefinition,
  EditableTextDefinition,
  EditableTextAreaDefinition,
  SignaturePadDefinition,
  PhoneNumberInputDefinition,
  OtpInputDefinition,
  SelectDefinition,
  SegmentedControlDefinition,
  MultiSelectDefinition,
  ListboxDefinition,
  MultiSelectListboxDefinition,
  RadioGroupDefinition,
  CheckboxDefinition,
  CheckboxGroupDefinition,
  CheckboxTreeDefinition,
  ToggleButtonDefinition,
  ToggleLinkDefinition,
  SwitchDefinition,
  SwitchGroupDefinition,
  SliderDefinition,
  RangeSliderDefinition,
  DatetimeInputDefinition,
  CalendarInputDefinition,
  DateDefinition,
  DateTimeDefinition,
  DateRangeDefinition,
  DayDefinition,
  MonthDefinition,
  TimeDefinition,
  YearDefinition,
  DatePickerDefinition,
  DateTimePickerDefinition,
  DateRangePickerDefinition,
  TimePickerDefinition,
  FileUploadDefinition,
  DropdownButtonDefinition,
  DrawerDefinition,
  SplitButtonDefinition,
  SplitPaneDefinition,
  StatisticDefinition,
  TagsDefinition,
  ProgressBarDefinition,
  ProgressCircleDefinition,
  RatingDefinition,
  DividerDefinition,
  FilterDefinition,
  StepsDefinition,
  PaginationDefinition,
  PageInputDefinition,
  ReorderableListDefinition,
  JsonEditorDefinition,
  JsonExplorerDefinition,
  JsonSchemaFormDefinition,
  HtmlDefinition,
  IFrameDefinition,
  LookerDefinition,
  MapDefinition,
  PdfViewerDefinition,
  ImageGridDefinition,
  QRCodeDefinition,
  VideoDefinition,
  AlertDefinition,
  AvatarGroupDefinition,
  StripeCardFormDefinition,
  StatusDefinition,
  TextAnnotationDefinition,
  BoundingBoxDefinition,
  ScannerDefinition,
  TimerDefinition,
  TimelineDefinition,
  KeyValueDefinition,
  KeyValueMapDefinition,
  HeaderDefinition,
  SidebarDefinition,
  GlobalHeaderDefinition,
  GlobalSidebarDefinition,
  GlobalDrawerDefinition,
  GlobalModalDefinition,
  GlobalSplitPaneDefinition,
  DrawerHeaderDefinition,
  DrawerFooterDefinition,
  DrawerTitleDefinition,
  DrawerCloseButtonDefinition,
  ModalHeaderDefinition,
  ModalFooterDefinition,
  ModalTitleDefinition,
  ModalCloseButtonDefinition,
  NavigationDefinition,
  ContainerDefinition,
  CollapsibleContainerDefinition,
  StackDefinition,
  TabsDefinition,
  TabbedContainerDefinition,
  SteppedContainerDefinition,
  WizardDefinition,
  ModalDefinition,
  FormDefinition,
  TableDefinition,
  ListViewDefinition,
  ChartDefinition,
  ImageDefinition,
  AvatarDefinition,
  IconDefinition,
  SpacerDefinition,
]

const enrichBuilderConfig = (definition: WidgetDefinition): WidgetDefinition => ({
  ...definition,
  builder: {
    ...definition.builder,
    eventOptions: resolveWidgetEventOptions(definition),
    eventActionOptions: resolveWidgetEventActionOptions(definition),
  },
})

const enrichedRegistry = registry.map(enrichBuilderConfig)

export const widgetRegistry = [...enrichedRegistry]

export const getWidgetDefinition = (type: string) => {
  const resolvedType = normalizeWidgetType(type)
  return (
    enrichedRegistry.find((widget) => widget.type === resolvedType) ??
    enrichedRegistry.find((widget) => widget.type.toLowerCase() === resolvedType.toLowerCase())
  )
}

export const widgetCategories = Array.from(
  enrichedRegistry.reduce((acc, widget) => {
    if (!acc.has(widget.category)) {
      acc.set(widget.category, [])
    }
    acc.get(widget.category)?.push(widget)
    return acc
  }, new Map<string, WidgetDefinition[]>())
)
