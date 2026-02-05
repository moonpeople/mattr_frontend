import { useMemo, useState } from 'react'
import { Search, X } from 'lucide-react'

import type { WidgetDefinition } from 'widgets'
import { Button, Input, Input_Shadcn_, ScrollArea, Separator, cn } from 'ui'

import { WidgetCard } from './BuilderSidebarItems'

// Панель компонентов: поиск, списки виджетов и модули.

// Набор быстрых элементов для блока Common.
const commonWidgetTypes = [
  'Table',
  'Text',
  'Button',
  'TextInput',
  'NumberInput',
  'Select',
  'Container',
  'Form',
  'Tabs',
  'Chart',
  'KeyValue',
  'Image',
  'Navigation',
]

const widgetLabelOverrides: Record<string, string> = {
  EditableTextArea: 'Editable Text Area',
  TextArea: 'Text Area',
  TextInput: 'Text Input',
  TextEditor: 'Rich Text Editor',
  JsonEditor: 'JSON Editor',
  NumberInput: 'Number Input',
  EditableNumber: 'Editable Number',
  PhoneNumberInput: 'Phone Number',
  RangeSlider: 'Range Slider',
  DatePicker: 'Date',
  DateRangePicker: 'Date Range',
  DateTimePicker: 'Date Time',
  TimePicker: 'Time',
  SwitchGroup: 'Switch Group',
  FileUpload: 'File Input',
  AgentChat: 'Agent Chat',
  TextAnnotation: 'Annotated Text',
  Chat: 'LLM Chat',
  CommentThread: 'Comment Thread',
  SignaturePad: 'Signature',
  JsonSchemaForm: 'JSON Schema Form',
  Tabs: 'Tabbed Container',
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
      'NumberInput',
      'EditableNumber',
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
    types: ['DatePicker', 'DateRangePicker', 'DateTimePicker', 'TimePicker'],
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
      'ButtonGroup',
      'DropdownButton',
      'Link',
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
    addMode: 'global' as const,
  },
  {
    key: 'containers',
    label: 'Containers and forms',
    types: ['Container', 'Form', 'JsonSchemaForm', 'Modal', 'Wizard'],
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
  onAddWidget: (widgetType: string) => void
  onAddGlobalWidget?: (type: string) => void
  onClose?: () => void
}

export const BuilderSidebarPanelComponents = ({
  widgets,
  onAddWidget,
  onAddGlobalWidget,
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
  const commonWidgets = useMemo(() => {
    return commonWidgetTypes
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

    return widgetSections
      .map((section) => {
        const sourceMap = section.source === 'all' ? widgetMap : availableWidgetMap
        const items = section.types
          .map((type) => sourceMap.get(type))
          .filter(Boolean) as WidgetDefinition[]
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
                {normalizedSearch.length === 0 && commonWidgets.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-foreground">Commonly used</div>
                    <div className="grid grid-cols-3 gap-2">
                      {commonWidgets.map((widget) => (
                        <WidgetCard
                          key={widget.type}
                          widget={widget}
                          label={resolveWidgetLabel(widget)}
                          onAddWidget={onAddWidget}
                          onAddGlobalWidget={onAddGlobalWidget}
                        />
                      ))}
                    </div>
                  </div>
                )}
                {componentSections.map((sectionItem) => (
                  <div key={sectionItem.key} className="space-y-2">
                    <div className="text-xs font-semibold text-foreground">{sectionItem.label}</div>
                    <div className="grid grid-cols-3 gap-2">
                      {sectionItem.items.map((widget) => (
                        <WidgetCard
                          key={widget.type}
                          widget={widget}
                          addMode={sectionItem.addMode}
                          label={resolveWidgetLabel(widget, sectionItem.key)}
                          onAddWidget={onAddWidget}
                          onAddGlobalWidget={onAddGlobalWidget}
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
