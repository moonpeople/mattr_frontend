import { useMemo, useState } from 'react'
import { Search, X } from 'lucide-react'

import type { WidgetDefinition } from 'widgets/runtime'
import { Button, Input, Input_Shadcn_, ScrollArea, Separator, cn } from 'ui'

import { WidgetListItem } from './BuilderSidebarItems'
import type { BuilderWidgetAddOptions } from './types'

// Панель компонентов: поиск, списки виджетов и модули.

// Виджеты, сделанные по аналогии с EditableText.
const madeWidgetTypes = ['EditableText', 'EditableTextArea', 'EditableNumber', 'NumberInput', 'Currency', 'Percent', 'Navigation']

const widgetLabelOverrides: Record<string, string> = {
  EditableTextArea: 'Editable Text Area',
  TextArea: 'Text Area',
  TextInput: 'Input',
  Email: 'Email',
  Url: 'URL',
  NumberInput: 'Number Input',
  Currency: 'Currency',
  Percent: 'Percent',
  TextEditor: 'Rich Text Editor',
  JsonEditor: 'JSON Editor',
  EditableNumber: 'Editable Number',
  PhoneNumberInput: 'Phone Number',
  RangeSlider: 'Range Slider',
  DatePicker: 'Date',
  Calendar: 'Calendar',
  DateRangePicker: 'Date Range',
  DateTimePicker: 'Date Time',
  TimePicker: 'Time',
  OutlineButton: 'Outline Button',
  CloseButton: 'Close Button',
  CalendarInput: 'Calendar Input',
  Date: 'Date',
  DateRange: 'Date Range',
  DateTime: 'Date Time',
  Day: 'Day',
  Month: 'Month',
  Time: 'Time',
  Year: 'Year',
  SwitchGroup: 'Switch Group',
  FileUpload: 'File Input',
  AgentChat: 'Agent Chat',
  TextAnnotation: 'Annotated Text',
  Chat: 'LLM Chat',
  CommentThread: 'Comment Thread',
  SignaturePad: 'Signature',
  JsonSchemaForm: 'JSON Schema Form',
  Tabs: 'Tabbed Container',
  TabbedContainer: 'Tabbed Container',
  SteppedContainer: 'Stepped Container',
  CollapsibleContainer: 'Collapsible Container',
  LinkCard: 'Link Card',
  Drawer: 'Drawer',
  SplitPane: 'Split Pane',
  Chart: 'Mixed Chart',
  KeyValue: 'Key Value',
  ProgressCircle: 'Progress Circle',
  ProgressBar: 'Progress Bar',
  PdfViewer: 'PDF',
  QRCode: 'QR Code',
  GlobalDrawer: 'Drawer Frame',
  GlobalModal: 'Modal Frame',
  GlobalSplitPane: 'Split Pane Frame',
  AuthLogin: 'Auth Login',
  Looker: 'Looker',
  Map: 'Mapbox Map',
  IFrame: 'IFrame',
  Html: 'HTML',
}

const legacyLabelOverrides: Record<string, string> = {
  Alert: 'Alert (legacy)',
  ButtonGroup: 'Button Group (legacy)',
  Chart: 'Chart (legacy)',
  CheckboxTree: 'Checkbox Tree (legacy)',
  KeyValue: 'Key Value (legacy)',
}

// Секции каталога для группировки виджетов.
const widgetSections = [
  {
    key: 'text-inputs',
    label: 'Text inputs',
    types: [
      'EditableText',
      'EditableTextArea',
      'TextInput',
      'Email',
      'Url',
      'TextArea',
      'PasswordInput',
      'JsonEditor',
      'TextEditor',
    ],
  },
  {
    key: 'number-inputs',
    label: 'Number inputs',
    types: [
      'EditableNumber',
      'NumberInput',
      'Currency',
      'Percent',
      'PhoneNumberInput',
      'RangeSlider',
      'Rating',
      'Slider',
    ],
  },
  {
    key: 'select-inputs',
    label: 'Select inputs',
    types: [
      'Cascader',
      'Checkbox',
      'CheckboxGroup',
      'CheckboxTree',
      'Listbox',
      'MultiSelect',
      'MultiSelectListbox',
      'RadioGroup',
      'SegmentedControl',
      'Select',
      'Switch',
      'SwitchGroup',
    ],
  },
  {
    key: 'date-time-inputs',
    label: 'Date and time inputs',
    types: [
      'Calendar',
      'CalendarInput',
      'Date',
      'DateRange',
      'DateTime',
      'Day',
      'Month',
      'Time',
      'Year',
    ],
  },
  {
    key: 'special-inputs',
    label: 'Special inputs',
    types: [
      'AgentChat',
      'TextAnnotation',
      'BoundingBox',
      'ColorInput',
      'CommentThread',
      'FileUpload',
      'Chat',
      'Microphone',
      'Scanner',
      'SignaturePad',
      'Timer',
    ],
  },
  {
    key: 'buttons',
    label: 'Buttons',
    types: [
      'Button',
      'OutlineButton',
      'CloseButton',
      'ButtonGroup',
      'DropdownButton',
      'Link',
      'LinkCard',
      'LinkList',
      'SplitButton',
      'ToggleButton',
      'ToggleLink',
    ],
  },
  {
    key: 'data',
    label: 'Data',
    types: ['Filter', 'JsonExplorer', 'KeyValue', 'KeyValueMap', 'ReorderableList', 'Table'],
  },
  {
    key: 'charts',
    label: 'Charts',
    types: ['Chart'],
  },
  {
    key: 'presentation',
    label: 'Presentation',
    types: [
      'Alert',
      'Avatar',
      'AvatarGroup',
      'Divider',
      'Icon',
      'Image',
      'ImageGrid',
      'PdfViewer',
      'ProgressBar',
      'ProgressCircle',
      'QRCode',
      'Spacer',
      'Statistic',
      'Status',
      'Tags',
      'Text',
      'Timeline',
      'Video',
    ],
  },
  {
    key: 'frames',
    label: 'Frames',
    types: ['GlobalDrawer', 'GlobalModal', 'GlobalSplitPane'],
    source: 'all',
    addMode: 'page-frame' as const,
  },
  {
    key: 'containers',
    label: 'Containers and forms',
    types: [
      'Container',
      'CollapsibleContainer',
      'Stack',
      'Form',
      'JsonSchemaForm',
      'SteppedContainer',
      'TabbedContainer',
      'Header',
      'Sidebar',
      'Drawer',
      'Modal',
      'SplitPane',
      'Wizard',
    ],
  },
  {
    key: 'repeatables',
    label: 'Repeatables',
    types: ['ListView'],
  },
  {
    key: 'navigation',
    label: 'Navigation',
    types: ['Breadcrumbs', 'Navigation', 'PageInput', 'Pagination', 'Steps', 'Tabs'],
  },
  {
    key: 'integrations',
    label: 'Integrations',
    types: ['AuthLogin', 'Looker', 'Map', 'StripeCardForm'],
  },
  {
    key: 'custom',
    label: 'Custom',
    types: ['Html', 'IFrame'],
  },
  {
    key: 'legacy',
    label: 'Legacy',
    types: ['Alert', 'ButtonGroup', 'Chart', 'CheckboxTree', 'KeyValue'],
    source: 'all',
  },
]

type BuilderSidebarPanelComponentsProps = {
  widgets: WidgetDefinition[]
  onAddWidget: (widgetType: string, options?: BuilderWidgetAddOptions) => void
  onAddAppFrameWidget?: (type: string) => void
  onAddPageFrameWidget?: (type: string) => void
  isWidgetSelectable?: (widgetType: string, options?: BuilderWidgetAddOptions) => boolean
  onClose?: () => void
}

export const BuilderSidebarPanelComponents = ({
  widgets,
  onAddWidget,
  onAddAppFrameWidget,
  onAddPageFrameWidget,
  isWidgetSelectable,
  onClose,
}: BuilderSidebarPanelComponentsProps) => {
  const [search, setSearch] = useState('')
  const [componentsTab, setComponentsTab] = useState<'components' | 'modules'>('components')
  const [moduleSearch, setModuleSearch] = useState('')

  const normalizedSearch = search.trim().toLowerCase()
  const availableWidgets = useMemo(
    () => widgets.filter((widget) => widget.category !== 'globals'),
    [widgets]
  )
  const widgetMap = useMemo(() => new Map(widgets.map((widget) => [widget.type, widget])), [
    widgets,
  ])
  const availableWidgetMap = useMemo(
    () => new Map(availableWidgets.map((widget) => [widget.type, widget])),
    [availableWidgets]
  )
  const madeWidgets = useMemo(() => {
    return madeWidgetTypes
      .map((type) => availableWidgets.find((widget) => widget.type === type))
      .filter(Boolean) as WidgetDefinition[]
  }, [availableWidgets])

  const componentSections = useMemo(() => {
    const matchesSearch = (widget: WidgetDefinition) => {
      if (!normalizedSearch) {
        return true
      }
      return [widget.label, widget.type, widget.description]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(normalizedSearch))
    }

    const seenWidgetTypes = new Set<string>()

    return widgetSections
      .map((section) => {
        const sourceMap = section.source === 'all' ? widgetMap : availableWidgetMap
        const items: WidgetDefinition[] = []
        section.types.forEach((type) => {
          if (seenWidgetTypes.has(type)) {
            return
          }
          const widget = sourceMap.get(type)
          if (!widget) {
            return
          }
          seenWidgetTypes.add(type)
          items.push(widget)
        })
        const filteredItems = items.filter(matchesSearch)
        return { ...section, items: filteredItems }
      })
      .filter((section) => section.items.length > 0)
  }, [availableWidgetMap, normalizedSearch, widgetMap])

  const resolveWidgetLabel = (widget: WidgetDefinition, sectionKey?: string) => {
    if (sectionKey === 'legacy') {
      return (
        legacyLabelOverrides[widget.type] ??
        `${widgetLabelOverrides[widget.type] ?? widget.label} (legacy)`
      )
    }
    return widgetLabelOverrides[widget.type] ?? widget.label
  }

  const isDisabled = (widget: WidgetDefinition) =>
    isWidgetSelectable ? !isWidgetSelectable(widget.type) : false

  return (
    <>
      <div className=" flex items-center justify-between pl-3 pr-2">
        <div className="flex h-9 items-center gap-3 text-xs font-normal">
          <button
            type="button"
            className={cn(
              '',
              componentsTab === 'components'
                ? 'text-foreground'
                : 'text-foreground-muted hover:text-foreground'
            )}
            onClick={() => setComponentsTab('components')}
          >
            Components
          </button>
          <button
            type="button"
            className={cn(
              '',
              componentsTab === 'modules'
                ? 'text-foreground'
                : 'text-foreground-muted hover:text-foreground'
            )}
            onClick={() => setComponentsTab('modules')}
          >
            Modules
          </button>
        </div>
        <Button className='px-1' type="text" size="tiny" icon={<X size={14} />} onClick={() => onClose?.()} />
      </div>
      <div className="flex h-full min-h-0 flex-col">
        {componentsTab === 'components' ? (
          <>
            <div className="px-3 pb-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-foreground-muted" />
                <Input_Shadcn_
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search inspector"
                  className="h-6 rounded-md bg-surface-75 pl-7 text-xs"
                />
              </div>
            </div>
            <ScrollArea className="min-h-0 flex-1 px-3 pb-3">
              <div className="space-y-4">
                {normalizedSearch.length === 0 && madeWidgets.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-foreground">Сделанные виджеты</div>
                    <div className="space-y-1">
                      {madeWidgets.map((widget) => (
                        <WidgetListItem
                          key={widget.type}
                          widget={widget}
                          label={resolveWidgetLabel(widget)}
                          onAddWidget={onAddWidget}
                          onAddAppFrameWidget={onAddAppFrameWidget}
                          onAddPageFrameWidget={onAddPageFrameWidget}
                          disabled={isDisabled(widget)}
                        />
                      ))}
                    </div>
                  </div>
                )}
                {componentSections.map((sectionItem) => (
                  <div key={sectionItem.key} className="space-y-2">
                    <div className="text-xs font-semibold text-foreground">{sectionItem.label}</div>
                    <div className="space-y-1">
                      {sectionItem.items.map((widget) => (
                        <WidgetListItem
                          key={widget.type}
                          widget={widget}
                          addMode={sectionItem.addMode}
                          label={resolveWidgetLabel(widget, sectionItem.key)}
                          onAddWidget={onAddWidget}
                          onAddAppFrameWidget={onAddAppFrameWidget}
                          onAddPageFrameWidget={onAddPageFrameWidget}
                          disabled={isDisabled(widget)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
                {componentSections.length === 0 && (
                  <div className="rounded-md border border-dashed border-foreground-muted/40 px-3 py-4 text-center text-xs text-foreground-muted">
                    No components match your search.
                  </div>
                )}
                {normalizedSearch.length === 0 && (
                  <div className="rounded-lg border border-foreground-muted/30 bg-surface-75 p-3 text-xs text-foreground-muted">
                    <div className="space-y-2">
                      <div className="text-xs font-semibold text-foreground">
                        Try custom components
                      </div>
                      <div>
                        Can&apos;t find what you&apos;re looking for? You can build and import your
                        own custom components.
                      </div>
                      <Button type="default" size="tiny">
                        Go to docs
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </>
        ) : (
          <>
            <div className="px-3 pb-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1.5 h-4 w-4 text-foreground-muted" />
                <Input
                  value={moduleSearch}
                  onChange={(event) => setModuleSearch(event.target.value)}
                  aria-label="Search modules"
                  placeholder="Search modules"
                  className="h-7 rounded-md bg-surface-75 pl-8"
                />
              </div>
            </div>
            <ScrollArea className="min-h-0 flex-1 px-3 pb-3">
              <div className="rounded-lg border border-dashed border-foreground-muted/40 px-3 py-6 text-center text-xs text-foreground-muted">
                <div className="space-y-2">
                  <div>Modules are reusable groups of components and queries.</div>
                  <Button type="default" size="tiny">
                    Create a module
                  </Button>
                </div>
              </div>
            </ScrollArea>
          </>
        )}
      </div>
    </>
  )
}
