import type { WidgetField, WidgetInspectorConfig } from '../types'
import { resolveInspectorFields } from './fieldRegistry'
import { normalizeWidgetType } from '../registry-utils'
import {
  resolveGlobalWidgetStyleFieldKeys,
  resolveGlobalWidgetStyleFieldOverrides,
} from './widgetStyleFields'
import { FrameCloseButtonInspector, FrameSectionInspector, FrameTitleInspector } from './widgets/FrameAddons.inspector'
import {
  GlobalHeaderFrameInspector,
  GlobalOverlayFrameInspector,
  GlobalSidebarFrameInspector,
} from './frames/GlobalFrame.inspector'
import { AgentChatInspector } from './widgets/AgentChat.inspector'
import { AlertInspector } from './widgets/Alert.inspector'
import { AuthLoginInspector } from './widgets/AuthLogin.inspector'
import { AvatarInspector } from './widgets/Avatar.inspector'
import { AvatarGroupInspector } from './widgets/AvatarGroup.inspector'
import { BoundingBoxInspector } from './widgets/BoundingBox.inspector'
import { BreadcrumbsInspector } from './widgets/Breadcrumbs.inspector'
import { ButtonInspector } from './widgets/Button.inspector'
import { ButtonGroupInspector } from './widgets/ButtonGroup.inspector'
import { CalendarInspector } from './widgets/Calendar.inspector'
import { CascaderInspector } from './widgets/Cascader.inspector'
import { ChartInspector } from './widgets/Chart.inspector'
import { ChatInspector } from './widgets/Chat.inspector'
import { CheckboxInspector } from './widgets/Checkbox.inspector'
import { CheckboxGroupInspector } from './widgets/CheckboxGroup.inspector'
import { CheckboxTreeInspector } from './widgets/CheckboxTree.inspector'
import { CloseButtonInspector } from './widgets/CloseButton.inspector'
import { ColorInputInspector } from './widgets/ColorInput.inspector'
import { CommentThreadInspector } from './widgets/CommentThread.inspector'
import { CollapsibleContainerInspector } from './widgets/CollapsibleContainer.inspector'
import { ContainerInspector } from './widgets/Container.inspector'
import { DatePickerInspector } from './widgets/DatePicker.inspector'
import { DateRangePickerInspector } from './widgets/DateRangePicker.inspector'
import { DateTimePickerInspector } from './widgets/DateTimePicker.inspector'
import { DatetimeInputInspector } from './widgets/DatetimeInput.inspector'
import { CalendarInputInspector } from './widgets/CalendarInput.inspector'
import { DateInspector } from './widgets/Date.inspector'
import { DateRangeInspector } from './widgets/DateRange.inspector'
import { DateTimeInspector } from './widgets/DateTime.inspector'
import { DayInspector } from './widgets/Day.inspector'
import { MonthInspector } from './widgets/Month.inspector'
import { DividerInspector } from './widgets/Divider.inspector'
import { DropdownButtonInspector } from './widgets/DropdownButton.inspector'
import { DrawerInspector } from './widgets/Drawer.inspector'
import { EditableNumberInspector } from './widgets/EditableNumber.inspector'
import { EditableTextInspector } from './widgets/EditableText.inspector'
import { EditableTextAreaInspector } from './widgets/EditableTextArea.inspector'
import { FileUploadInspector } from './widgets/FileUpload.inspector'
import { FilterInspector } from './widgets/Filter.inspector'
import { FormInspector } from './widgets/Form.inspector'
import { HeaderInspector } from './widgets/Header.inspector'
import { HtmlInspector } from './widgets/Html.inspector'
import { IFrameInspector } from './widgets/IFrame.inspector'
import { IconInspector } from './widgets/Icon.inspector'
import { ImageInspector } from './widgets/Image.inspector'
import { ImageGridInspector } from './widgets/ImageGrid.inspector'
import { JsonEditorInspector } from './widgets/JsonEditor.inspector'
import { JsonExplorerInspector } from './widgets/JsonExplorer.inspector'
import { JsonSchemaFormInspector } from './widgets/JsonSchemaForm.inspector'
import { KeyValueInspector } from './widgets/KeyValue.inspector'
import { KeyValueMapInspector } from './widgets/KeyValueMap.inspector'
import { LinkInspector } from './widgets/Link.inspector'
import { LinkCardInspector } from './widgets/LinkCard.inspector'
import { LinkListInspector } from './widgets/LinkList.inspector'
import { ListViewInspector } from './widgets/ListView.inspector'
import { ListboxInspector } from './widgets/Listbox.inspector'
import { LookerInspector } from './widgets/Looker.inspector'
import { MapInspector } from './widgets/Map.inspector'
import { MicrophoneInspector } from './widgets/Microphone.inspector'
import { ModalInspector } from './widgets/Modal.inspector'
import { MultiSelectInspector } from './widgets/MultiSelect.inspector'
import { MultiSelectListboxInspector } from './widgets/MultiSelectListbox.inspector'
import { NavigationInspector } from './widgets/Navigation.inspector'
import { PageInputInspector } from './widgets/PageInput.inspector'
import { PaginationInspector } from './widgets/Pagination.inspector'
import { PasswordInputInspector } from './widgets/PasswordInput.inspector'
import { PdfViewerInspector } from './widgets/PdfViewer.inspector'
import { PhoneNumberInputInspector } from './widgets/PhoneNumberInput.inspector'
import { OtpInputInspector } from './widgets/OtpInput.inspector'
import { ProgressBarInspector } from './widgets/ProgressBar.inspector'
import { ProgressCircleInspector } from './widgets/ProgressCircle.inspector'
import { QRCodeInspector } from './widgets/QRCode.inspector'
import { RadioGroupInspector } from './widgets/RadioGroup.inspector'
import { RangeSliderInspector } from './widgets/RangeSlider.inspector'
import { RatingInspector } from './widgets/Rating.inspector'
import { ReorderableListInspector } from './widgets/ReorderableList.inspector'
import { ScannerInspector } from './widgets/Scanner.inspector'
import { SegmentedControlInspector } from './widgets/SegmentedControl.inspector'
import { SelectInspector } from './widgets/Select.inspector'
import { SidebarInspector } from './widgets/Sidebar.inspector'
import { SignaturePadInspector } from './widgets/SignaturePad.inspector'
import { SliderInspector } from './widgets/Slider.inspector'
import { SpacerInspector } from './widgets/Spacer.inspector'
import { SplitButtonInspector } from './widgets/SplitButton.inspector'
import { SplitPaneInspector } from './widgets/SplitPane.inspector'
import { StatisticInspector } from './widgets/Statistic.inspector'
import { StackInspector } from './widgets/Stack.inspector'
import { StatusInspector } from './widgets/Status.inspector'
import { SteppedContainerInspector } from './widgets/SteppedContainer.inspector'
import { StepsInspector } from './widgets/Steps.inspector'
import { StripeCardFormInspector } from './widgets/StripeCardForm.inspector'
import { SwitchInspector } from './widgets/Switch.inspector'
import { SwitchGroupInspector } from './widgets/SwitchGroup.inspector'
import { TableInspector } from './widgets/Table.inspector'
import { TabbedContainerInspector } from './widgets/TabbedContainer.inspector'
import { TabsInspector } from './widgets/Tabs.inspector'
import { TagsInspector } from './widgets/Tags.inspector'
import { TextInspector } from './widgets/Text.inspector'
import { TextAnnotationInspector } from './widgets/TextAnnotation.inspector'
import { TextAreaInspector } from './widgets/TextArea.inspector'
import { TextEditorInspector } from './widgets/TextEditor.inspector'
import { TextInputInspector } from './widgets/TextInput.inspector'
import { NumberInputInspector } from './widgets/NumberInput.inspector'
import { OutlineButtonInspector } from './widgets/OutlineButton.inspector'
import { CurrencyInspector } from './widgets/Currency.inspector'
import { PercentInspector } from './widgets/Percent.inspector'
import { EmailInspector } from './widgets/Email.inspector'
import { UrlInspector } from './widgets/Url.inspector'
import { TimePickerInspector } from './widgets/TimePicker.inspector'
import { TimeInspector } from './widgets/Time.inspector'
import { TimelineInspector } from './widgets/Timeline.inspector'
import { TimerInspector } from './widgets/Timer.inspector'
import { ToggleButtonInspector } from './widgets/ToggleButton.inspector'
import { ToggleLinkInspector } from './widgets/ToggleLink.inspector'
import { VideoInspector } from './widgets/Video.inspector'
import { WizardInspector } from './widgets/Wizard.inspector'
import { YearInspector } from './widgets/Year.inspector'

const inspectorRegistry = new Map<string, WidgetInspectorConfig>([
  ['AgentChat', AgentChatInspector],
  ['Alert', AlertInspector],
  ['AuthLogin', AuthLoginInspector],
  ['Avatar', AvatarInspector],
  ['AvatarGroup', AvatarGroupInspector],
  ['BoundingBox', BoundingBoxInspector],
  ['Breadcrumbs', BreadcrumbsInspector],
  ['Button', ButtonInspector],
  ['ButtonGroup', ButtonGroupInspector],
  ['Calendar', CalendarInspector],
  ['Cascader', CascaderInspector],
  ['Chart', ChartInspector],
  ['Chat', ChatInspector],
  ['Checkbox', CheckboxInspector],
  ['CheckboxGroup', CheckboxGroupInspector],
  ['CheckboxTree', CheckboxTreeInspector],
  ['CloseButton', CloseButtonInspector],
  ['ColorInput', ColorInputInspector],
  ['CommentThread', CommentThreadInspector],
  ['CollapsibleContainer', CollapsibleContainerInspector],
  ['Container', ContainerInspector],
  ['DatePicker', DatePickerInspector],
  ['DateRangePicker', DateRangePickerInspector],
  ['DateTimePicker', DateTimePickerInspector],
  ['DatetimeInput', DatetimeInputInspector],
  ['CalendarInput', CalendarInputInspector],
  ['Date', DateInspector],
  ['DateRange', DateRangeInspector],
  ['DateTime', DateTimeInspector],
  ['Day', DayInspector],
  ['Month', MonthInspector],
  ['Divider', DividerInspector],
  ['DropdownButton', DropdownButtonInspector],
  ['Drawer', DrawerInspector],
  ['EditableText', EditableTextInspector],
  ['EditableTextArea', EditableTextAreaInspector],
  ['FileUpload', FileUploadInspector],
  ['Filter', FilterInspector],
  ['Form', FormInspector],
  ['Header', HeaderInspector],
  ['Html', HtmlInspector],
  ['IFrame', IFrameInspector],
  ['Icon', IconInspector],
  ['Image', ImageInspector],
  ['ImageGrid', ImageGridInspector],
  ['JsonEditor', JsonEditorInspector],
  ['JsonExplorer', JsonExplorerInspector],
  ['JsonSchemaForm', JsonSchemaFormInspector],
  ['KeyValue', KeyValueInspector],
  ['KeyValueMap', KeyValueMapInspector],
  ['Link', LinkInspector],
  ['LinkCard', LinkCardInspector],
  ['LinkList', LinkListInspector],
  ['ListView', ListViewInspector],
  ['Listbox', ListboxInspector],
  ['Looker', LookerInspector],
  ['Map', MapInspector],
  ['Microphone', MicrophoneInspector],
  ['Modal', ModalInspector],
  ['MultiSelect', MultiSelectInspector],
  ['MultiSelectListbox', MultiSelectListboxInspector],
  ['Navigation', NavigationInspector],
  ['EditableNumber', EditableNumberInspector],
  ['PageInput', PageInputInspector],
  ['Pagination', PaginationInspector],
  ['PasswordInput', PasswordInputInspector],
  ['PdfViewer', PdfViewerInspector],
  ['PhoneNumberInput', PhoneNumberInputInspector],
  ['OtpInput', OtpInputInspector],
  ['ProgressBar', ProgressBarInspector],
  ['ProgressCircle', ProgressCircleInspector],
  ['QRCode', QRCodeInspector],
  ['RadioGroup', RadioGroupInspector],
  ['RangeSlider', RangeSliderInspector],
  ['Rating', RatingInspector],
  ['ReorderableList', ReorderableListInspector],
  ['Scanner', ScannerInspector],
  ['SegmentedControl', SegmentedControlInspector],
  ['Select', SelectInspector],
  ['Sidebar', SidebarInspector],
  ['SignaturePad', SignaturePadInspector],
  ['Slider', SliderInspector],
  ['Spacer', SpacerInspector],
  ['SplitButton', SplitButtonInspector],
  ['SplitPane', SplitPaneInspector],
  ['Statistic', StatisticInspector],
  ['Stack', StackInspector],
  ['Status', StatusInspector],
  ['SteppedContainer', SteppedContainerInspector],
  ['Steps', StepsInspector],
  ['StripeCardForm', StripeCardFormInspector],
  ['Switch', SwitchInspector],
  ['SwitchGroup', SwitchGroupInspector],
  ['Table', TableInspector],
  ['TabbedContainer', TabbedContainerInspector],
  ['Tabs', TabsInspector],
  ['Tags', TagsInspector],
  ['Text', TextInspector],
  ['TextAnnotation', TextAnnotationInspector],
  ['TextArea', TextAreaInspector],
  ['TextEditor', TextEditorInspector],
  ['TextInput', TextInputInspector],
  ['NumberInput', NumberInputInspector],
  ['OutlineButton', OutlineButtonInspector],
  ['Currency', CurrencyInspector],
  ['Percent', PercentInspector],
  ['Email', EmailInspector],
  ['Url', UrlInspector],
  ['TimePicker', TimePickerInspector],
  ['Time', TimeInspector],
  ['Year', YearInspector],
  ['Timeline', TimelineInspector],
  ['Timer', TimerInspector],
  ['ToggleButton', ToggleButtonInspector],
  ['ToggleLink', ToggleLinkInspector],
  ['Video', VideoInspector],
  ['Wizard', WizardInspector],
  ['DrawerHeader', FrameSectionInspector],
  ['DrawerFooter', FrameSectionInspector],
  ['ModalHeader', FrameSectionInspector],
  ['ModalFooter', FrameSectionInspector],
  ['DrawerTitle', FrameTitleInspector],
  ['ModalTitle', FrameTitleInspector],
  ['DrawerCloseButton', FrameCloseButtonInspector],
  ['ModalCloseButton', FrameCloseButtonInspector],
  ['GlobalDrawer', GlobalOverlayFrameInspector],
  ['GlobalModal', GlobalOverlayFrameInspector],
  ['GlobalHeader', GlobalHeaderFrameInspector],
  ['GlobalSidebar', GlobalSidebarFrameInspector],
])

export const widgetInspectorRegistry = inspectorRegistry

const shouldForceAppearanceSection = (field: WidgetField) => {
  if (field.key === 'groupSize') {
    return false
  }
  if (field.key === 'variant' || field.key === 'size') {
    return true
  }
  if (field.key.endsWith('Variant') || field.key.endsWith('Size')) {
    return true
  }
  return false
}

const normalizeAppearanceFields = (fields: WidgetField[]) =>
  fields.map((field) => {
    if (!shouldForceAppearanceSection(field)) {
      return field
    }
    if (field.section === 'Styles') {
      return field
    }
    return {
      ...field,
      section: 'Appearance',
    }
  })

const appendGlobalStyleFields = (widgetType: string, fields: WidgetField[]) => {
  const hasDedicatedStyles = fields.some(
    (field) => field.section === 'Styles' && !field.key.startsWith('style')
  )
  const globalStyleFieldKeys = resolveGlobalWidgetStyleFieldKeys(
    widgetType,
    hasDedicatedStyles
  )
  if (globalStyleFieldKeys.length === 0) {
    return fields
  }
  const existing = new Set(fields.map((field) => field.key))
  const missingKeys = globalStyleFieldKeys.filter((key) => !existing.has(key))
  if (missingKeys.length === 0) {
    return fields
  }
  const styleFieldOverrides = resolveGlobalWidgetStyleFieldOverrides(
    widgetType,
    hasDedicatedStyles
  )
  const missingFields = resolveInspectorFields([...missingKeys], styleFieldOverrides)
  if (missingFields.length === 0) {
    return fields
  }
  return [...fields, ...missingFields]
}

export const getWidgetInspector = (type: string) => {
  const resolvedType = normalizeWidgetType(type)
  const config =
    inspectorRegistry.get(resolvedType) ??
    inspectorRegistry.get(
      Array.from(inspectorRegistry.keys()).find(
        (key) => key.toLowerCase() === resolvedType.toLowerCase()
      ) ?? ''
    )
  if (!config) {
    return undefined
  }
  const baseFields = config.fields?.length
    ? config.fields
    : config.fieldKeys?.length
      ? resolveInspectorFields(config.fieldKeys, config.fieldOverrides)
      : []
  const fields = normalizeAppearanceFields(
    appendGlobalStyleFields(resolvedType, baseFields)
  )
  if (fields.length === 0) {
    return config
  }
  return {
    ...config,
    fields,
  }
}
