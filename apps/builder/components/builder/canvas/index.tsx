/**
 * Входной controller canvas: связывает state hooks, renderers и viewport.
 */
import { useMemo, useRef, type CSSProperties } from 'react'
import type { Layout } from 'react-grid-layout'
import type { WidgetDefinition } from 'widgets/runtime'
import { cn } from 'ui'

import type {
  BuilderAppMeta,
  BuilderPageLayout,
  BuilderWidgetAddOptions,
  BuilderWidgetInstance,
} from '../types'
import { CanvasMainArea } from './components/CanvasMainArea'
import { CanvasViewport } from './components/CanvasViewport'
import { useCanvasDndState } from './hooks/useCanvasDndState'
import { useCanvasFrameSections } from './hooks/useCanvasFrameSections'
import { useCanvasGridRenderer } from './hooks/useCanvasGridRenderer'
import { useCanvasInteractions } from './hooks/useCanvasInteractions'
import { useCanvasQuickAddState } from './hooks/useCanvasQuickAddState'
import { useCanvasWidgetActions } from './hooks/useCanvasWidgetActions'
import { useCanvasWidgetCatalog } from './hooks/useCanvasWidgetCatalog'
import { createCanvasFrameRenderers } from './renderers/createCanvasFrameRenderers'
import {
  CANVAS_MIN_WIDTH,
  resolveAppMaxWidth,
  serializeThemeStyle,
} from './shared'

interface BuilderCanvasProps {
  widgets: BuilderWidgetInstance[]
  appFrameWidgets?: BuilderWidgetInstance[]
  pageFrameWidgets?: BuilderWidgetInstance[]
  appMeta?: BuilderAppMeta
  selectedWidgetId: string | null
  selectedFrameWidgetId?: string | null
  isPageMainSelected?: boolean
  evaluationContext?: Record<string, unknown>
  pageMain?: BuilderPageLayout['main']
  themeStyle?: CSSProperties
  themeCustomCss?: string
  iconLibrary?: string
  pageLabel?: string
  onSelectApp?: () => void
  onSelectWidget: (widgetId: string) => void
  onSelectFrameWidget?: (widgetId: string) => void
  onSelectPageMain?: () => void
  onClearSelection: () => void
  onUpdateLayout: (layout: Layout[]) => void
  onUpdateWidgetLayout: (widgetId: string, patch: Partial<Layout>) => void
  onUpdateChildLayout: (parentId: string, layout: Layout[]) => void
  onUpdateAppFrameChildLayout?: (parentId: string, layout: Layout[]) => void
  onUpdatePageFrameChildLayout?: (parentId: string, layout: Layout[]) => void
  onUpdateAppFrameWidgetLayout?: (widgetId: string, patch: Partial<Layout>) => void
  onUpdatePageFrameWidgetLayout?: (widgetId: string, patch: Partial<Layout>) => void
  onUpdateWidgetProps?: (widgetId: string, patch: Record<string, unknown>) => void
  onDropWidget: (
    widgetType: string,
    layout: Layout,
    parentId?: string,
    options?: BuilderWidgetAddOptions
  ) => void
  onDropAppFrameWidget?: (
    widgetType: string,
    layout: Layout,
    parentId: string,
    options?: BuilderWidgetAddOptions
  ) => void
  onDropPageFrameWidget?: (
    widgetType: string,
    layout: Layout,
    parentId: string,
    options?: BuilderWidgetAddOptions
  ) => void
  onInsertAdjacentWidget: (
    targetWidgetId: string,
    position: 'above' | 'below',
    widgetType: string,
    options?: BuilderWidgetAddOptions
  ) => void
  onMoveWidgetAdjacent?: (
    activeWidgetId: string,
    targetWidgetId: string,
    position: 'above' | 'below'
  ) => void
  onMoveWidgetToContainer?: (
    activeWidgetId: string,
    parentId: string,
    slot?: string,
    targetLayout?: Partial<Layout>
  ) => void
  onMoveWidgetToPageRoot?: (
    activeWidgetId: string,
    targetLayout?: Partial<Layout>
  ) => void
  onOpenInspectorPanel?: (widgetId: string, panel: { key: string; label: string }) => void
  onSetFrameWidgetHidden?: (
    widgetId: string,
    hidden: boolean,
    mode: 'app-frame' | 'page-frame'
  ) => void
  availableWidgets: WidgetDefinition[]
  gridRowHeight: number
  gridMargin: number
  showGrid: boolean
}

export const BuilderCanvas = ({
  widgets,
  appFrameWidgets = [],
  pageFrameWidgets = [],
  appMeta,
  themeStyle,
  themeCustomCss,
  selectedWidgetId,
  selectedFrameWidgetId,
  isPageMainSelected = false,
  evaluationContext,
  pageMain,
  pageLabel = 'Main',
  iconLibrary,
  onSelectApp,
  onSelectWidget,
  onSelectFrameWidget,
  onSelectPageMain,
  onClearSelection,
  onUpdateLayout,
  onUpdateWidgetLayout,
  onUpdateChildLayout,
  onUpdateAppFrameChildLayout,
  onUpdatePageFrameChildLayout,
  onUpdateAppFrameWidgetLayout,
  onUpdatePageFrameWidgetLayout,
  onUpdateWidgetProps,
  onDropWidget,
  onDropAppFrameWidget,
  onDropPageFrameWidget,
  onInsertAdjacentWidget,
  onMoveWidgetToContainer,
  onMoveWidgetToPageRoot,
  onOpenInspectorPanel,
  onSetFrameWidgetHidden,
  availableWidgets,
  gridRowHeight,
  gridMargin,
  showGrid,
}: BuilderCanvasProps) => {
  const themeCssText = useMemo(() => serializeThemeStyle(themeStyle), [themeStyle])
  const { quickAdd, search, setSearch, menuRef, toggleQuickAdd, closeQuickAdd } =
    useCanvasQuickAddState()
  const {
    isGridInteractionActive,
    isExternalDragActive,
    externalDropTarget,
    internalDragActiveId,
    internalDropTarget,
    internalDropContainerTarget,
    internalPageRootDropLayout,
    internalDragSource,
    isPageRootDropActive,
    isInternalDragActive,
    allowOverlapActive,
    preventCollisionActive,
    setIsExternalDragActive,
    setExternalDropTarget,
    setInternalDragActiveId,
    setInternalDropTarget,
    setInternalDropContainerTarget,
    setInternalPageRootDropLayout,
    setInternalDragSource,
    setIsPageRootDropActive,
    externalDragTimeoutRef,
    internalDragPointerRef,
    internalDropUpdateRafRef,
    internalDropUpdateArgsRef,
    beginGridInteraction,
    endGridInteraction,
    resetInternalDragState,
  } = useCanvasDndState()

  const canvasRootRef = useRef<HTMLDivElement | null>(null)
  const frameRef = useRef<HTMLDivElement | null>(null)

  const { commonWidgets, groupedWidgets, presetGroups, isQuickAddWidgetSelectable } =
    useCanvasWidgetCatalog(availableWidgets, search)

  const {
    frameWidth,
    onFrameResizeMouseDown,
    handleExternalDragOver,
    handleExternalDrop,
    clearExternalDragState,
    startInternalGridDrag,
    updateInternalGridDrag,
    stopInternalGridDrag,
    buildPreviewStyle,
  } = useCanvasInteractions({
    widgets,
    gridRowHeight,
    canvasRootRef,
    frameRef,
    isQuickAddWidgetSelectable,
    onInsertAdjacentWidget,
    onMoveWidgetToContainer,
    onMoveWidgetToPageRoot,
    isExternalDragActive,
    externalDropTarget,
    internalDragActiveId,
    internalDropTarget,
    internalDropContainerTarget,
    internalPageRootDropLayout,
    internalDragSource,
    isPageRootDropActive,
    setIsExternalDragActive,
    setExternalDropTarget,
    setInternalDragActiveId,
    setInternalDropTarget,
    setInternalDropContainerTarget,
    setInternalPageRootDropLayout,
    setInternalDragSource,
    setIsPageRootDropActive,
    externalDragTimeoutRef,
    internalDragPointerRef,
    internalDropUpdateRafRef,
    internalDropUpdateArgsRef,
    beginGridInteraction,
    resetInternalDragState,
  })

  const {
    activeHeaderWidgets,
    activeLeftSidebarWidgets,
    activeRightSidebarWidgets,
    activeSplitWidgets,
    activeOtherOverlayWidgets,
    visibleOverlayDrawers,
    visibleOverlayModals,
    frameWidgetIds,
    pageFrameIds,
  } = useCanvasFrameSections(appFrameWidgets, pageFrameWidgets, evaluationContext)

  const { runWidgetActions } = useCanvasWidgetActions({
    frameWidgetIds,
    pageFrameIds,
    onSetFrameWidgetHidden,
  })

  const { renderGrid, renderGlobalGrid } = useCanvasGridRenderer({
    widgets,
    selectedWidgetId,
    selectedFrameWidgetId,
    evaluationContext,
    iconLibrary,
    gridRowHeight,
    gridMargin,
    showGrid,
    isGridInteractionActive,
    isExternalDragActive,
    externalDropTarget,
    isInternalDragActive,
    internalDropTarget,
    internalDropContainerTarget,
    internalPageRootDropLayout,
    isPageRootDropActive,
    allowOverlapActive,
    preventCollisionActive,
    startInternalGridDrag,
    updateInternalGridDrag,
    stopInternalGridDrag,
    beginGridInteraction,
    endGridInteraction,
    buildPreviewStyle,
    clearExternalDragState,
    commonWidgets,
    groupedWidgets,
    presetGroups,
    isQuickAddWidgetSelectable,
    quickAdd,
    search,
    setSearch,
    menuRef,
    toggleQuickAdd,
    closeQuickAdd,
    onUpdateLayout,
    onUpdateChildLayout,
    onUpdateWidgetLayout,
    onUpdateAppFrameChildLayout,
    onUpdatePageFrameChildLayout,
    onUpdateAppFrameWidgetLayout,
    onUpdatePageFrameWidgetLayout,
    onUpdateWidgetProps,
    onDropWidget,
    onDropAppFrameWidget,
    onDropPageFrameWidget,
    onInsertAdjacentWidget,
    onSelectWidget,
    onSelectFrameWidget,
    onOpenInspectorPanel,
    onRunWidgetActions: runWidgetActions,
  })

  const { renderGlobalContainer, renderOverlayFrame } = useMemo(
    () =>
      createCanvasFrameRenderers({
        selectedFrameWidgetId,
        pageFrameIds,
        evaluationContext,
        onSelectFrameWidget,
        onSetFrameWidgetHidden,
        onUpdateAppFrameChildLayout,
        onUpdatePageFrameChildLayout,
        onDropAppFrameWidget,
        onDropPageFrameWidget,
        onUpdateAppFrameWidgetLayout,
        onUpdatePageFrameWidgetLayout,
        renderGlobalGrid,
      }),
    [
      selectedFrameWidgetId,
      pageFrameIds,
      evaluationContext,
      onSelectFrameWidget,
      onSetFrameWidgetHidden,
      onUpdateAppFrameChildLayout,
      onUpdatePageFrameChildLayout,
      onDropAppFrameWidget,
      onDropPageFrameWidget,
      onUpdateAppFrameWidgetLayout,
      onUpdatePageFrameWidgetLayout,
      renderGlobalGrid,
    ]
  )

  const pageMainSection = useMemo(
    () => (
      <CanvasMainArea
        isInternalDragActive={isInternalDragActive}
        isPageMainSelected={isPageMainSelected}
        pageMain={pageMain}
        pageLabel={pageLabel}
        onSelectPageMain={onSelectPageMain}
      >
        {renderGrid(widgets, 0, undefined, true)}
      </CanvasMainArea>
    ),
    [
      isInternalDragActive,
      isPageMainSelected,
      pageMain,
      pageLabel,
      onSelectPageMain,
      renderGrid,
      widgets,
    ]
  )

  return (
    <div
      ref={canvasRootRef}
      className={cn(
        'builder-canvas builder-app-theme-scope h-full min-h-0 w-full bg-surface-200',
        isInternalDragActive ? 'builder-canvas--internal-drag' : null
      )}
      style={themeStyle}
      onDragOver={handleExternalDragOver}
      onDragOverCapture={handleExternalDragOver}
      onDrop={(event) => {
        if (event.defaultPrevented) {
          clearExternalDragState()
          return
        }
        handleExternalDrop(event)
        clearExternalDragState()
      }}
    >
      {themeCssText ? (
        <style data-builder-theme-vars>
          {`.builder-app-theme-scope { ${themeCssText} }`}
        </style>
      ) : null}
      {themeCustomCss ? <style data-builder-custom-css>{themeCustomCss}</style> : null}
      <div className="flex h-full w-full flex-col" onClick={onClearSelection}>
        <div className="min-h-0 flex-1 overflow-x-auto overflow-y-hidden p-4">
          <div
            ref={frameRef}
            className="relative flex h-full min-h-0 flex-col gap-4 border border-foreground-muted/30"
            style={{
              width: frameWidth ? `${frameWidth}px` : '100%',
              minWidth: CANVAS_MIN_WIDTH,
              maxWidth: resolveAppMaxWidth(appMeta),
              minHeight: '100%',
            }}
            onClick={(event) => {
              if (event.target !== event.currentTarget) {
                return
              }
              event.stopPropagation()
              onSelectApp?.()
            }}
          >
            <CanvasViewport
              activeHeaderWidgets={activeHeaderWidgets}
              activeLeftSidebarWidgets={activeLeftSidebarWidgets}
              activeRightSidebarWidgets={activeRightSidebarWidgets}
              activeSplitWidgets={activeSplitWidgets}
              activeOtherOverlayWidgets={activeOtherOverlayWidgets}
              visibleOverlayDrawers={visibleOverlayDrawers}
              visibleOverlayModals={visibleOverlayModals}
              renderGlobalContainer={renderGlobalContainer}
              renderOverlayFrame={renderOverlayFrame}
              pageMainSection={pageMainSection}
            />
            <button
              type="button"
              aria-label="Resize canvas width"
              className="absolute right-0 top-0 h-full w-2 cursor-ew-resize rounded-sm bg-transparent transition hover:bg-foreground-muted/20"
              onMouseDown={onFrameResizeMouseDown}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
