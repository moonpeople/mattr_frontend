import type { ComponentType, Dispatch, SetStateAction } from 'react'
import {
  Boxes,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Edit,
  GripVertical,
  Layers,
  LayoutGrid,
  ListTree,
  Minus,
  MousePointer2,
  Table2,
  Target,
  Text,
  User,
} from 'lucide-react'

import type { WidgetDefinition } from 'widgets/runtime'
import { Button, cn } from 'ui'
import { resolveValue } from 'lib/builder/value-resolver'

import type { BuilderWidgetAddOptions, BuilderWidgetInstance } from './types'

// Вспомогательные элементы сайдбара билдера: карточки, строки дерева и оверлей для dnd.
export type BuilderWidgetMode = 'page' | 'app-frame' | 'page-frame'

const parseBoolean = (value: unknown, fallback = false) => {
  if (typeof value === 'boolean') {
    return value
  }
  if (typeof value === 'number') {
    return value !== 0
  }
  if (typeof value === 'string') {
    const trimmed = value.trim().toLowerCase()
    if (['true', '1', 'yes', 'y'].includes(trimmed)) {
      return true
    }
    if (['false', '0', 'no', 'n'].includes(trimmed)) {
      return false
    }
  }
  return fallback
}

const formatContainerSlotLabel = (value: unknown) => {
  if (typeof value !== 'string') {
    return ''
  }
  const normalized = value.trim()
  if (!normalized) {
    return ''
  }
  if (normalized.startsWith('tab:')) {
    return `Tab: ${normalized.slice(4)}`
  }
  if (normalized.startsWith('step:')) {
    return `Step: ${normalized.slice(5)}`
  }
  if (normalized === 'header') {
    return 'Header'
  }
  if (normalized === 'body') {
    return 'Body'
  }
  if (normalized === 'footer') {
    return 'Footer'
  }
  if (normalized === 'pane-1') {
    return 'Pane 1'
  }
  if (normalized === 'pane-2') {
    return 'Pane 2'
  }
  return normalized
}

type WidgetIconProps = {
  size?: number
  className?: string
}

type WidgetIconComponent = ComponentType<WidgetIconProps>

const BrandIcon = ({
  src,
  size = 16,
  className,
}: { src: string } & WidgetIconProps) => {
  return (
    <img
      src={src}
      width={size}
      height={size}
      className={cn('block', className)}
      alt=""
    />
  )
}

const getRuntimeBasePath = () => {
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_BASE_PATH ?? ''
  }
  const nextData = (window as { __NEXT_DATA__?: { basePath?: string; assetPrefix?: string } })
    .__NEXT_DATA__
  return nextData?.basePath ?? nextData?.assetPrefix ?? ''
}

const createBrandIcon = (fileName: string): WidgetIconComponent => {
  const IconComponent = ({ size = 32, className }: WidgetIconProps) => {
    const basePath = getRuntimeBasePath()
    const src = `${basePath}/component_icons/${fileName}`
    return <BrandIcon src={src} size={size} className={className} />
  }
  IconComponent.displayName = `BrandIcon(${fileName})`
  return IconComponent
}

const BRAND_WIDGET_ICONS: Record<string, WidgetIconComponent> = {
  Cascader: createBrandIcon('cascader.svg'),
  Checkbox: createBrandIcon('checkbox.svg'),
  CheckboxGroup: createBrandIcon('checkbox_group.svg'),
  CheckboxTree: createBrandIcon('checkbox_tree.svg'),
  EditableText: createBrandIcon('editable_text.svg'),
  EditableTextArea: createBrandIcon('editable_text_area.svg'),
  JsonEditor: createBrandIcon('json_editor.svg'),
  Listbox: createBrandIcon('listbox.svg'),
  MultiSelect: createBrandIcon('multiselect.svg'),
  MultiSelectListbox: createBrandIcon('multiselect_listbox.svg'),
  EditableNumber: createBrandIcon('number_input.svg'),
  PasswordInput: createBrandIcon('password.svg'),
  PhoneNumberInput: createBrandIcon('phone_number.svg'),
  RadioGroup: createBrandIcon('radio_group.svg'),
  RangeSlider: createBrandIcon('range_slider.svg'),
  Rating: createBrandIcon('rating.svg'),
  SegmentedControl: createBrandIcon('segmented_control.svg'),
  Select: createBrandIcon('select.svg'),
  Slider: createBrandIcon('slider.svg'),
  Switch: createBrandIcon('switch.svg'),
  SwitchGroup: createBrandIcon('switch_group.svg'),
  Table: createBrandIcon('table.svg'),
  TextArea: createBrandIcon('text_area.svg'),
  TextEditor: createBrandIcon('rich_text_editor.svg'),
  TextInput: createBrandIcon('text_input.svg'),
  Email: createBrandIcon('text_input.svg'),
  Url: createBrandIcon('text_input.svg'),
}

// Подбор иконок для элементов дерева и карточек.
export const getWidgetIcon = (type: string) => {
  const brandIcon = BRAND_WIDGET_ICONS[type]
  if (brandIcon) {
    return brandIcon
  }
  if (type === 'GlobalHeader' || type === 'GlobalSplitPane') {
    return LayoutGrid
  }
  if (type === 'SplitPane') {
    return LayoutGrid
  }
  if (type === 'GlobalSidebar') {
    return Layers
  }
  if (type === 'Sidebar') {
    return Layers
  }
  if (type === 'GlobalDrawer') {
    return ListTree
  }
  if (type === 'Drawer') {
    return ListTree
  }
  if (type === 'GlobalModal') {
    return Boxes
  }
  if (type === 'Modal') {
    return Boxes
  }
  if (type === 'DrawerHeader' || type === 'DrawerFooter' || type === 'ModalHeader' || type === 'ModalFooter') {
    return LayoutGrid
  }
  if (type === 'DrawerTitle' || type === 'ModalTitle') {
    return Text
  }
  if (type === 'DrawerCloseButton' || type === 'ModalCloseButton') {
    return MousePointer2
  }
  if (type === 'Table') {
    return Table2
  }
  if (type === 'Text') {
    return Text
  }
  if (type === 'Button' || type === 'OutlineButton' || type === 'CloseButton') {
    return MousePointer2
  }
  if (type === 'TextInput') {
    return Edit
  }
  if (type === 'Email' || type === 'Url') {
    return Edit
  }
  if (type === 'Navigation') {
    return ListTree
  }
  if (type === 'Avatar') {
    return User
  }
  return Boxes
}

// Рекурсивный поиск виджета в дереве.
export const findWidgetById = (
  widgets: BuilderWidgetInstance[],
  widgetId: string
): BuilderWidgetInstance | null => {
  for (const widget of widgets) {
    if (widget.id === widgetId) {
      return widget
    }
    if (widget.children?.length) {
      const match = findWidgetById(widget.children, widgetId)
      if (match) {
        return match
      }
    }
  }
  return null
}

export const TreeDragOverlayRow = ({ widget }: { widget: BuilderWidgetInstance }) => {
  const Icon = getWidgetIcon(widget.type)
  return (
    <div className="flex items-center gap-1.5 rounded-sm border border-foreground-muted/30 bg-surface-100 px-2 py-1 text-[11px] shadow-lg">
      <GripVertical size={10} className="text-foreground-muted" />
      <Icon size={12} className="text-foreground-muted" />
      <span className="text-foreground">{widget.id}</span>
    </div>
  )
}

type TreeRowProps = {
  widget: BuilderWidgetInstance
  depth: number
  mode: BuilderWidgetMode
  collapsed: Record<string, boolean>
  setCollapsed: Dispatch<SetStateAction<Record<string, boolean>>>
  selectedWidgetId?: string | null
  selectedFrameWidgetId?: string | null
  onSelectWidget?: (widgetId: string) => void
  onSelectFrameWidget?: (widgetId: string) => void
  onToggleWidgetHidden?: (widgetId: string, mode: BuilderWidgetMode) => void
  onFocusWidget?: (widgetId: string) => void
}

// Строка дерева с dnd, скрытием и фокусом.
export const TreeRow = ({
  widget,
  depth,
  mode,
  collapsed,
  setCollapsed,
  selectedWidgetId,
  selectedFrameWidgetId,
  onSelectWidget,
  onSelectFrameWidget,
  onToggleWidgetHidden,
  onFocusWidget,
}: TreeRowProps) => {
  const hasChildren = Boolean(widget.children && widget.children.length > 0)
  const isCollapsed = collapsed[widget.id]
  const isFrameMode = mode === 'app-frame' || mode === 'page-frame'
  const isSelected = isFrameMode
    ? selectedFrameWidgetId === widget.id
    : selectedWidgetId === widget.id
  const isHidden = parseBoolean(resolveValue(widget.hidden, {}), false)
  const containerSlotLabel = formatContainerSlotLabel(widget.props?.containerSlot)
  const Icon = getWidgetIcon(widget.type)

  return (
    <div>
      <div
        className={cn(
          'group flex cursor-pointer items-center justify-between rounded-sm px-1 text-xs transition',
          isSelected
            ? 'bg-brand-500/10 text-foreground'
            : 'text-foreground-muted hover:bg-surface-200',
          isHidden ? 'opacity-60' : null
        )}
        onClick={() => {
          if (isFrameMode) {
            onSelectFrameWidget?.(widget.id)
            return
          }
          onSelectWidget?.(widget.id)
        }}
      >
        <div className="flex items-center gap-0.5" style={{ paddingLeft: 0 + depth * 10 }}>
          {hasChildren ? (
            <button
              type="button"
              className="text-foreground-muted"
              onClick={(event) => {
                event.stopPropagation()
                setCollapsed((prev) => ({ ...prev, [widget.id]: !prev[widget.id] }))
              }}
            >
              {isCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
            </button>
          ) : (
            <span className="inline-flex h-3 w-3 items-center justify-center text-foreground-muted">
              {/* <Minus size={10} /> */}
            </span>
          )}
          <Icon size={12} className="text-foreground-muted" />
          <span className="text-foreground px-1">{widget.id}</span>
          {containerSlotLabel ? (
            <span className="max-w-[110px] truncate rounded border border-foreground-muted/30 bg-surface-200 px-1 py-0 text-[9px] uppercase tracking-wide text-foreground-muted">
              {containerSlotLabel}
            </span>
          ) : null}
          {isHidden && <EyeOff size={10} className="text-foreground-muted" />}
        </div>
        <div className="flex items-center gap-0.5 opacity-0 transition group-hover:opacity-100">
          <Button
            type="text"
            size="tiny"
            icon={<Target size={10} />}
            onClick={(event) => {
              event.stopPropagation()
              onFocusWidget?.(widget.id)
            }}
            className='px-1'
          />
          <Button
            type="text"
            size="tiny"
            icon={isHidden ? <EyeOff size={10} /> : <Eye size={10} />}
            onClick={(event) => {
              event.stopPropagation()
              onToggleWidgetHidden?.(widget.id, mode)
            }}
            className='px-1'
          />
        </div>
      </div>
      {!isCollapsed && widget.children?.length ? (
        <div className="space-y-0.5">
          {widget.children.map((child) => (
            <TreeRow
              key={child.id}
              widget={child}
              depth={depth + 1}
              mode={mode}
              collapsed={collapsed}
              setCollapsed={setCollapsed}
              selectedWidgetId={selectedWidgetId}
              selectedFrameWidgetId={selectedFrameWidgetId}
              onSelectWidget={onSelectWidget}
              onSelectFrameWidget={onSelectFrameWidget}
              onToggleWidgetHidden={onToggleWidgetHidden}
              onFocusWidget={onFocusWidget}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}

type WidgetCardProps = {
  widget: WidgetDefinition
  addMode?: 'page' | 'app-frame' | 'page-frame'
  label?: string
  onAddWidget: (widgetType: string, options?: BuilderWidgetAddOptions) => void
  onAddAppFrameWidget?: (type: string) => void
  onAddPageFrameWidget?: (type: string) => void
  addOptions?: BuilderWidgetAddOptions
  disabled?: boolean
}

// Карточка виджета для каталога/добавления.
export const WidgetCard = ({
  widget,
  addMode = 'page',
  label,
  onAddWidget,
  onAddAppFrameWidget,
  onAddPageFrameWidget,
  addOptions,
  disabled = false,
}: WidgetCardProps) => {
  const Icon = getWidgetIcon(widget.type)
  const isNew = widget.type === 'AgentChat'
  const cardLabel = label ?? widget.label
  const canDrag = addMode === 'page' && !disabled

  return (
    <button
      type="button"
      draggable={canDrag}
      className={cn(
        'group flex w-full flex-col items-center gap-1.5 bg-transparent p-0 text-left text-xs transition',
        canDrag ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer',
        disabled ? 'cursor-not-allowed opacity-50' : null
      )}
      disabled={disabled}
      onClick={() => {
        if (disabled) {
          return
        }
        if (addMode === 'app-frame') {
          onAddAppFrameWidget?.(widget.type)
          return
        }
        if (addMode === 'page-frame') {
          onAddPageFrameWidget?.(widget.type)
          return
        }
        onAddWidget(widget.type, addOptions)
      }}
      onDragStart={(event) => {
        if (!canDrag) {
          event.preventDefault()
          return
        }
        event.dataTransfer.setData('application/x-builder-widget', widget.type)
        if (addOptions?.presetId) {
          event.dataTransfer.setData('application/x-builder-widget-preset', addOptions.presetId)
        }
        event.dataTransfer.setData('text/plain', widget.type)
        event.dataTransfer.effectAllowed = 'copy'
      }}
    >
      <div className="relative flex h-10 w-full items-center justify-center rounded-lg border border-foreground-muted/30 bg-surface-75">
        <Icon size={32} className="text-foreground-muted/70" />
        {isNew && (
          <span className="absolute right-2 top-2 rounded-full bg-brand-500/10 px-2 py-0.5 text-[10px] font-semibold text-brand-600">
            New
          </span>
        )}
      </div>
      <div className="text-center text-[10px] font-medium text-foreground-muted">
        {cardLabel}
      </div>
    </button>
  )
}

type WidgetListItemProps = WidgetCardProps & {
  description?: string
}

// Строка виджета для списка.
export const WidgetListItem = ({
  widget,
  addMode = 'page',
  label,
  description,
  onAddWidget,
  onAddAppFrameWidget,
  onAddPageFrameWidget,
  addOptions,
  disabled = false,
}: WidgetListItemProps) => {
  const Icon = getWidgetIcon(widget.type)
  const canDrag = addMode === 'page' && !disabled

  return (
    <button
      type="button"
      draggable={canDrag}
      className={cn(
        'group flex w-full items-center gap-3 rounded-md px-2 py-1 text-left text-xs transition',
        canDrag ? 'cursor-grab hover:bg-surface-75 active:cursor-grabbing' : 'cursor-pointer',
        disabled ? 'cursor-not-allowed opacity-50' : null
      )}
      disabled={disabled}
      onClick={() => {
        if (disabled) {
          return
        }
        if (addMode === 'app-frame') {
          onAddAppFrameWidget?.(widget.type)
          return
        }
        if (addMode === 'page-frame') {
          onAddPageFrameWidget?.(widget.type)
          return
        }
        onAddWidget(widget.type, addOptions)
      }}
      onDragStart={(event) => {
        if (!canDrag) {
          event.preventDefault()
          return
        }
        event.dataTransfer.setData('application/x-builder-widget', widget.type)
        if (addOptions?.presetId) {
          event.dataTransfer.setData('application/x-builder-widget-preset', addOptions.presetId)
        }
        event.dataTransfer.setData('text/plain', widget.type)
        event.dataTransfer.effectAllowed = 'copy'
      }}
    >
      <span className="flex h-7 w-7 items-center justify-center rounded-md border border-foreground-muted/30 bg-surface-75 text-foreground-muted/70">
        <Icon size={16} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-foreground">{label ?? widget.label}</span>
        {(description ?? widget.description) && (
          <span className="truncate text-[10px] text-foreground-muted">
            {description ?? widget.description}
          </span>
        )}
      </span>
    </button>
  )
}
