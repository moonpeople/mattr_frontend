/**
 * Вспомогательные утилиты BuilderShell для ID/clone/event-ref операций по дереву виджетов.
 */
import { buildIndexedName } from '../BuilderCodeUtils'
import type { BuilderPage, BuilderWidgetInstance } from '../types'
import { getPageFrameWidgets } from '../types'
import { resolvePageFramesState, resolvePageWidgetsState } from '../utils/layout-slots'

const collectWidgetIds = (
  widgets: BuilderWidgetInstance[],
  ids: Set<string>
) => {
  widgets.forEach((widget) => {
    ids.add(widget.id)
    if (widget.children && widget.children.length > 0) {
      collectWidgetIds(widget.children, ids)
    }
  })
}

export const collectExistingWidgetIds = (
  pages: BuilderPage[],
  appFrameWidgets: BuilderWidgetInstance[]
) => {
  const ids = new Set<string>()
  pages.forEach((page) => {
    collectWidgetIds(resolvePageWidgetsState(page), ids)
    const pageFrames = getPageFrameWidgets(resolvePageFramesState(page))
    if (pageFrames.length > 0) {
      collectWidgetIds(pageFrames, ids)
    }
  })
  collectWidgetIds(appFrameWidgets, ids)
  return ids
}

export const buildWidgetIdFromSet = (
  widgetType: string,
  ids: Set<string>
) => {
  const base = widgetType
    ? widgetType[0].toLowerCase() + widgetType.slice(1)
    : 'widget'
  const nextId = buildIndexedName(base, ids)
  ids.add(nextId)
  return nextId
}

export const normalizeWidgetIdInput = (value: string) => {
  const trimmed = value.trim()
  if (!trimmed) {
    return 'widget'
  }
  const parts = trimmed.split(/[^a-zA-Z0-9]+/).filter(Boolean)
  if (parts.length === 0) {
    return 'widget'
  }
  const [first, ...rest] = parts
  let result =
    first.slice(0, 1).toLowerCase() + first.slice(1) +
    rest.map((part) => part.slice(0, 1).toUpperCase() + part.slice(1)).join('')
  if (/^[0-9]/.test(result)) {
    result = `widget${result}`
  }
  return result
}

export const ensureUniqueWidgetId = (baseId: string, existingIds: Set<string>) => {
  if (!existingIds.has(baseId)) {
    return baseId
  }
  const prefix = baseId.replace(/\d+$/, '') || baseId
  return buildIndexedName(prefix, existingIds)
}

export const cloneWidgetData = (widget: BuilderWidgetInstance) => {
  if (typeof structuredClone === 'function') {
    return structuredClone(widget)
  }
  return JSON.parse(JSON.stringify(widget)) as BuilderWidgetInstance
}

export const cloneWidgetTree = (
  widget: BuilderWidgetInstance,
  existingIds: Set<string>,
  buildWidgetId: (widgetType: string, ids: Set<string>) => string = buildWidgetIdFromSet
): BuilderWidgetInstance => {
  const nextId = buildWidgetId(widget.type, existingIds)
  return {
    ...widget,
    id: nextId,
    children: widget.children?.map((child) =>
      cloneWidgetTree(child, existingIds, buildWidgetId)
    ),
  }
}

const updateEventRefsInValue = (
  value: unknown,
  oldId: string,
  newId: string
): unknown => {
  const updateEvent = (event: Record<string, unknown>) => {
    const next = { ...event }
    const keys = ['pluginId', 'componentId', 'widgetId', 'targetId']
    keys.forEach((key) => {
      if (next[key] === oldId) {
        next[key] = newId
      }
    })
    if (next.params && typeof next.params === 'object' && !Array.isArray(next.params)) {
      const params = { ...(next.params as Record<string, unknown>) }
      keys.forEach((key) => {
        if (params[key] === oldId) {
          params[key] = newId
        }
      })
      next.params = params
    }
    return next
  }

  if (Array.isArray(value)) {
    return value.map((entry) =>
      typeof entry === 'object' && entry ? updateEvent(entry as Record<string, unknown>) : entry
    )
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed)) {
        const updated = parsed.map((entry) =>
          typeof entry === 'object' && entry ? updateEvent(entry as Record<string, unknown>) : entry
        )
        return JSON.stringify(updated)
      }
    } catch {
      return value
    }
  }

  return value
}

export const updateEventRefsInTree = (
  widgets: BuilderWidgetInstance[],
  oldId: string,
  newId: string
): BuilderWidgetInstance[] => {
  return widgets.map((widget) => {
    const nextEvents =
      widget.props && 'events' in widget.props
        ? updateEventRefsInValue(widget.props.events, oldId, newId)
        : widget.props?.events
    const nextProps =
      widget.props && nextEvents !== widget.props.events
        ? { ...widget.props, events: nextEvents }
        : widget.props
    const nextChildren = widget.children
      ? updateEventRefsInTree(widget.children, oldId, newId)
      : widget.children
    if (nextProps !== widget.props || nextChildren !== widget.children) {
      return {
        ...widget,
        props: nextProps ?? {},
        children: nextChildren,
      }
    }
    return widget
  })
}

export const RESET_STATE_KEYS = new Set([
  'value',
  'checked',
  'selectedIndex',
  'selectedValue',
  'selectedValues',
  'selectedRow',
  'selectedRows',
  'activeTab',
  'activeStep',
  'currentPage',
  'page',
  'open',
  'expanded',
  'items',
  'files',
  'text',
  'rating',
  'progress',
  'date',
  'dates',
  'range',
  'start',
  'end',
  'search',
  'filters',
  'draft',
  'message',
])
