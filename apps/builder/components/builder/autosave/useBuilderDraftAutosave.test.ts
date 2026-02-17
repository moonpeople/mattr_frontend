/**
 * Тесты hook-а автосохранения черновика билдера.
 */
import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { BuilderDraft, BuilderDraftUpsertVariables } from 'data/builder/builder-draft'
import type { BuilderRuntimePayload } from 'data/builder/builder-runtime'
import { useBuilderDraftAutosave } from './useBuilderDraftAutosave'

vi.mock('@uidotdev/usehooks', () => ({
  useDebounce: <T,>(value: T) => value,
}))

const createRuntimePayload = (
  overrides: Partial<BuilderRuntimePayload> = {}
): BuilderRuntimePayload => ({
  appId: 'app_1',
  name: 'Test app',
  projectRef: 'project_ref',
  orgSlug: 'org_slug',
  rootScreen: 'page_1',
  pages: [
    {
      id: 'page_1',
      name: 'Main',
      access: 'auth',
      menu: null,
      layout: {},
    },
  ],
  queries: [],
  js: [],
  viewer: {
    policies: {},
  },
  ...overrides,
})

describe('useBuilderDraftAutosave', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('does not loop autosave when server returns a different canonical schema', async () => {
    const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {})
    const baselineSchema = createRuntimePayload()
    const runtimePayload = createRuntimePayload({
      viewer: { policies: { can_edit: true } },
    })
    const serverSchema = createRuntimePayload({
      viewer: { policies: {} },
    })

    const upsertDraft = vi.fn(
      async (_variables: BuilderDraftUpsertVariables): Promise<BuilderDraft> => ({
        id: 'draft_1',
        appId: 'app_1',
        schema: serverSchema,
      })
    )

    renderHook(() =>
      useBuilderDraftAutosave({
        enabled: true,
        appId: 'app_1',
        projectRef: 'project_ref',
        runtimePayload,
        draftSchema: baselineSchema,
        isDraftLoading: false,
        isPagesLoading: false,
        remotePagesCount: 1,
        localPagesCount: 1,
        isPersisting: false,
        upsertDraft,
      })
    )

    await waitFor(() => {
      expect(upsertDraft).toHaveBeenCalledTimes(1)
    })

    await act(async () => {
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(upsertDraft).toHaveBeenCalledTimes(1)
    expect(debugSpy).toHaveBeenCalled()
  })

  it('supports manual save when autosave is disabled', async () => {
    vi.spyOn(console, 'debug').mockImplementation(() => {})
    const baselineSchema = createRuntimePayload()
    const runtimePayload = createRuntimePayload({
      viewer: { policies: { can_edit: true } },
    })

    const upsertDraft = vi.fn(
      async (variables: BuilderDraftUpsertVariables): Promise<BuilderDraft> => ({
        id: 'draft_1',
        appId: 'app_1',
        schema: variables.schema,
      })
    )

    const { result } = renderHook(() =>
      useBuilderDraftAutosave({
        enabled: false,
        appId: 'app_1',
        projectRef: 'project_ref',
        runtimePayload,
        draftSchema: baselineSchema,
        isDraftLoading: false,
        isPagesLoading: false,
        remotePagesCount: 1,
        localPagesCount: 1,
        isPersisting: false,
        upsertDraft,
      })
    )

    await act(async () => {
      await Promise.resolve()
    })
    expect(upsertDraft).toHaveBeenCalledTimes(0)

    await act(async () => {
      await result.current.saveNow()
    })
    expect(upsertDraft).toHaveBeenCalledTimes(1)
  })
})
