import { useEffect, useMemo, useRef, useState } from 'react'
import { BookOpen, ChevronDown, Grid, List, MoreHorizontal, Plus, Search, X } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useForm } from 'react-hook-form'
import { parseAsString, useQueryState } from 'nuqs'
import { useDebounce } from '@uidotdev/usehooks'
import type { Layout } from 'react-grid-layout'
import { useTheme } from 'next-themes'

import { LOCAL_STORAGE_KEYS, useParams, useUser } from 'common'
import { getWidgetDefinition, widgetRegistry } from 'widgets'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle as DialogTitleText,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  FormItem_Shadcn_,
  FormLabel_Shadcn_,
  FormMessage_Shadcn_,
  Form_Shadcn_,
  Input_Shadcn_,
  LogoLoader,
  ImperativePanelHandle,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  Select_Shadcn_,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  ToggleGroup,
  ToggleGroupItem,
} from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'
import { EmptyStatePresentational } from 'ui-patterns'

import { getWidgetIcon } from './BuilderSidebarItems'

import {
  useBuilderAppsQuery,
  useCreateBuilderAppMutation,
  useUpdateBuilderAppMutation,
} from 'data/builder/builder-apps'
import {
  useBuilderPagesQuery,
  useCreateBuilderPageMutation,
  useDeleteBuilderPageMutation,
} from 'data/builder/builder-pages'
import {
  useBuilderQueriesQuery,
  useCreateBuilderQueryMutation,
  useUpdateBuilderQueryMutation,
} from 'data/builder/builder-queries'
import {
  useBuilderJsQuery,
  useCreateBuilderJsMutation,
  useUpdateBuilderJsMutation,
} from 'data/builder/builder-js'
import type { BuilderPageRecord } from 'data/builder/builder-pages'
import {
  type BuilderRuntimePayload,
  buildRuntimePayload,
  useBuilderRuntimeQuery,
  usePublishBuilderRuntimeMutation,
} from 'data/builder/builder-runtime'
import { useBuilderDraftQuery, useUpsertBuilderDraftMutation } from 'data/builder/builder-draft'
import { SIDEBAR_KEYS } from 'components/layouts/ProjectLayout/LayoutSidebar/LayoutSidebarProvider'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useSidebarManagerSnapshot } from 'state/sidebar-manager-state'
import { BuilderCanvas } from './BuilderCanvas'
import { BuilderCodeOutputPanel } from './BuilderCodeOutputPanel'
import { BuilderCodeTabs, type BuilderCodeTab } from './BuilderCodeTabs'
import { BuilderCodeWorkspace } from './BuilderCodeWorkspace'
import { BuilderInspector } from './BuilderInspector'
import { BuilderOverlayInspector } from './BuilderOverlayInspector'
import { BuilderPageComponentInspector } from './BuilderPageComponentInspector'
import { BuilderPageInspector } from './BuilderPageInspector'
import { BuilderPreview } from './BuilderPreview'
import { BuilderSidebar } from './BuilderSidebar'
import { BuilderSectionMenu } from './BuilderSectionMenu'
import { BuilderToolbar } from './BuilderToolbar'
import type {
  BuilderMenuItem,
  BuilderPage,
  BuilderQueryRunResult,
  BuilderSection,
  BuilderWidgetSpacing,
  BuilderWidgetInstance,
} from './types'
import { resolveWidgetSpacing } from './types'
import {
  buildIndexedName,
  buildTransformerCode,
  setBuilderMeta,
  type BuilderCodeItemType,
  type BuilderCodeSelection,
} from './BuilderCodeUtils'
import CardButton from 'components/ui/CardButton'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import { NoOrganizationsState } from 'components/interfaces/Home/ProjectList/EmptyStates'
import { NoSearchResults } from 'components/ui/NoSearchResults'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { useProjectDetailQuery } from 'data/projects/project-detail-query'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'

// Основная оболочка билдера: состояние приложения, загрузка данных и режимы.

const GRID_ROW_HEIGHT = 8
const GRID_MARGIN = 0
const DEFAULT_JS_CODE = 'export function main() {\n  \n}\n'
const CANVAS_TAB_ID = 'canvas'

const parseBoolean = (value: unknown, fallback = false) => {
  if (typeof value === 'boolean') {
    return value
  }
  if (typeof value === 'number') {
    return value !== 0
  }
  if (typeof value === 'string') {
    const trimmed = value.trim().toLowerCase()
    if (['true', '1', 'yes', 'y'].includes(trimmed)) {
      return true
    }
    if (['false', '0', 'no', 'n'].includes(trimmed)) {
      return false
    }
  }
  return fallback
}

const buildCodeTab = (selection: BuilderCodeSelection): BuilderCodeTab | null => {
  if (!selection) {
    return null
  }
  return {
    id: `${selection.type}-${selection.id}`,
    type: selection.type,
    entityId: selection.id,
  }
}

const normalizeCodeTabs = (tabs: BuilderCodeTab[]) => {
  const withoutCanvas = tabs.filter((tab) => tab.id !== CANVAS_TAB_ID)
  return [{ id: CANVAS_TAB_ID, type: 'canvas' }, ...withoutCanvas]
}

const parseLocalStorageValues = () => {
  if (typeof window === 'undefined') {
    return {}
  }
  const values: Record<string, unknown> = {}
  for (let i = 0; i < window.localStorage.length; i += 1) {
    const key = window.localStorage.key(i)
    if (!key) {
      continue
    }
    const raw = window.localStorage.getItem(key)
    if (raw === null) {
      values[key] = null
      continue
    }
    try {
      values[key] = JSON.parse(raw)
    } catch {
      values[key] = raw
    }
  }
  return values
}

const parseUrlParams = (params: URLSearchParams) => {
  const result: Record<string, string> = {}
  params.forEach((value, key) => {
    result[key] = value
  })
  return result
}

const parseHashParams = (hash: string) => {
  const cleaned = hash.startsWith('#') ? hash.slice(1) : hash
  if (!cleaned) {
    return {}
  }
  return parseUrlParams(new URLSearchParams(cleaned))
}

export const BuilderShell = () => {
  const pageCreateRequested = useRef(false)
  const sidebarPanelRef = useRef<ImperativePanelHandle>(null)
  const sidebarPreviousSizeRef = useRef<number | null>(null)
  const inspectorPanelRef = useRef<ImperativePanelHandle>(null)
  const renameInputRef = useRef<HTMLInputElement | null>(null)
  const lastSavedDraftRef = useRef<string | null>(null)
  const [lastSavedDraftSignature, setLastSavedDraftSignature] = useState<string | null>(null)

  const { ref: projectRef, appId: appIdParam } = useParams()
  const router = useRouter()
  const { data: organization } = useSelectedOrganizationQuery()
  const { data: organizations = [], isPending: isOrganizationsLoading } = useOrganizationsQuery()
  const { openSidebar } = useSidebarManagerSnapshot()
  const user = useUser()
  const { resolvedTheme } = useTheme()

  const [appName, setAppName] = useState('New interface')
  const [pages, setPages] = useState<BuilderPage[]>([])
  const [activePageId, setActivePageId] = useState<string | null>(null)
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null)
  const [selectedGlobalWidgetId, setSelectedGlobalWidgetId] = useState<string | null>(null)
  const [selectedPageComponent, setSelectedPageComponent] = useState(false)
  const [inspectorAddonPanel, setInspectorAddonPanel] = useState<{
    widgetId: string
    key: string
    label: string
  } | null>(null)
  const [inspectorMenuOpen, setInspectorMenuOpen] = useState(false)
  const [inspectorSearch, setInspectorSearch] = useState('')
  const [isPreviewing, setIsPreviewing] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [lastQueryRun, setLastQueryRun] = useState<BuilderQueryRunResult | null>(null)
  const [queryRuns, setQueryRuns] = useState<Record<string, BuilderQueryRunResult>>({})
  const [viewport, setViewport] = useState({ width: 0, height: 0 })
  const [activeSection, setActiveSection] = useState<BuilderSection | null>('components')
  const [globalWidgets, setGlobalWidgets] = useState<BuilderWidgetInstance[]>([])
  const [search, setSearch] = useQueryState('search', parseAsString.withDefault(''))
  const debouncedSearch = useDebounce(search, 300)
  const [viewMode, setViewMode] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.BUILDER_APPS_VIEW,
    'grid'
  )
  const [lastVisitedOrgSlug] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.LAST_VISITED_ORGANIZATION,
    ''
  )
  const [selectedOrgSlug, setSelectedOrgSlug] = useState<string>('')
  const [showGrid, setShowGrid] = useState(true)
  const [showSidebar, setShowSidebar] = useState(true)
  const [showInspector, setShowInspector] = useState(true)
  const [widgetClipboard, setWidgetClipboard] = useState<{
    widget: BuilderWidgetInstance
    mode: 'copy' | 'cut'
  } | null>(null)
  const [isRenamingWidget, setIsRenamingWidget] = useState(false)
  const [renameDraft, setRenameDraft] = useState('')
  const [codeSelection, setCodeSelection] = useState<BuilderCodeSelection>(null)
  const [codeTabs, setCodeTabs] = useState<BuilderCodeTab[]>([
    { id: CANVAS_TAB_ID, type: 'canvas' },
  ])
  const [activeCodeTabId, setActiveCodeTabId] = useState(CANVAS_TAB_ID)
  const isCodeMode = activeSection === 'code'
  const isCodeTabActive = isCodeMode && activeCodeTabId !== CANVAS_TAB_ID
  const createOrgSlug = organization?.slug ?? selectedOrgSlug

  useEffect(() => {
    if (organization?.slug && organization.slug !== selectedOrgSlug) {
      setSelectedOrgSlug(organization.slug)
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
  }, [organization?.slug, selectedOrgSlug, lastVisitedOrgSlug, organizations])
  const inspectorOpen = (isCodeMode ? isCodeTabActive || showInspector : showInspector) && !isPreviewing
  const isSettingsSection = activeSection === 'settings'

  // Держим ресайз-панели синхронными с флагами видимости.
  useEffect(() => {
    if (showSidebar) {
      sidebarPanelRef.current?.expand()
    } else {
      sidebarPanelRef.current?.collapse()
    }
  }, [showSidebar])

  useEffect(() => {
    if (inspectorOpen) {
      inspectorPanelRef.current?.expand()
    } else {
      inspectorPanelRef.current?.collapse()
    }
  }, [inspectorOpen])

  useEffect(() => {
    if (!showSidebar) {
      return
    }
    const panel = sidebarPanelRef.current
    if (!panel) {
      return
    }
    if (isSettingsSection) {
      if (sidebarPreviousSizeRef.current === null) {
        sidebarPreviousSizeRef.current = panel.getSize()
      }
      panel.resize(40)
      panel.expand()
      return
    }
    if (sidebarPreviousSizeRef.current !== null) {
      panel.resize(sidebarPreviousSizeRef.current)
      sidebarPreviousSizeRef.current = null
    }
  }, [isSettingsSection, showSidebar])

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
  }, [])

  useEffect(() => {
    if (!inspectorAddonPanel) {
      return
    }
    if (
      inspectorAddonPanel.widgetId !== selectedWidgetId ||
      selectedGlobalWidgetId ||
      selectedPageComponent
    ) {
      setInspectorAddonPanel(null)
    }
  }, [inspectorAddonPanel, selectedWidgetId, selectedGlobalWidgetId, selectedPageComponent])

  // Запрашиваем приложения, страницы и связанные данные билдера.
  const { data: apps = [], isLoading: isAppsLoading } = useBuilderAppsQuery({ projectRef })
  const createAppMutation = useCreateBuilderAppMutation()
  const updateAppMutation = useUpdateBuilderAppMutation()

  const activeApp = useMemo(() => {
    if (!appIdParam) {
      return undefined
    }
    return apps.find((app) => app.id === appIdParam) ?? apps[0]
  }, [apps, appIdParam])
  const activeAppId = activeApp?.id
  const activeProjectRef = activeApp?.projectRef ?? projectRef
  const { data: project } = useProjectDetailQuery(
    { ref: activeProjectRef },
    { enabled: Boolean(activeProjectRef) }
  )

  const { data: draftData, isLoading: isDraftLoading } = useBuilderDraftQuery(
    { appId: activeAppId, projectRef: activeProjectRef },
    { enabled: Boolean(activeAppId) }
  )

  const { data: remotePagesData, isLoading: isPagesLoading } = useBuilderPagesQuery(
    { appId: activeAppId, projectRef: activeProjectRef },
    { enabled: Boolean(activeAppId) }
  )
  const remotePages = useMemo(() => remotePagesData ?? [], [remotePagesData])
  const createPageMutation = useCreateBuilderPageMutation({
    onSuccess: (page) => {
      setActivePageId(page.id)
      setSelectedWidgetId(null)
    },
  })
  const deletePageMutation = useDeleteBuilderPageMutation()
  const publishRuntimeMutation = usePublishBuilderRuntimeMutation()
  const upsertDraftMutation = useUpsertBuilderDraftMutation()
  const { data: queriesData } = useBuilderQueriesQuery(
    { appId: activeAppId, projectRef: activeProjectRef },
    { enabled: Boolean(activeAppId) }
  )
  const queries = useMemo(() => queriesData ?? [], [queriesData])
  const createQueryMutation = useCreateBuilderQueryMutation()
  const updateQueryMutation = useUpdateBuilderQueryMutation()
  const { data: jsFunctionsData } = useBuilderJsQuery(
    { appId: activeAppId, projectRef: activeProjectRef },
    { enabled: Boolean(activeAppId) }
  )
  const jsFunctions = useMemo(() => jsFunctionsData ?? [], [jsFunctionsData])
  const createJsMutation = useCreateBuilderJsMutation()
  const updateJsMutation = useUpdateBuilderJsMutation()
  const { data: runtimeData } = useBuilderRuntimeQuery(
    { appId: activeAppId, projectRef: activeProjectRef },
    { enabled: isPreviewing && Boolean(activeAppId) }
  )

  const createForm = useForm<{ name: string; orgSlug: string }>({
    defaultValues: { name: '', orgSlug: '' },
  })
  const formOrgSlug = createForm.watch('orgSlug')

  useEffect(() => {
    if (!isCreateOpen) {
      return
    }
    const fallbackName = project?.name ? `${project.name} App` : 'New app'
    createForm.reset({ name: fallbackName, orgSlug: createOrgSlug || '' })
  }, [createForm, isCreateOpen, project?.name, createOrgSlug])

  useEffect(() => {
    if (!activeApp?.id) {
      return
    }
    setAppName(activeApp.name)
  }, [activeApp?.id, activeApp?.name])

  useEffect(() => {
    setLastQueryRun(null)
    setQueryRuns({})
  }, [activeAppId])

  useEffect(() => {
    setCodeTabs([{ id: CANVAS_TAB_ID, type: 'canvas' }])
    setActiveCodeTabId(CANVAS_TAB_ID)
    setCodeSelection(null)
  }, [activeAppId])

  useEffect(() => {
    lastSavedDraftRef.current = null
    setLastSavedDraftSignature(null)
  }, [activeAppId])

  useEffect(() => {
    if (
      !activeAppId ||
      isPagesLoading ||
      remotePages.length > 0 ||
      createPageMutation.isPending ||
      pageCreateRequested.current
    ) {
      return
    }

    pageCreateRequested.current = true
    createPageMutation.mutate({ appId: activeAppId, name: 'Main' })
  }, [activeAppId, createPageMutation, isPagesLoading, remotePages.length])

  useEffect(() => {
    if (remotePages.length === 0) {
      return
    }

    const globals = extractGlobalWidgets(remotePages)
    setGlobalWidgets(globals)

    setPages((prev) => {
      const widgetMap = new Map(prev.map((page) => [page.id, page.widgets]))
      const menuMap = new Map(prev.map((page) => [page.id, page.menu]))
      return remotePages.map((page) => ({
        id: page.id,
        name: page.name,
        access: page.access,
        layout: {
          ...(page.layout ?? {}),
          globals,
        },
        menu: menuMap.has(page.id) ? menuMap.get(page.id) ?? page.menu ?? null : page.menu ?? null,
        widgets: resolvePageWidgets(page, widgetMap.get(page.id)),
        pageMeta: resolvePageMeta(page),
        pageComponent: resolvePageComponent(page),
        pageGlobals: resolvePageGlobals(page),
      }))
    })
  }, [remotePages])

  useEffect(() => {
    if (!activePageId && pages.length > 0) {
      setActivePageId(pages[0].id)
    }
  }, [activePageId, pages])

  useEffect(() => {
    if (isPreviewing) {
      setSelectedWidgetId(null)
      setSelectedGlobalWidgetId(null)
      setSelectedPageComponent(false)
    }
  }, [isPreviewing])

  const activePage = useMemo(
    () => pages.find((page) => page.id === activePageId) ?? pages[0],
    [pages, activePageId]
  )
  const rootScreenId = useMemo(() => {
    const rootPage = pages.find((page) => {
      const layout = page.layout as { rootScreen?: unknown } | undefined
      return typeof layout?.rootScreen === 'string'
    })
    const layout = rootPage?.layout as { rootScreen?: string } | undefined
    const candidate = layout?.rootScreen
    if (candidate && pages.some((page) => page.id === candidate)) {
      return candidate
    }
    return pages[0]?.id ?? null
  }, [pages])

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
  }, [pages])

  useEffect(() => {
    if (!codeSelection) {
      return
    }
    if (
      (codeSelection.type === 'query' || codeSelection.type === 'variable') &&
      !queries.some((query) => query.id === codeSelection.id)
    ) {
      setCodeSelection(null)
      return
    }
    if (
      codeSelection.type === 'transformer' &&
      !jsFunctions.some((func) => func.id === codeSelection.id)
    ) {
      setCodeSelection(null)
    }
  }, [codeSelection, jsFunctions, queries])

  useEffect(() => {
    const tab = buildCodeTab(codeSelection)
    if (!tab) {
      return
    }
    setCodeTabs((prev) => (prev.some((item) => item.id === tab.id) ? prev : [...prev, tab]))
    setActiveCodeTabId(tab.id)
  }, [codeSelection])

  useEffect(() => {
    setCodeTabs((prev) => {
      const next = prev.filter((tab) => {
        if (tab.type === 'canvas') {
          return true
        }
        if (tab.type === 'transformer') {
          return jsFunctions.some((func) => func.id === tab.entityId)
        }
        return queries.some((query) => query.id === tab.entityId)
      })
      const normalized = normalizeCodeTabs(next)
      if (normalized.length === prev.length) {
        const unchanged = normalized.every((tab, index) => {
          const current = prev[index]
          return (
            current &&
            tab.id === current.id &&
            tab.type === current.type &&
            tab.entityId === current.entityId
          )
        })
        if (unchanged) {
          return prev
        }
      }
      return normalized
    })
  }, [jsFunctions, queries])

  useEffect(() => {
    if (codeTabs.some((tab) => tab.id === activeCodeTabId)) {
      return
    }
    const fallback = codeTabs[codeTabs.length - 1]?.id ?? CANVAS_TAB_ID
    setActiveCodeTabId(fallback)
    const fallbackTab = codeTabs.find((tab) => tab.id === fallback)
    if (!fallbackTab || fallbackTab.type === 'canvas') {
      setCodeSelection(null)
      return
    }
    setCodeSelection({ type: fallbackTab.type, id: fallbackTab.entityId ?? '' })
  }, [activeCodeTabId, codeTabs])

  const selectedWidget = selectedGlobalWidgetId
    ? findWidgetById(
        activePage?.pageGlobals?.some((widget) => widget.id === selectedGlobalWidgetId)
          ? activePage.pageGlobals ?? []
          : globalWidgets,
        selectedGlobalWidgetId
      )
    : activePage && selectedWidgetId
      ? findWidgetById(activePage.widgets, selectedWidgetId)
      : null
  const selectedWidgetMode: 'page' | 'global' | 'page-global' | null = selectedGlobalWidgetId
    ? activePage?.pageGlobals?.some((widget) => widget.id === selectedGlobalWidgetId)
      ? 'page-global'
      : 'global'
    : selectedWidgetId
      ? 'page'
      : null
  const SelectedWidgetIcon = selectedWidget ? getWidgetIcon(selectedWidget.type) : null
  const selectedDefinition = selectedWidget ? getWidgetDefinition(selectedWidget.type) : undefined
  const activeAddonPanel =
    inspectorAddonPanel && inspectorAddonPanel.widgetId === selectedWidgetId
      ? inspectorAddonPanel
      : null
  const isAddonPanelActive = Boolean(activeAddonPanel && selectedWidget)
  const isOverlayWidget =
    selectedWidget?.type === 'GlobalDrawer' || selectedWidget?.type === 'GlobalModal'
  const overlayMode = selectedWidget?.type === 'GlobalDrawer' ? 'drawer' : 'modal'
  const overlayWidgetMode =
    selectedWidgetMode === 'global' || selectedWidgetMode === 'page-global'
      ? selectedWidgetMode
      : null
  const isInspectorSearchEnabled = Boolean(selectedWidget && selectedDefinition)
  const hasClipboardWidget = Boolean(widgetClipboard)

  useEffect(() => {
    setIsRenamingWidget(false)
    setRenameDraft(selectedWidget?.id ?? '')
  }, [selectedWidget?.id])

  useEffect(() => {
    if (!isRenamingWidget) {
      return
    }
    const frame = window.requestAnimationFrame(() => {
      renameInputRef.current?.focus()
      renameInputRef.current?.select()
    })
    return () => window.cancelAnimationFrame(frame)
  }, [isRenamingWidget])

  useEffect(() => {
    if (!isInspectorSearchEnabled) {
      setInspectorSearch('')
    }
  }, [isInspectorSearchEnabled])
  const runtimePayload = useMemo(
    () =>
      activeApp
        ? buildRuntimePayload(activeApp, pages, queries, jsFunctions, globalWidgets)
        : null,
    [activeApp, pages, queries, jsFunctions, globalWidgets]
  )
  const runtimeSignature = useMemo(
    () => (runtimePayload ? JSON.stringify(runtimePayload) : null),
    [runtimePayload]
  )
  const debouncedRuntimeSignature = useDebounce(runtimeSignature, 1200)
  const runtimePayloadRef = useRef(runtimePayload)
  const pendingDraftSaveRef = useRef(false)

  useEffect(() => {
    runtimePayloadRef.current = runtimePayload
  }, [runtimePayload])

  useEffect(() => {
    if (!activeAppId || !debouncedRuntimeSignature || isPagesLoading || isDraftLoading) {
      return
    }
    if (debouncedRuntimeSignature === lastSavedDraftRef.current) {
      return
    }
    if (upsertDraftMutation.isPending) {
      pendingDraftSaveRef.current = true
      return
    }

    const persistDraft = (payload: BuilderRuntimePayload) => {
      const nextSignature = JSON.stringify(payload)
      if (nextSignature === lastSavedDraftRef.current) {
        return
      }
      upsertDraftMutation.mutate(
        { appId: activeAppId, schema: payload, projectRef: activeProjectRef },
        {
          onSuccess: () => {
            lastSavedDraftRef.current = nextSignature
            setLastSavedDraftSignature(nextSignature)
            if (pendingDraftSaveRef.current) {
              pendingDraftSaveRef.current = false
              const latestPayload = runtimePayloadRef.current
              if (!latestPayload) {
                return
              }
              const latestSignature = JSON.stringify(latestPayload)
              if (latestSignature !== lastSavedDraftRef.current) {
                persistDraft(latestPayload)
              }
            }
          },
        }
      )
    }

    const latestPayload = runtimePayloadRef.current
    if (!latestPayload) {
      return
    }
    persistDraft(latestPayload)
  }, [
    activeAppId,
    activeProjectRef,
    debouncedRuntimeSignature,
    isDraftLoading,
    isPagesLoading,
    upsertDraftMutation,
  ])

  useEffect(() => {
    if (!runtimePayload || isDraftLoading) {
      return
    }
    if (draftData?.updatedAt && lastSavedDraftRef.current === null) {
      if (remotePages.length > 0 && pages.length === 0) {
        return
      }
      const signature = JSON.stringify(runtimePayload)
      lastSavedDraftRef.current = signature
      setLastSavedDraftSignature(signature)
    }
  }, [draftData?.updatedAt, isDraftLoading, pages.length, remotePages.length, runtimePayload])

  useEffect(() => {
    if (typeof document === 'undefined') {
      return
    }
    if (!selectedWidgetId && !selectedGlobalWidgetId && !selectedPageComponent) {
      return
    }
    const activeElement = document.activeElement as HTMLElement | null
    if (!activeElement) {
      return
    }
    if (
      activeElement.tagName === 'INPUT' ||
      activeElement.tagName === 'TEXTAREA' ||
      activeElement.tagName === 'SELECT' ||
      activeElement.isContentEditable
    ) {
      activeElement.blur()
    }
  }, [selectedWidgetId, selectedGlobalWidgetId, selectedPageComponent])
  const localPolicyKeys = useMemo(
    () => collectPolicyKeys(pages, globalWidgets),
    [pages, globalWidgets]
  )
  const previewPolicies = useMemo(() => {
    const policies = runtimeData?.viewer?.policies
    if (!policies) {
      return undefined
    }
    const policyKeys = Object.keys(policies)
    if (policyKeys.length === 0) {
      return undefined
    }
    const coversAll = localPolicyKeys.every((key) => key in policies)
    return coversAll ? policies : undefined
  }, [runtimeData, localPolicyKeys])
  const eventTargets = useMemo(() => {
    const allWidgets = [
      ...flattenWidgets(globalWidgets),
      ...flattenWidgets(activePage?.pageGlobals ?? []),
      ...flattenWidgets(activePage?.widgets ?? []),
    ]
    return allWidgets.map((widget) => {
      const widgetDefinition = getWidgetDefinition(widget.type)
      return {
        id: widget.id,
        label: `${widget.id} (${widgetDefinition?.label ?? widget.type})`,
        type: widget.type,
      }
    })
  }, [activePage?.pageGlobals, activePage?.widgets, globalWidgets])
  const eventQueries = useMemo(
    () =>
      queries
        .filter((query) => query.type !== 'variable')
        .map((query) => ({
          id: query.id,
          label: query.name || query.id,
        })),
    [queries]
  )
  const eventVariables = useMemo(
    () =>
      queries
        .filter((query) => query.type === 'variable')
        .map((query) => ({
          id: query.name || query.id,
          label: query.name || query.id,
        })),
    [queries]
  )
  const eventScripts = useMemo(
    () =>
      jsFunctions.map((func) => ({
        id: func.id,
        label: func.name || func.id,
      })),
    [jsFunctions]
  )
  const eventPages = useMemo(
    () =>
      pages.map((page) => ({
        id: page.id,
        label: page.name || page.pageMeta?.title || page.id,
      })),
    [pages]
  )
  const eventApps = useMemo(
    () =>
      apps.map((app) => ({
        id: app.id,
        label: app.name || app.id,
      })),
    [apps]
  )
  const runningQueries = useMemo(
    () =>
      queries
        .filter((query) => queryRuns[query.id]?.status === 'running')
        .map((query) => query.name || query.id),
    [queries, queryRuns]
  )
  const queryResults = useMemo(() => {
    const results: Record<string, { data?: unknown; isFetching?: boolean }> = {}
    queries.forEach((query) => {
      const run = queryRuns[query.id]
      const entry = { data: run?.data ?? null, isFetching: run?.status === 'running' }
      results[query.id] = entry
      if (query.name) {
        results[query.name] = entry
      }
    })
    return results
  }, [queries, queryRuns])
  const localStorageValues = useMemo(() => parseLocalStorageValues(), [activePageId, queryRuns])
  const locationState = useMemo(() => {
    if (typeof window === 'undefined') {
      return { href: '', searchParams: {}, hashParams: {} }
    }
    return {
      href: window.location.href,
      searchParams: parseUrlParams(new URLSearchParams(window.location.search)),
      hashParams: parseHashParams(window.location.hash),
    }
  }, [router.asPath])
  const themeState = useMemo(() => {
    if (typeof window === 'undefined') {
      return { mode: resolvedTheme ?? '', primary: '', surfacePrimary: '' }
    }
    const styles = getComputedStyle(document.documentElement)
    return {
      mode: resolvedTheme ?? '',
      primary: styles.getPropertyValue('--colors-brand-500')?.trim() ?? '',
      surfacePrimary: styles.getPropertyValue('--colors-surface-100')?.trim() ?? '',
    }
  }, [resolvedTheme])
  const currentUser = useMemo(() => (user ? { ...user } : null), [user])
  const widgetValues = useMemo(() => {
    const allWidgets = [
      ...flattenWidgets(globalWidgets),
      ...flattenWidgets(activePage?.pageGlobals ?? []),
      ...flattenWidgets(activePage?.widgets ?? []),
    ]
    const values: Record<string, Record<string, unknown>> = {}
    allWidgets.forEach((widget) => {
      const definition = getWidgetDefinition(widget.type)
      const defaultProps = definition?.defaultProps ?? {}
      values[widget.id] = {
        id: widget.id,
        type: widget.type,
        ...defaultProps,
        ...(widget.props ?? {}),
        hidden: parseBoolean(widget.hidden, false),
        visibleWhen: widget.visibleWhen ?? '',
        disabledWhen: widget.disabledWhen ?? '',
      }
    })
    return values
  }, [activePage?.pageGlobals, activePage?.widgets, globalWidgets])
  const canvasEvaluationContext = useMemo(() => {
    const allWidgets = [
      ...flattenWidgets(globalWidgets),
      ...flattenWidgets(activePage?.pageGlobals ?? []),
      ...flattenWidgets(activePage?.widgets ?? []),
    ]
    const widgetContext: Record<string, Record<string, unknown>> = {}
    allWidgets.forEach((widget) => {
      widgetContext[widget.id] = {
        ...(widget.props ?? {}),
      }
    })

    const queryContext: Record<string, { data?: unknown; isFetching?: boolean }> = {}
    queries.forEach((query) => {
      const result = queryResults[query.id]
      const entry = { data: result?.data ?? null, isFetching: result?.isFetching ?? false }
      queryContext[query.id] = entry
      if (query.name) {
        queryContext[query.name] = entry
      }
    })

    const stateContext = Object.fromEntries(
      eventVariables.map((variable) => [
        variable.id,
        queryResults[variable.id]?.data ?? null,
      ])
    )
    const scriptContext = Object.fromEntries(
      jsFunctions.map((script) => [script.name || script.id, () => undefined])
    )
    const pageNames = pages.map((page) => page.name || page.id)
    const currentPage = activePage?.name ?? activePage?.id ?? pageNames[0] ?? ''
    const appName = activeApp?.name ?? ''

    return {
      state: stateContext,
      widgets: widgetContext,
      queries: queryContext,
      auth: currentUser ? { user: currentUser } : {},
      current_user: currentUser ?? {},
      localStorage: localStorageValues,
      theme: themeState,
      location: locationState,
      viewport,
      retoolContext: {
        appName,
        currentPage,
        environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? 'local',
        inEditorMode: true,
        pages: pageNames,
        runningQueries,
        translations: {},
      },
      ...widgetContext,
      ...queryContext,
      ...scriptContext,
    }
  }, [
    activeApp?.name,
    activePage?.name,
    activePage?.pageGlobals,
    activePage?.widgets,
    currentUser,
    eventVariables,
    globalWidgets,
    jsFunctions,
    localStorageValues,
    locationState,
    pages,
    queryResults,
    queries,
    runningQueries,
    themeState,
    viewport,
  ])
  const normalizedSearch = debouncedSearch.trim().toLowerCase()
  const filteredApps = useMemo(() => {
    if (!normalizedSearch) {
      return apps
    }
    return apps.filter((app) => {
      const value = `${app.name ?? ''} ${app.id ?? ''} ${app.projectRef ?? ''} ${app.orgSlug ?? ''}`
      return value.toLowerCase().includes(normalizedSearch)
    })
  }, [apps, normalizedSearch])
  const sortedApps = useMemo(
    () => [...filteredApps].sort((a, b) => a.name.localeCompare(b.name)),
    [filteredApps]
  )
  const noSearchResults = normalizedSearch.length > 0 && sortedApps.length === 0

  const collectWidgetIds = (
    widgets: BuilderWidgetInstance[],
    ids: Set<string>
  ) => {
    widgets.forEach((widget) => {
      ids.add(widget.id)
      if (widget.children && widget.children.length > 0) {
        collectWidgetIds(widget.children, ids)
      }
    })
  }

  const getExistingWidgetIds = () => {
    const ids = new Set<string>()
    pages.forEach((page) => {
      collectWidgetIds(page.widgets, ids)
      if (page.pageGlobals && page.pageGlobals.length > 0) {
        collectWidgetIds(page.pageGlobals, ids)
      }
    })
    collectWidgetIds(globalWidgets, ids)
    return ids
  }

  const toLowerCamel = (value: string) => {
    if (!value) {
      return 'widget'
    }
    return value[0].toLowerCase() + value.slice(1)
  }

  const buildWidgetId = (widgetType: string, existingIds?: Set<string>) => {
    const ids = existingIds ?? getExistingWidgetIds()
    const base = toLowerCamel(widgetType)
    const nextId = buildIndexedName(base, ids)
    ids.add(nextId)
    return nextId
  }

  const normalizeWidgetIdInput = (value: string) => {
    const trimmed = value.trim()
    if (!trimmed) {
      return 'widget'
    }
    const parts = trimmed.split(/[^a-zA-Z0-9]+/).filter(Boolean)
    if (parts.length === 0) {
      return 'widget'
    }
    const [first, ...rest] = parts
    let result =
      first.slice(0, 1).toLowerCase() + first.slice(1) +
      rest.map((part) => part.slice(0, 1).toUpperCase() + part.slice(1)).join('')
    if (/^[0-9]/.test(result)) {
      result = `widget${result}`
    }
    return result
  }

  const ensureUniqueWidgetId = (baseId: string, existingIds: Set<string>) => {
    if (!existingIds.has(baseId)) {
      return baseId
    }
    const prefix = baseId.replace(/\d+$/, '') || baseId
    return buildIndexedName(prefix, existingIds)
  }

  const cloneWidgetData = (widget: BuilderWidgetInstance) => {
    if (typeof structuredClone === 'function') {
      return structuredClone(widget)
    }
    return JSON.parse(JSON.stringify(widget)) as BuilderWidgetInstance
  }

  const cloneWidgetTree = (
    widget: BuilderWidgetInstance,
    existingIds: Set<string>
  ): BuilderWidgetInstance => {
    const nextId = buildWidgetId(widget.type, existingIds)
    return {
      ...widget,
      id: nextId,
      children: widget.children?.map((child) => cloneWidgetTree(child, existingIds)),
    }
  }

  const updateEventRefsInValue = (
    value: unknown,
    oldId: string,
    newId: string
  ): unknown => {
    const updateEvent = (event: Record<string, unknown>) => {
      const next = { ...event }
      const keys = ['pluginId', 'componentId', 'widgetId', 'targetId']
      keys.forEach((key) => {
        if (next[key] === oldId) {
          next[key] = newId
        }
      })
      if (next.params && typeof next.params === 'object' && !Array.isArray(next.params)) {
        const params = { ...(next.params as Record<string, unknown>) }
        keys.forEach((key) => {
          if (params[key] === oldId) {
            params[key] = newId
          }
        })
        next.params = params
      }
      return next
    }

    if (Array.isArray(value)) {
      return value.map((entry) =>
        typeof entry === 'object' && entry ? updateEvent(entry as Record<string, unknown>) : entry
      )
    }

    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value)
        if (Array.isArray(parsed)) {
          const updated = parsed.map((entry) =>
            typeof entry === 'object' && entry ? updateEvent(entry as Record<string, unknown>) : entry
          )
          return JSON.stringify(updated)
        }
      } catch {
        return value
      }
    }

    return value
  }

  const updateEventRefsInTree = (
    widgets: BuilderWidgetInstance[],
    oldId: string,
    newId: string
  ): BuilderWidgetInstance[] => {
    return widgets.map((widget) => {
      const nextEvents =
        widget.props && 'events' in widget.props
          ? updateEventRefsInValue(widget.props.events, oldId, newId)
          : widget.props?.events
      const nextProps =
        widget.props && nextEvents !== widget.props.events
          ? { ...widget.props, events: nextEvents }
          : widget.props
      const nextChildren = widget.children
        ? updateEventRefsInTree(widget.children, oldId, newId)
        : widget.children
      if (nextProps !== widget.props || nextChildren !== widget.children) {
        return {
          ...widget,
          props: nextProps ?? {},
          children: nextChildren,
        }
      }
      return widget
    })
  }

  const RESET_STATE_KEYS = new Set([
    'value',
    'checked',
    'selectedIndex',
    'selectedValue',
    'selectedValues',
    'selectedRow',
    'selectedRows',
    'activeTab',
    'activeStep',
    'currentPage',
    'page',
    'open',
    'expanded',
    'items',
    'files',
    'text',
    'rating',
    'progress',
    'date',
    'dates',
    'range',
    'start',
    'end',
    'search',
    'filters',
    'draft',
    'message',
  ])

  const handleAddWidget = (widgetType: string) => {
    const definition = getWidgetDefinition(widgetType)
    if (!definition) {
      return
    }

    const spacing = resolveWidgetSpacing(widgetType)
    const targetPageId = activePageId ?? activePage?.id ?? pages[0]?.id
    if (!targetPageId) {
      return
    }

    const widgetId = buildWidgetId(widgetType)
    const newWidget: BuilderWidgetInstance = {
      id: widgetId,
      type: widgetType,
      props: { ...definition.defaultProps },
      layout: undefined,
      spacing,
      policy: [],
      visibleWhen: '',
      disabledWhen: '',
    }

    const selectedParent =
      selectedWidgetId && activePage ? findWidgetById(activePage.widgets, selectedWidgetId) : null
    const parentDefinition = selectedParent
      ? getWidgetDefinition(selectedParent.type)
      : undefined
    const shouldNest = Boolean(selectedParent && parentDefinition?.supportsChildren)

    setPages((prev) =>
      prev.map((page) => {
        if (page.id !== targetPageId) {
          return page
        }

        if (shouldNest && selectedParent) {
          return {
            ...page,
            widgets: addChildWidget(page.widgets, selectedParent.id, {
              ...newWidget,
              layout: applySpacingToLayout(
                getDefaultWidgetLayout(selectedParent.children ?? []),
                spacing
              ),
            }),
          }
        }

        return {
          ...page,
          widgets: [
            ...page.widgets,
            {
              ...newWidget,
              layout: applySpacingToLayout(getDefaultWidgetLayout(page.widgets), spacing),
            },
          ],
        }
      })
    )
    if (!activePageId) {
      setActivePageId(targetPageId)
    }
    setSelectedWidgetId(widgetId)
    setSelectedGlobalWidgetId(null)
  }

  const handleAddWidgetAtRoot = (widgetType: string) => {
    const definition = getWidgetDefinition(widgetType)
    if (!definition) {
      return
    }

    const spacing = resolveWidgetSpacing(widgetType)
    const targetPageId = activePageId ?? activePage?.id ?? pages[0]?.id
    if (!targetPageId) {
      return
    }

    const widgetId = buildWidgetId(widgetType)
    const newWidget: BuilderWidgetInstance = {
      id: widgetId,
      type: widgetType,
      props: { ...definition.defaultProps },
      layout: undefined,
      spacing,
      policy: [],
      visibleWhen: '',
      disabledWhen: '',
    }

    setPages((prev) =>
      prev.map((page) => {
        if (page.id !== targetPageId) {
          return page
        }

        return {
          ...page,
          widgets: [
            ...page.widgets,
            {
              ...newWidget,
              layout: applySpacingToLayout(getDefaultWidgetLayout(page.widgets), spacing),
            },
          ],
        }
      })
    )
    if (!activePageId) {
      setActivePageId(targetPageId)
    }
    setSelectedWidgetId(widgetId)
    setSelectedGlobalWidgetId(null)
  }

  const handleAddCodeItem = (
    type: BuilderCodeItemType,
    scope: 'global' | 'page',
    pageId?: string
  ) => {
    if (!activeAppId) {
      return
    }

    if (type === 'transformer') {
      const existing = new Set(jsFunctions.map((func) => func.name))
      const name = buildIndexedName('transformer', existing)
      const code = buildTransformerCode(DEFAULT_JS_CODE, {
        scope,
        pageId: scope === 'page' ? pageId ?? activePageId ?? undefined : undefined,
      })
      createJsMutation.mutate(
        { appId: activeAppId, name, code },
        {
          onSuccess: (js) => setCodeSelection({ type: 'transformer', id: js.id }),
        }
      )
      return
    }

    const existing = new Set(queries.map((query) => query.name))
    const name = buildIndexedName(type === 'variable' ? 'variable' : 'query', existing)
    const baseConfig =
      type === 'variable' ? { initialValue: null } : {}
    const config = setBuilderMeta(baseConfig, {
      scope,
      pageId: scope === 'page' ? pageId ?? activePageId ?? undefined : undefined,
    })
    createQueryMutation.mutate(
      {
        appId: activeAppId,
        name,
        type: type === 'variable' ? 'variable' : 'rest',
        config,
        trigger: null,
      },
      {
        onSuccess: (query) =>
          setCodeSelection({
            type: type === 'variable' ? 'variable' : 'query',
            id: query.id,
          }),
      }
    )
  }

  const handleMoveCodeItem = (
    type: BuilderCodeItemType,
    id: string,
    scope: 'global' | 'page',
    pageId?: string
  ) => {
    if (!activeAppId) {
      return
    }
    if (type === 'transformer') {
      const func = jsFunctions.find((item) => item.id === id)
      if (!func) {
        return
      }
      const code = buildTransformerCode(func.code ?? DEFAULT_JS_CODE, {
        scope,
        pageId: scope === 'page' ? pageId ?? activePageId ?? undefined : undefined,
      })
      updateJsMutation.mutate({ appId: activeAppId, jsId: func.id, code })
      return
    }

    const query = queries.find((item) => item.id === id)
    if (!query) {
      return
    }
    const config = setBuilderMeta(query.config ?? {}, {
      scope,
      pageId: scope === 'page' ? pageId ?? activePageId ?? undefined : undefined,
    })
    updateQueryMutation.mutate({ appId: activeAppId, queryId: query.id, config })
  }

  const handleQueryRun = (result: BuilderQueryRunResult) => {
    setLastQueryRun(result)
    setQueryRuns((prev) => ({ ...prev, [result.queryId]: result }))
  }

  const handleSelectCodeItem = (selection: BuilderCodeSelection) => {
    if (!selection) {
      setCodeSelection(null)
      return
    }
    setCodeSelection(selection)
    const tab = buildCodeTab(selection)
    if (!tab) {
      return
    }
    setCodeTabs((prev) => (prev.some((item) => item.id === tab.id) ? prev : [...prev, tab]))
    setActiveCodeTabId(tab.id)
  }

  const handleSelectCodeTab = (tabId: string) => {
    setActiveCodeTabId(tabId)
    const tab = codeTabs.find((item) => item.id === tabId)
    if (!tab || tab.type === 'canvas') {
      setCodeSelection(null)
      return
    }
    setCodeSelection({ type: tab.type, id: tab.entityId ?? '' })
  }

  const handleOpenInspectorPanel = (
    widgetId: string,
    panel: { key: string; label: string }
  ) => {
    setSelectedWidgetId(widgetId)
    setSelectedGlobalWidgetId(null)
    setSelectedPageComponent(false)
    setInspectorAddonPanel({ widgetId, key: panel.key, label: panel.label })
    setShowInspector(true)
  }

  const startWidgetRename = () => {
    if (!selectedWidget) {
      return
    }
    setRenameDraft(selectedWidget.id)
    setIsRenamingWidget(true)
  }

  const cancelWidgetRename = () => {
    setIsRenamingWidget(false)
    setRenameDraft(selectedWidget?.id ?? '')
  }

  const renameWidgetId = (
    widgetId: string,
    nextId: string,
    mode: 'page' | 'global' | 'page-global'
  ) => {
    if (widgetId === nextId) {
      return
    }
    if (mode === 'global') {
      setGlobalWidgets((prev) => {
        const updatedGlobals = updateEventRefsInTree(
          updateWidgetById(prev, widgetId, (widget) => ({ ...widget, id: nextId })),
          widgetId,
          nextId
        )
        setPages((pagesPrev) =>
          pagesPrev.map((page) => {
            const nextWidgets = updateEventRefsInTree(page.widgets, widgetId, nextId)
            const nextPageGlobals = updateEventRefsInTree(
              page.pageGlobals ?? [],
              widgetId,
              nextId
            )
            return {
              ...page,
              widgets: nextWidgets,
              pageGlobals: nextPageGlobals,
              layout: {
                ...(page.layout ?? {}),
                globals: updatedGlobals,
                pageGlobals: nextPageGlobals,
              },
            }
          })
        )
        return updatedGlobals
      })
      setSelectedGlobalWidgetId(nextId)
    } else if (mode === 'page-global') {
      if (!activePageId) {
        return
      }
      setPages((prev) =>
        prev.map((page) => {
          const nextWidgets = updateEventRefsInTree(page.widgets, widgetId, nextId)
          if (page.id !== activePageId) {
            return {
              ...page,
              widgets: nextWidgets,
              pageGlobals: updateEventRefsInTree(page.pageGlobals ?? [], widgetId, nextId),
            }
          }
          const updatedGlobals = updateEventRefsInTree(
            updateWidgetById(page.pageGlobals ?? [], widgetId, (widget) => ({
              ...widget,
              id: nextId,
            })),
            widgetId,
            nextId
          )
          return {
            ...page,
            widgets: nextWidgets,
            pageGlobals: updatedGlobals,
            layout: {
              ...(page.layout ?? {}),
              pageGlobals: updatedGlobals,
            },
          }
        })
      )
      setSelectedGlobalWidgetId(nextId)
    } else {
      const targetPageId = activePageId ?? pages[0]?.id
      if (!targetPageId) {
        return
      }
      setPages((prev) =>
        prev.map((page) => {
          const nextGlobals = updateEventRefsInTree(page.pageGlobals ?? [], widgetId, nextId)
          if (page.id !== targetPageId) {
            return {
              ...page,
              widgets: updateEventRefsInTree(page.widgets, widgetId, nextId),
              pageGlobals: nextGlobals,
            }
          }
          const updatedWidgets = updateEventRefsInTree(
            updateWidgetById(page.widgets, widgetId, (widget) => ({
              ...widget,
              id: nextId,
            })),
            widgetId,
            nextId
          )
          return {
            ...page,
            widgets: updatedWidgets,
            pageGlobals: nextGlobals,
            layout: {
              ...(page.layout ?? {}),
              widgets: updatedWidgets,
            },
          }
        })
      )
      setSelectedWidgetId(nextId)
    }

    setGlobalWidgets((prev) => updateEventRefsInTree(prev, widgetId, nextId))
    setInspectorAddonPanel((prev) =>
      prev && prev.widgetId === widgetId ? { ...prev, widgetId: nextId } : prev
    )
  }

  const commitWidgetRename = () => {
    if (!selectedWidget || !selectedWidgetMode) {
      cancelWidgetRename()
      return
    }
    const existingIds = getExistingWidgetIds()
    existingIds.delete(selectedWidget.id)
    const normalized = normalizeWidgetIdInput(renameDraft)
    const nextId = ensureUniqueWidgetId(normalized, existingIds)
    renameWidgetId(selectedWidget.id, nextId, selectedWidgetMode)
    setIsRenamingWidget(false)
  }

  const handleCopyWidget = () => {
    if (!selectedWidget) {
      return
    }
    setWidgetClipboard({ widget: cloneWidgetData(selectedWidget), mode: 'copy' })
  }

  const handleCutWidget = () => {
    if (!selectedWidget || !selectedWidgetMode) {
      return
    }
    setWidgetClipboard({ widget: cloneWidgetData(selectedWidget), mode: 'cut' })
    handleDeleteWidget(selectedWidget.id, selectedWidgetMode)
  }

  const handleDuplicateWidget = () => {
    if (!selectedWidget || !selectedWidgetMode) {
      return
    }
    const existingIds = getExistingWidgetIds()
    const clonedWidget = cloneWidgetTree(selectedWidget, existingIds)

    if (selectedWidgetMode === 'global') {
      setGlobalWidgets((prev) => {
        const [nextGlobals, inserted] = insertAdjacentWidget(
          prev,
          selectedWidget.id,
          'below',
          clonedWidget
        )
        if (inserted) {
          setPages((pagesPrev) =>
            pagesPrev.map((page) => ({
              ...page,
              layout: {
                ...(page.layout ?? {}),
                globals: nextGlobals,
              },
            }))
          )
        }
        return nextGlobals
      })
      setSelectedGlobalWidgetId(clonedWidget.id)
      return
    }

    if (selectedWidgetMode === 'page-global') {
      if (!activePageId) {
        return
      }
      setPages((prev) =>
        prev.map((page) => {
          if (page.id !== activePageId) {
            return page
          }
          const [nextGlobals, inserted] = insertAdjacentWidget(
            page.pageGlobals ?? [],
            selectedWidget.id,
            'below',
            clonedWidget
          )
          if (!inserted) {
            return page
          }
          return {
            ...page,
            pageGlobals: nextGlobals,
            layout: {
              ...(page.layout ?? {}),
              pageGlobals: nextGlobals,
            },
          }
        })
      )
      setSelectedGlobalWidgetId(clonedWidget.id)
      return
    }

    const targetPageId = activePageId ?? pages[0]?.id
    if (!targetPageId) {
      return
    }
    setPages((prev) =>
      prev.map((page) => {
        if (page.id !== targetPageId) {
          return page
        }
        const [nextWidgets, inserted] = insertAdjacentWidget(
          page.widgets,
          selectedWidget.id,
          'below',
          clonedWidget
        )
        if (!inserted) {
          return page
        }
        return {
          ...page,
          widgets: nextWidgets,
          layout: {
            ...(page.layout ?? {}),
            widgets: nextWidgets,
          },
        }
      })
    )
    setSelectedWidgetId(clonedWidget.id)
  }

  const handleResetWidgetState = () => {
    if (!selectedWidget || !selectedDefinition || !selectedWidgetMode) {
      return
    }
    const defaultProps = selectedDefinition.defaultProps ?? {}
    const resetPatch = Object.keys(defaultProps).reduce<Record<string, unknown>>((acc, key) => {
      if (RESET_STATE_KEYS.has(key)) {
        acc[key] = defaultProps[key]
      }
      return acc
    }, {})
    if (Object.keys(resetPatch).length === 0) {
      return
    }
    if (selectedWidgetMode === 'global') {
      updateGlobalWidget(selectedWidget.id, (widget) => ({
        ...widget,
        props: { ...widget.props, ...resetPatch },
      }))
      return
    }
    if (selectedWidgetMode === 'page-global') {
      updatePageGlobalWidget(selectedWidget.id, (widget) => ({
        ...widget,
        props: { ...widget.props, ...resetPatch },
      }))
      return
    }
    updateWidget(selectedWidget.id, (widget) => ({
      ...widget,
      props: { ...widget.props, ...resetPatch },
    }))
  }

  const handleCloseCodeTab = (tabId: string) => {
    if (tabId === CANVAS_TAB_ID) {
      return
    }
    const nextTabs = codeTabs.filter((tab) => tab.id !== tabId)
    setCodeTabs(normalizeCodeTabs(nextTabs))
    if (activeCodeTabId !== tabId) {
      return
    }
    const fallback = nextTabs[nextTabs.length - 1]?.id ?? CANVAS_TAB_ID
    setActiveCodeTabId(fallback)
    const fallbackTab = nextTabs.find((tab) => tab.id === fallback)
    if (!fallbackTab || fallbackTab.type === 'canvas') {
      setCodeSelection(null)
      return
    }
    setCodeSelection({ type: fallbackTab.type, id: fallbackTab.entityId ?? '' })
  }

  const buildWidgetInstance = (
    widgetType: string,
    layout: BuilderWidgetInstance['layout'],
    props?: Record<string, unknown>,
    existingIds?: Set<string>
  ): BuilderWidgetInstance | null => {
    const definition = getWidgetDefinition(widgetType)
    if (!definition || !layout) {
      return null
    }
    const spacing = resolveWidgetSpacing(widgetType)
    const layoutWithSpacing = applySpacingToLayout(layout, spacing)
    return {
      id: buildWidgetId(widgetType, existingIds),
      type: widgetType,
      props: { ...definition.defaultProps, ...(props ?? {}) },
      layout: layoutWithSpacing ?? layout,
      spacing,
      policy: [],
      visibleWhen: '',
      disabledWhen: '',
    }
  }

  const buildGlobalPresetChildren = (
    type: string,
    parentId: string,
    existingIds: Set<string>
  ): BuilderWidgetInstance[] => {
    const children: BuilderWidgetInstance[] = []
    const baseLayout = (
      x: number,
      y: number,
      w: number,
      h: number
    ): BuilderWidgetInstance['layout'] => ({
      x,
      y,
      w,
      h,
      minW: DEFAULT_WIDGET_LAYOUT.minW,
      minH: DEFAULT_WIDGET_LAYOUT.minH,
    })
    const compactLayout = (
      x: number,
      y: number,
      w: number,
      h: number
    ): BuilderWidgetInstance['layout'] => ({
      x,
      y,
      w,
      h,
      minW: 1,
      minH: 1,
    })
    const buildCloseEvents = (targetId?: string) => {
      if (!targetId) {
        return []
      }
      return [
        {
          event: 'click',
          type: 'widget',
          method: 'setHidden',
          pluginId: targetId,
          params: { hidden: true },
          waitType: 'debounce',
          waitMs: '0',
        },
      ]
    }

    if (type === 'GlobalHeader') {
      const logo = buildWidgetInstance('Image', baseLayout(0, 0, 2, 4), {
        alt: 'Logo',
      }, existingIds)
      const nav = buildWidgetInstance('Navigation', baseLayout(2, 0, 8, 4), {
        variant: 'horizontal',
        showPath: false,
      }, existingIds)
      if (logo) {
        children.push(logo)
      }
      if (nav) {
        children.push(nav)
      }
      return children
    }

    if (type === 'GlobalSidebar') {
      const logo = buildWidgetInstance('Image', baseLayout(0, 0, 12, 5), {
        alt: 'Logo',
      }, existingIds)
      const nav = buildWidgetInstance('Navigation', baseLayout(0, 5, 12, 18), {
        variant: 'vertical',
        showPath: false,
      }, existingIds)
      const avatar = buildWidgetInstance(
        'Avatar',
        baseLayout(0, 23, 12, 5),
        undefined,
        existingIds
      )
      if (logo) {
        children.push(logo)
      }
      if (nav) {
        children.push(nav)
      }
      if (avatar) {
        children.push(avatar)
      }
      return children
    }

    if (type === 'GlobalDrawer' || type === 'GlobalModal') {
      const headerType = type === 'GlobalDrawer' ? 'DrawerHeader' : 'ModalHeader'
      const footerType = type === 'GlobalDrawer' ? 'DrawerFooter' : 'ModalFooter'
      const titleType = type === 'GlobalDrawer' ? 'DrawerTitle' : 'ModalTitle'
      const closeType =
        type === 'GlobalDrawer' ? 'DrawerCloseButton' : 'ModalCloseButton'
      const header = buildWidgetInstance(headerType, baseLayout(0, 0, 12, 3), {
        showSeparator: true,
        padding: 'normal',
      }, existingIds)
      const footer = buildWidgetInstance(footerType, baseLayout(0, 0, 12, 3), {
        showSeparator: true,
        padding: 'normal',
      }, existingIds)
      if (header) {
        const title = buildWidgetInstance(
          titleType,
          compactLayout(0, 0, 9, 2),
          undefined,
          existingIds
        )
        const close = buildWidgetInstance(
          closeType,
          compactLayout(9, 0, 3, 2),
          { events: buildCloseEvents(parentId) },
          existingIds
        )
        header.children = [title, close].filter(Boolean) as BuilderWidgetInstance[]
        children.push(header)
      }
      if (footer) {
        children.push(footer)
      }
      return children
    }

    return children
  }

  const handleAddGlobalComponent = (type: string) => {
    const definition = getWidgetDefinition(type)
    setGlobalWidgets((prev) => {
      const pageGlobals = pages.flatMap((page) => page.pageGlobals ?? [])
      const existingIds = getExistingWidgetIds()
      const nextId = createGlobalId(type, [...prev, ...pageGlobals], existingIds)
      existingIds.add(nextId)
      const presetChildren = buildGlobalPresetChildren(type, nextId, existingIds)
      const newWidget: BuilderWidgetInstance = {
        id: nextId,
        type,
        props: { ...(definition?.defaultProps ?? {}) },
        layout: undefined,
        spacing: resolveWidgetSpacing(type),
        policy: [],
        visibleWhen: '',
        disabledWhen: '',
        children: presetChildren,
      }
      const next = [...prev, newWidget]
      setPages((pagesPrev) =>
        pagesPrev.map((page) => ({
          ...page,
          layout: {
            ...(page.layout ?? {}),
            globals: next,
          },
        }))
      )
      return next
    })
  }

  const handleAddPageGlobalComponent = (type: string) => {
    if (!activePageId) {
      return
    }
    const definition = getWidgetDefinition(type)
    setPages((prev) =>
      prev.map((page) => {
        if (page.id !== activePageId) {
          return page
        }
        const existingIds = getExistingWidgetIds()
        const nextId = createGlobalId(
          type,
          [...(page.pageGlobals ?? []), ...globalWidgets],
          existingIds
        )
        existingIds.add(nextId)
        const presetChildren = buildGlobalPresetChildren(type, nextId, existingIds)
        const newWidget: BuilderWidgetInstance = {
          id: nextId,
          type,
          props: { ...(definition?.defaultProps ?? {}) },
          layout: undefined,
          spacing: resolveWidgetSpacing(type),
          policy: [],
          visibleWhen: '',
          disabledWhen: '',
          children: presetChildren,
        }
        const nextGlobals = [...(page.pageGlobals ?? []), newWidget]
        return {
          ...page,
          pageGlobals: nextGlobals,
          layout: {
            ...(page.layout ?? {}),
            pageGlobals: nextGlobals,
          },
        }
      })
    )
  }

  const updateGlobalWidget = (
    widgetId: string,
    updater: (widget: BuilderWidgetInstance) => BuilderWidgetInstance
  ) => {
    setGlobalWidgets((prev) => {
      const next = updateWidgetById(prev, widgetId, updater)
      setPages((pagesPrev) =>
        pagesPrev.map((page) => ({
          ...page,
          layout: {
            ...(page.layout ?? {}),
            globals: next,
          },
        }))
      )
      return next
    })
  }

  const updatePageGlobalWidget = (
    widgetId: string,
    updater: (widget: BuilderWidgetInstance) => BuilderWidgetInstance
  ) => {
    if (!activePageId) {
      return
    }
    setPages((prev) =>
      prev.map((page) => {
        if (page.id !== activePageId) {
          return page
        }
        const nextGlobals = updateWidgetById(page.pageGlobals ?? [], widgetId, updater)
        return {
          ...page,
          pageGlobals: nextGlobals,
          layout: {
            ...(page.layout ?? {}),
            pageGlobals: nextGlobals,
          },
        }
      })
    )
  }

  const updateWidget = (
    widgetId: string,
    updater: (widget: BuilderWidgetInstance) => BuilderWidgetInstance
  ) => {
    const targetPageId = activePageId ?? pages[0]?.id
    if (!targetPageId) {
      return
    }

    setPages((prev) =>
      prev.map((page) => {
        if (page.id !== targetPageId) {
          return page
        }

        return {
          ...page,
          widgets: updateWidgetById(page.widgets, widgetId, updater),
        }
      })
    )
  }

  const handleUpdateProps = (patch: Record<string, unknown>) => {
    if (!selectedWidget) {
      return
    }

    const updater = (widget: BuilderWidgetInstance) => ({
      ...widget,
      props: {
        ...widget.props,
        ...patch,
      },
    })

    if (selectedGlobalWidgetId) {
      if (activePage?.pageGlobals?.some((widget) => widget.id === selectedGlobalWidgetId)) {
        updatePageGlobalWidget(selectedGlobalWidgetId, updater)
      } else {
        updateGlobalWidget(selectedGlobalWidgetId, updater)
      }
      return
    }

    updateWidget(selectedWidget.id, updater)
  }

  const handleUpdateAccess = (patch: {
    policy?: string[]
    visibleWhen?: string
    disabledWhen?: string
  }) => {
    if (!selectedWidget) {
      return
    }

    const updater = (widget: BuilderWidgetInstance) => ({
      ...widget,
      ...patch,
    })

    if (selectedGlobalWidgetId) {
      if (activePage?.pageGlobals?.some((widget) => widget.id === selectedGlobalWidgetId)) {
        updatePageGlobalWidget(selectedGlobalWidgetId, updater)
      } else {
        updateGlobalWidget(selectedGlobalWidgetId, updater)
      }
      return
    }

    updateWidget(selectedWidget.id, updater)
  }

  const handleUpdateSpacing = (patch: BuilderWidgetSpacing) => {
    if (!selectedWidget) {
      return
    }

    const applySpacing = (widget: BuilderWidgetInstance) => {
      const nextSpacing = resolveWidgetSpacing(widget.type, {
        ...widget.spacing,
        ...patch,
      })
      const layout = widget.layout
      const adjustedLayout =
        layout && nextSpacing.heightMode === 'auto'
          ? { ...layout, minH: AUTO_HEIGHT_MIN_H }
          : layout && nextSpacing.heightMode === 'fixed'
            ? {
                ...layout,
                minH:
                  typeof layout.minH === 'number' && layout.minH > DEFAULT_WIDGET_LAYOUT.minH
                    ? layout.minH
                    : DEFAULT_WIDGET_LAYOUT.minH,
              }
            : layout

      return {
        ...widget,
        spacing: nextSpacing,
        layout: adjustedLayout,
      }
    }

    if (selectedGlobalWidgetId) {
      if (activePage?.pageGlobals?.some((widget) => widget.id === selectedGlobalWidgetId)) {
        updatePageGlobalWidget(selectedGlobalWidgetId, applySpacing)
      } else {
        updateGlobalWidget(selectedGlobalWidgetId, applySpacing)
      }
      return
    }

    updateWidget(selectedWidget.id, applySpacing)
  }

  const handleUpdateHidden = (hidden: boolean | string) => {
    if (!selectedWidget) {
      return
    }

    const updater = (widget: BuilderWidgetInstance) => ({
      ...widget,
      hidden,
    })

    if (selectedGlobalWidgetId) {
      if (activePage?.pageGlobals?.some((widget) => widget.id === selectedGlobalWidgetId)) {
        updatePageGlobalWidget(selectedGlobalWidgetId, updater)
      } else {
        updateGlobalWidget(selectedGlobalWidgetId, updater)
      }
      return
    }

    updateWidget(selectedWidget.id, updater)
  }

  const handleToggleWidgetHidden = (
    widgetId: string,
    mode: 'page' | 'global' | 'page-global'
  ) => {
    if (mode === 'global') {
      updateGlobalWidget(widgetId, (widget) => ({
        ...widget,
        hidden: !parseBoolean(widget.hidden, false),
      }))
      return
    }

    if (mode === 'page-global') {
      updatePageGlobalWidget(widgetId, (widget) => ({
        ...widget,
        hidden: !parseBoolean(widget.hidden, false),
      }))
      return
    }

    updateWidget(widgetId, (widget) => ({
      ...widget,
      hidden: !parseBoolean(widget.hidden, false),
    }))
  }

  const handleUpdateOverlayChildProps = (
    parentId: string,
    childId: string,
    patch: Record<string, unknown>,
    mode: 'global' | 'page-global'
  ) => {
    const updateChildren = (widget: BuilderWidgetInstance) => ({
      ...widget,
      children: updateWidgetById(widget.children ?? [], childId, (child) => ({
        ...child,
        props: {
          ...child.props,
          ...patch,
        },
      })),
    })
    if (mode === 'page-global') {
      updatePageGlobalWidget(parentId, updateChildren)
      return
    }
    updateGlobalWidget(parentId, updateChildren)
  }

  const handleSetGlobalWidgetHidden = (
    widgetId: string,
    hidden: boolean,
    mode: 'global' | 'page-global'
  ) => {
    if (mode === 'page-global') {
      updatePageGlobalWidget(widgetId, (widget) => ({
        ...widget,
        hidden,
      }))
      return
    }

    updateGlobalWidget(widgetId, (widget) => ({
      ...widget,
      hidden,
    }))
  }

  const handleDeleteWidget = (
    widgetId: string,
    mode: 'page' | 'global' | 'page-global'
  ) => {
    if (mode === 'global') {
      setGlobalWidgets((prev) => {
        const next = removeWidgetById(prev, widgetId)
        setPages((pagesPrev) =>
          pagesPrev.map((page) => ({
            ...page,
            layout: {
              ...(page.layout ?? {}),
              globals: next,
            },
          }))
        )
        return next
      })
      setSelectedWidgetId(null)
      setSelectedGlobalWidgetId(null)
      setSelectedPageComponent(false)
      return
    }

    if (mode === 'page-global') {
      if (!activePageId) {
        return
      }
      setPages((prev) =>
        prev.map((page) => {
          if (page.id !== activePageId) {
            return page
          }
          const nextGlobals = removeWidgetById(page.pageGlobals ?? [], widgetId)
          return {
            ...page,
            pageGlobals: nextGlobals,
            layout: {
              ...(page.layout ?? {}),
              pageGlobals: nextGlobals,
            },
          }
        })
      )
      setSelectedWidgetId(null)
      setSelectedGlobalWidgetId(null)
      setSelectedPageComponent(false)
      return
    }

    const targetPageId = activePageId ?? pages[0]?.id
    if (!targetPageId) {
      return
    }
    setPages((prev) =>
      prev.map((page) => {
        if (page.id !== targetPageId) {
          return page
        }
        const nextWidgets = removeWidgetById(page.widgets, widgetId)
        return {
          ...page,
          widgets: nextWidgets,
          layout: {
            ...(page.layout ?? {}),
            widgets: nextWidgets,
          },
        }
      })
    )
    setSelectedWidgetId(null)
    setSelectedGlobalWidgetId(null)
    setSelectedPageComponent(false)
  }

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isPreviewing || selectedPageComponent) {
        return
      }
      if (event.key !== 'Backspace' && event.key !== 'Delete') {
        return
      }
      const target = event.target as HTMLElement | null
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return
      }
      if (!selectedWidgetMode) {
        return
      }
      const targetId = selectedGlobalWidgetId ?? selectedWidgetId
      if (!targetId) {
        return
      }
      event.preventDefault()
      handleDeleteWidget(targetId, selectedWidgetMode)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    isPreviewing,
    selectedPageComponent,
    selectedWidgetId,
    selectedGlobalWidgetId,
    selectedWidgetMode,
    handleDeleteWidget,
  ])

  const handleReorderWidget = (
    activeId: string,
    overId: string,
    parentId: string | null,
    mode: 'page' | 'global' | 'page-global'
  ) => {
    if (mode === 'global') {
      setGlobalWidgets((prev) => {
        const next = reorderWidgetInTree(prev, activeId, overId, parentId)
        setPages((pagesPrev) =>
          pagesPrev.map((page) => ({
            ...page,
            layout: {
              ...(page.layout ?? {}),
              globals: next,
            },
          }))
        )
        return next
      })
      return
    }

    if (mode === 'page-global') {
      if (!activePageId) {
        return
      }
      setPages((prev) =>
        prev.map((page) => {
          if (page.id !== activePageId) {
            return page
          }
          const nextGlobals = reorderWidgetInTree(
            page.pageGlobals ?? [],
            activeId,
            overId,
            parentId
          )
          return {
            ...page,
            pageGlobals: nextGlobals,
            layout: {
              ...(page.layout ?? {}),
              pageGlobals: nextGlobals,
            },
          }
        })
      )
      return
    }

    const targetPageId = activePageId ?? pages[0]?.id
    if (!targetPageId) {
      return
    }

    setPages((prev) =>
      prev.map((page) => {
        if (page.id !== targetPageId) {
          return page
        }
        return {
          ...page,
          widgets: reorderWidgetInTree(page.widgets, activeId, overId, parentId),
        }
      })
    )
  }

  const handleAddPage = () => {
    if (!activeAppId) {
      return
    }

    createPageMutation.mutate({
      appId: activeAppId,
      name: `Page ${pages.length + 1}`,
    })
  }

  const handleDeletePage = (pageId: string) => {
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
          setSelectedWidgetId(null)
          if (nextActiveId !== activePageId) {
            setActivePageId(nextActiveId)
          }
        },
      }
    )
  }

  const handleSaveDraft = () => {
    if (activeAppId) {
      if (appName && appName !== activeApp?.name) {
        updateAppMutation.mutate({ appId: activeAppId, name: appName })
      }

      if (runtimePayload) {
        const signature = JSON.stringify(runtimePayload)
        upsertDraftMutation.mutate(
          { appId: activeAppId, schema: runtimePayload, projectRef: activeProjectRef },
          {
            onSuccess: () => {
              lastSavedDraftRef.current = signature
              setLastSavedDraftSignature(signature)
            },
          }
        )
      }
    }
  }

  const handleUpdateActivePage = (patch: Partial<BuilderPage>) => {
    const targetPageId = activePageId ?? activePage?.id ?? pages[0]?.id
    if (!targetPageId) {
      return
    }

    setPages((prev) =>
      prev.map((page) => (page.id === targetPageId ? { ...page, ...patch } : page))
    )
  }

  const handleUpdateActivePageMeta = (patch: Partial<BuilderPage['pageMeta']>) => {
    const targetPageId = activePageId ?? activePage?.id ?? pages[0]?.id
    if (!targetPageId) {
      return
    }
    setPages((prev) =>
      prev.map((page) =>
        page.id === targetPageId
          ? {
              ...page,
              pageMeta: { ...(page.pageMeta ?? {}), ...patch },
              layout: {
                ...(page.layout ?? {}),
                pageMeta: { ...(page.pageMeta ?? {}), ...patch },
              },
            }
          : page
      )
    )
  }

  const handleUpdateActivePageComponent = (
    patch: Partial<BuilderPage['pageComponent']>
  ) => {
    const targetPageId = activePageId ?? activePage?.id ?? pages[0]?.id
    if (!targetPageId) {
      return
    }
    setPages((prev) =>
      prev.map((page) =>
        page.id === targetPageId
          ? {
              ...page,
              pageComponent: { ...(page.pageComponent ?? {}), ...patch },
              layout: {
                ...(page.layout ?? {}),
                pageComponent: { ...(page.pageComponent ?? {}), ...patch },
              },
            }
          : page
      )
    )
  }

  const handleUpdateActiveMenu = (items: BuilderMenuItem[]) => {
    handleUpdateActivePage({ menu: { items } })
  }

  const handleSetRootScreen = (pageId: string) => {
    setPages((prev) =>
      prev.map((page) => ({
        ...page,
        layout: { ...(page.layout ?? {}), rootScreen: pageId },
      }))
    )
  }

  const handleUpdateLayout = (layout: Layout[]) => {
    const targetPageId = activePageId ?? pages[0]?.id
    if (!targetPageId || layout.length === 0) {
      return
    }

    const layoutMap = new Map(layout.map((item) => [item.i, item]))

    setPages((prev) =>
      prev.map((page) => {
        if (page.id !== targetPageId) {
          return page
        }

        return {
          ...page,
          widgets: page.widgets.map((widget) => {
            const item = layoutMap.get(widget.id)
            if (!item) {
              return widget
            }
            return {
              ...widget,
              layout: {
                ...(widget.layout ?? {}),
                x: item.x,
                y: item.y,
                w: item.w,
                h: item.h,
              },
            }
          }),
        }
      })
    )
  }

  const handleUpdateWidgetLayout = (widgetId: string, patch: Partial<Layout>) => {
    updateWidget(widgetId, (widget) => {
      if (!widget.layout) {
        return widget
      }
      return {
        ...widget,
        layout: {
          ...widget.layout,
          ...patch,
        },
      }
    })
  }

  const handleDropWidget = (widgetType: string, layoutItem: Layout, parentId?: string) => {
    const definition = getWidgetDefinition(widgetType)
    if (!definition) {
      return
    }

    const spacing = resolveWidgetSpacing(widgetType)
    const targetPageId = activePageId ?? pages[0]?.id
    if (!targetPageId) {
      return
    }

    const widgetId = buildWidgetId(widgetType)
    const newWidget: BuilderWidgetInstance = {
      id: widgetId,
      type: widgetType,
      props: { ...definition.defaultProps },
      layout: {
        x: layoutItem.x ?? 0,
        y: layoutItem.y ?? 0,
        w: layoutItem.w ?? DEFAULT_WIDGET_LAYOUT.w,
        h: layoutItem.h ?? DEFAULT_WIDGET_LAYOUT.h,
        minW: DEFAULT_WIDGET_LAYOUT.minW,
        minH: spacing.heightMode === 'auto' ? AUTO_HEIGHT_MIN_H : DEFAULT_WIDGET_LAYOUT.minH,
      },
      spacing,
      policy: [],
      visibleWhen: '',
      disabledWhen: '',
    }

    setPages((prev) =>
      prev.map((page) => {
        if (page.id !== targetPageId) {
          return page
        }
        if (parentId) {
          return {
            ...page,
            widgets: addChildWidget(page.widgets, parentId, newWidget),
          }
        }
        return { ...page, widgets: [...page.widgets, newWidget] }
      })
    )
    setSelectedWidgetId(widgetId)
    setSelectedGlobalWidgetId(null)
  }

  const handleUpdateChildLayout = (parentId: string, layout: Layout[]) => {
    const targetPageId = activePageId ?? pages[0]?.id
    if (!targetPageId || layout.length === 0) {
      return
    }

    setPages((prev) =>
      prev.map((page) => {
        if (page.id !== targetPageId) {
          return page
        }

        return {
          ...page,
          widgets: updateWidgetById(page.widgets, parentId, (parent) => {
            if (!parent.children || parent.children.length === 0) {
              return parent
            }
            const layoutMap = new Map(layout.map((item) => [item.i, item]))
            return {
              ...parent,
              children: parent.children.map((child) => {
                const item = layoutMap.get(child.id)
                if (!item) {
                  return child
                }
                return {
                  ...child,
                  layout: {
                    ...(child.layout ?? {}),
                    x: item.x,
                    y: item.y,
                    w: item.w,
                    h: item.h,
                  },
                }
              }),
            }
          }),
        }
      })
    )
  }

  const handleUpdateGlobalChildLayout = (parentId: string, layout: Layout[]) => {
    if (layout.length === 0) {
      return
    }

    updateGlobalWidget(parentId, (parent) => {
      if (!parent.children || parent.children.length === 0) {
        return parent
      }
      const layoutMap = new Map(layout.map((item) => [item.i, item]))
      return {
        ...parent,
        children: parent.children.map((child) => {
          const item = layoutMap.get(child.id)
          if (!item) {
            return child
          }
          return {
            ...child,
            layout: {
              ...(child.layout ?? {}),
              x: item.x,
              y: item.y,
              w: item.w,
              h: item.h,
            },
          }
        }),
      }
    })
  }

  const handleUpdatePageGlobalChildLayout = (parentId: string, layout: Layout[]) => {
    if (layout.length === 0) {
      return
    }
    updatePageGlobalWidget(parentId, (parent) => {
      if (!parent.children || parent.children.length === 0) {
        return parent
      }
      const layoutMap = new Map(layout.map((item) => [item.i, item]))
      return {
        ...parent,
        children: parent.children.map((child) => {
          const item = layoutMap.get(child.id)
          if (!item) {
            return child
          }
          return {
            ...child,
            layout: {
              ...(child.layout ?? {}),
              x: item.x,
              y: item.y,
              w: item.w,
              h: item.h,
            },
          }
        }),
      }
    })
  }

  const handleInsertAdjacentWidget = (
    targetWidgetId: string,
    position: 'above' | 'below',
    widgetType: string
  ) => {
    const definition = getWidgetDefinition(widgetType)
    if (!definition) {
      return
    }

    const spacing = resolveWidgetSpacing(widgetType)
    const targetPageId = activePageId ?? pages[0]?.id
    if (!targetPageId) {
      return
    }

    const widgetId = buildWidgetId(widgetType)
    const newWidget: BuilderWidgetInstance = {
      id: widgetId,
      type: widgetType,
      props: { ...definition.defaultProps },
      layout: undefined,
      spacing,
      policy: [],
      visibleWhen: '',
      disabledWhen: '',
    }

    setPages((prev) =>
      prev.map((page) => {
        if (page.id !== targetPageId) {
          return page
        }

        const [nextWidgets, inserted] = insertAdjacentWidget(
          page.widgets,
          targetWidgetId,
          position,
          newWidget
        )

        return inserted ? { ...page, widgets: nextWidgets } : page
      })
    )
    setSelectedWidgetId(widgetId)
    setSelectedGlobalWidgetId(null)
  }

  const handleUpdateGlobalWidgetLayout = (widgetId: string, patch: Partial<Layout>) => {
    updateGlobalWidget(widgetId, (widget) => {
      if (!widget.layout) {
        return widget
      }
      return {
        ...widget,
        layout: {
          ...widget.layout,
          ...patch,
        },
      }
    })
  }

  const handleUpdatePageGlobalWidgetLayout = (widgetId: string, patch: Partial<Layout>) => {
    updatePageGlobalWidget(widgetId, (widget) => {
      if (!widget.layout) {
        return widget
      }
      return {
        ...widget,
        layout: {
          ...widget.layout,
          ...patch,
        },
      }
    })
  }

  const handleDropGlobalWidget = (
    widgetType: string,
    layoutItem: Layout,
    parentId: string
  ) => {
    const definition = getWidgetDefinition(widgetType)
    if (!definition) {
      return
    }

    const widgetId = buildWidgetId(widgetType)
    const spacing = resolveWidgetSpacing(widgetType)
    const newWidget: BuilderWidgetInstance = {
      id: widgetId,
      type: widgetType,
      props: { ...definition.defaultProps },
      layout: {
        x: layoutItem.x ?? 0,
        y: layoutItem.y ?? 0,
        w: layoutItem.w ?? DEFAULT_WIDGET_LAYOUT.w,
        h: layoutItem.h ?? DEFAULT_WIDGET_LAYOUT.h,
        minW: DEFAULT_WIDGET_LAYOUT.minW,
        minH: spacing.heightMode === 'auto' ? AUTO_HEIGHT_MIN_H : DEFAULT_WIDGET_LAYOUT.minH,
      },
      spacing,
      policy: [],
      visibleWhen: '',
      disabledWhen: '',
    }

    updateGlobalWidget(parentId, (parent) => ({
      ...parent,
      children: [...(parent.children ?? []), newWidget],
    }))
    setSelectedWidgetId(widgetId)
    setSelectedGlobalWidgetId(null)
  }

  const handleDropPageGlobalWidget = (
    widgetType: string,
    layoutItem: Layout,
    parentId: string
  ) => {
    const definition = getWidgetDefinition(widgetType)
    if (!definition) {
      return
    }

    const widgetId = buildWidgetId(widgetType)
    const spacing = resolveWidgetSpacing(widgetType)
    const newWidget: BuilderWidgetInstance = {
      id: widgetId,
      type: widgetType,
      props: { ...definition.defaultProps },
      layout: {
        x: layoutItem.x ?? 0,
        y: layoutItem.y ?? 0,
        w: layoutItem.w ?? DEFAULT_WIDGET_LAYOUT.w,
        h: layoutItem.h ?? DEFAULT_WIDGET_LAYOUT.h,
        minW: DEFAULT_WIDGET_LAYOUT.minW,
        minH: spacing.heightMode === 'auto' ? AUTO_HEIGHT_MIN_H : DEFAULT_WIDGET_LAYOUT.minH,
      },
      spacing,
      policy: [],
      visibleWhen: '',
      disabledWhen: '',
    }

    updatePageGlobalWidget(parentId, (parent) => ({
      ...parent,
      children: [...(parent.children ?? []), newWidget],
    }))
    setSelectedWidgetId(widgetId)
    setSelectedGlobalWidgetId(null)
  }

  const handleTogglePreview = () => {
    setIsPreviewing((prev) => !prev)
  }

  const handlePublish = () => {
    if (!activeAppId || !runtimePayload) {
      return
    }

    publishRuntimeMutation.mutate({
      appId: activeAppId,
      payload: runtimePayload,
      projectRef: activeProjectRef,
    })
  }

  const handleCreateApp = (values: { name: string; orgSlug?: string }) => {
    const orgSlug = organization?.slug ?? values.orgSlug
    if (!orgSlug) {
      return
    }
    createAppMutation.mutate(
      {
        name: values.name.trim(),
        projectRef,
        orgSlug,
      },
      {
        onSuccess: (app) => {
          setIsCreateOpen(false)
          createForm.reset({ name: '', orgSlug: orgSlug })
          router.push(
            projectRef ? `/builder?ref=${projectRef}&appId=${app.id}` : `/builder?appId=${app.id}`
          )
        },
      }
    )
  }

  const isSaving = upsertDraftMutation.isPending || updateAppMutation.isPending
  const isPublishing = publishRuntimeMutation.isPending
  const isDraftSynced =
    Boolean(runtimeSignature) &&
    Boolean(lastSavedDraftSignature) &&
    runtimeSignature === lastSavedDraftSignature &&
    !isDraftLoading
  const draftStatus = isSaving ? 'Saving…' : isDraftSynced ? 'Draft saved' : ''

  if (isAppsLoading || isOrganizationsLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LogoLoader />
      </div>
    )
  }

  if (organizations.length === 0) {
    return (
      <ScaffoldContainer className="flex-grow flex">
        <ScaffoldSection isFullWidth className="flex-grow pb-0">
          <NoOrganizationsState />
        </ScaffoldSection>
      </ScaffoldContainer>
    )
  }

  if (!appIdParam) {
    const canOpenCreateApp = Boolean(organization?.slug || organizations.length > 0)
    const canSubmitCreateApp = Boolean(organization?.slug || formOrgSlug)
    const fullFormHref = projectRef ? `/builder/new?ref=${projectRef}` : '/builder/new'
    return (
      <ScaffoldContainer className="flex-grow flex">
        <ScaffoldSection isFullWidth className="flex-grow pb-0">
          <div className="flex flex-col gap-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Search for an app"
                  icon={<Search />}
                  size="tiny"
                  className="w-32 md:w-64"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  actions={[
                    search && (
                      <Button
                        key="clear"
                        size="tiny"
                        type="text"
                        icon={<X />}
                        onClick={() => setSearch('')}
                        className="h-5 w-5 p-0"
                      />
                    ),
                  ]}
                />
              </div>
              <div className="flex items-center gap-2">
                {viewMode && setViewMode && (
                  <ToggleGroup
                    type="single"
                    size="sm"
                    value={viewMode}
                    onValueChange={(value) => value && setViewMode(value as 'grid' | 'table')}
                  >
                    <ToggleGroupItem value="grid" size="sm" className="h-[26px] w-[26px] p-0">
                      <Grid size={14} strokeWidth={1.5} />
                    </ToggleGroupItem>
                    <ToggleGroupItem value="table" size="sm" className="h-[26px] w-[26px] p-0">
                      <List size={14} strokeWidth={1.5} />
                    </ToggleGroupItem>
                  </ToggleGroup>
                )}
                <Button
                  type="primary"
                  size="tiny"
                  icon={<Plus />}
                  onClick={() => setIsCreateOpen(true)}
                  disabled={!canOpenCreateApp}
                >
                  Create app
                </Button>
                <Button asChild type="default" size="tiny">
                  <Link href={fullFormHref}>Open full form</Link>
                </Button>
              </div>
            </div>

            {apps.length === 0 && !normalizedSearch ? (
              <EmptyStatePresentational
                title="Create a builder app"
                description="Start designing interfaces with widgets, pages, and menus."
              >
                <Button
                  type="default"
                  size="tiny"
                  icon={<Plus />}
                  onClick={() => setIsCreateOpen(true)}
                  disabled={!canOpenCreateApp}
                >
                  Create app
                </Button>
              </EmptyStatePresentational>
            ) : noSearchResults ? (
              <NoSearchResults searchString={search} />
            ) : viewMode === 'table' ? (
              <Card className="flex-1 min-h-0 overflow-y-auto mb-8">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>App</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Organization</TableHead>
                      <TableHead>Updated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedApps.map((app) => {
                      const appProjectRef = app.projectRef ?? projectRef
                      const appHref = appProjectRef
                        ? `/builder?ref=${appProjectRef}&appId=${app.id}`
                        : `/builder?appId=${app.id}`

                      return (
                        <TableRow key={app.id}>
                          <TableCell className="max-w-[240px]">
                            <Link href={appHref} className="block text-sm text-foreground truncate">
                              {app.name}
                            </Link>
                            <div className="text-xs text-foreground-muted truncate">{app.id}</div>
                          </TableCell>
                          <TableCell className="text-xs text-foreground-muted">
                            {app.projectRef ?? '—'}
                          </TableCell>
                          <TableCell className="text-xs text-foreground-muted">
                            {app.orgSlug}
                          </TableCell>
                          <TableCell className="text-xs text-foreground-muted">
                            {app.updatedAt ? new Date(app.updatedAt).toLocaleDateString() : '—'}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </Card>
            ) : (
              <div className="flex flex-col gap-y-2 md:gap-y-4 pb-6">
                <ul
                  className="min-h-0 w-full mx-auto grid grid-cols-1 gap-2 md:gap-4 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3"
                >
                  {sortedApps.map((app) => {
                    const appProjectRef = app.projectRef ?? projectRef
                    const appHref = appProjectRef
                      ? `/builder?ref=${appProjectRef}&appId=${app.id}`
                      : `/builder?appId=${app.id}`

                    return (
                      <li key={app.id} className="list-none h-min">
                        <CardButton
                          linkHref={appHref}
                          className="h-44 !px-0 group pt-5 pb-0"
                          title={
                            <div className="w-full flex flex-col gap-y-4 justify-between px-5">
                              <div className="flex flex-col gap-y-0.5">
                                <h5 className="text-sm flex-shrink truncate pr-5">{app.name}</h5>
                                <p className="text-sm text-foreground-lighter">{app.id}</p>
                              </div>
                              <div className="flex items-center gap-x-1.5">
                                <Badge>{app.projectRef ?? 'No project'}</Badge>
                                <Badge>{app.orgSlug}</Badge>
                              </div>
                            </div>
                          }
                          footer={
                            <div className="px-5 pb-4 text-xs text-foreground-muted">
                              Updated{' '}
                              {app.updatedAt ? new Date(app.updatedAt).toLocaleDateString() : '—'}
                            </div>
                          }
                        />
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}
          </div>
        </ScaffoldSection>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent size="medium">
            <Form_Shadcn_ {...createForm}>
              <form
                id="builder-create-app"
                onSubmit={createForm.handleSubmit(handleCreateApp)}
                className="space-y-4"
              >
                <DialogHeader>
                  <DialogTitleText>Create builder app</DialogTitleText>
                  <DialogDescription>Give your app a name to start building.</DialogDescription>
                </DialogHeader>
                <DialogSectionSeparator />
                <DialogSection>
                  <FormField_Shadcn_
                    name="name"
                    control={createForm.control}
                    rules={{ required: 'App name is required' }}
                    render={({ field }) => (
                      <FormItem_Shadcn_>
                        <FormLabel_Shadcn_>App name</FormLabel_Shadcn_>
                        <FormControl_Shadcn_>
                          <Input_Shadcn_ placeholder="Interface name" {...field} />
                        </FormControl_Shadcn_>
                        <FormMessage_Shadcn_ />
                      </FormItem_Shadcn_>
                    )}
                  />
                  {!projectRef && (
                    <FormField_Shadcn_
                      name="orgSlug"
                      control={createForm.control}
                      rules={{ required: 'Organization is required' }}
                      render={({ field }) => (
                        <FormItem_Shadcn_>
                          <FormLabel_Shadcn_>Organization</FormLabel_Shadcn_>
                          <FormControl_Shadcn_>
                            <Select_Shadcn_
                              value={field.value}
                              onValueChange={(value) => {
                                field.onChange(value)
                                setSelectedOrgSlug(value)
                              }}
                            >
                              <SelectTrigger_Shadcn_>
                                <SelectValue_Shadcn_
                                  placeholder={
                                    isOrganizationsLoading
                                      ? 'Loading organizations...'
                                      : 'Select an organization'
                                  }
                                />
                              </SelectTrigger_Shadcn_>
                              <SelectContent_Shadcn_>
                                {organizations.map((org) => (
                                  <SelectItem_Shadcn_ key={org.slug} value={org.slug}>
                                    {org.name}
                                  </SelectItem_Shadcn_>
                                ))}
                              </SelectContent_Shadcn_>
                            </Select_Shadcn_>
                          </FormControl_Shadcn_>
                          <FormMessage_Shadcn_ />
                        </FormItem_Shadcn_>
                      )}
                    />
                  )}
                  {createAppMutation.error && (
                    <p className="text-sm text-destructive">
                      {createAppMutation.error.message}
                    </p>
                  )}
                </DialogSection>
                <DialogFooter>
                  <Button
                    type="default"
                    onClick={() => setIsCreateOpen(false)}
                    disabled={createAppMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={createAppMutation.isPending}
                    disabled={!canSubmitCreateApp || createAppMutation.isPending}
                  >
                    Create app
                  </Button>
                </DialogFooter>
              </form>
            </Form_Shadcn_>
          </DialogContent>
        </Dialog>
      </ScaffoldContainer>
    )
  }

  if (!activeAppId) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>App not found</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-foreground-muted">
            <p>The selected app does not exist or is not available for this project.</p>
            <Button asChild type="primary">
              <Link href={projectRef ? `/builder?ref=${projectRef}` : '/builder'}>
                Choose another app
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="builder-shell flex h-full min-h-0 min-w-0">
      <BuilderSectionMenu
        activeSection={activeSection}
        onSelectSection={(section) => {
          setShowSidebar(true)
          setActiveSection(section)
        }}
      />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <BuilderToolbar
          onOpenAi={() => openSidebar(SIDEBAR_KEYS.AI_ASSISTANT)}
          onTogglePreview={handleTogglePreview}
          isPreviewing={isPreviewing}
          onSaveDraft={handleSaveDraft}
          isSaving={isSaving}
          draftStatus={draftStatus}
          onPublish={handlePublish}
          isPublishing={isPublishing}
        />
        <ResizablePanelGroup direction="horizontal" className="min-h-0 min-w-0 flex-1">
          <ResizablePanel
            ref={sidebarPanelRef}
            defaultSize={isSettingsSection ? 40 : 22}
            minSize={isSettingsSection ? 40 : 18}
            maxSize={isSettingsSection ? 40 : 32}
            collapsible
            collapsedSize={0}
          >
            {activeSection ? (
              <BuilderSidebar
                appId={activeAppId}
                appName={appName}
                apps={apps}
                projectRef={activeProjectRef}
                projectRestUrl={project?.restUrl}
                activeSection={activeSection}
                globalWidgets={globalWidgets}
                onAddGlobalWidget={handleAddGlobalComponent}
                pages={pages}
                activePageId={activePageId ?? ''}
                rootScreenId={rootScreenId}
                onSetRootScreen={handleSetRootScreen}
                selectedWidgetId={selectedWidgetId}
                selectedGlobalWidgetId={selectedGlobalWidgetId}
                onSelectPage={(pageId) => {
                  setActivePageId(pageId)
                  setSelectedWidgetId(null)
                  setSelectedGlobalWidgetId(null)
                  setSelectedPageComponent(false)
                }}
                onSelectWidget={(widgetId) => {
                  setSelectedWidgetId(widgetId)
                  setSelectedGlobalWidgetId(null)
                  setSelectedPageComponent(false)
                }}
                onSelectGlobalWidget={(widgetId) => {
                  setSelectedGlobalWidgetId(widgetId)
                  setSelectedWidgetId(null)
                  setSelectedPageComponent(false)
                }}
                onSelectPageComponent={() => {
                  setSelectedWidgetId(null)
                  setSelectedGlobalWidgetId(null)
                  setSelectedPageComponent(true)
                }}
                selectedPageComponent={selectedPageComponent}
                pageGlobals={activePage?.pageGlobals ?? []}
                onAddPageGlobalWidget={handleAddPageGlobalComponent}
                onToggleWidgetHidden={handleToggleWidgetHidden}
                onReorderWidget={handleReorderWidget}
                onAddWidgetAtRoot={handleAddWidgetAtRoot}
                onAddPage={handleAddPage}
                onDeletePage={handleDeletePage}
                isDeletingPage={deletePageMutation.isPending}
                widgets={widgetRegistry}
                onAddWidget={handleAddWidget}
                onQueryRun={handleQueryRun}
                queryRuns={queryRuns}
                queries={queries}
                jsFunctions={jsFunctions}
                codeSelection={codeSelection}
                onSelectCodeItem={handleSelectCodeItem}
                onAddCodeItem={handleAddCodeItem}
                onMoveCodeItem={handleMoveCodeItem}
                onAppNameChange={setAppName}
                onClose={() => {
                  setShowSidebar(false)
                  setActiveSection(null)
                }}
              />
            ) : null}
          </ResizablePanel>
          <ResizableHandle
            withHandle
            className={
              showSidebar && !isSettingsSection ? undefined : 'opacity-0 pointer-events-none'
            }
          />
          <ResizablePanel defaultSize={56} minSize={40}>
            <div className="flex h-full flex-col">
            {!isPreviewing && isCodeMode && (
              <BuilderCodeTabs
                tabs={codeTabs}
                activeTabId={activeCodeTabId}
                queries={queries}
                jsFunctions={jsFunctions}
                onSelectTab={handleSelectCodeTab}
                onCloseTab={handleCloseCodeTab}
              />
            )}
            <div className="relative flex-1 min-h-0">
            {isPreviewing ? (
              <BuilderPreview
                pages={pages}
                activePageId={activePageId}
                globalWidgets={globalWidgets}
                policies={previewPolicies}
                queryRun={lastQueryRun ?? undefined}
                onClearQueryRun={() => setLastQueryRun(null)}
                onQueryRun={handleQueryRun}
                queries={queries}
                jsFunctions={jsFunctions}
                projectRef={activeProjectRef}
                projectRestUrl={project?.restUrl}
                onSelectPage={(pageId) => {
                  setActivePageId(pageId)
                  setSelectedWidgetId(null)
                  setSelectedGlobalWidgetId(null)
                }}
                gridRowHeight={GRID_ROW_HEIGHT}
                gridMargin={GRID_MARGIN}
              />
            ) : isCodeMode && isCodeTabActive ? (
              <BuilderCodeWorkspace
                appId={activeAppId}
                projectRef={activeProjectRef}
                projectRestUrl={project?.restUrl}
                connectionString={project?.connectionString ?? null}
                pages={pages}
                activePageId={activePageId}
                queries={queries}
                jsFunctions={jsFunctions}
                selection={codeSelection}
                onSelectItem={handleSelectCodeItem}
                onQueryRun={handleQueryRun}
              />
            ) : (
              <BuilderCanvas
                widgets={activePage?.widgets ?? []}
                globalWidgets={globalWidgets}
                pageGlobals={activePage?.pageGlobals ?? []}
                selectedWidgetId={selectedWidgetId}
                selectedGlobalWidgetId={selectedGlobalWidgetId}
                isPageComponentSelected={selectedPageComponent}
                evaluationContext={canvasEvaluationContext}
                pageComponent={activePage?.pageComponent}
                pageLabel={activePage ? `${activePage.name} Main` : 'Main'}
                onSelectWidget={(widgetId) => {
                  setSelectedWidgetId(widgetId)
                  setSelectedGlobalWidgetId(null)
                  setSelectedPageComponent(false)
                }}
                onOpenInspectorPanel={handleOpenInspectorPanel}
                onSelectGlobalWidget={(widgetId) => {
                  setSelectedGlobalWidgetId(widgetId)
                  setSelectedWidgetId(null)
                  setSelectedPageComponent(false)
                }}
                onSelectPageComponent={() => {
                  setSelectedWidgetId(null)
                  setSelectedGlobalWidgetId(null)
                  setSelectedPageComponent(true)
                }}
                onClearSelection={() => {
                  setSelectedWidgetId(null)
                  setSelectedGlobalWidgetId(null)
                  setSelectedPageComponent(false)
                }}
                onUpdateLayout={handleUpdateLayout}
                onUpdateWidgetLayout={handleUpdateWidgetLayout}
                onUpdateChildLayout={handleUpdateChildLayout}
                onUpdateGlobalChildLayout={handleUpdateGlobalChildLayout}
                onUpdatePageGlobalChildLayout={handleUpdatePageGlobalChildLayout}
                onDropWidget={handleDropWidget}
                onDropGlobalWidget={handleDropGlobalWidget}
                onDropPageGlobalWidget={handleDropPageGlobalWidget}
                onInsertAdjacentWidget={handleInsertAdjacentWidget}
                onUpdateGlobalWidgetLayout={handleUpdateGlobalWidgetLayout}
                onUpdatePageGlobalWidgetLayout={handleUpdatePageGlobalWidgetLayout}
                onSetGlobalWidgetHidden={handleSetGlobalWidgetHidden}
                availableWidgets={widgetRegistry}
                gridRowHeight={GRID_ROW_HEIGHT}
                gridMargin={GRID_MARGIN}
                showGrid={showGrid}
              />
            )}
            {!isPreviewing && !showInspector && (!isCodeMode || !isCodeTabActive) && (
              <div className="absolute right-4 top-4 z-10">
                <Button type="default" size="tiny" onClick={() => setShowInspector(true)}>
                  Inspector
                </Button>
              </div>
            )}
            </div>
          </div>
        </ResizablePanel>
        <ResizableHandle
          withHandle
          className={inspectorOpen ? undefined : 'opacity-0 pointer-events-none'}
        />
        <ResizablePanel
          ref={inspectorPanelRef}
          defaultSize={22}
          minSize={18}
          maxSize={34}
          collapsible
          collapsedSize={0}
        >
          {isCodeTabActive ? (
            <BuilderCodeOutputPanel result={lastQueryRun} />
          ) : (
            <div className="builder-panel h-full border-l border-foreground-muted/30 bg-surface-100">
              {!isPreviewing && (
                <>
                  <div className="builder-panel-header flex h-9 items-center justify-between border-b border-foreground-muted/30 bg-surface-200 px-3 text-[11px] font-semibold">
                    <div className="flex min-w-0 items-center gap-2">
                      {selectedWidget && SelectedWidgetIcon ? (
                        <div className="flex h-6 w-6 items-center justify-center rounded-md border border-foreground-muted/30 bg-surface-100">
                          <SelectedWidgetIcon size={14} className="text-foreground-muted" />
                        </div>
                      ) : (
                        <span>Inspector</span>
                      )}
                      {selectedWidget && (
                        <>
                          {isRenamingWidget ? (
                            <Input_Shadcn_
                              ref={renameInputRef}
                              value={renameDraft}
                              onChange={(event) => setRenameDraft(event.target.value)}
                              onBlur={commitWidgetRename}
                              onKeyDown={(event) => {
                                if (event.key === 'Enter') {
                                  event.preventDefault()
                                  commitWidgetRename()
                                }
                                if (event.key === 'Escape') {
                                  event.preventDefault()
                                  cancelWidgetRename()
                                }
                              }}
                              className="h-6 min-w-[120px] max-w-[180px] px-2 text-[11px]"
                            />
                          ) : (
                            <>
                              {isAddonPanelActive ? (
                                <div className="flex min-w-0 items-center gap-1 text-[11px] font-semibold">
                                  <button
                                    type="button"
                                    className="min-w-0 truncate text-foreground hover:text-foreground"
                                    onClick={() => setInspectorAddonPanel(null)}
                                  >
                                    {selectedWidget.id}
                                  </button>
                                  <span className="text-foreground-muted">{'>'}</span>
                                  <span className="min-w-0 truncate">
                                    {activeAddonPanel?.label}
                                  </span>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  className="min-w-0 truncate text-[11px] font-semibold text-foreground hover:text-foreground"
                                  onClick={startWidgetRename}
                                >
                                  {selectedWidget.id}
                                </button>
                              )}
                            </>
                          )}
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Popover_Shadcn_
                        open={inspectorMenuOpen}
                        onOpenChange={setInspectorMenuOpen}
                      >
                        <PopoverTrigger_Shadcn_ asChild>
                          <Button
                            type="text"
                            size="tiny"
                            icon={<MoreHorizontal size={14} />}
                            className="text-foreground-muted px-1"
                          />
                        </PopoverTrigger_Shadcn_>
                        <PopoverContent_Shadcn_ className="w-60 p-2" align="end" side="bottom">
                          <div className="flex items-center justify-between border-b border-foreground-muted/20 px-1 pb-2">
                            <span className="text-[12px] font-medium text-foreground">
                              {selectedDefinition?.label ?? 'Inspector'}
                            </span>
                            <Button
                              type="text"
                              size="tiny"
                              icon={<BookOpen size={14} />}
                              className="px-1 text-foreground-muted"
                              disabled
                              aria-label="Open documentation"
                            />
                          </div>
                          <div className="pt-2 space-y-1">
                            <button
                              type="button"
                              className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs text-foreground hover:bg-surface-200"
                              onClick={() => {
                                setActiveSection('state')
                                setShowSidebar(true)
                                setInspectorMenuOpen(false)
                              }}
                            >
                              <span>View state</span>
                            </button>
                            <button
                              type="button"
                              className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs text-foreground-muted/60"
                              disabled
                              data-has-clipboard={hasClipboardWidget ? 'true' : 'false'}
                            >
                              <span>Prompt Assist (Beta)</span>
                            </button>
                            <div className="my-1 h-px bg-foreground-muted/20" />
                            <button
                              type="button"
                              className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs text-foreground hover:bg-surface-200"
                              disabled={!selectedWidget}
                              onClick={() => {
                                handleCopyWidget()
                                setInspectorMenuOpen(false)
                              }}
                            >
                              <span>Copy</span>
                              <span className="text-[10px] text-foreground-muted">Cmd+C</span>
                            </button>
                            <button
                              type="button"
                              className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs text-foreground hover:bg-surface-200"
                              disabled={!selectedWidget}
                              onClick={() => {
                                handleCutWidget()
                                setInspectorMenuOpen(false)
                              }}
                            >
                              <span>Cut</span>
                              <span className="text-[10px] text-foreground-muted">Cmd+X</span>
                            </button>
                            <button
                              type="button"
                              className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs text-foreground hover:bg-surface-200"
                              disabled={!selectedWidget}
                              onClick={() => {
                                handleDuplicateWidget()
                                setInspectorMenuOpen(false)
                              }}
                            >
                              <span>Duplicate</span>
                              <span className="text-[10px] text-foreground-muted">Cmd+D</span>
                            </button>
                            <button
                              type="button"
                              className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs text-foreground-muted/60"
                              disabled
                            >
                              <span>Paste below</span>
                              <span className="text-[10px] text-foreground-muted">Cmd+V</span>
                            </button>
                            <button
                              type="button"
                              className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs text-foreground hover:bg-surface-200"
                              disabled={!selectedWidget}
                              onClick={() => {
                                startWidgetRename()
                                setInspectorMenuOpen(false)
                              }}
                            >
                              <span>Rename</span>
                            </button>
                            <div className="my-1 h-px bg-foreground-muted/20" />
                            <button
                              type="button"
                              className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs text-foreground-muted/60"
                              disabled
                            >
                              <span>Export to module</span>
                            </button>
                            <button
                              type="button"
                              className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs text-foreground-muted/60"
                              disabled
                            >
                              <span>Switch to ...</span>
                            </button>
                            <div className="my-1 h-px bg-foreground-muted/20" />
                            <button
                              type="button"
                              className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs text-foreground hover:bg-surface-200"
                              disabled={!selectedWidget}
                              onClick={() => {
                                handleResetWidgetState()
                                setInspectorMenuOpen(false)
                              }}
                            >
                              <span>Reset state</span>
                            </button>
                            <button
                              type="button"
                              className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs text-destructive-500 hover:bg-destructive-500/10"
                              disabled={!selectedWidget || !selectedWidgetMode}
                              onClick={() => {
                                if (!selectedWidgetMode) {
                                  return
                                }
                                handleDeleteWidget(
                                  selectedGlobalWidgetId ?? selectedWidgetId ?? '',
                                  selectedWidgetMode
                                )
                                setInspectorMenuOpen(false)
                              }}
                            >
                              <span>Delete</span>
                            </button>
                          </div>
                        </PopoverContent_Shadcn_>
                      </Popover_Shadcn_>
                      <Button
                        className="px-1"
                        type="text"
                        size="tiny"
                        icon={<X size={14} />}
                        onClick={() => setShowInspector(false)}
                      />
                    </div>
                  </div>
                  <div className="h-[calc(100%-64px)]">
                    {selectedWidget && selectedDefinition ? (
                      isOverlayWidget && overlayWidgetMode ? (
                        <BuilderOverlayInspector
                          widget={selectedWidget}
                          definition={selectedDefinition}
                          mode={overlayMode}
                          widgetMode={overlayWidgetMode}
                          eventTargets={eventTargets}
                          eventQueries={eventQueries}
                          eventScripts={eventScripts}
                          eventPages={eventPages}
                          eventApps={eventApps}
                          eventVariables={eventVariables}
                          onUpdateProps={handleUpdateProps}
                          onUpdateHidden={handleUpdateHidden}
                          onUpdateChildProps={handleUpdateOverlayChildProps}
                          onDelete={
                            selectedWidgetMode && (selectedGlobalWidgetId || selectedWidgetId)
                              ? () =>
                                  handleDeleteWidget(
                                    selectedGlobalWidgetId ?? selectedWidgetId ?? '',
                                    selectedWidgetMode
                                  )
                              : undefined
                          }
                        />
                      ) : (
                        <BuilderInspector
                          widget={selectedWidget}
                          definition={selectedDefinition}
                          search={inspectorSearch}
                          eventTargets={eventTargets}
                          eventQueries={eventQueries}
                          eventScripts={eventScripts}
                          eventPages={eventPages}
                          eventApps={eventApps}
                          eventVariables={eventVariables}
                          fxContextInfo={{
                            appName: activeApp?.name ?? '',
                            currentPage: activePage?.name ?? '',
                            pages: pages.map((page) => page.name),
                            currentUser,
                            localStorage: localStorageValues,
                            theme: themeState,
                            location: locationState,
                            viewport,
                            runningQueries,
                            queryResults,
                            widgetValues,
                          }}
                          activeAddonPanel={
                            activeAddonPanel
                              ? {
                                  key: activeAddonPanel.key,
                                  label: activeAddonPanel.label,
                                }
                              : null
                          }
                          onActiveAddonPanelChange={(panel) => {
                            if (!selectedWidgetId) {
                              setInspectorAddonPanel(null)
                              return
                            }
                            setInspectorAddonPanel(
                              panel ? { widgetId: selectedWidgetId, ...panel } : null
                            )
                          }}
                          onUpdateProps={handleUpdateProps}
                          onUpdateAccess={handleUpdateAccess}
                          onUpdateSpacing={handleUpdateSpacing}
                          onUpdateHidden={handleUpdateHidden}
                          onDelete={
                            selectedWidgetMode && (selectedGlobalWidgetId || selectedWidgetId)
                              ? () =>
                                  handleDeleteWidget(
                                    selectedGlobalWidgetId ?? selectedWidgetId ?? '',
                                    selectedWidgetMode
                                  )
                              : undefined
                          }
                        />
                      )
                    ) : selectedPageComponent ? (
                      <BuilderPageComponentInspector
                        page={activePage ?? null}
                        onUpdateComponent={handleUpdateActivePageComponent}
                      />
                    ) : (
                      <BuilderPageInspector
                        page={activePage ?? null}
                        pages={pages}
                        onUpdatePage={handleUpdateActivePage}
                        onUpdateMeta={handleUpdateActivePageMeta}
                        onUpdateMenu={handleUpdateActiveMenu}
                      />
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  </div>
  )
}

const resolvePageWidgets = (
  page: BuilderPageRecord,
  existing?: BuilderWidgetInstance[]
): BuilderWidgetInstance[] => {
  if (existing && existing.length > 0) {
    return existing.map(applyWidgetDefaults)
  }

  const layoutWidgets = (page.layout as { widgets?: BuilderWidgetInstance[] })?.widgets
  return Array.isArray(layoutWidgets) ? layoutWidgets.map(applyWidgetDefaults) : []
}

const resolvePageMeta = (page: BuilderPageRecord): BuilderPage['pageMeta'] => {
  const layoutMeta = (page.layout as { pageMeta?: BuilderPage['pageMeta'] } | undefined)?.pageMeta
  const fallbackTitle = page.name ?? 'Page'
  const fallbackUrl = slugifyPageUrl(fallbackTitle)
  return {
    title: layoutMeta?.title ?? fallbackTitle,
    browserTitle: layoutMeta?.browserTitle ?? fallbackTitle,
    url: layoutMeta?.url ?? fallbackUrl,
    searchParams: layoutMeta?.searchParams ?? [],
    hashParams: layoutMeta?.hashParams ?? [],
    shortcuts: layoutMeta?.shortcuts ?? [],
  }
}

const resolvePageComponent = (page: BuilderPageRecord): BuilderPage['pageComponent'] => {
  const layoutComponent =
    (page.layout as { pageComponent?: BuilderPage['pageComponent'] } | undefined)?.pageComponent ??
    null
  return {
    expandToFit: layoutComponent?.expandToFit ?? false,
    background: layoutComponent?.background ?? '',
    paddingMode: layoutComponent?.paddingMode ?? 'normal',
    paddingFxEnabled: layoutComponent?.paddingFxEnabled ?? false,
    paddingFx: layoutComponent?.paddingFx ?? '',
  }
}

const resolvePageGlobals = (page: BuilderPageRecord): BuilderWidgetInstance[] => {
  const layoutGlobals =
    (page.layout as { pageGlobals?: BuilderWidgetInstance[] } | undefined)?.pageGlobals
  return Array.isArray(layoutGlobals) ? layoutGlobals.map(applyWidgetDefaults) : []
}

const createGlobalId = (
  type: string,
  globals: BuilderWidgetInstance[],
  existingIds?: Set<string>
) => {
  const prefixMap: Record<string, string> = {
    GlobalHeader: 'header',
    GlobalSidebar: 'sidebar',
    GlobalDrawer: 'drawer',
    GlobalModal: 'modal',
    GlobalSplitPane: 'splitPane',
  }
  const prefix = prefixMap[type] ?? type.toLowerCase()
  if (existingIds) {
    return buildIndexedName(prefix, existingIds)
  }
  const count = globals.filter((widget) => widget.type === type).length + 1
  return `${prefix}${count}`
}

const CYRILLIC_TRANSLIT: Record<string, string> = {
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'g',
  д: 'd',
  е: 'e',
  ё: 'e',
  ж: 'zh',
  з: 'z',
  и: 'i',
  й: 'y',
  к: 'k',
  л: 'l',
  м: 'm',
  н: 'n',
  о: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ф: 'f',
  х: 'kh',
  ц: 'ts',
  ч: 'ch',
  ш: 'sh',
  щ: 'shch',
  ъ: '',
  ы: 'y',
  ь: '',
  э: 'e',
  ю: 'yu',
  я: 'ya',
  і: 'i',
  ї: 'yi',
  є: 'ye',
  ґ: 'g',
}

const transliterateCyrillic = (value: string) =>
  value
    .split('')
    .map((char) => {
      const lower = char.toLowerCase()
      return CYRILLIC_TRANSLIT[lower] ?? char
    })
    .join('')

const slugifyPageUrl = (value: string) => {
  const normalized = transliterateCyrillic(value)
  return (
    normalized
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'page'
  )
}

const GRID_COLUMNS = 12
const DEFAULT_WIDGET_LAYOUT = {
  w: 4,
  h: 6,
  minW: 2,
  minH: 3,
}
const AUTO_HEIGHT_MIN_H = 1

const applySpacingToLayout = (
  layout: BuilderWidgetInstance['layout'],
  spacing: BuilderWidgetSpacing
) => {
  if (!layout) {
    return layout
  }
  if (spacing.heightMode === 'auto') {
    return {
      ...layout,
      minH: AUTO_HEIGHT_MIN_H,
    }
  }
  return layout
}

const getDefaultWidgetLayout = (widgets: BuilderWidgetInstance[]) => {
  const columnSpan = DEFAULT_WIDGET_LAYOUT.w
  const columnsPerRow = Math.max(1, Math.floor(GRID_COLUMNS / columnSpan))
  const index = widgets.length
  const x = (index % columnsPerRow) * columnSpan
  const y = Math.floor(index / columnsPerRow) * DEFAULT_WIDGET_LAYOUT.h

  return {
    x,
    y,
    w: DEFAULT_WIDGET_LAYOUT.w,
    h: DEFAULT_WIDGET_LAYOUT.h,
    minW: DEFAULT_WIDGET_LAYOUT.minW,
    minH: DEFAULT_WIDGET_LAYOUT.minH,
  }
}

const resolveWidgetLayout = (
  widget: BuilderWidgetInstance,
  widgets: BuilderWidgetInstance[]
) => {
  const fallback = getDefaultWidgetLayout(widgets)
  const layout = widget.layout ?? fallback
  return {
    x: layout.x ?? fallback.x,
    y: layout.y ?? fallback.y,
    w: layout.w ?? fallback.w,
    h: layout.h ?? fallback.h,
    minW: layout.minW ?? fallback.minW,
    minH: layout.minH ?? fallback.minH,
    maxW: layout.maxW,
    maxH: layout.maxH,
  }
}

const applyWidgetDefaults = (widget: BuilderWidgetInstance): BuilderWidgetInstance => {
  const spacing = resolveWidgetSpacing(widget.type, widget.spacing)
  const layout = widget.layout ? applySpacingToLayout(widget.layout, spacing) : widget.layout
  const children = widget.children?.map(applyWidgetDefaults)

  return {
    ...widget,
    spacing,
    layout,
    children,
  }
}

const extractGlobalWidgets = (pages: BuilderPageRecord[]): BuilderWidgetInstance[] => {
  for (const page of pages) {
    const globals = (page.layout as { globals?: BuilderWidgetInstance[] } | undefined)?.globals
    if (Array.isArray(globals) && globals.length > 0) {
      return globals.map(applyWidgetDefaults)
    }
  }
  return []
}

const findWidgetById = (
  widgets: BuilderWidgetInstance[],
  widgetId: string
): BuilderWidgetInstance | null => {
  for (const widget of widgets) {
    if (widget.id === widgetId) {
      return widget
    }
    if (widget.children && widget.children.length > 0) {
      const match = findWidgetById(widget.children, widgetId)
      if (match) {
        return match
      }
    }
  }
  return null
}

const flattenWidgets = (
  widgets: BuilderWidgetInstance[]
): BuilderWidgetInstance[] => {
  return widgets.flatMap((widget) => [
    widget,
    ...(widget.children ? flattenWidgets(widget.children) : []),
  ])
}

const updateWidgetById = (
  widgets: BuilderWidgetInstance[],
  widgetId: string,
  updater: (widget: BuilderWidgetInstance) => BuilderWidgetInstance
): BuilderWidgetInstance[] => {
  return widgets.map((widget) => {
    if (widget.id === widgetId) {
      return updater(widget)
    }
    if (widget.children && widget.children.length > 0) {
      return {
        ...widget,
        children: updateWidgetById(widget.children, widgetId, updater),
      }
    }
    return widget
  })
}

const removeWidgetById = (
  widgets: BuilderWidgetInstance[],
  widgetId: string
): BuilderWidgetInstance[] => {
  return widgets.flatMap((widget) => {
    if (widget.id === widgetId) {
      return []
    }
    if (widget.children && widget.children.length > 0) {
      const nextChildren = removeWidgetById(widget.children, widgetId)
      return [
        {
          ...widget,
          children: nextChildren.length > 0 ? nextChildren : undefined,
        },
      ]
    }
    return [widget]
  })
}

const addChildWidget = (
  widgets: BuilderWidgetInstance[],
  parentId: string,
  child: BuilderWidgetInstance
): BuilderWidgetInstance[] => {
  return widgets.map((widget) => {
    if (widget.id === parentId) {
      const existingChildren = widget.children ? [...widget.children] : []
      return {
        ...widget,
        children: [...existingChildren, child],
      }
    }
    if (widget.children && widget.children.length > 0) {
      return {
        ...widget,
        children: addChildWidget(widget.children, parentId, child),
      }
    }
    return widget
  })
}

const insertAdjacentWidget = (
  widgets: BuilderWidgetInstance[],
  targetId: string,
  position: 'above' | 'below',
  newWidget: BuilderWidgetInstance
): [BuilderWidgetInstance[], boolean] => {
  let inserted = false
  let insertedLayout: BuilderWidgetInstance['layout'] | null = null

  const nextWidgets = widgets.flatMap((widget) => {
    if (widget.id === targetId) {
      inserted = true
      const targetLayout = resolveWidgetLayout(widget, widgets)
      const baseX = targetLayout.x
      const baseY = targetLayout.y
      const baseW = targetLayout.w
      const baseH = targetLayout.h
      const newY = position === 'above' ? Math.max(0, baseY - baseH) : baseY + baseH
      const spacing = resolveWidgetSpacing(newWidget.type, newWidget.spacing)

      const widgetWithLayout = {
        ...newWidget,
        layout: {
          x: baseX,
          y: newY,
          w: baseW,
          h: DEFAULT_WIDGET_LAYOUT.h,
          minW: DEFAULT_WIDGET_LAYOUT.minW,
          minH: DEFAULT_WIDGET_LAYOUT.minH,
        },
        spacing,
      }
      widgetWithLayout.layout = applySpacingToLayout(widgetWithLayout.layout, spacing)
      insertedLayout = widgetWithLayout.layout

      return position === 'above' ? [widgetWithLayout, widget] : [widget, widgetWithLayout]
    }

    if (widget.children && widget.children.length > 0) {
      const [nextChildren, childInserted] = insertAdjacentWidget(
        widget.children,
        targetId,
        position,
        newWidget
      )
      if (childInserted) {
        inserted = true
        return [{ ...widget, children: nextChildren }]
      }
    }

    return [widget]
  })

  if (inserted && insertedLayout) {
    return [
      shiftWidgetsForInsert(nextWidgets, newWidget.id, targetId, insertedLayout),
      true,
    ]
  }

  return [nextWidgets, inserted]
}

const shiftWidgetsForInsert = (
  widgets: BuilderWidgetInstance[],
  insertedId: string,
  targetId: string,
  insertedLayout: BuilderWidgetInstance['layout']
): BuilderWidgetInstance[] => {
  if (!insertedLayout) {
    return widgets
  }

  const insertedTop = insertedLayout.y ?? 0
  const insertedHeight = insertedLayout.h ?? DEFAULT_WIDGET_LAYOUT.h
  const insertedBottom = insertedTop + insertedHeight
  const insertedLeft = insertedLayout.x ?? 0
  const insertedRight = insertedLeft + (insertedLayout.w ?? DEFAULT_WIDGET_LAYOUT.w)

  return widgets.map((widget) => {
    if (widget.id === insertedId || widget.id === targetId) {
      return widget
    }

    const layout = resolveWidgetLayout(widget, widgets)
    const widgetLeft = layout.x
    const widgetRight = layout.x + layout.w
    const overlapsX = widgetLeft < insertedRight && widgetRight > insertedLeft
    const isBelow = layout.y >= insertedBottom

    if (overlapsX && isBelow) {
      return {
        ...widget,
        layout: {
          ...layout,
          y: layout.y + insertedHeight,
        },
      }
    }

    return widget
  })
}

const reorderWidgetInList = (
  widgets: BuilderWidgetInstance[],
  activeId: string,
  overId: string
) => {
  const fromIndex = widgets.findIndex((widget) => widget.id === activeId)
  const toIndex = widgets.findIndex((widget) => widget.id === overId)
  if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
    return widgets
  }
  const nextWidgets = [...widgets]
  const [moved] = nextWidgets.splice(fromIndex, 1)
  nextWidgets.splice(toIndex, 0, moved)
  return nextWidgets
}

const reorderWidgetInTree = (
  widgets: BuilderWidgetInstance[],
  activeId: string,
  overId: string,
  parentId: string | null
) => {
  if (!parentId) {
    return reorderWidgetInList(widgets, activeId, overId)
  }

  return updateWidgetById(widgets, parentId, (parent) => {
    if (!parent.children || parent.children.length === 0) {
      return parent
    }
    return {
      ...parent,
      children: reorderWidgetInList(parent.children, activeId, overId),
    }
  })
}

const collectPolicyKeys = (
  pages: BuilderPage[],
  globalWidgets: BuilderWidgetInstance[]
) => {
  const keys = new Set<string>()

  collectWidgetPolicyKeys(globalWidgets, keys)
  pages.forEach((page) => {
    collectWidgetPolicyKeys(page.pageGlobals ?? [], keys)
    collectWidgetPolicyKeys(page.widgets, keys)
    collectMenuKeys(page.menu?.items ?? [], keys)
  })

  return Array.from(keys)
}

const collectWidgetPolicyKeys = (widgets: BuilderWidgetInstance[], keys: Set<string>) => {
  widgets.forEach((widget) => {
    addPolicyKeys(widget.policy, keys)
    if (widget.children && widget.children.length > 0) {
      collectWidgetPolicyKeys(widget.children, keys)
    }
  })
}

const addPolicyKeys = (policy: string[] | string | undefined, keys: Set<string>) => {
  if (Array.isArray(policy)) {
    policy
      .map((entry) => entry.trim())
      .filter(Boolean)
      .forEach((entry) => keys.add(entry))
    return
  }

  if (typeof policy === 'string') {
    const trimmed = policy.trim()
    if (trimmed) {
      keys.add(trimmed)
    }
  }
}

const collectMenuKeys = (items: BuilderMenuItem[], keys: Set<string>) => {
  items.forEach((item) => {
    addPolicyKeys(item.policy, keys)
    if (item.items && item.items.length > 0) {
      collectMenuKeys(item.items, keys)
    }
  })
}
