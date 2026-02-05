import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
  type MouseEvent,
  type ReactNode,
} from 'react'
import RGL, { WidthProvider, type Layout } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import {
  BarChartIcon,
  Box,
  Calendar,
  ChevronDown,
  Database,
  Edit,
  FileText,
  GripVertical,
  Image as ImageIcon,
  LayoutGrid,
  List,
  Menu,
  MousePointer2,
  Plus,
  Table2,
  Upload,
  User,
  X,
} from 'lucide-react'
import type { WidgetDefinition } from 'widgets'
import { getWidgetDefinition } from 'widgets'
import { Button, Input, ScrollArea, Separator, cn } from 'ui'
import { resolveValue } from 'lib/builder/value-resolver'

import type { BuilderWidgetInstance } from './types'
import {
  resolvePagePaddingValue,
  resolveSpacingPadding,
  resolveWidgetSpacingModes,
} from './types'
import { getWidgetResizeHandles, renderBuilderResizeHandle } from './BuilderResizeHandles'

// Canvas buildera: sobiraet globalnye sekcii, page grid i dnd/resize.

interface BuilderCanvasProps {
  widgets: BuilderWidgetInstance[]
  globalWidgets?: BuilderWidgetInstance[]
  pageGlobals?: BuilderWidgetInstance[]
  selectedWidgetId: string | null
  selectedGlobalWidgetId?: string | null
  isPageComponentSelected?: boolean
  evaluationContext?: Record<string, unknown>
  pageComponent?: {
    expandToFit?: boolean
    background?: string
    paddingMode?: 'normal' | 'none'
    paddingFxEnabled?: boolean
    paddingFx?: string
  }
  pageLabel?: string
  onSelectWidget: (widgetId: string) => void
  onSelectGlobalWidget?: (widgetId: string) => void
  onSelectPageComponent?: () => void
  onClearSelection: () => void
  onUpdateLayout: (layout: Layout[]) => void
  onUpdateWidgetLayout: (widgetId: string, patch: Partial<Layout>) => void
  onUpdateChildLayout: (parentId: string, layout: Layout[]) => void
  onUpdateGlobalChildLayout?: (parentId: string, layout: Layout[]) => void
  onUpdatePageGlobalChildLayout?: (parentId: string, layout: Layout[]) => void
  onUpdateGlobalWidgetLayout?: (widgetId: string, patch: Partial<Layout>) => void
  onUpdatePageGlobalWidgetLayout?: (widgetId: string, patch: Partial<Layout>) => void
  onDropWidget: (widgetType: string, layout: Layout, parentId?: string) => void
  onDropGlobalWidget?: (widgetType: string, layout: Layout, parentId: string) => void
  onDropPageGlobalWidget?: (widgetType: string, layout: Layout, parentId: string) => void
  onInsertAdjacentWidget: (
    targetWidgetId: string,
    position: 'above' | 'below',
    widgetType: string
  ) => void
  onOpenInspectorPanel?: (widgetId: string, panel: { key: string; label: string }) => void
  onSetGlobalWidgetHidden?: (
    widgetId: string,
    hidden: boolean,
    mode: 'global' | 'page-global'
  ) => void
  availableWidgets: WidgetDefinition[]
  gridRowHeight: number
  gridMargin: number
  showGrid: boolean
}

const ReactGridLayout = WidthProvider(RGL)
const GRID_COLUMNS = 12
const DEFAULT_ITEM = {
  w: 4,
  h: 6,
  minW: 2,
  minH: 3,
}
const CANVAS_MIN_WIDTH = 1280
const DRAG_HOLD_DELAY_MS = 200
const DRAG_HANDLE_SELECTOR = '.builder-drag-handle'
const DRAG_CANCEL_SELECTOR =
  'button, input, textarea, select, option, [data-no-drag="true"]'
const CONNECT_DATA_WIDGET_TYPES = new Set(['Table'])
const COMMON_WIDGET_TYPES = ['Table', 'Text', 'Button', 'TextInput', 'Select']

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

const widgetIconMap: Record<string, typeof Box> = {
  Text: FileText,
  Button: MousePointer2,
  TextInput: Edit,
  Select: ChevronDown,
  Switch: Box,
  DatePicker: Calendar,
  FileUpload: Upload,
  Container: LayoutGrid,
  Tabs: LayoutGrid,
  Modal: Box,
  Form: Box,
  Table: Table2,
  ListView: List,
  Chart: BarChartIcon,
  Image: ImageIcon,
  Icon: Box,
  Navigation: Menu,
  Avatar: User,
}

export const BuilderCanvas = ({
  widgets,
  globalWidgets = [],
  pageGlobals = [],
  selectedWidgetId,
  selectedGlobalWidgetId,
  isPageComponentSelected = false,
  evaluationContext,
  pageComponent,
  pageLabel = 'Main',
  onSelectWidget,
  onSelectGlobalWidget,
  onSelectPageComponent,
  onClearSelection,
  onUpdateLayout,
  onUpdateWidgetLayout,
  onUpdateChildLayout,
  onUpdateGlobalChildLayout,
  onUpdatePageGlobalChildLayout,
  onUpdateGlobalWidgetLayout,
  onUpdatePageGlobalWidgetLayout,
  onDropWidget,
  onDropGlobalWidget,
  onDropPageGlobalWidget,
  onInsertAdjacentWidget,
  onOpenInspectorPanel,
  onSetGlobalWidgetHidden,
  availableWidgets,
  gridRowHeight,
  gridMargin,
  showGrid,
}: BuilderCanvasProps) => {
  const [quickAdd, setQuickAdd] = useState<{
    widgetId: string
    position: 'above' | 'below'
  } | null>(null)
  const [search, setSearch] = useState('')
  const [frameWidth, setFrameWidth] = useState<number | null>(null)
  const [isFrameResizing, setIsFrameResizing] = useState(false)
  const [isGridInteractionActive, setIsGridInteractionActive] = useState(false)
  const [isExternalDragActive, setIsExternalDragActive] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const frameRef = useRef<HTMLDivElement | null>(null)
  const frameResizeRef = useRef<{ startX: number; startWidth: number } | null>(null)
  const gridInteractionRef = useRef(0)
  const externalDragTimeoutRef = useRef<number | null>(null)

  useEffect(() => {
    if (!quickAdd) {
      return
    }
    const handleClick = (event: MouseEvent) => {
      if (!menuRef.current) {
        return
      }
      if (!menuRef.current.contains(event.target as Node)) {
        setQuickAdd(null)
      }
    }
    window.addEventListener('mousedown', handleClick)
    return () => window.removeEventListener('mousedown', handleClick)
  }, [quickAdd])

  useEffect(() => {
    if (quickAdd) {
      setSearch('')
    }
  }, [quickAdd?.widgetId, quickAdd?.position])

  useEffect(() => {
    return () => {
      if (externalDragTimeoutRef.current) {
        window.clearTimeout(externalDragTimeoutRef.current)
      }
    }
  }, [])

  // Grid pokazyvaem tolko pri drag/resize ili vneshnem drop.
  const beginGridInteraction = () => {
    gridInteractionRef.current += 1
    if (!isGridInteractionActive) {
      setIsGridInteractionActive(true)
    }
  }

  const endGridInteraction = () => {
    gridInteractionRef.current = Math.max(0, gridInteractionRef.current - 1)
    if (gridInteractionRef.current === 0) {
      setIsGridInteractionActive(false)
    }
  }

  const handleExternalDragOver = (event: DragEvent<HTMLDivElement>) => {
    const types = Array.from(event.dataTransfer?.types ?? [])
    if (!types.includes('application/x-builder-widget')) {
      return
    }
    if (!isExternalDragActive) {
      setIsExternalDragActive(true)
    }
    if (externalDragTimeoutRef.current) {
      window.clearTimeout(externalDragTimeoutRef.current)
    }
    externalDragTimeoutRef.current = window.setTimeout(() => {
      setIsExternalDragActive(false)
    }, 120)
  }

  useEffect(() => {
    if (!isFrameResizing) {
      return
    }

    const handleMove = (event: MouseEvent) => {
      if (!frameResizeRef.current) {
        return
      }
      const delta = event.clientX - frameResizeRef.current.startX
      const nextWidth = Math.max(
        CANVAS_MIN_WIDTH,
        Math.round(frameResizeRef.current.startWidth + delta)
      )
      setFrameWidth(nextWidth)
    }

    const handleUp = () => {
      setIsFrameResizing(false)
      frameResizeRef.current = null
    }

    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp)
    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleUp)
    }
  }, [isFrameResizing])

  const { commonWidgets, groupedWidgets } = useMemo(() => {
    const normalized = search.trim().toLowerCase()
    const matches = (widget: WidgetDefinition) =>
      [widget.label, widget.type, widget.description]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(normalized))

    const filtered = normalized ? availableWidgets.filter(matches) : availableWidgets
    const common = COMMON_WIDGET_TYPES.map((type) =>
      filtered.find((widget) => widget.type === type)
    ).filter(Boolean) as WidgetDefinition[]
    const commonTypes = new Set(common.map((widget) => widget.type))

    const grouped = Array.from(
      filtered
        .filter((widget) => !commonTypes.has(widget.type))
        .reduce((acc, widget) => {
          if (!acc.has(widget.category)) {
            acc.set(widget.category, [])
          }
          acc.get(widget.category)?.push(widget)
          return acc
        }, new Map<string, WidgetDefinition[]>())
    )

    return { commonWidgets: common, groupedWidgets: grouped }
  }, [availableWidgets, search])

  // Grid dlya widgetov na stranitse i vlozhennykh containerakh.
  const renderGrid = (
    items: BuilderWidgetInstance[],
    depth: number,
    parentId?: string,
    showEmptyState = false
  ): ReactNode => {
    const layoutMap = new Map(
      items.map((widget, index) => {
        const definition = getWidgetDefinition(widget.type)
        return [
          widget.id,
          normalizeLayout(
            widget,
            index,
            GRID_COLUMNS,
            definition?.builder?.resizeHandles,
            selectedWidgetId === widget.id
          ),
        ]
      })
    )
    const gridLayout = Array.from(layoutMap.values())
    const marginValue =
      depth > 0 ? Math.max(4, Math.round(gridMargin / 2)) : gridMargin
    const margin: [number, number] = [marginValue, marginValue]
    const isEmpty = items.length === 0
    const minHeight = depth > 0 ? 'min-h-[120px]' : 'min-h-[160px]'
    const showGridLines = showGrid && (isGridInteractionActive || isExternalDragActive)
    const lineColor =
      depth > 0
        ? 'var(--builder-grid-line-muted, rgba(148,163,184,0.16))'
        : 'var(--builder-grid-line, rgba(148,163,184,0.28))'
    const columnStride = `calc((100% - ${(GRID_COLUMNS - 1) * marginValue}px) / ${GRID_COLUMNS} + ${marginValue}px)`
    const rowStride = `${gridRowHeight + marginValue}px`
    const gridStyle = showGridLines
      ? {
          backgroundImage: `linear-gradient(to right, ${lineColor} 1px, transparent 1px), linear-gradient(to bottom, ${lineColor} 1px, transparent 1px)`,
          backgroundSize: `${columnStride} ${rowStride}`,
          backgroundPosition: '0 0',
        }
      : undefined

    return (
      <div className={cn('relative', minHeight)} style={gridStyle}>
        {isEmpty && showEmptyState && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 text-center text-sm text-foreground-muted">
            <div className="text-base font-medium text-foreground">Drop widgets here</div>
            <div>Pick a widget from the left panel to start building.</div>
          </div>
        )}
        <ReactGridLayout
          layout={gridLayout}
          cols={GRID_COLUMNS}
          rowHeight={gridRowHeight}
          margin={margin}
          containerPadding={[0, 0]}
          compactType={null}
          preventCollision={false}
          isDraggable
          isResizable
          draggableHandle={DRAG_HANDLE_SELECTOR}
          draggableCancel={DRAG_CANCEL_SELECTOR}
          resizeHandle={renderBuilderResizeHandle}
          className={minHeight}
          isDroppable
          droppingItem={{ i: '__dropping__', ...DEFAULT_ITEM }}
          onDragStart={beginGridInteraction}
          onResizeStart={beginGridInteraction}
          onDragStop={(layout) => {
            if (depth === 0) {
              onUpdateLayout(layout)
            } else if (parentId) {
              onUpdateChildLayout(parentId, layout)
            }
            endGridInteraction()
          }}
          onResizeStop={(layout) => {
            if (depth === 0) {
              onUpdateLayout(layout)
            } else if (parentId) {
              onUpdateChildLayout(parentId, layout)
            }
            endGridInteraction()
          }}
          onDrop={(layout, layoutItem, event) => {
            const widgetType = event.dataTransfer?.getData('application/x-builder-widget')
            if (!widgetType) {
              return
            }
            if (depth === 0) {
              onUpdateLayout(layout)
              onDropWidget(widgetType, layoutItem)
              setIsExternalDragActive(false)
              return
            }
            if (parentId) {
              onUpdateChildLayout(parentId, layout)
              onDropWidget(widgetType, layoutItem, parentId)
              setIsExternalDragActive(false)
            }
          }}
        >
          {items.map((widget) => {
            const definition = getWidgetDefinition(widget.type)
            if (!definition) {
              return null
            }

            const layout = layoutMap.get(widget.id)
            if (!layout) {
              return null
            }

            const supportsChildren = Boolean(definition.supportsChildren)
            const childContent = supportsChildren
              ? renderGrid(widget.children ?? [], depth + 1, widget.id, true)
              : null

            return (
              <div
                key={widget.id}
                className="group h-full"
                data-selected={selectedWidgetId === widget.id ? 'true' : 'false'}
              >
                <CanvasCard
                  widget={widget}
                  definition={definition}
                  isSelected={selectedWidgetId === widget.id}
                  onSelect={() => onSelectWidget(widget.id)}
                  onQuickAdd={(position) =>
                    setQuickAdd((prev) =>
                      prev?.widgetId === widget.id && prev.position === position
                        ? null
                        : { widgetId: widget.id, position }
                    )
                  }
                  layout={layout}
                  gridRowHeight={gridRowHeight}
                  gridMargin={marginValue}
                  onAutoHeight={(nextHeight) =>
                    onUpdateWidgetLayout(widget.id, { h: nextHeight, minH: 1 })
                  }
                  childContent={childContent}
                  depth={depth}
                  onRunActions={(eventName, payload) =>
                    handleCanvasActions(widget, eventName, payload)
                  }
                  evaluationContext={evaluationContext}
                  onOpenInspectorPanel={onOpenInspectorPanel}
                  showQuickAdd={quickAdd?.widgetId === widget.id}
                  quickAddPosition={quickAdd?.position}
                  quickAddContent={
                    quickAdd?.widgetId === widget.id ? (
                      <div ref={menuRef}>
                        <QuickAddMenu
                          commonWidgets={commonWidgets}
                          groupedWidgets={groupedWidgets}
                          search={search}
                          onSearchChange={setSearch}
                          onSelect={(widgetType) => {
                            onInsertAdjacentWidget(widget.id, quickAdd.position, widgetType)
                            setQuickAdd(null)
                          }}
                        />
                      </div>
                    ) : null
                  }
                />
              </div>
            )
          })}
        </ReactGridLayout>
      </div>
    )
  }

  // Grid dlya globalnykh frame (header/sidebar/drawer), s podderzhkoi fill height.
  const renderGlobalGrid = (
    items: BuilderWidgetInstance[],
    parentId: string,
    minHeightClass = 'min-h-[120px]',
    options?: {
      onUpdateChildLayout?: (parentId: string, layout: Layout[]) => void
      onDropWidget?: (widgetType: string, layout: Layout, parentId: string) => void
      onUpdateWidgetLayout?: (widgetId: string, patch: Partial<Layout>) => void
      fillHeight?: boolean
      columns?: number
      showEmptyState?: boolean
    }
  ): ReactNode => {
    const columns = options?.columns ?? GRID_COLUMNS
    const layoutMap = new Map(
      items.map((widget, index) => {
        const definition = getWidgetDefinition(widget.type)
        return [
          widget.id,
          normalizeLayout(
            widget,
            index,
            columns,
            definition?.builder?.resizeHandles,
            selectedGlobalWidgetId === widget.id
          ),
        ]
      })
    )
    const gridLayout = Array.from(layoutMap.values())
    const marginValue = gridMargin
    const margin: [number, number] = [marginValue, marginValue]
    const isEmpty = items.length === 0
    const updateChildLayout = options?.onUpdateChildLayout ?? onUpdateGlobalChildLayout
    const dropWidget = options?.onDropWidget ?? onDropGlobalWidget
    const updateWidgetLayout = options?.onUpdateWidgetLayout ?? onUpdateGlobalWidgetLayout
    const fillHeight = options?.fillHeight ?? false
    const showEmptyState = options?.showEmptyState ?? true
    const showGridLines = showGrid && (isGridInteractionActive || isExternalDragActive)
    const lineColor = 'var(--builder-grid-line-muted, rgba(148,163,184,0.2))'
    const columnStride =
      columns === 1
        ? '100%'
        : `calc((100% - ${(columns - 1) * marginValue}px) / ${columns} + ${marginValue}px)`
    const rowStride = `${gridRowHeight + marginValue}px`
    const gridStyle = showGridLines
      ? {
          backgroundImage: `linear-gradient(to right, ${lineColor} 1px, transparent 1px), linear-gradient(to bottom, ${lineColor} 1px, transparent 1px)`,
          backgroundSize: `${columnStride} ${rowStride}`,
          backgroundPosition: '0 0',
        }
      : undefined
    const wrapperStyle = fillHeight ? { ...gridStyle, height: '100%' } : gridStyle

    return (
      <div
        className={cn(
          'relative',
          fillHeight ? 'h-full overflow-visible' : null,
          minHeightClass
        )}
        style={wrapperStyle}
      >
        {isEmpty && showEmptyState && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 text-center text-xs text-foreground-muted">
            <div className="text-sm font-medium text-foreground">Drop components here</div>
            <div>Drag widgets from the left panel.</div>
          </div>
        )}
        <ReactGridLayout
          layout={gridLayout}
          cols={columns}
          rowHeight={gridRowHeight}
          margin={margin}
          containerPadding={[0, 0]}
          compactType={null}
          preventCollision={false}
          isDraggable
          isResizable
          draggableHandle={DRAG_HANDLE_SELECTOR}
          draggableCancel={DRAG_CANCEL_SELECTOR}
          resizeHandle={renderBuilderResizeHandle}
          className={cn(minHeightClass, fillHeight ? 'h-full overflow-visible' : null)}
          autoSize={!fillHeight}
          style={fillHeight ? { height: '100%' } : undefined}
          isDroppable
          droppingItem={{ i: '__dropping__', ...DEFAULT_ITEM }}
          onDragStart={beginGridInteraction}
          onResizeStart={beginGridInteraction}
          onDragStop={(layout) => {
            updateChildLayout?.(parentId, layout)
            endGridInteraction()
          }}
          onResizeStop={(layout) => {
            updateChildLayout?.(parentId, layout)
            endGridInteraction()
          }}
          onDrop={(layout, layoutItem, event) => {
            const widgetType = event.dataTransfer?.getData('application/x-builder-widget')
            if (!widgetType) {
              return
            }
            updateChildLayout?.(parentId, layout)
            dropWidget?.(widgetType, layoutItem, parentId)
            setIsExternalDragActive(false)
          }}
        >
          {items.map((widget) => {
            const definition = getWidgetDefinition(widget.type)
            if (!definition) {
              return null
            }

            const layout = layoutMap.get(widget.id)
            if (!layout) {
              return null
            }

            return (
              <div
                key={widget.id}
                className="group h-full"
                data-selected={selectedGlobalWidgetId === widget.id ? 'true' : 'false'}
              >
                <CanvasCard
                  widget={widget}
                  definition={definition}
                  isSelected={selectedGlobalWidgetId === widget.id}
                  onSelect={() => onSelectGlobalWidget?.(widget.id)}
                  onQuickAdd={(position) => {
                    void position
                  }}
                  enableQuickAddControls={false}
                  layout={layout}
                  gridRowHeight={gridRowHeight}
                  gridMargin={marginValue}
                  onAutoHeight={(nextHeight) =>
                    updateWidgetLayout?.(widget.id, { h: nextHeight, minH: 1 })
                  }
                  childContent={null}
                  depth={1}
                  onRunActions={(eventName, payload) =>
                    handleCanvasActions(widget, eventName, payload)
                  }
                  evaluationContext={evaluationContext}
                  onOpenInspectorPanel={onOpenInspectorPanel}
                  showQuickAdd={false}
                  quickAddContent={null}
                />
              </div>
            )
          })}
        </ReactGridLayout>
      </div>
    )
  }

  const globalSections = useMemo(() => {
    const sections: Record<
      'header' | 'sidebar' | 'drawer' | 'modal' | 'split' | 'other',
      BuilderWidgetInstance[]
    > = {
      header: [],
      sidebar: [],
      drawer: [],
      modal: [],
      split: [],
      other: [],
    }

    globalWidgets.forEach((widget) => {
      if (widget.type === 'GlobalHeader') {
        sections.header.push(widget)
      } else if (widget.type === 'GlobalSidebar') {
        sections.sidebar.push(widget)
      } else if (widget.type === 'GlobalDrawer') {
        sections.drawer.push(widget)
      } else if (widget.type === 'GlobalModal') {
        sections.modal.push(widget)
      } else if (widget.type === 'GlobalSplitPane') {
        sections.split.push(widget)
      } else {
        sections.other.push(widget)
      }
    })

    return sections
  }, [globalWidgets])

  const pageGlobalSections = useMemo(() => {
    const sections: Record<'header' | 'sidebar', BuilderWidgetInstance[]> = {
      header: [],
      sidebar: [],
    }
    pageGlobals.forEach((widget) => {
      if (widget.type === 'GlobalHeader') {
        sections.header.push(widget)
      } else if (widget.type === 'GlobalSidebar') {
        sections.sidebar.push(widget)
      }
    })
    return sections
  }, [pageGlobals])

  const activeHeaderWidgets =
    pageGlobalSections.header.length > 0 ? pageGlobalSections.header : globalSections.header
  const activeSidebarWidgets =
    pageGlobalSections.sidebar.length > 0 ? pageGlobalSections.sidebar : globalSections.sidebar
  const globalWidgetIds = useMemo(
    () => new Set(globalWidgets.map((widget) => widget.id)),
    [globalWidgets]
  )
  const pageGlobalIds = useMemo(
    () => new Set(pageGlobals.map((widget) => widget.id)),
    [pageGlobals]
  )
  const visibleOverlayDrawers = useMemo(
    () =>
      globalSections.drawer.filter(
        (widget) =>
          !parseBoolean(resolveValue(widget.hidden, evaluationContext ?? {}), false)
      ),
    [evaluationContext, globalSections.drawer]
  )
  const visibleOverlayModals = useMemo(
    () =>
      globalSections.modal.filter(
        (widget) =>
          !parseBoolean(resolveValue(widget.hidden, evaluationContext ?? {}), false)
      ),
    [evaluationContext, globalSections.modal]
  )

  const handleCanvasActions = (
    widget: BuilderWidgetInstance,
    eventName: string,
    payload?: Record<string, unknown>
  ) => {
    const events = normalizeEvents(widget.props?.events)
    if (events.length === 0) {
      return
    }

    for (const action of events.filter((item) => item.event === eventName)) {
      const resolved = resolveValue(action, { event: payload })
      if (!resolved || typeof resolved !== 'object') {
        continue
      }
      const actionType = String((resolved as Record<string, unknown>).type ?? '')
      const isControlComponent = actionType === 'controlComponent'
      const isWidgetAction = actionType === 'widget'
      if (actionType !== 'setHidden' && !isControlComponent && !isWidgetAction) {
        continue
      }
      const method = isControlComponent
        ? String((resolved as Record<string, unknown>).method ?? '')
        : isWidgetAction
          ? String((resolved as Record<string, unknown>).method ?? '')
          : 'setHidden'
      if (method !== 'setHidden') {
        continue
      }
      const targetIdRaw =
        (resolved as Record<string, unknown>).componentId ??
        (resolved as Record<string, unknown>).widgetId ??
        (resolved as Record<string, unknown>).targetId ??
        (resolved as Record<string, unknown>).pluginId
      const targetId = typeof targetIdRaw === 'string' ? targetIdRaw : null
      if (!targetId) {
        continue
      }
      const hiddenRaw =
        (resolved as Record<string, unknown>).hidden ??
        (resolved as Record<string, unknown>).params?.hidden
      const hidden =
        typeof hiddenRaw === 'boolean'
          ? hiddenRaw
          : typeof hiddenRaw === 'string'
            ? hiddenRaw.toLowerCase() === 'true'
            : true
      if (pageGlobalIds.has(targetId)) {
        onSetGlobalWidgetHidden?.(targetId, hidden, 'page-global')
        continue
      }
      if (globalWidgetIds.has(targetId)) {
        onSetGlobalWidgetHidden?.(targetId, hidden, 'global')
      }
    }
  }

  // Obertka globalnogo widgeta: label, selection i frame tip.
  const renderGlobalContainer = (
    widget: BuilderWidgetInstance,
    variant: 'header' | 'sidebar' | 'drawer' | 'modal' | 'split' | 'other'
  ) => {
    const definition = getWidgetDefinition(widget.type)
    const label = definition?.label ?? widget.type
    const isActive = selectedGlobalWidgetId === widget.id
    const isHidden = parseBoolean(
      resolveValue(widget.hidden, evaluationContext ?? {}),
      false
    )
    const isPageGlobal = pageGlobalIds.has(widget.id)
    const baseClass =
      variant === 'drawer' || variant === 'modal'
        ? 'bg-surface-200/70'
        : 'bg-surface-100'
    const isInlineFrame = variant === 'header' || variant === 'sidebar' || variant === 'split'
    const minHeightClass =
      variant === 'header'
        ? 'min-h-[72px]'
        : variant === 'sidebar'
          ? 'min-h-full h-full'
          : 'min-h-[120px]'

    if (isInlineFrame) {
      return (
        <div
          key={widget.id}
          className={cn(
            'relative transition',
            baseClass,
            variant === 'sidebar' ? 'flex-1 min-h-0 overflow-visible' : null,
            isActive ? 'shadow-sm' : null
          )}
          onClick={(event) => {
            event.stopPropagation()
            onSelectGlobalWidget?.(widget.id)
          }}
          data-builder-widget-id={widget.id}
        >
          {isActive && (
            <span className="pointer-events-none absolute inset-0 border border-dashed border-brand-500" />
          )}
          {isActive && (
            <span className="absolute left-2 top-2 rounded-md bg-brand-500 px-2 py-1 text-[10px] font-semibold uppercase text-white shadow-sm">
              {label}
            </span>
          )}
          {renderGlobalGrid(widget.children ?? [], widget.id, minHeightClass, {
            onUpdateChildLayout: isPageGlobal
              ? onUpdatePageGlobalChildLayout
              : onUpdateGlobalChildLayout,
            onDropWidget: isPageGlobal ? onDropPageGlobalWidget : onDropGlobalWidget,
            onUpdateWidgetLayout: isPageGlobal
              ? onUpdatePageGlobalWidgetLayout
              : onUpdateGlobalWidgetLayout,
            fillHeight: variant === 'sidebar',
            columns: variant === 'sidebar' ? 1 : GRID_COLUMNS,
          })}
        </div>
      )
    }

    if (isHidden) {
      return null
    }

    return (
      <div
        key={widget.id}
        className={cn(
          'relative p-3 shadow-sm transition',
          baseClass,
          isActive ? 'shadow-md' : null
        )}
        onClick={(event) => {
          event.stopPropagation()
          onSelectGlobalWidget?.(widget.id)
        }}
        data-builder-widget-id={widget.id}
      >
        {isActive && (
          <span className="pointer-events-none absolute inset-0 border border-dashed border-brand-500" />
        )}
        <div className="flex items-center justify-between text-xs uppercase text-foreground-muted">
          <span>{label}</span>
          <span>{widget.id}</span>
        </div>
        <div className="mt-3 p-2">
          {renderGlobalGrid(widget.children ?? [], widget.id, undefined, {
            onUpdateChildLayout: isPageGlobal
              ? onUpdatePageGlobalChildLayout
              : onUpdateGlobalChildLayout,
            onDropWidget: isPageGlobal ? onDropPageGlobalWidget : onDropGlobalWidget,
            onUpdateWidgetLayout: isPageGlobal
              ? onUpdatePageGlobalWidgetLayout
              : onUpdateGlobalWidgetLayout,
          })}
        </div>
      </div>
    )
  }

  const renderOverlayFrame = (
    widget: BuilderWidgetInstance,
    variant: 'modal' | 'drawer',
    index: number
  ) => {
    const definition = getWidgetDefinition(widget.type)
    const label = definition?.label ?? widget.type
    const overlayProps = widget.props as
      | {
          title?: string
          showHeader?: boolean
          showFooter?: boolean
          showOverlay?: boolean
          closeOnOutsideClick?: boolean
        }
      | undefined
    const title = typeof overlayProps?.title === 'string' ? overlayProps.title : label
    const isActive = selectedGlobalWidgetId === widget.id
    const isPageGlobal = pageGlobalIds.has(widget.id)
    const sectionTypes =
      variant === 'drawer'
        ? { header: 'DrawerHeader', footer: 'DrawerFooter' }
        : { header: 'ModalHeader', footer: 'ModalFooter' }
    const headerWidget = widget.children?.find(
      (child) => child.type === sectionTypes.header
    )
    const footerWidget = widget.children?.find(
      (child) => child.type === sectionTypes.footer
    )
    const contentWidgets = (widget.children ?? []).filter(
      (child) => child.id !== headerWidget?.id && child.id !== footerWidget?.id
    )
    const showHeader =
      overlayProps?.showHeader !== false && !headerWidget?.hidden
    const showFooter =
      overlayProps?.showFooter !== false && !footerWidget?.hidden
    const showOverlay = overlayProps?.showOverlay !== false
    const closeOnOutsideClick = overlayProps?.closeOnOutsideClick !== false
    const overlayClass =
      variant === 'modal'
        ? 'items-center justify-center'
        : 'items-stretch justify-end'
    const drawerWidths: Record<string, number> = {
      small: 320,
      medium: 400,
      large: 480,
    }
    const modalSizes: Record<string, number> = {
      small: 480,
      medium: 640,
      large: 800,
    }
    const widthKey = overlayProps?.width ?? 'medium'
    const sizeKey = overlayProps?.size ?? 'medium'
    const drawerWidth = drawerWidths[widthKey] ?? drawerWidths.medium
    const modalWidth = modalSizes[sizeKey] ?? modalSizes.medium
    const expandToFit = overlayProps?.expandToFit === true
    const panelClass =
      variant === 'modal'
        ? cn(
            'max-w-[90%] rounded-md border border-foreground-muted/30',
            expandToFit ? 'h-auto max-h-[85%]' : 'h-[70%] max-h-[80%] min-h-[240px]'
          )
        : 'h-full max-w-[85%] border-l border-foreground-muted/30'
    const panelStyle =
      variant === 'modal' ? { width: `${modalWidth}px` } : { width: `${drawerWidth}px` }
    const gridOptions = {
      onUpdateChildLayout: isPageGlobal
        ? onUpdatePageGlobalChildLayout
        : onUpdateGlobalChildLayout,
      onDropWidget: isPageGlobal ? onDropPageGlobalWidget : onDropGlobalWidget,
      onUpdateWidgetLayout: isPageGlobal
        ? onUpdatePageGlobalWidgetLayout
        : onUpdateGlobalWidgetLayout,
    }
    const contentGrid = renderGlobalGrid(
      contentWidgets,
      widget.id,
      'min-h-[160px] h-full',
      {
        ...gridOptions,
        fillHeight: true,
        columns: GRID_COLUMNS,
      }
    )
    const renderFrameSection = (
      section: BuilderWidgetInstance,
      position: 'header' | 'footer'
    ) => {
      const sectionProps = section.props as
        | { showSeparator?: boolean; padding?: 'normal' | 'none' }
        | undefined
      const paddingClass =
        sectionProps?.padding === 'none' ? 'p-0' : 'px-3 py-2'
      const showSeparator = sectionProps?.showSeparator !== false
      const separatorClass = showSeparator
        ? position === 'header'
          ? 'border-b border-foreground-muted/30'
          : 'border-t border-foreground-muted/30'
        : null
      const isSectionActive = selectedGlobalWidgetId === section.id
      return (
        <div
          className={cn('relative', paddingClass, separatorClass)}
          onClick={(event) => {
            event.stopPropagation()
            onSelectGlobalWidget?.(section.id)
          }}
          data-builder-widget-id={section.id}
        >
          {isSectionActive && (
            <span className="pointer-events-none absolute inset-0 border border-dashed border-brand-500" />
          )}
          {renderGlobalGrid(section.children ?? [], section.id, 'min-h-[32px]', {
            ...gridOptions,
            fillHeight: false,
            columns: GRID_COLUMNS,
            showEmptyState: false,
          })}
        </div>
      )
    }

    return (
      <div
        key={widget.id}
        className={cn('absolute inset-0 flex', overlayClass)}
        style={{ zIndex: 30 + index }}
      >
        {(showOverlay || closeOnOutsideClick) && (
          <div
            className={cn(
              'absolute inset-0',
              showOverlay ? 'bg-foreground/10' : 'bg-transparent'
            )}
            onClick={(event) => {
              event.stopPropagation()
              if (!closeOnOutsideClick) {
                return
              }
              onSetGlobalWidgetHidden?.(
                widget.id,
                true,
                isPageGlobal ? 'page-global' : 'global'
              )
            }}
          />
        )}
        <div
          className={cn(
            'relative flex min-h-0 flex-col bg-surface-100 shadow-lg',
            panelClass
          )}
          style={panelStyle}
          onClick={(event) => {
            event.stopPropagation()
            onSelectGlobalWidget?.(widget.id)
          }}
          data-builder-widget-id={widget.id}
        >
          {isActive && (
            <span className="pointer-events-none absolute inset-0 border border-dashed border-brand-500" />
          )}
          {headerWidget && showHeader
            ? renderFrameSection(headerWidget, 'header')
            : showHeader && (
                <div className="flex items-center justify-between border-b border-foreground-muted/30 px-3 py-2 text-[11px] uppercase text-foreground-muted">
                  <span className="truncate text-foreground">{title}</span>
                  <div className="flex items-center gap-2 text-foreground-muted">
                    <span>{label}</span>
                    <button
                      type="button"
                      className="flex h-5 w-5 items-center justify-center rounded-sm transition hover:bg-foreground/10 hover:text-foreground"
                      aria-label="Close"
                      onClick={(event) => {
                        event.stopPropagation()
                        onSetGlobalWidgetHidden?.(
                          widget.id,
                          true,
                          isPageGlobal ? 'page-global' : 'global'
                        )
                      }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                </div>
              )}
          <div
            className={cn(
              'min-h-0 flex-1',
              overlayProps?.padding === 'none' ? 'p-0' : 'px-3 py-2'
            )}
          >
            {contentGrid}
          </div>
          {footerWidget && showFooter ? renderFrameSection(footerWidget, 'footer') : null}
        </div>
      </div>
    )
  }

  return (
    <div
      className="builder-canvas h-full min-h-0 w-full bg-surface-200 p-4"
      onDragOver={handleExternalDragOver}
      onDrop={() => setIsExternalDragActive(false)}
    >
      <div className="flex h-full w-full flex-col" onClick={onClearSelection}>
        <div className="min-h-0 flex-1 overflow-auto">
          <div
            ref={frameRef}
            className="relative flex min-h-0 flex-col gap-4 border border-foreground-muted/30"
            style={{
              width: frameWidth ? `${frameWidth}px` : '100%',
              minWidth: CANVAS_MIN_WIDTH,
              minHeight: '100%',
            }}
          >
            <div className="flex min-h-0 flex-1 flex-col gap-0">
              {activeHeaderWidgets.length > 0 && (
                <div className="space-y-3">
                  {activeHeaderWidgets.map((widget) => renderGlobalContainer(widget, 'header'))}
                </div>
              )}
              <div className="flex min-h-[320px] flex-1 gap-0">
                {activeSidebarWidgets.length > 0 && (
                <div className="flex h-full min-h-0 w-72 flex-col gap-3 overflow-visible">
                  {activeSidebarWidgets.map((widget) =>
                    renderGlobalContainer(widget, 'sidebar')
                  )}
                </div>
                )}
                <div className="min-h-0 flex-1 overflow-auto">
                  <div
                    className={cn(
                      'relative bg-surface-100 shadow-sm',
                      isPageComponentSelected ? 'shadow-md' : null,
                      pageComponent?.expandToFit ? 'min-h-0' : 'min-h-full'
                    )}
                    style={{
                      backgroundColor: pageComponent?.background || undefined,
                      padding: resolvePagePadding(pageComponent),
                    }}
                    onClick={(event) => {
                      event.stopPropagation()
                      onSelectPageComponent?.()
                    }}
                    data-builder-widget-id="page-component"
                  >
                    {isPageComponentSelected && (
                      <span className="pointer-events-none absolute inset-0 border border-dashed border-brand-500" />
                    )}
                    {isPageComponentSelected && (
                      <span className="absolute left-0 top-0 bg-brand-500 text-[9px] px-2 font-semibold uppercase text-white shadow-sm">
                        {pageLabel}
                      </span>
                    )}
                    {renderGrid(widgets, 0, undefined, true)}
                  </div>
                </div>
              </div>
            </div>
            {(visibleOverlayDrawers.length > 0 || visibleOverlayModals.length > 0) && (
              <div className="absolute inset-0 z-20">
                {visibleOverlayDrawers.map((widget, index) =>
                  renderOverlayFrame(widget, 'drawer', index)
                )}
                {visibleOverlayModals.map((widget, index) =>
                  renderOverlayFrame(
                    widget,
                    'modal',
                    index + visibleOverlayDrawers.length
                  )
                )}
              </div>
            )}
            {globalSections.split.length > 0 && (
              <div className="space-y-3">
                {globalSections.split.map((widget) => renderGlobalContainer(widget, 'split'))}
              </div>
            )}
            {globalSections.other.length > 0 && (
              <div className="space-y-3">
                <div className="text-xs uppercase text-foreground-muted">Overlays</div>
                <div className="grid gap-3 md:grid-cols-2">
                  {globalSections.other.map((widget) =>
                    renderGlobalContainer(widget, 'other')
                  )}
                </div>
              </div>
            )}
            <button
              type="button"
              aria-label="Resize canvas width"
              className="absolute right-0 top-0 h-full w-2 cursor-ew-resize rounded-sm bg-transparent transition hover:bg-foreground-muted/20"
              onMouseDown={(event) => {
                event.preventDefault()
                event.stopPropagation()
                const rect = frameRef.current?.getBoundingClientRect()
                if (!rect) {
                  return
                }
                frameResizeRef.current = {
                  startX: event.clientX,
                  startWidth: frameWidth ?? rect.width,
                }
                setIsFrameResizing(true)
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// Kartochka widgeta: selection, quick-add i auto-height.
const CanvasCard = ({
  widget,
  definition,
  isSelected,
  onSelect,
  onQuickAdd,
  enableQuickAddControls = true,
  layout,
  gridRowHeight,
  gridMargin,
  onAutoHeight,
  childContent,
  depth,
  onRunActions,
  evaluationContext,
  onOpenInspectorPanel,
  showQuickAdd,
  quickAddPosition,
  quickAddContent,
}: {
  widget: BuilderWidgetInstance
  definition: WidgetDefinition
  isSelected: boolean
  onSelect: () => void
  onQuickAdd: (position: 'above' | 'below') => void
  enableQuickAddControls?: boolean
  layout: Layout
  gridRowHeight: number
  gridMargin: number
  onAutoHeight: (nextHeight: number) => void
  childContent: ReactNode
  depth: number
  onRunActions?: (eventName: string, payload?: Record<string, unknown>) => void
  evaluationContext?: Record<string, unknown>
  onOpenInspectorPanel?: (widgetId: string, panel: { key: string; label: string }) => void
  showQuickAdd: boolean
  quickAddPosition?: 'above' | 'below'
  quickAddContent?: ReactNode
}) => {
  const holdTimerRef = useRef<number | null>(null)
  const holdTargetRef = useRef<HTMLElement | null>(null)
  const holdPositionRef = useRef<{ x: number; y: number } | null>(null)
  const isPressingRef = useRef(false)
  const contentRef = useRef<HTMLDivElement | null>(null)
  const spacing = resolveWidgetSpacingModes(widget.type, widget.spacing, (expression) =>
    resolveValue(expression, {})
  )
  const isHidden = parseBoolean(resolveValue(widget.hidden, evaluationContext ?? {}), false)

  useEffect(() => {
    return () => {
      if (holdTimerRef.current) {
        window.clearTimeout(holdTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (spacing.heightMode !== 'auto') {
      return
    }
    const node = contentRef.current
    if (!node) {
      return
    }

    const borderY = 0
    const updateHeight = () => {
      const contentHeight = node.getBoundingClientRect().height
      const totalHeight = Math.max(1, contentHeight + borderY)
      const rowStride = gridRowHeight + gridMargin
      const nextRows = Math.max(1, Math.ceil((totalHeight + gridMargin) / rowStride))
      if (nextRows !== layout.h) {
        onAutoHeight(nextRows)
      }
    }

    updateHeight()
    const observer = new ResizeObserver(updateHeight)
    observer.observe(node)
    return () => observer.disconnect()
  }, [
    gridMargin,
    gridRowHeight,
    layout.h,
    onAutoHeight,
    spacing.heightMode,
    spacing.marginMode,
  ])

  const clearHold = () => {
    if (holdTimerRef.current) {
      window.clearTimeout(holdTimerRef.current)
    }
    holdTimerRef.current = null
    holdTargetRef.current = null
    holdPositionRef.current = null
    isPressingRef.current = false
  }

  const handlePressStart = (event: MouseEvent<HTMLDivElement>) => {
    if (event.button !== 0) {
      return
    }
    const target = event.target as HTMLElement
    if (target.closest(DRAG_HANDLE_SELECTOR)) {
      return
    }
    event.stopPropagation()
    const isInteractive = Boolean(
      target.closest('button, input, textarea, select, [data-no-drag="true"]')
    )
    if (!isInteractive) {
      event.preventDefault()
    }

    const gridItem = (event.currentTarget as HTMLElement).closest('.react-grid-item')
    if (!gridItem || isInteractive) {
      clearHold()
      return
    }

    isPressingRef.current = true
    holdTargetRef.current = gridItem
    holdPositionRef.current = { x: event.clientX, y: event.clientY }
    if (holdTimerRef.current) {
      window.clearTimeout(holdTimerRef.current)
    }
    holdTimerRef.current = window.setTimeout(() => {
      if (!isPressingRef.current || !holdTargetRef.current || !holdPositionRef.current) {
        return
      }
      const { x, y } = holdPositionRef.current
      holdTargetRef.current.dispatchEvent(
        new MouseEvent('mousedown', {
          bubbles: true,
          cancelable: true,
          clientX: x,
          clientY: y,
          button: 0,
          buttons: 1,
        })
      )
    }, DRAG_HOLD_DELAY_MS)
  }

  const handlePressMove = (event: MouseEvent<HTMLDivElement>) => {
    if (!isPressingRef.current) {
      return
    }
    holdPositionRef.current = { x: event.clientX, y: event.clientY }
  }

  const handlePressEnd = () => {
    clearHold()
  }

  const childPreview = childContent ? (
    <div
      className={cn('mt-3 p-2', depth > 0 ? 'bg-surface-200/50' : 'bg-surface-100')}
    >
      {childContent}
    </div>
  ) : null
  const showConnectData = isSelected && CONNECT_DATA_WIDGET_TYPES.has(definition.type)
  const marginPadding = resolveSpacingPadding(spacing, (expression) =>
    resolveValue(expression, {})
  )

  return (
    <div
      role="button"
      tabIndex={0}
      data-builder-widget-id={widget.id}
      onClick={(event) => {
        event.stopPropagation()
        onSelect()
      }}
      onMouseDown={handlePressStart}
      onMouseMove={handlePressMove}
      onMouseUp={handlePressEnd}
      onMouseLeave={handlePressEnd}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onSelect()
        }
      }}
      className={cn(
        'group relative h-full w-full cursor-grab transition',
        depth > 0 ? 'bg-surface-100/60' : null,
        isHidden ? 'opacity-60' : null
      )}
    >
      {!isSelected && (
        <span className="pointer-events-none absolute inset-0 border border-brand-500 opacity-0 transition-opacity group-hover:opacity-100" />
      )}
      {isSelected && (
        <span className="pointer-events-none absolute inset-0 border border-dashed border-brand-500" />
      )}
      {isSelected && (
        <>
          {enableQuickAddControls && (
            <>
              <button
                type="button"
                className="absolute left-1/2 top-0 flex h-4 w-4 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-brand-600 text-white shadow-md transition hover:bg-brand-500"
                onClick={(event) => {
                  event.stopPropagation()
                  onQuickAdd('above')
                }}
              >
                <Plus size={12} />
              </button>
              <button
                type="button"
                className="absolute left-1/2 bottom-0 flex h-4 w-4 -translate-x-1/2 translate-y-1/2 items-center justify-center rounded-full bg-brand-600 text-white shadow-md transition hover:bg-brand-500"
                onClick={(event) => {
                  event.stopPropagation()
                  onQuickAdd('below')
                }}
              >
                <Plus size={12} />
              </button>
            </>
          )}
          <div
            className={cn(
              'absolute left-0 flex items-center gap-1',
              shouldPlaceBadgeBelow(widget) ? '-bottom-4' : '-top-4'
            )}
          >
            <div className="builder-drag-handle flex h-4 items-center gap-1 rounded-sm bg-brand-500 pr-2 text-[9px] font-medium text-white shadow-sm">
              <GripVertical className="h-3 w-3 text-white/80" />
              <span className=" flex">{widget.id}</span>
            </div>
            {showConnectData && (
              <span className="flex items-center gap-1 rounded-md bg-emerald-500 px-2 py-1 text-xs font-semibold text-white shadow-sm">
                <Database className="h-3 w-3 text-white/80" />
                <span>Connect data</span>
              </span>
            )}
          </div>
        </>
      )}
      <div ref={contentRef} style={{ padding: marginPadding }}>
        <div>
          {definition.render(widget.props as any, {
            mode: 'canvas',
            widgetId: widget.id,
            runActions: onRunActions,
            evaluationContext,
            openInspectorPanel: onOpenInspectorPanel
              ? (panel) => onOpenInspectorPanel(widget.id, panel)
              : undefined,
          })}
        </div>
        {childPreview}
      </div>
      {showQuickAdd && quickAddContent && (
        <div
          className={cn(
            'absolute left-1/2 z-50 w-72 -translate-x-1/2',
            quickAddPosition === 'above' ? 'bottom-full mb-3' : 'top-full mt-3'
          )}
          onClick={(event) => event.stopPropagation()}
        >
          {quickAddContent}
        </div>
      )}
    </div>
  )
}

const QuickAddMenu = ({
  commonWidgets,
  groupedWidgets,
  search,
  onSearchChange,
  onSelect,
}: {
  commonWidgets: WidgetDefinition[]
  groupedWidgets: [string, WidgetDefinition[]][]
  search: string
  onSearchChange: (value: string) => void
  onSelect: (widgetType: string) => void
}) => {
  return (
    <div className="rounded-lg border border-foreground-muted/30 bg-surface-100 shadow-lg">
      <div className="p-3">
        <Input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search components"
          className="h-8"
        />
      </div>
      <Separator />
      <ScrollArea className="max-h-72">
        <div className="space-y-4 p-3">
          {commonWidgets.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs uppercase text-foreground-muted">Commonly used</div>
              <div className="space-y-1">
                {commonWidgets.map((widget) => (
                  <WidgetMenuItem key={widget.type} widget={widget} onSelect={onSelect} />
                ))}
              </div>
            </div>
          )}
          {commonWidgets.length > 0 && groupedWidgets.length > 0 && <Separator />}
          {groupedWidgets.map(([category, items]) => (
            <div key={category} className="space-y-2">
              <div className="text-xs uppercase text-foreground-muted">{category}</div>
              <div className="space-y-1">
                {items.map((widget) => (
                  <WidgetMenuItem key={widget.type} widget={widget} onSelect={onSelect} />
                ))}
              </div>
            </div>
          ))}
          {commonWidgets.length === 0 && groupedWidgets.length === 0 && (
            <div className="text-sm text-foreground-muted">No widgets found.</div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

const WidgetMenuItem = ({
  widget,
  onSelect,
}: {
  widget: WidgetDefinition
  onSelect: (widgetType: string) => void
}) => {
  const Icon = widgetIconMap[widget.type] ?? Box

  return (
    <Button
      type="text"
      size="tiny"
      className="w-full justify-start"
      onClick={() => onSelect(widget.type)}
    >
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-md border border-foreground-muted/30 bg-surface-200 text-foreground-muted">
          <Icon size={16} />
        </span>
        <div className="flex flex-col items-start">
          <span className="text-sm text-foreground">{widget.label}</span>
          {widget.description && (
            <span className="text-xs text-foreground-muted">{widget.description}</span>
          )}
        </div>
      </div>
    </Button>
  )
}

type WidgetEvent = {
  event: string
  type: string
  [key: string]: unknown
}

const normalizeEvents = (value: unknown): WidgetEvent[] => {
  if (Array.isArray(value)) {
    return value as WidgetEvent[]
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) {
      return []
    }
    try {
      const parsed = JSON.parse(trimmed)
      if (Array.isArray(parsed)) {
        return parsed as WidgetEvent[]
      }
    } catch {
      return []
    }
  }

  return []
}

const normalizeLayout = (
  widget: BuilderWidgetInstance,
  index: number,
  columns = GRID_COLUMNS,
  resizeHandlesOverride?: string[],
  isSelected = true
): Layout => {
  const columnsPerRow = Math.max(1, Math.floor(columns / DEFAULT_ITEM.w))
  const fallback = {
    ...DEFAULT_ITEM,
    x: (index % columnsPerRow) * DEFAULT_ITEM.w,
    y: Math.floor(index / columnsPerRow) * DEFAULT_ITEM.h,
  }
  const layout = widget.layout ?? fallback
  const spacing = resolveWidgetSpacingModes(widget.type, widget.spacing, (expression) =>
    resolveValue(expression, {})
  )
  const minH = spacing.heightMode === 'auto' ? 1 : layout.minH ?? fallback.minH
  const resizeHandles = getWidgetResizeHandles(widget, spacing, resizeHandlesOverride)
  const resolvedHandles = isSelected ? resizeHandles : []
  return {
    i: widget.id,
    x: layout.x ?? fallback.x,
    y: layout.y ?? fallback.y,
    w: Math.min(layout.w ?? fallback.w, columns),
    h: layout.h ?? fallback.h,
    minW: Math.min(layout.minW ?? fallback.minW, columns),
    minH,
    maxW: layout.maxW ? Math.min(layout.maxW, columns) : columns === 1 ? 1 : layout.maxW,
    maxH: layout.maxH,
    isResizable: isSelected && resizeHandles.length > 0,
    resizeHandles: resolvedHandles,
  }
}

const shouldPlaceBadgeBelow = (widget: BuilderWidgetInstance) => {
  const y = widget.layout?.y ?? 0
  return y < 2
}

const resolvePagePadding = (pageComponent?: {
  paddingMode?: 'normal' | 'none'
  paddingFxEnabled?: boolean
  paddingFx?: string
}) => {
  const value = resolvePagePaddingValue(pageComponent, (expression) =>
    resolveValue(expression, {})
  )
  return value ? value : 0
}

const hasWidgetInTree = (widgets: BuilderWidgetInstance[], widgetId: string): boolean => {
  for (const widget of widgets) {
    if (widget.id === widgetId) {
      return true
    }
    if (widget.children && widget.children.length > 0) {
      if (hasWidgetInTree(widget.children, widgetId)) {
        return true
      }
    }
  }
  return false
}
