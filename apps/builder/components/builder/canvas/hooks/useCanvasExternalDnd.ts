/**
 * Hook external DnD: обрабатывает перетаскивание виджетов из каталога в сетку canvas.
 */
import { useCallback, useEffect, useMemo, type DragEvent as ReactDragEvent } from 'react'

import { resolveBuilderWidgetDragPayload } from '../../utils/quickadd-dnd'
import {
  areAdjacentDropTargetsEqual,
  isPointInsideCanvasChildDropZone,
  resolveAdjacentDropTargetFromPoint,
} from '../engines/dropTargetEngine'
import { collectWidgetIds } from '../selectors/layoutSelectors'
import { getEventDataTransfer } from '../shared'
import type { UseCanvasInteractionsParams } from './useCanvasInteractions.types'

type ExternalDndParams = Pick<
  UseCanvasInteractionsParams,
  | 'widgets'
  | 'isQuickAddWidgetSelectable'
  | 'onInsertAdjacentWidget'
  | 'isExternalDragActive'
  | 'externalDropTarget'
  | 'setIsExternalDragActive'
  | 'setExternalDropTarget'
  | 'externalDragTimeoutRef'
>

export const useCanvasExternalDnd = ({
  widgets,
  isQuickAddWidgetSelectable,
  onInsertAdjacentWidget,
  isExternalDragActive,
  externalDropTarget,
  setIsExternalDragActive,
  setExternalDropTarget,
  externalDragTimeoutRef,
}: ExternalDndParams) => {
  const pageWidgetIds = useMemo(() => collectWidgetIds(widgets), [widgets])

  const clearExternalDragState = useCallback(() => {
    setIsExternalDragActive(false)
    setExternalDropTarget(null)
  }, [setExternalDropTarget, setIsExternalDragActive])

  useEffect(() => {
    return () => {
      if (externalDragTimeoutRef.current) {
        window.clearTimeout(externalDragTimeoutRef.current)
        externalDragTimeoutRef.current = null
      }
    }
  }, [externalDragTimeoutRef])

  const handleExternalDragOver = useCallback(
    (event: ReactDragEvent<HTMLDivElement>) => {
      const dataTransfer = getEventDataTransfer(event)
      const dragPayload = resolveBuilderWidgetDragPayload(dataTransfer)
      if (
        !dragPayload ||
        !isQuickAddWidgetSelectable(dragPayload.widgetType, {
          ...(dragPayload.presetId ? { presetId: dragPayload.presetId } : {}),
        })
      ) {
        clearExternalDragState()
        return
      }
      event.preventDefault()
      if (!isExternalDragActive) {
        setIsExternalDragActive(true)
      }
      if (externalDragTimeoutRef.current) {
        window.clearTimeout(externalDragTimeoutRef.current)
      }
      externalDragTimeoutRef.current = window.setTimeout(() => {
        clearExternalDragState()
      }, 120)

      const canvasRoot = event.currentTarget instanceof HTMLElement ? event.currentTarget : null
      const nextTarget = resolveAdjacentDropTargetFromPoint({
        canvasRoot,
        x: event.clientX,
        y: event.clientY,
        pageWidgetIds,
      })
      setExternalDropTarget((prev) =>
        areAdjacentDropTargetsEqual(prev, nextTarget) ? prev : nextTarget
      )
    },
    [
      clearExternalDragState,
      externalDragTimeoutRef,
      isExternalDragActive,
      isQuickAddWidgetSelectable,
      pageWidgetIds,
      setExternalDropTarget,
      setIsExternalDragActive,
    ]
  )

  const handleExternalDrop = useCallback(
    (event: ReactDragEvent<HTMLDivElement>) => {
      const dataTransfer = getEventDataTransfer(event)
      const dragPayload = resolveBuilderWidgetDragPayload(dataTransfer)
      if (
        !dragPayload ||
        !isQuickAddWidgetSelectable(dragPayload.widgetType, {
          ...(dragPayload.presetId ? { presetId: dragPayload.presetId } : {}),
        })
      ) {
        return
      }
      if (!externalDropTarget) {
        return
      }
      const canvasRoot = event.currentTarget instanceof HTMLElement ? event.currentTarget : null
      if (
        isPointInsideCanvasChildDropZone({
          canvasRoot,
          x: event.clientX,
          y: event.clientY,
        })
      ) {
        return
      }
      event.preventDefault()
      event.stopPropagation()
      if (externalDropTarget && pageWidgetIds.has(externalDropTarget.widgetId)) {
        onInsertAdjacentWidget(
          externalDropTarget.widgetId,
          externalDropTarget.position,
          dragPayload.widgetType,
          dragPayload.presetId ? { presetId: dragPayload.presetId } : undefined
        )
      } else {
        return
      }
      clearExternalDragState()
    },
    [
      clearExternalDragState,
      externalDropTarget,
      isQuickAddWidgetSelectable,
      onInsertAdjacentWidget,
      pageWidgetIds,
    ]
  )

  return {
    clearExternalDragState,
    handleExternalDragOver,
    handleExternalDrop,
  }
}
