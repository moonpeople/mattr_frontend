/**
 * Bootstrap-hook BuilderShell: инициализация org/ui/page состояния и синхронизация с remote pages.
 */
import { useEffect } from 'react'
import type {
  Dispatch,
  MutableRefObject,
  SetStateAction,
} from 'react'
import type { BuilderPageRecord } from 'data/builder/builder-pages'

import type {
  BuilderAppLayout,
  BuilderPage,
  BuilderSelectedNode,
} from '../../types'
import { resolveAppLayoutFromUnknown } from '../../utils/layout-model'
import { resolvePageWidgetsState } from '../../utils/layout-slots'
import { buildPageModel, resolvePageMeta } from '../layout-ops'

interface CreatePageMutation {
  isPending: boolean
  mutate: (variables: { appId: string; name: string }) => void
}

interface OrganizationRecord {
  slug: string
}

export interface UseBuilderShellBootstrapParams {
  organizationSlug?: string | null
  selectedOrgSlug: string
  setSelectedOrgSlug: Dispatch<SetStateAction<string>>
  lastVisitedOrgSlug: string
  organizations: OrganizationRecord[]
  appIdParam?: string | null
  setHeaderActionsRoot: Dispatch<SetStateAction<HTMLElement | null>>
  setViewport: Dispatch<SetStateAction<{ width: number; height: number }>>
  isCreateOpen: boolean
  projectName?: string | null
  createOrgSlug: string
  resetCreateForm: (values: { name: string; orgSlug: string }) => void
  activeAppId?: string | null
  activeAppName?: string | null
  setAppName: Dispatch<SetStateAction<string>>
  setIsPublishDialogOpen: Dispatch<SetStateAction<boolean>>
  isPagesLoading: boolean
  remotePages: BuilderPageRecord[]
  createPageMutation: CreatePageMutation
  pageCreateRequestedRef: MutableRefObject<boolean>
  draftAppLayout: unknown
  setAppLayout: Dispatch<SetStateAction<BuilderAppLayout>>
  pages: BuilderPage[]
  setPages: Dispatch<SetStateAction<BuilderPage[]>>
  activePageId: string | null
  setActivePageId: Dispatch<SetStateAction<string | null>>
  selectedNode: BuilderSelectedNode | null
  setSelectedNode: Dispatch<SetStateAction<BuilderSelectedNode | null>>
  isPreviewing: boolean
}

export const useBuilderShellBootstrap = ({
  organizationSlug,
  selectedOrgSlug,
  setSelectedOrgSlug,
  lastVisitedOrgSlug,
  organizations,
  appIdParam,
  setHeaderActionsRoot,
  setViewport,
  isCreateOpen,
  projectName,
  createOrgSlug,
  resetCreateForm,
  activeAppId,
  activeAppName,
  setAppName,
  setIsPublishDialogOpen,
  isPagesLoading,
  remotePages,
  createPageMutation,
  pageCreateRequestedRef,
  draftAppLayout,
  setAppLayout,
  pages,
  setPages,
  activePageId,
  setActivePageId,
  selectedNode,
  setSelectedNode,
  isPreviewing,
}: UseBuilderShellBootstrapParams) => {
  useEffect(() => {
    if (organizationSlug && organizationSlug !== selectedOrgSlug) {
      setSelectedOrgSlug(organizationSlug)
      return
    }
    if (selectedOrgSlug) {
      return
    }
    if (lastVisitedOrgSlug && organizations.some((org) => org.slug === lastVisitedOrgSlug)) {
      setSelectedOrgSlug(lastVisitedOrgSlug)
      return
    }
    if (organizations.length === 1) {
      setSelectedOrgSlug(organizations[0].slug)
    }
  }, [
    organizationSlug,
    selectedOrgSlug,
    setSelectedOrgSlug,
    lastVisitedOrgSlug,
    organizations,
  ])

  useEffect(() => {
    if (typeof document === 'undefined') {
      return
    }
    setHeaderActionsRoot(document.getElementById('builder-header-actions'))
  }, [appIdParam, setHeaderActionsRoot])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    const updateViewport = () => {
      setViewport({ width: window.innerWidth, height: window.innerHeight })
    }
    updateViewport()
    window.addEventListener('resize', updateViewport)
    return () => window.removeEventListener('resize', updateViewport)
  }, [setViewport])

  useEffect(() => {
    if (!isCreateOpen) {
      return
    }
    const fallbackName = projectName ? `${projectName} App` : 'New app'
    resetCreateForm({ name: fallbackName, orgSlug: createOrgSlug || '' })
  }, [createOrgSlug, isCreateOpen, projectName, resetCreateForm])

  useEffect(() => {
    if (!activeAppId || typeof activeAppName !== 'string') {
      return
    }
    setAppName(activeAppName)
  }, [activeAppId, activeAppName, setAppName])

  useEffect(() => {
    setIsPublishDialogOpen(false)
  }, [activeAppId, setIsPublishDialogOpen])

  useEffect(() => {
    if (
      !activeAppId ||
      isPagesLoading ||
      remotePages.length > 0 ||
      createPageMutation.isPending ||
      pageCreateRequestedRef.current
    ) {
      return
    }

    pageCreateRequestedRef.current = true
    createPageMutation.mutate({ appId: activeAppId, name: 'Main' })
  }, [
    activeAppId,
    isPagesLoading,
    remotePages.length,
    createPageMutation,
    pageCreateRequestedRef,
  ])

  useEffect(() => {
    if (remotePages.length === 0) {
      return
    }

    setAppLayout(resolveAppLayoutFromUnknown(draftAppLayout))

    setPages((prev) => {
      const widgetMap = new Map(
        prev.map((page) => [page.id, resolvePageWidgetsState(page)])
      )
      const menuMap = new Map(prev.map((page) => [page.id, page.menu]))
      return remotePages.map<BuilderPage>((page) => ({
        ...buildPageModel(page, widgetMap.get(page.id)),
        id: page.id,
        name: page.name,
        access: page.access ?? undefined,
        menu: (menuMap.has(page.id) ? menuMap.get(page.id) : page.menu) as BuilderPage['menu'],
        pageMeta: resolvePageMeta(page),
      }))
    })
  }, [draftAppLayout, remotePages, setAppLayout, setPages])

  useEffect(() => {
    if (!activePageId && pages.length > 0) {
      setActivePageId(pages[0].id)
    }
  }, [activePageId, pages, setActivePageId])

  useEffect(() => {
    if (!selectedNode || selectedNode.kind === 'app') {
      return
    }
    const hasSelectedPage = pages.some((page) => page.id === selectedNode.pageId)
    if (hasSelectedPage) {
      return
    }
    const fallbackPageId = activePageId ?? pages[0]?.id
    if (!fallbackPageId) {
      setSelectedNode(null)
      return
    }
    setSelectedNode({ kind: 'page', pageId: fallbackPageId })
  }, [activePageId, pages, selectedNode, setSelectedNode])

  useEffect(() => {
    if (isPreviewing) {
      setSelectedNode(null)
    }
  }, [isPreviewing, setSelectedNode])

  useEffect(() => {
    if (pages.length === 0) {
      return
    }
    const hasRootScreen = pages.some((page) => {
      const layout = page.layout as { rootScreen?: unknown } | undefined
      const rootScreen = layout?.rootScreen
      return typeof rootScreen === 'string' && pages.some((item) => item.id === rootScreen)
    })
    if (hasRootScreen) {
      return
    }
    const fallbackId = pages[0]?.id
    if (!fallbackId) {
      return
    }
    setPages((prev) =>
      prev.map((page) => ({
        ...page,
        layout: { ...(page.layout ?? {}), rootScreen: fallbackId },
      }))
    )
  }, [pages, setPages])
}
