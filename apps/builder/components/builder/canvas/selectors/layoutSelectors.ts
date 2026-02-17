/**
 * Helper-функции layout selectors: normalize layouts, build maps и collect widget ids.
 */
import type { Layout } from 'react-grid-layout'
import { getWidgetDefinition } from 'widgets/runtime'

import { resolveValue } from 'lib/builder/value-resolver'
import type { BuilderWidgetInstance } from '../../types'
import { resolveWidgetSpacingModes } from '../../types'
import { getWidgetResizeHandles } from '../resize-handles'
import {
  DEFAULT_ITEM,
  getDefaultItemHeight,
  getDefaultItemMinW,
  GRID_COLUMNS,
} from '../shared'

export const normalizeLayout = (
  widget: BuilderWidgetInstance,
  index: number,
  columns = GRID_COLUMNS,
  resizeHandlesOverride?: string[],
  isSelected = true
): Layout => {
  const columnsPerRow = Math.max(1, Math.floor(columns / DEFAULT_ITEM.w))
  const defaultH = getDefaultItemHeight(widget.type)
  const fallback = {
    ...DEFAULT_ITEM,
    x: (index % columnsPerRow) * DEFAULT_ITEM.w,
    y: Math.floor(index / columnsPerRow) * DEFAULT_ITEM.h,
    minW: getDefaultItemMinW(widget.type),
    maxW: undefined,
    maxH: undefined,
  }
  const layout = widget.layout ?? fallback
  const spacing = resolveWidgetSpacingModes(widget.type, widget.spacing, (expression) =>
    resolveValue(expression, {})
  )
  const minH = spacing.heightMode === 'auto' ? 1 : layout.minH ?? fallback.minH
  const rawH = layout.h ?? fallback.h
  const isLegacyHeight = rawH === 1 || rawH === DEFAULT_ITEM.h
  const h =
    (widget.type === 'JsonEditor' || widget.type === 'Sidebar') && isLegacyHeight
      ? defaultH
      : rawH
  const resolvedMinH = widget.type === 'Sidebar' ? Math.max(minH, defaultH) : minH
  const resizeHandles = getWidgetResizeHandles(widget, spacing, resizeHandlesOverride)
  const resolvedHandles = isSelected ? resizeHandles : []
  return {
    i: widget.id,
    x: layout.x ?? fallback.x,
    y: layout.y ?? fallback.y,
    w: Math.min(layout.w ?? fallback.w, columns),
    h,
    minW: Math.min(layout.minW ?? fallback.minW, columns),
    minH: resolvedMinH,
    maxW: layout.maxW ? Math.min(layout.maxW, columns) : columns === 1 ? 1 : layout.maxW,
    maxH: layout.maxH,
    isResizable: isSelected && resizeHandles.length > 0,
    resizeHandles: resolvedHandles,
  }
}

export const buildLayoutMap = (
  items: BuilderWidgetInstance[],
  columns: number,
  activeWidgetId?: string | null
) =>
  new Map(
    items.map((widget, index) => {
      const definition = getWidgetDefinition(widget.type)
      return [
        widget.id,
        normalizeLayout(
          widget,
          index,
          columns,
          definition?.builder?.resizeHandles,
          activeWidgetId === widget.id
        ),
      ]
    })
  )

export const collectWidgetIds = (items: BuilderWidgetInstance[]) => {
  const ids = new Set<string>()
  const collect = (next: BuilderWidgetInstance[]) => {
    next.forEach((widget) => {
      ids.add(widget.id)
      if (widget.children && widget.children.length > 0) {
        collect(widget.children)
      }
    })
  }
  collect(items)
  return ids
}
