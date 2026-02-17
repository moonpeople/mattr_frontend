/**
 * Preview/publish orchestrator для BuilderShell: autosave, переход в preview, publish и статусы.
 */
import { useCallback } from 'react'

import type { BuilderDraft, BuilderDraftUpsertVariables } from 'data/builder/builder-draft'
import type { BuilderRuntimePayload } from 'data/builder/builder-runtime'

import {
  useBuilderDraftAutosave,
  useBuilderPreviewPublishActions,
  type BuilderPreviewRoutePayload,
} from '../../autosave'

export interface BuilderShellPublishRuntimeMutationLike {
  isPending: boolean
  mutate: (
    variables: {
      appId: string
      payload: BuilderRuntimePayload
      projectRef?: string
    },
    options?: {
      onSuccess?: () => void
    }
  ) => void
}

export interface UseBuilderShellPreviewPublishOpsParams {
  autosaveEnabled: boolean
  appId?: string
  projectRef?: string
  pageId?: string | null
  runtimePayload: BuilderRuntimePayload | null
  draftSchema?: Partial<BuilderRuntimePayload> | null
  isDraftLoading: boolean
  isPagesLoading: boolean
  remotePagesCount: number
  localPagesCount: number
  isDraftPersisting: boolean
  upsertDraft: (variables: BuilderDraftUpsertVariables) => Promise<BuilderDraft>
  publishRuntimeMutation: BuilderShellPublishRuntimeMutationLike
  isAppUpdating: boolean
  setIsPreviewing: (value: boolean) => void
  setIsPublishDialogOpen: (value: boolean) => void
  router: {
    push: (input: {
      pathname: string
      query: Record<string, string>
    }) => Promise<unknown> | unknown
  }
}

export const useBuilderShellPreviewPublishOps = ({
  autosaveEnabled,
  appId,
  projectRef,
  pageId,
  runtimePayload,
  draftSchema,
  isDraftLoading,
  isPagesLoading,
  remotePagesCount,
  localPagesCount,
  isDraftPersisting,
  upsertDraft,
  publishRuntimeMutation,
  isAppUpdating,
  setIsPreviewing,
  setIsPublishDialogOpen,
  router,
}: UseBuilderShellPreviewPublishOpsParams) => {
  const autosave = useBuilderDraftAutosave({
    enabled: autosaveEnabled,
    appId,
    projectRef,
    runtimePayload,
    draftSchema,
    isDraftLoading,
    isPagesLoading,
    remotePagesCount,
    localPagesCount,
    isPersisting: isDraftPersisting,
    upsertDraft,
  })

  const openPreviewRoute = useCallback(
    ({ appId, projectRef, pageId }: BuilderPreviewRoutePayload) => {
      void router.push({
        pathname: '/preview',
        query: {
          appId,
          ...(projectRef ? { ref: projectRef } : {}),
          ...(pageId ? { pageId } : {}),
        },
      })
      setIsPreviewing(false)
    },
    [router, setIsPreviewing]
  )

  const publishRuntime = useCallback(
    (payload: BuilderRuntimePayload) => {
      if (!appId) {
        return
      }
      publishRuntimeMutation.mutate(
        {
          appId,
          payload,
          projectRef,
        },
        {
          onSuccess: () => {
            setIsPublishDialogOpen(false)
          },
        }
      )
    },
    [appId, projectRef, publishRuntimeMutation, setIsPublishDialogOpen]
  )

  const previewPublishActions = useBuilderPreviewPublishActions({
    appId,
    projectRef,
    pageId,
    runtimePayload,
    flushLatest: autosave.flushLatest,
    openPreviewRoute,
    publishRuntime,
  })

  const handleOpenPublishDialog = useCallback(() => {
    setIsPublishDialogOpen(true)
  }, [setIsPublishDialogOpen])

  const isSaving = autosave.isSaving || isAppUpdating
  const isPublishing = publishRuntimeMutation.isPending
  const canPublish = previewPublishActions.canPublish
  const isPublishDisabled = !canPublish || isPublishing
  const isPreviewDisabled = false
  const draftStatus = isSaving ? 'Saving…' : autosave.isDraftSynced ? 'Draft saved' : ''

  return {
    autosave,
    handleOpenPreview: previewPublishActions.openPreview,
    handleConfirmPublish: previewPublishActions.confirmPublish,
    handleOpenPublishDialog,
    isSaving,
    isPublishing,
    isPublishDisabled,
    isPreviewDisabled,
    draftStatus,
  }
}
