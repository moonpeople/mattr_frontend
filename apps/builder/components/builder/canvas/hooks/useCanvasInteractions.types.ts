/**
 * Общие типы для hooks взаимодействий canvas.
 */
import type { CSSProperties, DragEvent, MouseEvent, RefObject } from 'react'
import type { Layout } from 'react-grid-layout'

import type { BuilderWidgetAddOptions, BuilderWidgetInstance } from '../../types'
import type { AdjacentDropTarget } from '../engines/dropTargetEngine'

export type ContainerDropTarget = {
  parentId: string
  slot?: string
  layout?: Partial<Layout>
} | null

export type InternalDragSource = {
  parentId?: string
  slot?: string
  layout: Partial<Layout>
} | null

export type IsQuickAddWidgetSelectable = (
  widgetType: string,
  options?: BuilderWidgetAddOptions
) => boolean

export interface UseCanvasInteractionsParams {
  widgets: BuilderWidgetInstance[]
  gridRowHeight: number
  canvasRootRef: RefObject<HTMLDivElement>
  frameRef: RefObject<HTMLDivElement>
  isQuickAddWidgetSelectable: IsQuickAddWidgetSelectable
  onInsertAdjacentWidget: (
    targetWidgetId: string,
    position: 'above' | 'below',
    widgetType: string,
    options?: BuilderWidgetAddOptions
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
  isExternalDragActive: boolean
  externalDropTarget: AdjacentDropTarget
  internalDragActiveId: string | null
  internalDropTarget: AdjacentDropTarget
  internalDropContainerTarget: ContainerDropTarget
  internalPageRootDropLayout: Partial<Layout> | null
  internalDragSource: InternalDragSource
  isPageRootDropActive: boolean
  setIsExternalDragActive: (value: boolean) => void
  setExternalDropTarget: (
    value: AdjacentDropTarget | ((prev: AdjacentDropTarget) => AdjacentDropTarget)
  ) => void
  setInternalDragActiveId: (value: string | null) => void
  setInternalDropTarget: (
    value: AdjacentDropTarget | ((prev: AdjacentDropTarget) => AdjacentDropTarget)
  ) => void
  setInternalDropContainerTarget: (
    value:
      | ContainerDropTarget
      | ((prev: ContainerDropTarget) => ContainerDropTarget)
  ) => void
  setInternalPageRootDropLayout: (
    value: Partial<Layout> | null | ((prev: Partial<Layout> | null) => Partial<Layout> | null)
  ) => void
  setInternalDragSource: (value: InternalDragSource) => void
  setIsPageRootDropActive: (value: boolean | ((prev: boolean) => boolean)) => void
  externalDragTimeoutRef: RefObject<number | null>
  internalDragPointerRef: RefObject<{ x: number; y: number } | null>
  internalDropUpdateRafRef: RefObject<number | null>
  internalDropUpdateArgsRef: RefObject<{ x: number; y: number; activeId: string } | null>
  beginGridInteraction: () => void
  resetInternalDragState: () => void
}

export interface UseCanvasInteractionsResult {
  frameWidth: number | null
  onFrameResizeMouseDown: (event: MouseEvent<HTMLButtonElement>) => void
  handleExternalDragOver: (event: DragEvent<HTMLDivElement>) => void
  handleExternalDrop: (event: DragEvent<HTMLDivElement>) => void
  clearExternalDragState: () => void
  startInternalGridDrag: (
    oldItem: Layout,
    parentId?: string,
    parentSlot?: string,
    event?: unknown
  ) => void
  updateInternalGridDrag: (oldItem: Layout, event?: unknown) => void
  stopInternalGridDrag: (layout: Layout[], onFallback: () => void, event?: unknown) => void
  buildPreviewStyle: (
    layout: Partial<Layout> | null,
    columns: number,
    margin: number
  ) => CSSProperties | null
}
