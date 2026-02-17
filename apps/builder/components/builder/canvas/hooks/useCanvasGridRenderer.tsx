/**
 * Верхнеуровневый hook grid-рендера, который композит page/frame renderer hooks.
 */
import type { CSSProperties, RefObject } from 'react'
import type { Layout } from 'react-grid-layout'
import type { WidgetDefinition } from 'widgets/runtime'

import type { QuickAddMenuProps } from '../../components/QuickAddMenu'
import type { BuilderWidgetAddOptions, BuilderWidgetInstance } from '../../types'
import type { AdjacentDropTarget } from '../engines/dropTargetEngine'
import {
  type ContainerDropTarget,
  useCanvasGridRendererBase,
} from './useCanvasGridRendererBase'
import { useCanvasPageGridRenderer, type RenderGrid } from './useCanvasPageGridRenderer'
import {
  useCanvasFrameGridRenderer,
  type RenderGlobalGrid,
} from './useCanvasFrameGridRenderer'

type QuickAddState = {
  widgetId: string
  position: 'above' | 'below'
} | null

type IsQuickAddWidgetSelectable = (
  widgetType: string,
  options?: BuilderWidgetAddOptions
) => boolean

interface UseCanvasGridRendererParams {
  widgets: BuilderWidgetInstance[]
  selectedWidgetId: string | null
  selectedFrameWidgetId?: string | null
  evaluationContext?: Record<string, unknown>
  iconLibrary?: string
  gridRowHeight: number
  gridMargin: number
  showGrid: boolean
  isGridInteractionActive: boolean
  isExternalDragActive: boolean
  externalDropTarget: AdjacentDropTarget
  isInternalDragActive: boolean
  internalDropTarget: AdjacentDropTarget
  internalDropContainerTarget: ContainerDropTarget
  internalPageRootDropLayout: Partial<Layout> | null
  isPageRootDropActive: boolean
  allowOverlapActive: boolean
  preventCollisionActive: boolean
  startInternalGridDrag: (
    oldItem: Layout,
    parentId?: string,
    parentSlot?: string,
    event?: unknown
  ) => void
  updateInternalGridDrag: (oldItem: Layout, event?: unknown) => void
  stopInternalGridDrag: (layout: Layout[], onFallback: () => void, event?: unknown) => void
  beginGridInteraction: () => void
  endGridInteraction: () => void
  buildPreviewStyle: (
    layout: Partial<Layout> | null,
    columns: number,
    margin: number
  ) => CSSProperties | null
  clearExternalDragState: () => void
  commonWidgets: WidgetDefinition[]
  groupedWidgets: [string, WidgetDefinition[]][]
  presetGroups: QuickAddMenuProps['presetGroups']
  isQuickAddWidgetSelectable: IsQuickAddWidgetSelectable
  quickAdd: QuickAddState
  search: string
  setSearch: (value: string) => void
  menuRef: RefObject<HTMLDivElement | null>
  toggleQuickAdd: (widgetId: string, position: 'above' | 'below') => void
  closeQuickAdd: () => void
  onUpdateLayout: (layout: Layout[]) => void
  onUpdateChildLayout: (parentId: string, layout: Layout[]) => void
  onUpdateWidgetLayout: (widgetId: string, patch: Partial<Layout>) => void
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
  onSelectWidget: (widgetId: string) => void
  onSelectFrameWidget?: (widgetId: string) => void
  onOpenInspectorPanel?: (widgetId: string, panel: { key: string; label: string }) => void
  onRunWidgetActions: (
    widget: BuilderWidgetInstance,
    eventName: string,
    payload?: Record<string, unknown>
  ) => void
}

interface UseCanvasGridRendererResult {
  renderGrid: RenderGrid
  renderGlobalGrid: RenderGlobalGrid
}

export const useCanvasGridRenderer = ({
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
  onUpdateAppFrameWidgetLayout,
  onUpdateWidgetProps,
  onDropWidget,
  onDropAppFrameWidget,
  onInsertAdjacentWidget,
  onSelectWidget,
  onSelectFrameWidget,
  onOpenInspectorPanel,
  onRunWidgetActions,
}: UseCanvasGridRendererParams): UseCanvasGridRendererResult => {
  const { renderCanvasGrid } = useCanvasGridRendererBase({
    gridRowHeight,
    allowOverlapActive,
    preventCollisionActive,
    isExternalDragActive,
    externalDropTarget,
    isInternalDragActive,
    internalDropContainerTarget,
    buildPreviewStyle,
    startInternalGridDrag,
    updateInternalGridDrag,
    stopInternalGridDrag,
    beginGridInteraction,
    endGridInteraction,
  })

  const { renderGrid } = useCanvasPageGridRenderer({
    widgets,
    selectedWidgetId,
    gridRowHeight,
    gridMargin,
    showGrid,
    isGridInteractionActive,
    isExternalDragActive,
    externalDropTarget,
    isInternalDragActive,
    internalDropTarget,
    internalPageRootDropLayout,
    isPageRootDropActive,
    iconLibrary,
    evaluationContext,
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
    renderCanvasGrid,
    clearExternalDragState,
    onUpdateLayout,
    onUpdateChildLayout,
    onUpdateWidgetLayout,
    onDropWidget,
    onInsertAdjacentWidget,
    onSelectWidget,
    onOpenInspectorPanel,
    onUpdateWidgetProps,
    onRunWidgetActions,
  })

  const { renderGlobalGrid } = useCanvasFrameGridRenderer({
    selectedFrameWidgetId,
    iconLibrary,
    evaluationContext,
    gridRowHeight,
    gridMargin,
    showGrid,
    isExternalDragActive,
    externalDropTarget,
    isInternalDragActive,
    internalDropTarget,
    renderCanvasGrid,
    clearExternalDragState,
    commonWidgets,
    groupedWidgets,
    presetGroups,
    isQuickAddWidgetSelectable,
    search,
    setSearch,
    onUpdateAppFrameChildLayout,
    onUpdateAppFrameWidgetLayout,
    onDropAppFrameWidget,
    onSelectFrameWidget,
    onOpenInspectorPanel,
    onUpdateWidgetProps,
    onRunWidgetActions,
  })

  return { renderGrid, renderGlobalGrid }
}
