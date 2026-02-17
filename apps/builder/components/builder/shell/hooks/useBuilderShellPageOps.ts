/**
 * Page-ops hook BuilderShell: add/delete page, save draft и обновление page/app meta.
 */
import { useCallback } from 'react'
import type { Dispatch, SetStateAction } from 'react'

import type { BuilderRuntimePayload } from 'data/builder/builder-runtime'

import type {
  BuilderAppMeta,
  BuilderMenuItem,
  BuilderPage,
  BuilderPageLayout,
  BuilderSelectedNode,
} from '../../types'
import { applyPageMain, resolvePageMainState } from '../../utils/layout-slots'

interface PageMutation {
  mutate: (variables: { appId: string; name: string }) => void
}

interface DeletePageMutation {
  mutate: (
    variables: { pageId: string; appId: string },
    options?: {
      onSuccess?: () => void
    }
  ) => void
}

interface UpdateAppMutation {
  mutate: (variables: { appId: string; name: string }) => void
}

export interface UseBuilderShellPageOpsParams {
  activeAppId?: string | null
  activeAppName?: string | null
  appName: string
  activePageId: string | null
  activePage?: BuilderPage
  pages: BuilderPage[]
  runtimePayload: BuilderRuntimePayload | null
  saveDraftNow: () => Promise<unknown>
  createPageMutation: PageMutation
  deletePageMutation: DeletePageMutation
  updateAppMutation: UpdateAppMutation
  setPages: Dispatch<SetStateAction<BuilderPage[]>>
  setActivePageId: (pageId: string | null) => void
  setSelectedNode: (node: BuilderSelectedNode | null) => void
  updatePageLayoutSlotById: (
    targetPageId: string,
    updater: (page: BuilderPage) => BuilderPage
  ) => void
}

export const useBuilderShellPageOps = ({
  activeAppId,
  activeAppName,
  appName,
  activePageId,
  activePage,
  pages,
  runtimePayload,
  saveDraftNow,
  createPageMutation,
  deletePageMutation,
  updateAppMutation,
  setPages,
  setActivePageId,
  setSelectedNode,
  updatePageLayoutSlotById,
}: UseBuilderShellPageOpsParams) => {
  const handleAddPage = useCallback(() => {
    if (!activeAppId) {
      return
    }

    createPageMutation.mutate({
      appId: activeAppId,
      name: `Page ${pages.length + 1}`,
    })
  }, [activeAppId, createPageMutation, pages.length])

  const handleDeletePage = useCallback(
    (pageId: string) => {
      if (!activeAppId) {
        return
      }

      const remainingPages = pages.filter((page) => page.id !== pageId)
      const nextActiveId =
        activePageId === pageId ? remainingPages[0]?.id ?? null : activePageId

      deletePageMutation.mutate(
        { pageId, appId: activeAppId },
        {
          onSuccess: () => {
            if (nextActiveId !== activePageId) {
              setActivePageId(nextActiveId)
            }
            if (nextActiveId) {
              setSelectedNode({ kind: 'page', pageId: nextActiveId })
            } else {
              setSelectedNode(null)
            }
          },
        }
      )
    },
    [activeAppId, activePageId, deletePageMutation, pages, setActivePageId, setSelectedNode]
  )

  const handleSaveDraft = useCallback(() => {
    if (!activeAppId) {
      return
    }

    if (appName && appName !== activeAppName) {
      updateAppMutation.mutate({ appId: activeAppId, name: appName })
    }

    if (runtimePayload) {
      void saveDraftNow().catch(() => {
        // Manual save should not break editor interactions on request failure.
      })
    }
  }, [activeAppId, activeAppName, appName, runtimePayload, saveDraftNow, updateAppMutation])

  const handleUpdateActivePage = useCallback(
    (patch: Partial<BuilderPage>) => {
      const targetPageId = activePageId ?? activePage?.id ?? pages[0]?.id
      if (!targetPageId) {
        return
      }
      updatePageLayoutSlotById(targetPageId, (page) => ({ ...page, ...patch }))
    },
    [activePage?.id, activePageId, pages, updatePageLayoutSlotById]
  )

  const handleUpdateActivePageMeta = useCallback(
    (patch: Partial<BuilderPage['pageMeta']>) => {
      const targetPageId = activePageId ?? activePage?.id ?? pages[0]?.id
      if (!targetPageId) {
        return
      }
      updatePageLayoutSlotById(targetPageId, (page) => ({
        ...page,
        pageMeta: { ...(page.pageMeta ?? {}), ...patch },
        layout: {
          ...(page.layout ?? {}),
          pageMeta: { ...(page.pageMeta ?? {}), ...patch },
        },
      }))
    },
    [activePage?.id, activePageId, pages, updatePageLayoutSlotById]
  )

  const handleUpdateAppMeta = useCallback(
    (patch: Partial<BuilderAppMeta>) => {
      setPages((prev) =>
        prev.map((page) => {
          const layout = page.layout ?? {}
          const currentMeta = (layout as { appMeta?: BuilderAppMeta }).appMeta ?? {}
          return {
            ...page,
            layout: {
              ...layout,
              appMeta: { ...currentMeta, ...patch },
            },
          }
        })
      )
    },
    [setPages]
  )

  const handleUpdateActivePageMain = useCallback(
    (patch: Partial<BuilderPageLayout['main']>) => {
      const targetPageId = activePageId ?? activePage?.id ?? pages[0]?.id
      if (!targetPageId) {
        return
      }
      updatePageLayoutSlotById(targetPageId, (page) =>
        applyPageMain(page, { ...resolvePageMainState(page), ...patch })
      )
    },
    [activePage?.id, activePageId, pages, updatePageLayoutSlotById]
  )

  const handleSelectAppSettings = useCallback(() => {
    setSelectedNode({ kind: 'app' })
  }, [setSelectedNode])

  const handleUpdateActiveMenu = useCallback(
    (items: BuilderMenuItem[]) => {
      handleUpdateActivePage({ menu: { items } })
    },
    [handleUpdateActivePage]
  )

  const handleSetRootScreen = useCallback(
    (pageId: string) => {
      setPages((prev) =>
        prev.map((page) => ({
          ...page,
          layout: { ...(page.layout ?? {}), rootScreen: pageId },
        }))
      )
    },
    [setPages]
  )

  return {
    handleAddPage,
    handleDeletePage,
    handleSaveDraft,
    handleUpdateActivePage,
    handleUpdateActivePageMeta,
    handleUpdateAppMeta,
    handleUpdateActivePageMain,
    handleSelectAppSettings,
    handleUpdateActiveMenu,
    handleSetRootScreen,
  }
}
