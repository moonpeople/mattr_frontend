/**
 * Тесты page-ops hook-а BuilderShell.
 */
import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import {
  createDefaultMainFrame,
  createEmptyPageFrames,
  type BuilderPage,
} from '../../types'
import { useBuilderShellPageOps } from './useBuilderShellPageOps'

const createPage = (id: string): BuilderPage => ({
  id,
  name: id,
  layout: {},
  pageLayout: {
    main: createDefaultMainFrame(),
    widgets: [],
    frames: createEmptyPageFrames(),
  },
  menu: null,
  pageMeta: {},
})

describe('useBuilderShellPageOps', () => {
  it('saves draft and updates app name when name changed', async () => {
    const page = createPage('page_1')
    const saveDraftNow = vi.fn(async () => undefined)
    const updateAppMutation = { mutate: vi.fn() }

    const { result } = renderHook(() =>
      useBuilderShellPageOps({
        activeAppId: 'app_1',
        activeAppName: 'Old Name',
        appName: 'New Name',
        activePageId: 'page_1',
        activePage: page,
        pages: [page],
        runtimePayload: {} as never,
        saveDraftNow,
        createPageMutation: { mutate: vi.fn() },
        deletePageMutation: { mutate: vi.fn() },
        updateAppMutation,
        setPages: vi.fn(),
        setActivePageId: vi.fn(),
        setSelectedNode: vi.fn(),
        updatePageLayoutSlotById: vi.fn(),
      })
    )

    act(() => {
      result.current.handleSaveDraft()
    })

    expect(updateAppMutation.mutate).toHaveBeenCalledWith({
      appId: 'app_1',
      name: 'New Name',
    })

    await Promise.resolve()
    expect(saveDraftNow).toHaveBeenCalledTimes(1)
  })

  it('deletes page and sets next active page in onSuccess', () => {
    const pages = [createPage('page_1'), createPage('page_2')]
    const setActivePageId = vi.fn()
    const setSelectedNode = vi.fn()

    const deletePageMutation = {
      mutate: vi.fn(
        (_variables: { pageId: string; appId: string }, options?: { onSuccess?: () => void }) => {
          options?.onSuccess?.()
        }
      ),
    }

    const { result } = renderHook(() =>
      useBuilderShellPageOps({
        activeAppId: 'app_1',
        activeAppName: 'App Name',
        appName: 'App Name',
        activePageId: 'page_1',
        activePage: pages[0],
        pages,
        runtimePayload: null,
        saveDraftNow: vi.fn(async () => undefined),
        createPageMutation: { mutate: vi.fn() },
        deletePageMutation,
        updateAppMutation: { mutate: vi.fn() },
        setPages: vi.fn(),
        setActivePageId,
        setSelectedNode,
        updatePageLayoutSlotById: vi.fn(),
      })
    )

    act(() => {
      result.current.handleDeletePage('page_1')
    })

    expect(deletePageMutation.mutate).toHaveBeenCalledWith(
      { pageId: 'page_1', appId: 'app_1' },
      expect.any(Object)
    )
    expect(setActivePageId).toHaveBeenCalledWith('page_2')
    expect(setSelectedNode).toHaveBeenCalledWith({ kind: 'page', pageId: 'page_2' })
  })
})
