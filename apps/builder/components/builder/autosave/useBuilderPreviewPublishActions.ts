/**
 * Hook действий preview/publish: orchestration открытия preview и публикации с учетом draft state.
 */
import { useCallback } from 'react'

import { normalizeDraftSchema } from 'data/builder/builder-draft'
import type { BuilderRuntimePayload } from 'data/builder/builder-runtime'

export type BuilderPreviewRoutePayload = {
  appId: string
  projectRef?: string
  pageId?: string | null
}

type UseBuilderPreviewPublishActionsParams = {
  appId?: string
  projectRef?: string
  pageId?: string | null
  runtimePayload: BuilderRuntimePayload | null
  flushLatest: () => Promise<{ schema: BuilderRuntimePayload } | null>
  openPreviewRoute: (route: BuilderPreviewRoutePayload) => void
  publishRuntime: (payload: BuilderRuntimePayload) => void
}

type UseBuilderPreviewPublishActionsResult = {
  canPublish: boolean
  openPreview: () => Promise<void>
  confirmPublish: () => Promise<void>
}

export const useBuilderPreviewPublishActions = ({
  appId,
  projectRef,
  pageId,
  runtimePayload,
  flushLatest,
  openPreviewRoute,
  publishRuntime,
}: UseBuilderPreviewPublishActionsParams): UseBuilderPreviewPublishActionsResult => {
  const openPreview = useCallback(async () => {
    if (!appId) {
      return
    }

    if (typeof window !== 'undefined' && runtimePayload) {
      try {
        const snapshot = normalizeDraftSchema(runtimePayload, appId)
        window.sessionStorage.setItem(
          'builder-preview-route',
          JSON.stringify({
            appId,
            ref: projectRef ?? '',
            pageId: pageId ?? '',
          })
        )
        window.sessionStorage.setItem(`builder-preview-schema:${appId}`, JSON.stringify(snapshot))
        window.sessionStorage.setItem('builder-preview-schema:latest', JSON.stringify(snapshot))
      } catch {
        // Ignore snapshot serialization issues; preview will still load from backend.
      }
    }

    // Persist latest state before navigating, otherwise preview/edit roundtrips can
    // rehydrate from an older draft if autosave debounce hasn't fired yet.
    try {
      if (runtimePayload) {
        await flushLatest()
      }
    } catch {
      // Navigation should still work even if draft persistence fails.
    }

    openPreviewRoute({ appId, projectRef, pageId })
  }, [appId, flushLatest, openPreviewRoute, pageId, projectRef, runtimePayload])

  const confirmPublish = useCallback(async () => {
    if (!appId || !runtimePayload) {
      return
    }

    // Ensure the latest canvas state is persisted to the draft before publishing.
    // Otherwise a quick "add widget -> publish -> preview -> back to edit" can show an older draft.
    let publishPayload: BuilderRuntimePayload = runtimePayload
    try {
      const persisted = await flushLatest()
      if (persisted?.schema) {
        publishPayload = persisted.schema
      }
    } catch {
      // Publishing should still be possible even if draft persistence fails.
    }

    publishRuntime(publishPayload)
  }, [appId, flushLatest, publishRuntime, runtimePayload])

  return {
    canPublish: Boolean(appId && runtimePayload),
    openPreview,
    confirmPublish,
  }
}
