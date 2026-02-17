/**
 * Hook автосохранения черновика билдера: отслеживает изменения, запускает persist и синхронизирует baseline.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useDebounce } from '@uidotdev/usehooks'
import type { BuilderDraft, BuilderDraftUpsertVariables } from 'data/builder/builder-draft'
import { normalizeDraftSchema } from 'data/builder/builder-draft'
import type { BuilderRuntimePayload } from 'data/builder/builder-runtime'

import { findFirstSchemaDiff, stableStringify } from './autosave-model'

type PersistResult = {
  schema: BuilderRuntimePayload
  signature: string
}

type UseBuilderDraftAutosaveParams = {
  enabled?: boolean
  appId?: string
  projectRef?: string
  runtimePayload: BuilderRuntimePayload | null
  draftSchema?: Partial<BuilderRuntimePayload> | null
  isDraftLoading: boolean
  isPagesLoading: boolean
  remotePagesCount: number
  localPagesCount: number
  isPersisting: boolean
  upsertDraft: (variables: BuilderDraftUpsertVariables) => Promise<BuilderDraft>
}

type UseBuilderDraftAutosaveResult = {
  isSaving: boolean
  isDraftSynced: boolean
  draftStatus: string
  debouncedRuntimeSignature: string | null
  lastSavedDraftSignature: string | null
  saveNow: () => Promise<PersistResult | null>
  flushLatest: () => Promise<PersistResult | null>
}

export const useBuilderDraftAutosave = (
  params: UseBuilderDraftAutosaveParams
): UseBuilderDraftAutosaveResult => {
  const {
    enabled = true,
    appId,
    projectRef,
    runtimePayload,
    draftSchema,
    isDraftLoading,
    isPagesLoading,
    remotePagesCount,
    localPagesCount,
    isPersisting,
    upsertDraft,
  } = params

  const [lastSavedDraftSignature, setLastSavedDraftSignature] = useState<string | null>(null)
  const lastSavedDraftRef = useRef<string | null>(null)
  const lastAutosaveDebugRef = useRef<{ from: string; to: string } | null>(null)
  const lastServerMismatchDebugRef = useRef<{ client: string; server: string } | null>(null)
  const runtimePayloadRef = useRef(runtimePayload)

  const debouncedRuntimePayload = useDebounce(runtimePayload, 1200)
  const debouncedRuntimeSignature = useMemo(() => {
    if (!debouncedRuntimePayload || !appId) {
      return null
    }
    const normalized = normalizeDraftSchema(debouncedRuntimePayload, appId)
    return stableStringify(normalized)
  }, [appId, debouncedRuntimePayload])

  useEffect(() => {
    runtimePayloadRef.current = runtimePayload
  }, [runtimePayload])

  useEffect(() => {
    lastSavedDraftRef.current = null
    lastServerMismatchDebugRef.current = null
    setLastSavedDraftSignature(null)
  }, [appId])

  useEffect(() => {
    if (!appId || isDraftLoading) {
      return
    }
    if (!draftSchema) {
      return
    }
    if (lastSavedDraftRef.current !== null) {
      return
    }

    const normalized = normalizeDraftSchema(draftSchema, appId)
    const signature = stableStringify(normalized)
    lastSavedDraftRef.current = signature
    setLastSavedDraftSignature(signature)
  }, [appId, draftSchema, isDraftLoading])

  const persistPayload = useCallback(
    async (payload: BuilderRuntimePayload): Promise<PersistResult | null> => {
      if (!appId) {
        return null
      }

      const normalizedPayload = normalizeDraftSchema(payload, appId)
      const nextSignature = stableStringify(normalizedPayload)
      if (nextSignature === lastSavedDraftRef.current) {
        return {
          schema: normalizedPayload,
          signature: nextSignature,
        }
      }

      const baselineSchema = draftSchema ? normalizeDraftSchema(draftSchema, appId) : null
      if (baselineSchema) {
        const baselineSignature = stableStringify(baselineSchema)
        const debugKey = { from: baselineSignature, to: nextSignature }
        const lastDebug = lastAutosaveDebugRef.current
        if (!lastDebug || lastDebug.from !== debugKey.from || lastDebug.to !== debugKey.to) {
          lastAutosaveDebugRef.current = debugKey
          const diff = findFirstSchemaDiff(baselineSchema, normalizedPayload)
          if (diff) {
            console.debug('[builder autosave] schema diff', diff.path, diff.a, diff.b)
          } else {
            console.debug('[builder autosave] signature mismatch without structural diff')
          }
        }
      }

      const data = await upsertDraft({
        appId,
        schema: normalizedPayload,
        projectRef,
      })

      const serverSchema = normalizeDraftSchema(data.schema, appId)
      const serverSignature = stableStringify(serverSchema)
      // Use client signature as autosave baseline to prevent write loops when server
      // returns the same schema in a different canonical form.
      lastSavedDraftRef.current = nextSignature
      setLastSavedDraftSignature(nextSignature)

      if (serverSignature !== nextSignature) {
        const mismatch = { client: nextSignature, server: serverSignature }
        const lastMismatch = lastServerMismatchDebugRef.current
        if (
          !lastMismatch ||
          lastMismatch.client !== mismatch.client ||
          lastMismatch.server !== mismatch.server
        ) {
          lastServerMismatchDebugRef.current = mismatch
          const diff = findFirstSchemaDiff(normalizedPayload, serverSchema)
          if (diff) {
            console.debug('[builder autosave] server normalized schema diff', diff.path, diff.a, diff.b)
          } else {
            console.debug(
              '[builder autosave] server normalized schema signature mismatch without structural diff'
            )
          }
        }
      } else {
        lastServerMismatchDebugRef.current = null
      }

      return {
        schema: serverSchema,
        signature: nextSignature,
      }
    },
    [appId, draftSchema, projectRef, upsertDraft]
  )

  useEffect(() => {
    if (!enabled) {
      return
    }
    if (!appId || !debouncedRuntimeSignature || isPagesLoading || isDraftLoading) {
      return
    }
    if (remotePagesCount > 0 && localPagesCount === 0) {
      return
    }
    if (lastSavedDraftRef.current === null) {
      return
    }
    if (debouncedRuntimeSignature === lastSavedDraftRef.current) {
      return
    }
    if (isPersisting) {
      return
    }

    const latestPayload = runtimePayloadRef.current
    if (!latestPayload) {
      return
    }

    void persistPayload(latestPayload).catch(() => {
      // Autosave must never crash the editor session.
    })
  }, [
    enabled,
    appId,
    debouncedRuntimeSignature,
    isDraftLoading,
    isPagesLoading,
    isPersisting,
    localPagesCount,
    persistPayload,
    remotePagesCount,
  ])

  const saveNow = useCallback(async () => {
    const payload = runtimePayloadRef.current
    if (!payload) {
      return null
    }
    return persistPayload(payload)
  }, [persistPayload])

  const flushLatest = useCallback(async () => {
    const payload = runtimePayloadRef.current
    if (!payload) {
      return null
    }
    return persistPayload(payload)
  }, [persistPayload])

  const isDraftSynced =
    Boolean(debouncedRuntimeSignature) &&
    Boolean(lastSavedDraftSignature) &&
    debouncedRuntimeSignature === lastSavedDraftSignature &&
    !isDraftLoading

  const draftStatus = isPersisting ? 'Saving…' : isDraftSynced ? 'Draft saved' : ''

  return {
    isSaving: isPersisting,
    isDraftSynced,
    draftStatus,
    debouncedRuntimeSignature,
    lastSavedDraftSignature,
    saveNow,
    flushLatest,
  }
}
