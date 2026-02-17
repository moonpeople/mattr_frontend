/**
 * Hook internal DnD для перемещения виджетов между page root и container slots.
 */
import { useCallback, useEffect, useRef } from 'react'
import type { Layout } from 'react-grid-layout'

import {
  buildDropPreviewStyle,
  resolveDropLayoutInZone,
  resolveDropZoneFromPoint,
} from '../engines/dropTargetEngine'
import {
  DEFAULT_ITEM,
  getPointerCoordinates,
  normalizeSlotValue,
} from '../shared'
import type { UseCanvasInteractionsParams } from './useCanvasInteractions.types'

type InternalDndParams = Pick<
  UseCanvasInteractionsParams,
  | 'gridRowHeight'
  | 'canvasRootRef'
  | 'onMoveWidgetToContainer'
  | 'onMoveWidgetToPageRoot'
  | 'internalDragActiveId'
  | 'internalDropTarget'
  | 'internalDropContainerTarget'
  | 'internalPageRootDropLayout'
  | 'internalDragSource'
  | 'isPageRootDropActive'
  | 'setInternalDragActiveId'
  | 'setInternalDropTarget'
  | 'setInternalDropContainerTarget'
  | 'setInternalPageRootDropLayout'
  | 'setInternalDragSource'
  | 'setIsPageRootDropActive'
  | 'internalDragPointerRef'
  | 'internalDropUpdateRafRef'
  | 'internalDropUpdateArgsRef'
  | 'beginGridInteraction'
  | 'resetInternalDragState'
>

export const useCanvasInternalDnd = ({
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
}: InternalDndParams) => {
  const resolveWidgetRootById = useCallback(
    (widgetId: string) =>
      (canvasRootRef.current?.querySelector(
        `[data-builder-widget-id="${widgetId}"]`
      ) as HTMLElement | null) ?? null,
    [canvasRootRef]
  )

  const updateInternalDropTargetFromPoint = useCallback(
    (x: number, y: number, activeId: string) => {
      const activeRoot = resolveWidgetRootById(activeId)
      const activeZone = resolveDropZoneFromPoint({
        canvasRoot: canvasRootRef.current,
        x,
        y,
        activeId,
        activeRoot,
        resolveWidgetRootById,
      })

      if (!activeZone) {
        if (internalDropContainerTarget) {
          setInternalDropContainerTarget(null)
        }
        if (internalDropTarget) {
          setInternalDropTarget(null)
        }
        if (internalPageRootDropLayout) {
          setInternalPageRootDropLayout(null)
        }
        if (isPageRootDropActive) {
          setIsPageRootDropActive(false)
        }
        return
      }

      const sourceLayout = internalDragSource?.layout ?? null
      const nextLayout = resolveDropLayoutInZone({
        zone: activeZone.element,
        x,
        y,
        rowHeight: gridRowHeight,
        sourceLayout,
      })
      if (!nextLayout) {
        return
      }

      if (activeZone.kind === 'container' && activeZone.parentId) {
        const targetParentId = activeZone.parentId
        setInternalDropContainerTarget((prev) =>
          prev?.parentId === activeZone.parentId &&
          (prev?.slot ?? '') === (activeZone.slot ?? '') &&
          (prev?.layout?.x ?? -1) === (nextLayout.x ?? -1) &&
          (prev?.layout?.y ?? -1) === (nextLayout.y ?? -1)
            ? prev
            : { parentId: targetParentId, slot: activeZone.slot, layout: nextLayout }
        )
        if (internalDropTarget) {
          setInternalDropTarget(null)
        }
        if (internalPageRootDropLayout) {
          setInternalPageRootDropLayout(null)
        }
        if (isPageRootDropActive) {
          setIsPageRootDropActive(false)
        }
        return
      }

      if (activeZone.kind === 'page-root') {
        if (internalDropContainerTarget) {
          setInternalDropContainerTarget(null)
        }
        if (internalDropTarget) {
          setInternalDropTarget(null)
        }
        setInternalPageRootDropLayout((prev) =>
          (prev?.x ?? -1) === (nextLayout.x ?? -1) &&
          (prev?.y ?? -1) === (nextLayout.y ?? -1) &&
          (prev?.w ?? -1) === (nextLayout.w ?? -1) &&
          (prev?.h ?? -1) === (nextLayout.h ?? -1)
            ? prev
            : nextLayout
        )
        setIsPageRootDropActive((prev) => (prev ? prev : true))
      }
    },
    [
      canvasRootRef,
      gridRowHeight,
      internalDragSource,
      internalDropContainerTarget,
      internalDropTarget,
      internalPageRootDropLayout,
      isPageRootDropActive,
      resolveWidgetRootById,
      setInternalDropContainerTarget,
      setInternalDropTarget,
      setInternalPageRootDropLayout,
      setIsPageRootDropActive,
    ]
  )

  const updateInternalDropTarget = useCallback(
    (pointer: { clientX: number; clientY: number }, activeId: string) => {
      internalDragPointerRef.current = { x: pointer.clientX, y: pointer.clientY }
      internalDropUpdateArgsRef.current = {
        x: pointer.clientX,
        y: pointer.clientY,
        activeId,
      }
      if (internalDropUpdateRafRef.current) {
        return
      }
      internalDropUpdateRafRef.current = window.requestAnimationFrame(() => {
        internalDropUpdateRafRef.current = null
        const nextArgs = internalDropUpdateArgsRef.current
        if (!nextArgs) {
          return
        }
        updateInternalDropTargetFromPoint(nextArgs.x, nextArgs.y, nextArgs.activeId)
      })
    },
    [
      internalDragPointerRef,
      internalDropUpdateArgsRef,
      internalDropUpdateRafRef,
      updateInternalDropTargetFromPoint,
    ]
  )
  const updateInternalDropTargetRef = useRef(updateInternalDropTarget)
  updateInternalDropTargetRef.current = updateInternalDropTarget

  const updatePointerFromUnknownEvent = useCallback(
    (event: unknown) => {
      const pointer = getPointerCoordinates(event)
      if (!pointer) {
        return
      }
      internalDragPointerRef.current = {
        x: pointer.clientX,
        y: pointer.clientY,
      }
    },
    [internalDragPointerRef]
  )

  const isPointerOverPageRootDropZone = useCallback(() => {
    const pointer = internalDragPointerRef.current
    if (!pointer || !internalDragActiveId) {
      return false
    }
    const activeRoot = resolveWidgetRootById(internalDragActiveId)
    const zone = resolveDropZoneFromPoint({
      canvasRoot: canvasRootRef.current,
      x: pointer.x,
      y: pointer.y,
      activeId: internalDragActiveId,
      activeRoot: activeRoot,
      resolveWidgetRootById,
    })
    return zone?.kind === 'page-root'
  }, [canvasRootRef, internalDragActiveId, internalDragPointerRef, resolveWidgetRootById])

  useEffect(() => {
    if (!internalDragActiveId) {
      return
    }
    const handleMove = (event: globalThis.MouseEvent) => {
      updateInternalDropTargetRef.current(event, internalDragActiveId)
    }
    window.addEventListener('mousemove', handleMove)
    return () => window.removeEventListener('mousemove', handleMove)
  }, [internalDragActiveId])

  useEffect(() => {
    if (!internalDragActiveId) {
      return
    }
    const handleEnd = () => resetInternalDragState()
    window.addEventListener('mouseup', handleEnd)
    window.addEventListener('dragend', handleEnd)
    window.addEventListener('blur', handleEnd)
    return () => {
      window.removeEventListener('mouseup', handleEnd)
      window.removeEventListener('dragend', handleEnd)
      window.removeEventListener('blur', handleEnd)
    }
  }, [internalDragActiveId, resetInternalDragState])

  const startInternalGridDrag = useCallback(
    (
      oldItem: Layout,
      parentId?: string,
      parentSlot?: string,
      event?: unknown
    ) => {
      setInternalDragActiveId(oldItem.i)
      setInternalDropTarget(null)
      setInternalDropContainerTarget(null)
      setInternalPageRootDropLayout(null)
      setInternalDragSource({
        parentId,
        slot: parentSlot,
        layout: {
          x: oldItem.x,
          y: oldItem.y,
          w: oldItem.w,
          h: oldItem.h,
          minW: oldItem.minW,
          minH: oldItem.minH,
          maxW: oldItem.maxW,
          maxH: oldItem.maxH,
        },
      })
      beginGridInteraction()
      if (!event) {
        return
      }
      const pointer = getPointerCoordinates(event)
      if (pointer) {
        updateInternalDropTarget(pointer, oldItem.i)
      }
    },
    [
      beginGridInteraction,
      setInternalDragActiveId,
      setInternalDragSource,
      setInternalDropContainerTarget,
      setInternalDropTarget,
      setInternalPageRootDropLayout,
      updateInternalDropTarget,
    ]
  )

  const updateInternalGridDrag = useCallback(
    (oldItem: Layout, event?: unknown) => {
      if (!event) {
        return
      }
      const pointer = getPointerCoordinates(event)
      if (pointer) {
        updateInternalDropTarget(pointer, oldItem.i)
      }
    },
    [updateInternalDropTarget]
  )

  const stopInternalGridDrag = useCallback(
    (layout: Layout[], onFallback: () => void, event?: unknown) => {
      void layout
      updatePointerFromUnknownEvent(event)
      const sourceParentId = internalDragSource?.parentId
      const sourceSlot = normalizeSlotValue(internalDragSource?.slot)
      if (
        internalDropContainerTarget &&
        internalDragActiveId &&
        internalDropContainerTarget.parentId !== internalDragActiveId &&
        (internalDropContainerTarget.parentId !== sourceParentId ||
          normalizeSlotValue(internalDropContainerTarget.slot) !== sourceSlot)
      ) {
        onMoveWidgetToContainer?.(
          internalDragActiveId,
          internalDropContainerTarget.parentId,
          internalDropContainerTarget.slot,
          internalDropContainerTarget.layout
        )
      } else if (internalDragActiveId && sourceParentId && isPointerOverPageRootDropZone()) {
        onMoveWidgetToPageRoot?.(internalDragActiveId, internalPageRootDropLayout ?? undefined)
      } else {
        onFallback()
      }
      internalDragPointerRef.current = null
      resetInternalDragState()
    },
    [
      internalDragActiveId,
      internalDragPointerRef,
      internalDragSource,
      internalDropContainerTarget,
      internalPageRootDropLayout,
      isPointerOverPageRootDropZone,
      onMoveWidgetToContainer,
      onMoveWidgetToPageRoot,
      resetInternalDragState,
      updatePointerFromUnknownEvent,
    ]
  )

  const buildPreviewStyle = useCallback(
    (layout: Partial<Layout> | null, columns: number, margin: number) =>
      buildDropPreviewStyle(layout, columns, margin, gridRowHeight, DEFAULT_ITEM),
    [gridRowHeight]
  )

  return {
    startInternalGridDrag,
    updateInternalGridDrag,
    stopInternalGridDrag,
    buildPreviewStyle,
  }
}

