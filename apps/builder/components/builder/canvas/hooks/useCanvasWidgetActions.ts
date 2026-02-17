/**
 * Runtime hook действий виджетов, используемый карточками canvas и frame-виджетами.
 */
import { useCallback } from 'react'

import { resolveValue } from 'lib/builder/value-resolver'

import type { BuilderWidgetInstance } from '../../types'

type WidgetEvent = {
  event: string
  type: string
  [key: string]: unknown
}

type FrameHideMode = 'app-frame' | 'page-frame'

interface UseCanvasWidgetActionsParams {
  frameWidgetIds: Set<string>
  pageFrameIds: Set<string>
  onSetFrameWidgetHidden?: (
    widgetId: string,
    hidden: boolean,
    mode: FrameHideMode
  ) => void
}

const normalizeEvents = (value: unknown): WidgetEvent[] => {
  if (Array.isArray(value)) {
    return value as WidgetEvent[]
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) {
      return []
    }
    try {
      const parsed = JSON.parse(trimmed)
      if (Array.isArray(parsed)) {
        return parsed as WidgetEvent[]
      }
    } catch {
      return []
    }
  }

  return []
}

export const resolveHiddenValue = (value: unknown): boolean => {
  if (typeof value === 'boolean') {
    return value
  }
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true'
  }
  return true
}

export const useCanvasWidgetActions = ({
  frameWidgetIds,
  pageFrameIds,
  onSetFrameWidgetHidden,
}: UseCanvasWidgetActionsParams) => {
  const runWidgetActions = useCallback(
    (
      widget: BuilderWidgetInstance,
      eventName: string,
      payload?: Record<string, unknown>
    ) => {
      const events = normalizeEvents(widget.props?.events)
      if (events.length === 0) {
        return
      }

      for (const action of events.filter((item) => item.event === eventName)) {
        const resolved = resolveValue(action, { event: payload })
        if (!resolved || typeof resolved !== 'object') {
          continue
        }
        const actionRecord = resolved as Record<string, unknown>
        const actionType = String(actionRecord.type ?? '')
        const isControlComponent = actionType === 'controlComponent'
        const isWidgetAction = actionType === 'widget'
        if (actionType !== 'setHidden' && !isControlComponent && !isWidgetAction) {
          continue
        }

        const method = isControlComponent || isWidgetAction ? String(actionRecord.method ?? '') : 'setHidden'
        if (method !== 'setHidden') {
          continue
        }

        const targetIdRaw =
          actionRecord.componentId ??
          actionRecord.widgetId ??
          actionRecord.targetId ??
          actionRecord.pluginId
        const targetId = typeof targetIdRaw === 'string' ? targetIdRaw : null
        if (!targetId) {
          continue
        }

        const paramsRaw = actionRecord.params
        const params =
          paramsRaw && typeof paramsRaw === 'object'
            ? (paramsRaw as Record<string, unknown>)
            : undefined
        const hidden = resolveHiddenValue(actionRecord.hidden ?? params?.hidden)

        if (pageFrameIds.has(targetId)) {
          onSetFrameWidgetHidden?.(targetId, hidden, 'page-frame')
          continue
        }
        if (frameWidgetIds.has(targetId)) {
          onSetFrameWidgetHidden?.(targetId, hidden, 'app-frame')
        }
      }
    },
    [frameWidgetIds, onSetFrameWidgetHidden, pageFrameIds]
  )

  return { runWidgetActions }
}

