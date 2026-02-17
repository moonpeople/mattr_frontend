/**
 * Тесты bootstrap hook-а BuilderShell.
 */
import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import {
  createDefaultMainFrame,
  createEmptyPageFrames,
  type BuilderPage,
} from '../../types'
import {
  type UseBuilderShellBootstrapParams,
  useBuilderShellBootstrap,
} from './useBuilderShellBootstrap'

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

const createParams = (
  overrides: Partial<UseBuilderShellBootstrapParams> = {}
): UseBuilderShellBootstrapParams => ({
  organizationSlug: null,
  selectedOrgSlug: '',
  setSelectedOrgSlug: vi.fn(),
  lastVisitedOrgSlug: '',
  organizations: [],
  appIdParam: null,
  setHeaderActionsRoot: vi.fn(),
  setViewport: vi.fn(),
  isCreateOpen: false,
  projectName: null,
  createOrgSlug: '',
  resetCreateForm: vi.fn(),
  activeAppId: null,
  activeAppName: null,
  setAppName: vi.fn(),
  setIsPublishDialogOpen: vi.fn(),
  isPagesLoading: false,
  remotePages: [],
  createPageMutation: { isPending: false, mutate: vi.fn() },
  pageCreateRequestedRef: { current: false },
  draftAppLayout: undefined,
  setAppLayout: vi.fn(),
  pages: [],
  setPages: vi.fn(),
  activePageId: null,
  setActivePageId: vi.fn(),
  selectedNode: null,
  setSelectedNode: vi.fn(),
  isPreviewing: false,
  ...overrides,
})

describe('useBuilderShellBootstrap', () => {
  it('sets selected org from last visited slug when local selection is empty', async () => {
    const setSelectedOrgSlug = vi.fn()
    const params = createParams({
      lastVisitedOrgSlug: 'org-b',
      organizations: [{ slug: 'org-a' }, { slug: 'org-b' }],
      setSelectedOrgSlug,
    })

    renderHook(() => useBuilderShellBootstrap(params))

    await waitFor(() => {
      expect(setSelectedOrgSlug).toHaveBeenCalledWith('org-b')
    })
  })

  it('auto-creates first page once when remote pages are empty', async () => {
    const mutate = vi.fn()
    const pageCreateRequestedRef = { current: false }
    const params = createParams({
      activeAppId: 'app_1',
      createPageMutation: { isPending: false, mutate },
      pageCreateRequestedRef,
    })

    const { rerender } = renderHook(() => useBuilderShellBootstrap(params))

    await waitFor(() => {
      expect(mutate).toHaveBeenCalledWith({ appId: 'app_1', name: 'Main' })
    })
    expect(pageCreateRequestedRef.current).toBe(true)

    rerender()
    expect(mutate).toHaveBeenCalledTimes(1)
  })

  it('ensures rootScreen is set when pages do not have one', async () => {
    const pageOne = createPage('page_1')
    const pageTwo = createPage('page_2')
    const setPages = vi.fn()
    const params = createParams({
      pages: [pageOne, pageTwo],
      setPages,
    })

    renderHook(() => useBuilderShellBootstrap(params))

    await waitFor(() => {
      expect(setPages).toHaveBeenCalled()
    })

    const updater = setPages.mock.calls[0][0] as (prev: BuilderPage[]) => BuilderPage[]
    const nextPages = updater([pageOne, pageTwo])
    expect((nextPages[0].layout as { rootScreen?: string }).rootScreen).toBe('page_1')
    expect((nextPages[1].layout as { rootScreen?: string }).rootScreen).toBe('page_1')
  })
})
