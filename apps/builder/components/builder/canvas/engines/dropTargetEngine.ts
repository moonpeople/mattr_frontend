/**
 * Drop-target engine: определяет зоны/layout по координатам указателя и строит drop-preview.
 */
import type { CSSProperties } from 'react'
import type { Layout } from 'react-grid-layout'

import { DEFAULT_ITEM } from '../shared'

export type AdjacentDropPosition = 'above' | 'below'

export type AdjacentDropTarget = {
  widgetId: string
  position: AdjacentDropPosition
} | null

export type CanvasDropZoneKind = 'container' | 'page-root'

export type CanvasDropZone = {
  kind: CanvasDropZoneKind
  element: HTMLElement
  rect: DOMRect
  parentId?: string
  slot?: string
}

type IsValidContainerDropZoneParams = {
  zone: HTMLElement
  activeId: string
  activeRoot: HTMLElement | null
  resolveWidgetRootById: (widgetId: string) => HTMLElement | null
}

export const isValidContainerDropZone = ({
  zone,
  activeId,
  activeRoot,
  resolveWidgetRootById,
}: IsValidContainerDropZoneParams) => {
  const parentId = zone.getAttribute('data-builder-parent-id')?.trim()
  if (!parentId || parentId === activeId) {
    return false
  }
  const parentRoot = resolveWidgetRootById(parentId)
  if (activeRoot && parentRoot && activeRoot.contains(parentRoot)) {
    return false
  }
  return true
}

type ResolveDropZoneFromPointParams = {
  canvasRoot: HTMLElement | null
  x: number
  y: number
  activeId: string
  activeRoot: HTMLElement | null
  resolveWidgetRootById: (widgetId: string) => HTMLElement | null
}

const resolveElementFromPoint = (x: number, y: number): HTMLElement | null => {
  if (typeof document.elementFromPoint !== 'function') {
    return null
  }
  const element = document.elementFromPoint(x, y)
  return element instanceof HTMLElement ? element : null
}

type IsPointInsideCanvasChildDropZoneParams = {
  canvasRoot: HTMLElement | null
  x: number
  y: number
}

export const isPointInsideCanvasChildDropZone = ({
  canvasRoot,
  x,
  y,
}: IsPointInsideCanvasChildDropZoneParams) => {
  if (!canvasRoot) {
    return false
  }
  const elementUnderPointer = resolveElementFromPoint(x, y)
  if (!elementUnderPointer || !canvasRoot.contains(elementUnderPointer)) {
    return false
  }
  const zone = elementUnderPointer.closest('[data-builder-child-drop-zone="true"]')
  return zone instanceof HTMLElement && canvasRoot.contains(zone)
}

type ResolveAdjacentDropTargetFromPointParams = {
  canvasRoot: HTMLElement | null
  x: number
  y: number
  pageWidgetIds: ReadonlySet<string>
}

export const resolveAdjacentDropTargetFromPoint = ({
  canvasRoot,
  x,
  y,
  pageWidgetIds,
}: ResolveAdjacentDropTargetFromPointParams): AdjacentDropTarget => {
  if (!canvasRoot) {
    return null
  }
  if (isPointInsideCanvasChildDropZone({ canvasRoot, x, y })) {
    return null
  }
  const elementUnderPointer = resolveElementFromPoint(x, y)
  if (!elementUnderPointer || !canvasRoot.contains(elementUnderPointer)) {
    return null
  }
  const target = elementUnderPointer.closest('[data-builder-widget-id]') as HTMLElement | null
  const targetId = target?.getAttribute('data-builder-widget-id')?.trim() ?? ''
  if (!target || targetId.length === 0 || !pageWidgetIds.has(targetId)) {
    return null
  }
  const rect = target.getBoundingClientRect()
  const position: AdjacentDropPosition = y <= rect.top + rect.height / 2 ? 'above' : 'below'
  return { widgetId: targetId, position }
}

export const areAdjacentDropTargetsEqual = (
  a: AdjacentDropTarget,
  b: AdjacentDropTarget
) => a?.widgetId === b?.widgetId && a?.position === b?.position

type ShouldInsertAdjacentWidgetInGridDropParams = {
  parentId?: string
  parentSlot?: string
  externalDropTarget: AdjacentDropTarget
  pageWidgetIds: ReadonlySet<string>
}

export const shouldInsertAdjacentWidgetInGridDrop = ({
  parentId,
  parentSlot,
  externalDropTarget,
  pageWidgetIds,
}: ShouldInsertAdjacentWidgetInGridDropParams) => {
  if (parentId) {
    return false
  }
  if (typeof parentSlot === 'string' && parentSlot.trim().length > 0) {
    return false
  }
  if (!externalDropTarget) {
    return false
  }
  return pageWidgetIds.has(externalDropTarget.widgetId)
}

export const resolveDropZoneFromPoint = ({
  canvasRoot,
  x,
  y,
  activeId,
  activeRoot,
  resolveWidgetRootById,
}: ResolveDropZoneFromPointParams): CanvasDropZone | null => {
  if (!canvasRoot) {
    return null
  }

  const seen = new Set<HTMLElement>()
  const stack = (
    typeof document.elementsFromPoint === 'function'
      ? (document.elementsFromPoint(x, y) as HTMLElement[])
      : []
  ).filter((element) => canvasRoot.contains(element))
  for (const element of stack) {
    const zone = element.closest(
      '[data-builder-child-drop-zone="true"], [data-builder-page-root-drop-zone="true"]'
    ) as HTMLElement | null
    if (!zone || !canvasRoot.contains(zone) || seen.has(zone)) {
      continue
    }
    seen.add(zone)
    const rect = zone.getBoundingClientRect()
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      continue
    }
    const isContainer = zone.getAttribute('data-builder-child-drop-zone') === 'true'
    if (
      isContainer &&
      !isValidContainerDropZone({
        zone,
        activeId,
        activeRoot,
        resolveWidgetRootById,
      })
    ) {
      continue
    }
    const parentId = zone.getAttribute('data-builder-parent-id')?.trim() ?? ''
    const slot = zone.getAttribute('data-builder-parent-slot')?.trim() ?? ''
    return {
      kind: isContainer ? 'container' : 'page-root',
      element: zone,
      rect,
      parentId: parentId || undefined,
      slot: slot || undefined,
    }
  }

  const zones: CanvasDropZone[] = Array.from(
    canvasRoot.querySelectorAll(
      '[data-builder-child-drop-zone="true"], [data-builder-page-root-drop-zone="true"]'
    )
  )
    .map((element) => {
      const zone = element as HTMLElement
      const isContainer = zone.getAttribute('data-builder-child-drop-zone') === 'true'
      const parentIdRaw = zone.getAttribute('data-builder-parent-id')?.trim() ?? ''
      const slotRaw = zone.getAttribute('data-builder-parent-slot')?.trim() ?? ''
      return {
        kind: isContainer ? 'container' : 'page-root',
        element: zone,
        rect: zone.getBoundingClientRect(),
        parentId: parentIdRaw || undefined,
        slot: slotRaw || undefined,
      } as CanvasDropZone
    })
    .filter(
      (zone) =>
        x >= zone.rect.left &&
        x <= zone.rect.right &&
        y >= zone.rect.top &&
        y <= zone.rect.bottom
    )
    .filter((zone) =>
      zone.kind === 'container'
        ? isValidContainerDropZone({
            zone: zone.element,
            activeId,
            activeRoot,
            resolveWidgetRootById,
          })
        : true
    )
    .sort((a, b) => {
      if (a.kind !== b.kind) {
        return a.kind === 'container' ? -1 : 1
      }
      const areaA = a.rect.width * a.rect.height
      const areaB = b.rect.width * b.rect.height
      return areaA - areaB
    })

  return zones[0] ?? null
}

type ResolveDropLayoutInZoneParams = {
  zone: HTMLElement
  x: number
  y: number
  rowHeight: number
  sourceLayout?: Partial<Layout> | null
  defaultItem?: { w: number; h: number }
}

export const resolveDropLayoutInZone = ({
  zone,
  x,
  y,
  rowHeight,
  sourceLayout,
  defaultItem = DEFAULT_ITEM,
}: ResolveDropLayoutInZoneParams): Partial<Layout> | null => {
  const columnsRaw = zone.getAttribute('data-builder-grid-columns')
  const marginRaw = zone.getAttribute('data-builder-grid-margin')
  const columns = Number(columnsRaw)
  const margin = Number(marginRaw)
  if (!Number.isFinite(columns) || columns <= 0 || !Number.isFinite(margin) || margin < 0) {
    return null
  }
  const rect = zone.getBoundingClientRect()
  const safeColumns = Math.max(1, Math.floor(columns))
  const sourceW = Math.max(1, Math.floor(sourceLayout?.w ?? defaultItem.w))
  const sourceH = Math.max(1, Math.floor(sourceLayout?.h ?? defaultItem.h))
  const w = Math.max(1, Math.min(sourceW, safeColumns))
  const colWidth = (rect.width - (safeColumns - 1) * margin) / safeColumns
  const colStride = colWidth + margin
  const rowStride = rowHeight + margin
  if (colStride <= 0 || rowStride <= 0) {
    return null
  }
  const relativeX = x - rect.left
  const relativeY = y - rect.top
  const rawX = Math.floor(relativeX / colStride)
  const rawY = Math.floor(relativeY / rowStride)
  return {
    x: Math.max(0, Math.min(safeColumns - w, rawX)),
    y: Math.max(0, rawY),
    w,
    h: sourceH,
    minW: sourceLayout?.minW,
    minH: sourceLayout?.minH,
    maxW: sourceLayout?.maxW,
    maxH: sourceLayout?.maxH,
  }
}

export const buildDropPreviewStyle = (
  layout: Partial<Layout> | null,
  columns: number,
  margin: number,
  rowHeight: number,
  defaultItem: { w: number; h: number } = DEFAULT_ITEM
): CSSProperties | null => {
  if (!layout || columns <= 0) {
    return null
  }
  const x = Math.max(0, Math.floor(layout.x ?? 0))
  const y = Math.max(0, Math.floor(layout.y ?? 0))
  const w = Math.max(1, Math.min(columns, Math.floor(layout.w ?? defaultItem.w)))
  const h = Math.max(1, Math.floor(layout.h ?? defaultItem.h))
  const track = `((100% - ${(columns - 1) * margin}px) / ${columns})`
  const left = x <= 0 ? '0px' : `calc(${track} * ${x} + ${margin * x}px)`
  const width = w <= 1 ? `calc(${track})` : `calc(${track} * ${w} + ${margin * (w - 1)}px)`
  return {
    left,
    top: `${y * (rowHeight + margin)}px`,
    width,
    height: `${h * rowHeight + (h - 1) * margin}px`,
  }
}
