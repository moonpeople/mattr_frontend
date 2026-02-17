/**
 * Тесты hook-а действий preview/publish.
 */
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { BuilderRuntimePayload } from 'data/builder/builder-runtime'
import { useBuilderPreviewPublishActions } from './useBuilderPreviewPublishActions'

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
  viewer: { policies: {} },
  ...overrides,
})

describe('useBuilderPreviewPublishActions', () => {
  beforeEach(() => {
    window.sessionStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('writes preview snapshot, flushes latest draft and opens preview route', async () => {
    const runtimePayload = createRuntimePayload()
    const flushLatest = vi.fn(async () => null)
    const openPreviewRoute = vi.fn()
    const publishRuntime = vi.fn()

    const { result } = renderHook(() =>
      useBuilderPreviewPublishActions({
        appId: 'app_1',
        projectRef: 'project_ref',
        pageId: 'page_1',
        runtimePayload,
        flushLatest,
        openPreviewRoute,
        publishRuntime,
      })
    )

    await act(async () => {
      await result.current.openPreview()
    })

    expect(flushLatest).toHaveBeenCalledTimes(1)
    expect(openPreviewRoute).toHaveBeenCalledWith({
      appId: 'app_1',
      projectRef: 'project_ref',
      pageId: 'page_1',
    })
    expect(window.sessionStorage.getItem('builder-preview-route')).toBeTruthy()
    expect(window.sessionStorage.getItem('builder-preview-schema:app_1')).toBeTruthy()
    expect(window.sessionStorage.getItem('builder-preview-schema:latest')).toBeTruthy()
  })

  it('still opens preview when draft flush fails', async () => {
    const runtimePayload = createRuntimePayload()
    const flushLatest = vi.fn(async () => {
      throw new Error('flush failed')
    })
    const openPreviewRoute = vi.fn()
    const publishRuntime = vi.fn()

    const { result } = renderHook(() =>
      useBuilderPreviewPublishActions({
        appId: 'app_1',
        projectRef: 'project_ref',
        pageId: 'page_1',
        runtimePayload,
        flushLatest,
        openPreviewRoute,
        publishRuntime,
      })
    )

    await act(async () => {
      await result.current.openPreview()
    })

    expect(flushLatest).toHaveBeenCalledTimes(1)
    expect(openPreviewRoute).toHaveBeenCalledTimes(1)
  })

  it('uses persisted schema for publish payload when available', async () => {
    const runtimePayload = createRuntimePayload()
    const persistedSchema = createRuntimePayload({
      viewer: { policies: { can_edit: true } },
    })
    const flushLatest = vi.fn(async () => ({ schema: persistedSchema }))
    const openPreviewRoute = vi.fn()
    const publishRuntime = vi.fn()

    const { result } = renderHook(() =>
      useBuilderPreviewPublishActions({
        appId: 'app_1',
        projectRef: 'project_ref',
        pageId: 'page_1',
        runtimePayload,
        flushLatest,
        openPreviewRoute,
        publishRuntime,
      })
    )

    await act(async () => {
      await result.current.confirmPublish()
    })

    expect(flushLatest).toHaveBeenCalledTimes(1)
    expect(publishRuntime).toHaveBeenCalledWith(persistedSchema)
  })
})
