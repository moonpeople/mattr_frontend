import type { Dispatch, SetStateAction } from 'react'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
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

import type { WidgetDefinition } from 'widgets'
import { Button, cn } from 'ui'
import { resolveValue } from 'lib/builder/value-resolver'

import type { BuilderWidgetInstance } from './types'

// Вспомогательные элементы сайдбара билдера: карточки, строки дерева и оверлей для dnd.
export type BuilderWidgetMode = 'page' | 'global' | 'page-global'

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

// Подбор иконок для элементов дерева и карточек.
export const getWidgetIcon = (type: string) => {
  if (type === 'GlobalHeader' || type === 'GlobalSplitPane') {
    return LayoutGrid
  }
  if (type === 'GlobalSidebar') {
    return Layers
  }
  if (type === 'GlobalDrawer') {
    return ListTree
  }
  if (type === 'GlobalModal') {
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
  if (type === 'Button') {
    return MousePointer2
  }
  if (type === 'TextInput') {
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
  parentId: string | null
  collapsed: Record<string, boolean>
  setCollapsed: Dispatch<SetStateAction<Record<string, boolean>>>
  selectedWidgetId?: string | null
  selectedGlobalWidgetId?: string | null
  onSelectWidget?: (widgetId: string) => void
  onSelectGlobalWidget?: (widgetId: string) => void
  onToggleWidgetHidden?: (widgetId: string, mode: BuilderWidgetMode) => void
  onFocusWidget?: (widgetId: string) => void
}

// Строка дерева с dnd, скрытием и фокусом.
export const TreeRow = ({
  widget,
  depth,
  mode,
  parentId,
  collapsed,
  setCollapsed,
  selectedWidgetId,
  selectedGlobalWidgetId,
  onSelectWidget,
  onSelectGlobalWidget,
  onToggleWidgetHidden,
  onFocusWidget,
}: TreeRowProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: widget.id,
    data: { parentId, mode },
  })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }
  const hasChildren = Boolean(widget.children && widget.children.length > 0)
  const isCollapsed = collapsed[widget.id]
  const isGlobalMode = mode === 'global' || mode === 'page-global'
  const isSelected = isGlobalMode
    ? selectedGlobalWidgetId === widget.id
    : selectedWidgetId === widget.id
  const isHidden = parseBoolean(resolveValue(widget.hidden, {}), false)
  const Icon = getWidgetIcon(widget.type)

  return (
    <div className="space-y-0.5">
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          'group flex cursor-pointer items-center justify-between rounded-sm px-1.5 py-0.5 text-[11px] transition',
          isSelected
            ? 'bg-brand-500/10 text-foreground'
            : 'text-foreground-muted hover:bg-surface-200',
          isHidden ? 'opacity-60' : null,
          isDragging ? 'z-10 bg-surface-100 shadow-sm' : null
        )}
        onClick={() => {
          if (isGlobalMode) {
            onSelectGlobalWidget?.(widget.id)
            return
          }
          onSelectWidget?.(widget.id)
        }}
      >
        <div className="flex items-center gap-1.5" style={{ paddingLeft: 6 + depth * 10 }}>
          <button
            type="button"
            ref={setActivatorNodeRef}
            className="flex h-3 w-3 items-center justify-center text-foreground-muted hover:text-foreground"
            {...attributes}
            {...listeners}
            onClick={(event) => event.stopPropagation()}
          >
            <GripVertical size={10} />
          </button>
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
              <Minus size={10} />
            </span>
          )}
          <Icon size={12} className="text-foreground-muted" />
          <span className="text-foreground">{widget.id}</span>
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
          />
          <Button
            type="text"
            size="tiny"
            icon={isHidden ? <EyeOff size={10} /> : <Eye size={10} />}
            onClick={(event) => {
              event.stopPropagation()
              onToggleWidgetHidden?.(widget.id, mode)
            }}
          />
        </div>
      </div>
      {!isCollapsed && widget.children?.length ? (
        <SortableContext
          items={widget.children.map((child) => child.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-0.5">
            {widget.children.map((child) => (
              <TreeRow
                key={child.id}
                widget={child}
                depth={depth + 1}
                mode={mode}
                parentId={widget.id}
                collapsed={collapsed}
                setCollapsed={setCollapsed}
                selectedWidgetId={selectedWidgetId}
                selectedGlobalWidgetId={selectedGlobalWidgetId}
                onSelectWidget={onSelectWidget}
                onSelectGlobalWidget={onSelectGlobalWidget}
                onToggleWidgetHidden={onToggleWidgetHidden}
                onFocusWidget={onFocusWidget}
              />
            ))}
          </div>
        </SortableContext>
      ) : null}
    </div>
  )
}

type WidgetCardProps = {
  widget: WidgetDefinition
  addMode?: 'page' | 'global'
  label?: string
  onAddWidget: (widgetType: string) => void
  onAddGlobalWidget?: (type: string) => void
}

// Карточка виджета для каталога/добавления.
export const WidgetCard = ({
  widget,
  addMode = 'page',
  label,
  onAddWidget,
  onAddGlobalWidget,
}: WidgetCardProps) => {
  const Icon = getWidgetIcon(widget.type)
  const isNew = widget.type === 'AgentChat'
  const cardLabel = label ?? widget.label
  const canDrag = addMode !== 'global'

  return (
    <button
      type="button"
      draggable={canDrag}
      className={cn(
        'group flex w-full flex-col items-center gap-1.5 rounded-lg border border-foreground-muted/20 bg-surface-75 px-2 py-2 text-left text-xs transition hover:border-foreground-muted/50 hover:bg-surface-100/70',
        canDrag ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
      )}
      onClick={() => {
        if (addMode === 'global') {
          onAddGlobalWidget?.(widget.type)
          return
        }
        onAddWidget(widget.type)
      }}
      onDragStart={(event) => {
        if (!canDrag) {
          event.preventDefault()
          return
        }
        event.dataTransfer.setData('application/x-builder-widget', widget.type)
        event.dataTransfer.setData('text/plain', widget.type)
        event.dataTransfer.effectAllowed = 'copy'
      }}
    >
      <div className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-foreground-muted/30 bg-surface-75">
        <Icon size={20} className="text-foreground-muted/70" />
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
