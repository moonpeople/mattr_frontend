/**
 * Оркестратор взаимодействий canvas: frame resize, external DnD и internal DnD.
 */
import { useCanvasExternalDnd } from './useCanvasExternalDnd'
import { useCanvasFrameResize } from './useCanvasFrameResize'
import { useCanvasInternalDnd } from './useCanvasInternalDnd'
import type {
  UseCanvasInteractionsParams,
  UseCanvasInteractionsResult,
} from './useCanvasInteractions.types'

export const useCanvasInteractions = ({
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
}: UseCanvasInteractionsParams): UseCanvasInteractionsResult => {
  const { frameWidth, onFrameResizeMouseDown } = useCanvasFrameResize({ frameRef })

  const {
    clearExternalDragState,
    handleExternalDragOver,
    handleExternalDrop,
  } = useCanvasExternalDnd({
    widgets,
    isQuickAddWidgetSelectable,
    onInsertAdjacentWidget,
    isExternalDragActive,
    externalDropTarget,
    setIsExternalDragActive,
    setExternalDropTarget,
    externalDragTimeoutRef,
  })

  const {
    startInternalGridDrag,
    updateInternalGridDrag,
    stopInternalGridDrag,
    buildPreviewStyle,
  } = useCanvasInternalDnd({
    gridRowHeight,
    canvasRootRef,
    onMoveWidgetToContainer,
    onMoveWidgetToPageRoot,
    internalDragActiveId,
    internalDropTarget,
    internalDropContainerTarget,
    internalPageRootDropLayout,
    internalDragSource,
    isPageRootDropActive,
    setInternalDragActiveId,
    setInternalDropTarget,
    setInternalDropContainerTarget,
    setInternalPageRootDropLayout,
    setInternalDragSource,
    setIsPageRootDropActive,
    internalDragPointerRef,
    internalDropUpdateRafRef,
    internalDropUpdateArgsRef,
    beginGridInteraction,
    resetInternalDragState,
  })

  return {
    frameWidth,
    onFrameResizeMouseDown,
    handleExternalDragOver,
    handleExternalDrop,
    clearExternalDragState,
    startInternalGridDrag,
    updateInternalGridDrag,
    stopInternalGridDrag,
    buildPreviewStyle,
  }
}
