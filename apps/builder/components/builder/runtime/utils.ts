/**
 * Runtime-утилиты builder: общие helper-функции для рендера и обработки runtime-данных.
 */
import type { Layout } from 'react-grid-layout'

import { evaluateCondition } from 'lib/builder/expressions'
import { resolveValue } from 'lib/builder/value-resolver'

import type { BuilderWidgetInstance } from '../types'

export const GRID_COLUMNS = 12

const DEFAULT_ITEM = {
  w: 4,
  h: 6,
  minW: 2,
  minH: 3,
}
const ONE_COLUMN_WIDGET_TYPES = new Set([
  'Button',
  'OutlineButton',
  'CloseButton',
  'ButtonGroup',
  'DropdownButton',
  'Link',
  'LinkList',
  'SplitButton',
  'ToggleButton',
  'ToggleLink',
])
const DEFAULT_ITEM_HEIGHT_BY_TYPE: Record<string, number> = {
  JsonEditor: 40,
  Sidebar: 40,
}
const getDefaultItemHeight = (widgetType: string) =>
  DEFAULT_ITEM_HEIGHT_BY_TYPE[widgetType] ?? DEFAULT_ITEM.h
const getDefaultItemMinW = (widgetType: string) =>
  ONE_COLUMN_WIDGET_TYPES.has(widgetType) ? 1 : DEFAULT_ITEM.minW

export const parseBoolean = (value: unknown, fallback = false) => {
  if (typeof value === 'boolean') {
    return value
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (normalized === 'true') {
      return true
    }
    if (normalized === 'false') {
      return false
    }
  }
  return fallback
}

export const flattenWidgets = (widgets: BuilderWidgetInstance[]): BuilderWidgetInstance[] => {
  const flattened: BuilderWidgetInstance[] = []
  widgets.forEach((widget) => {
    flattened.push(widget)
    if (widget.children && widget.children.length > 0) {
      flattened.push(...flattenWidgets(widget.children))
    }
  })
  return flattened
}

export const normalizeLayout = (widget: BuilderWidgetInstance, index: number): Layout => {
  const columnsPerRow = Math.max(1, Math.floor(GRID_COLUMNS / DEFAULT_ITEM.w))
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
  const rawH = layout.h ?? fallback.h
  const isLegacyHeight = rawH === 1 || rawH === DEFAULT_ITEM.h
  const h =
    (widget.type === 'JsonEditor' || widget.type === 'Sidebar') && isLegacyHeight
      ? defaultH
      : rawH
  const minH =
    widget.type === 'Sidebar'
      ? Math.max(layout.minH ?? defaultH, defaultH)
      : layout.minH ?? fallback.minH
  return {
    i: widget.id,
    x: layout.x ?? fallback.x,
    y: layout.y ?? fallback.y,
    w: layout.w ?? fallback.w,
    h,
    minW: layout.minW ?? fallback.minW,
    minH,
    maxW: layout.maxW,
    maxH: layout.maxH,
  }
}

export const isWidgetAllowed = (
  widget: BuilderWidgetInstance,
  policies: Record<string, boolean>
) => {
  const required = widget.policy ?? []
  if (required.length === 0) {
    return true
  }

  return required.every((policy) => Boolean(policies[policy]))
}

export const isWidgetVisible = (
  widget: BuilderWidgetInstance,
  policies: Record<string, boolean>,
  runtimeContext: Record<string, unknown>,
  widgetState?: Record<string, Record<string, unknown>>,
  options?: {
    includeHidden?: boolean
  }
): boolean => {
  const hiddenOverride = widgetState?.[widget.id]?.hidden
  const baseHidden = parseBoolean(resolveValue(widget.hidden, runtimeContext), false)
  const isHidden = parseBoolean(hiddenOverride, baseHidden)
  if (isHidden && !options?.includeHidden) {
    return false
  }
  const hasPolicies = Object.keys(policies).length > 0
  if (hasPolicies && !isWidgetAllowed(widget, policies)) {
    return false
  }
  return evaluateCondition(widget.visibleWhen, policies) !== false
}
