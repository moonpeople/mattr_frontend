/**
 * Общие константы canvas и utility helper-функции, используемые в hooks/renderers.
 */
import type { CSSProperties } from 'react'
import type { Layout } from 'react-grid-layout'

import { resolveValue } from 'lib/builder/value-resolver'

import type { BuilderAppMeta, BuilderPageLayout, BuilderWidgetInstance } from '../types'
import { resolvePagePaddingValue } from '../types'

export const GRID_COLUMNS = 12
export const DEFAULT_ITEM = {
  w: 4,
  h: 6,
  minW: 2,
  minH: 3,
}
export const ONE_COLUMN_WIDGET_TYPES = new Set([
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
export const DEFAULT_ITEM_HEIGHT_BY_TYPE: Record<string, number> = {
  JsonEditor: 40,
  Sidebar: 40,
}
export const getDefaultItemHeight = (widgetType: string) =>
  DEFAULT_ITEM_HEIGHT_BY_TYPE[widgetType] ?? DEFAULT_ITEM.h
export const getDefaultItemMinW = (widgetType: string) =>
  ONE_COLUMN_WIDGET_TYPES.has(widgetType) ? 1 : DEFAULT_ITEM.minW
export const CANVAS_MIN_WIDTH = 1040
export const DRAG_HOLD_DELAY_MS = 200
export const DRAG_HANDLE_SELECTOR = '.builder-drag-handle'
export const normalizeSlotValue = (value: unknown) =>
  typeof value === 'string' ? value.trim().toLowerCase() : ''
export const DRAG_CANCEL_SELECTOR =
  'button, input, textarea, select, option, [data-no-drag="true"]'
export const INTERACTIVE_TARGET_SELECTOR = [
  DRAG_CANCEL_SELECTOR,
  '[role="slider"]',
  '[data-slot="slider"]',
  '[data-slot="slider-track"]',
  '[data-slot="slider-range"]',
  '[data-slot="slider-thumb"]',
].join(', ')
export const CANVAS_VALUE_WIDGET_TYPES = new Set([
  'EditableText',
  'EditableTextArea',
  'EditableNumber',
  'TextArea',
  'TextInput',
  'Email',
  'Url',
  'PasswordInput',
  'DatetimeInput',
  'DatePicker',
  'DateRangePicker',
  'DateTimePicker',
  'TimePicker',
  'Calendar',
  'CalendarInput',
  'Date',
  'DateRange',
  'DateTime',
  'Day',
  'Month',
  'Time',
  'Year',
  'JsonEditor',
  'Switch',
  'SwitchGroup',
  'RadioGroup',
  'SegmentedControl',
  'Slider',
  'RangeSlider',
  'Rating',
  'Select',
  'MultiSelect',
  'Listbox',
  'MultiSelectListbox',
  'Cascader',
  'Checkbox',
  'CheckboxGroup',
  'CheckboxTree',
  'TabbedContainer',
  'SteppedContainer',
])
export const CANVAS_STATE_KEYS = new Set([
  'value',
  'values',
  'activeTab',
  'activeStep',
  'currentStep',
  'checked',
  'start',
  'end',
  'startDate',
  'endDate',
])
export const CONNECT_DATA_WIDGET_TYPES = new Set(['Table'])
export const COMMON_WIDGET_TYPES = ['Table', 'Text', 'Button', 'TextInput', 'Email', 'Url', 'Select']

export const parseBoolean = (value: unknown, fallback = false) => {
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

export const getPointerCoordinates = (
  event: unknown
): { clientX: number; clientY: number } | null => {
  if (!event || typeof event !== 'object') {
    return null
  }
  const record = event as { nativeEvent?: unknown; clientX?: unknown; clientY?: unknown }
  const source =
    record.nativeEvent && typeof record.nativeEvent === 'object'
      ? (record.nativeEvent as { clientX?: unknown; clientY?: unknown })
      : record
  if (typeof source.clientX !== 'number' || typeof source.clientY !== 'number') {
    return null
  }
  if (!Number.isFinite(source.clientX) || !Number.isFinite(source.clientY)) {
    return null
  }
  return { clientX: source.clientX, clientY: source.clientY }
}

export const getEventDataTransfer = (event: unknown): DataTransfer | null => {
  if (!event || typeof event !== 'object') {
    return null
  }
  const record = event as { nativeEvent?: unknown; dataTransfer?: unknown }
  const source =
    record.nativeEvent && typeof record.nativeEvent === 'object'
      ? (record.nativeEvent as { dataTransfer?: unknown })
      : record
  return source.dataTransfer instanceof DataTransfer ? source.dataTransfer : null
}

export type GlobalFramePadding = 'sm' | 'md' | 'lg'
export type GlobalFrameBackground = 'surface' | 'muted' | 'transparent'

export const resolveGlobalFrameVisualConfig = (
  raw: Record<string, unknown> | undefined
): { padding: GlobalFramePadding; bordered: boolean; background: GlobalFrameBackground } => {
  const paddingRaw = typeof raw?.padding === 'string' ? raw.padding.trim().toLowerCase() : 'md'
  const padding: GlobalFramePadding =
    paddingRaw === 'sm' || paddingRaw === 'lg' ? paddingRaw : 'md'
  const backgroundRaw =
    typeof raw?.background === 'string' ? raw.background.trim().toLowerCase() : 'surface'
  const background: GlobalFrameBackground =
    backgroundRaw === 'muted' || backgroundRaw === 'transparent' ? backgroundRaw : 'surface'
  const bordered = parseBoolean(raw?.bordered, true)
  return { padding, bordered, background }
}

export const getGlobalFramePaddingClass = (padding: GlobalFramePadding) =>
  padding === 'sm' ? 'p-3' : padding === 'lg' ? 'p-6' : 'p-4'

export const getGlobalFrameBackgroundClass = (background: GlobalFrameBackground) =>
  background === 'muted'
    ? 'bg-muted'
    : background === 'transparent'
      ? 'bg-transparent'
      : 'bg-background'

export const resolveShowInEditor = (
  widget: BuilderWidgetInstance,
  evaluationContext?: Record<string, unknown>
) => {
  const rawValue = (widget.props as Record<string, unknown> | undefined)
    ?.alwaysShowInEditMode
  return parseBoolean(resolveValue(rawValue, evaluationContext ?? {}), false)
}

const toKebabCase = (value: string) =>
  value.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`)

export const serializeThemeStyle = (style?: CSSProperties) => {
  if (!style) {
    return ''
  }
  return Object.entries(style)
    .map(([key, value]) => {
      if (value === undefined || value === null || value === '') {
        return ''
      }
      const cssKey = key.startsWith('--') ? key : toKebabCase(key)
      return `${cssKey}: ${String(value)};`
    })
    .filter(Boolean)
    .join(' ')
}

export const shouldPlaceBadgeBelow = (widget: BuilderWidgetInstance) => {
  const y = widget.layout?.y ?? 0
  return y < 2
}

export const resolvePagePadding = (pageMain?: BuilderPageLayout['main']) => {
  const value = resolvePagePaddingValue(pageMain, (expression) =>
    resolveValue(expression, {})
  )
  return value ? value : 0
}

export const resolveAppMaxWidth = (appMeta?: BuilderAppMeta) => {
  if (!appMeta?.maxWidth) {
    return undefined
  }
  const value = appMeta.maxWidth.trim()
  return value.length > 0 ? value : undefined
}

export const hasWidgetInTree = (
  widgets: BuilderWidgetInstance[],
  widgetId: string
): boolean => {
  for (const widget of widgets) {
    if (widget.id === widgetId) {
      return true
    }
    if (widget.children && hasWidgetInTree(widget.children, widgetId)) {
      return true
    }
  }
  return false
}

const resolveGridContainerFromEvent = (event: unknown): HTMLElement | null => {
  const record = event as { currentTarget?: EventTarget | null; target?: EventTarget | null }
  if (record.currentTarget instanceof HTMLElement) {
    return record.currentTarget
  }
  if (record.target instanceof HTMLElement) {
    return record.target.closest('.react-grid-layout') as HTMLElement | null
  }
  return null
}

export const resolveGridDropLayoutFromEvent = (
  event: unknown,
  params: {
    columns: number
    margin: number
    rowHeight: number
    defaultItem?: { w: number; h: number }
  }
): Layout | null => {
  const pointer = getPointerCoordinates(event)
  if (!pointer) {
    return null
  }
  const container = resolveGridContainerFromEvent(event)
  if (!container) {
    return null
  }
  const rect = container.getBoundingClientRect()
  if (!rect.width || !rect.height) {
    return null
  }
  const columns = Math.max(1, Math.floor(params.columns))
  const margin = Math.max(0, params.margin)
  const defaultItem = params.defaultItem ?? DEFAULT_ITEM
  const columnWidth = (rect.width - (columns - 1) * margin) / columns
  const columnStride = columnWidth + margin
  const rowStride = params.rowHeight + margin
  if (columnStride <= 0 || rowStride <= 0) {
    return null
  }
  const relativeX = pointer.clientX - rect.left
  const relativeY = pointer.clientY - rect.top
  const x = Math.max(0, Math.min(columns - 1, Math.floor(relativeX / columnStride)))
  const y = Math.max(0, Math.floor(relativeY / rowStride))
  return {
    i: '__drop__',
    x,
    y,
    w: Math.max(1, Math.min(defaultItem.w, columns)),
    h: Math.max(1, defaultItem.h),
  }
}

export const buildGridBackgroundStyle = (params: {
  show: boolean
  columns: number
  margin: number
  rowHeight: number
  lineColor: string
}): CSSProperties | undefined => {
  if (!params.show) {
    return undefined
  }
  const columns = Math.max(1, Math.floor(params.columns))
  const margin = Math.max(0, params.margin)
  const columnStride =
    columns === 1
      ? '100%'
      : `calc((100% - ${(columns - 1) * margin}px) / ${columns} + ${margin}px)`
  const rowStride = `${params.rowHeight + margin}px`
  return {
    backgroundImage: `linear-gradient(to right, ${params.lineColor} 1px, transparent 1px), linear-gradient(to bottom, ${params.lineColor} 1px, transparent 1px)`,
    backgroundSize: `${columnStride} ${rowStride}`,
    backgroundPosition: '0 0',
  }
}
