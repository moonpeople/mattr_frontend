import { type SetStateAction, useCallback, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import { useForm } from 'react-hook-form'
import { parseAsString, useQueryState } from 'nuqs'
import { useDebounce } from '@uidotdev/usehooks'
import type { Layout } from 'react-grid-layout'

import { LOCAL_STORAGE_KEYS, useParams, useUser } from 'common'
import { widgetRegistry } from 'widgets/runtime'
import { ImperativePanelHandle } from 'ui'

import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import type {
  BuilderAppLayout,
  BuilderPageFrames,
  BuilderPage,
  BuilderSection,
  BuilderWidgetInstance,
} from './types'
import {
  createAppLayoutFromWidgets,
  createEmptyAppLayout,
  getAppLayoutWidgets,
  isFrameType,
} from './types'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { useAiAssistantState } from 'state/ai-assistant-state'
import type { BuilderAppTheme } from 'state/app-theme-state'
import { slugifyWithFallback } from './utils/slugify'
import {
  applyPageFrames,
  applyPageWidgets,
  resolvePageFramesState,
  resolvePageMainState,
  resolvePageWidgetsState,
  updatePageById,
} from './utils/layout-slots'
import { resolveAppMeta } from './shell/layout-ops'
import {
  buildWidgetIdFromSet,
  collectExistingWidgetIds,
} from './shell/widget-tree-utils'
import {
  useBuilderShellAppCatalogOps,
  useBuilderShellActionProps,
  useBuilderShellAssistantSync,
  useBuilderShellBootstrap,
  useBuilderShellCatalogState,
  useBuilderShellCatalogViewProps,
  useBuilderShellCodeOps,
  useBuilderShellCodeItemOps,
  useBuilderShellData,
  useBuilderShellDerivedState,
  useBuilderShellInspectorPaneProps,
  useBuilderShellPreviewPublishOps,
  useBuilderShellRenderState,
  useBuilderShellDialogs,
  useBuilderShellFrameOps,
  useBuilderShellInspectorEffects,
  useBuilderShellPageOps,
  useBuilderShellPanelSync,
  useBuilderShellRootScreenId,
  useBuilderShellRuntimeContexts,
  useBuilderShellSelectedWidgetState,
  useBuilderShellSelection,
  useBuilderShellThemeSync,
  useBuilderShellUiOps,
  useBuilderShellViewProps,
  useBuilderShellWidgetCreateOps,
  useBuilderShellWidgetEditOps,
  useBuilderShellWidgetOps,
} from './shell/hooks'
import { BuilderShellView } from './shell/components/BuilderShellView'

// Основная оболочка билдера: состояние приложения, загрузка данных и режимы.

const GRID_ROW_HEIGHT = 8
const GRID_MARGIN = 0
const CANVAS_TAB_ID = 'canvas'
const BUILDER_APPS_VIEW_LOCAL_STORAGE_KEY = 'builder-apps-view'
const BUILDER_DRAFT_AUTOSAVE_ENABLED =
  process.env.NEXT_PUBLIC_BUILDER_DRAFT_AUTOSAVE === 'true'

export const BuilderShell = () => {
  const pageCreateRequested = useRef(false)
  const sidebarPanelRef = useRef<ImperativePanelHandle>(null)
  const sidebarPreviousSizeRef = useRef<number | null>(null)
  const inspectorPanelRef = useRef<ImperativePanelHandle>(null)
  const renameInputRef = useRef<HTMLInputElement | null>(null)

  const { ref: projectRef, appId: appIdParam } = useParams()
  const router = useRouter()
  const { data: organization } = useSelectedOrganizationQuery()
  const { data: organizations = [], isPending: isOrganizationsLoading } = useOrganizationsQuery()
  const aiAssistantState = useAiAssistantState()
  const user = useUser()

  const [appName, setAppName] = useState('New interface')
  const [pages, setPages] = useState<BuilderPage[]>([])
  const [inspectorMenuOpen, setInspectorMenuOpen] = useState(false)
  const [inspectorSearch, setInspectorSearch] = useState('')
  const [headerActionsRoot, setHeaderActionsRoot] = useState<HTMLElement | null>(null)
  const {
    isPreviewing,
    setIsPreviewing,
    isCreateOpen,
    setIsCreateOpen,
    isPublishDialogOpen,
    setIsPublishDialogOpen,
  } = useBuilderShellDialogs()
  const [viewport, setViewport] = useState({ width: 0, height: 0 })
  const [activeSection, setActiveSection] = useState<BuilderSection | null>('components')
  const [appLayout, setAppLayout] = useState<BuilderAppLayout>(() => createEmptyAppLayout())
  const appFrameWidgets = useMemo(() => getAppLayoutWidgets(appLayout), [appLayout])
  const setAppFrameWidgets = useCallback(
    (updater: SetStateAction<BuilderWidgetInstance[]>) => {
      setAppLayout((prevLayout) => {
        const prevWidgets = getAppLayoutWidgets(prevLayout)
        const nextWidgets =
          typeof updater === 'function'
            ? (updater as (prev: BuilderWidgetInstance[]) => BuilderWidgetInstance[])(prevWidgets)
            : updater
        return createAppLayoutFromWidgets(nextWidgets)
      })
    },
    []
  )
  const {
    activePage,
    activePageFrameWidgets,
    activePageId,
    setActivePageId,
    selectedNode,
    setSelectedNode,
    inspectorAddonPanel,
    setInspectorAddonPanel,
    resolveCurrentPageId,
    clearWidgetSelection,
    selectPageNode,
    selectMainNode,
    selectMainWidgetNode,
    selectFrameNode,
  } = useBuilderShellSelection({
    pages,
    appFrameWidgets,
  })
  const updatePageLayoutSlotById = useCallback(
    (targetPageId: string, updater: (page: BuilderPage) => BuilderPage) => {
      setPages((prev) => updatePageById(prev, targetPageId, updater))
    },
    []
  )
  const updatePageWidgetSlotById = useCallback(
    (
      targetPageId: string,
      updater: (widgets: BuilderWidgetInstance[]) => BuilderWidgetInstance[]
    ) => {
      updatePageLayoutSlotById(targetPageId, (page) =>
        applyPageWidgets(page, updater(resolvePageWidgetsState(page)))
      )
    },
    [updatePageLayoutSlotById]
  )
  const updatePageFrameSlotById = useCallback(
    (
      targetPageId: string,
      updater: (frames: BuilderPageFrames) => BuilderPageFrames
    ) => {
      updatePageLayoutSlotById(targetPageId, (page) =>
        applyPageFrames(page, updater(resolvePageFramesState(page)))
      )
    },
    [updatePageLayoutSlotById]
  )
  const [search, setSearch] = useQueryState('search', parseAsString.withDefault(''))
  const debouncedSearch = useDebounce(search, 300)
  const [viewMode, setViewMode] = useLocalStorageQuery(
    BUILDER_APPS_VIEW_LOCAL_STORAGE_KEY,
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
  const isCodeMode = activeSection === 'code'
  const createOrgSlug = organization?.slug ?? selectedOrgSlug

  const {
    apps,
    isAppsLoading,
    activeApp,
    activeAppId,
    activeProjectRef,
    project,
    draftData,
    isDraftLoading,
    remotePages,
    isPagesLoading,
    createAppMutation,
    updateAppMutation,
    createPageMutation,
    deletePageMutation,
    queries,
    createQueryMutation,
    updateQueryMutation,
    jsFunctions,
    createJsMutation,
    updateJsMutation,
    runtimeData,
    publishRuntimeMutation,
    upsertDraftMutation,
  } = useBuilderShellData({
    projectRef,
    appIdParam,
    isPreviewing,
    onCreatePageSuccess: (page) => {
      setActivePageId(page.id)
      setSelectedNode({ kind: 'page', pageId: page.id })
    },
  })
  const persistAppTheme = useCallback(
    (theme: BuilderAppTheme) => {
      if (!activeAppId) {
        return
      }
      updateAppMutation.mutate({ appId: activeAppId, theme })
    },
    [activeAppId, updateAppMutation]
  )
  const { appTheme, normalizedTheme, appThemeCssVars } = useBuilderShellThemeSync({
    activeAppId,
    activeAppTheme: activeApp?.theme,
    persistTheme: persistAppTheme,
  })
  const {
    lastQueryRun,
    setLastQueryRun,
    queryRuns,
    codeSelection,
    setCodeSelection,
    codeTabs,
    activeCodeTabId,
    handleQueryRun,
    handleSelectCodeItem,
    handleSelectCodeTab,
    handleCloseCodeTab,
  } = useBuilderShellCodeOps({
    activeAppId,
    queries,
    jsFunctions,
    canvasTabId: CANVAS_TAB_ID,
  })
  const isCodeTabActive = isCodeMode && activeCodeTabId !== CANVAS_TAB_ID
  const inspectorOpen =
    (isCodeMode ? isCodeTabActive || showInspector : showInspector) && !isPreviewing
  const isSettingsSection = activeSection === 'settings'

  useBuilderShellPanelSync({
    showSidebar,
    inspectorOpen,
    isSettingsSection,
    sidebarPanelRef,
    inspectorPanelRef,
    sidebarPreviousSizeRef,
  })

  const createForm = useForm<{ name: string; orgSlug: string }>({
    defaultValues: { name: '', orgSlug: '' },
  })
  const formOrgSlug = createForm.watch('orgSlug')
  const navigateToCreatedApp = useCallback(
    (app: { id: string }) => {
      void router.push(
        projectRef ? `/builder?ref=${projectRef}&appId=${app.id}` : `/builder?appId=${app.id}`
      )
    },
    [projectRef, router]
  )
  const {
    canOpenCreateApp,
    canSubmitCreateApp,
    fullFormHref,
    handleCreateApp,
  } = useBuilderShellAppCatalogOps({
    organizationSlug: organization?.slug,
    organizationsCount: organizations.length,
    formOrgSlug,
    projectRef,
    setIsCreateOpen,
    resetCreateForm: createForm.reset,
    createAppMutation,
    navigateToBuilderApp: navigateToCreatedApp,
  })

  useBuilderShellBootstrap({
    organizationSlug: organization?.slug,
    selectedOrgSlug,
    setSelectedOrgSlug,
    lastVisitedOrgSlug,
    organizations,
    appIdParam,
    setHeaderActionsRoot,
    setViewport,
    isCreateOpen,
    projectName: project?.name,
    createOrgSlug,
    resetCreateForm: createForm.reset,
    activeAppId,
    activeAppName: activeApp?.name,
    setAppName,
    setIsPublishDialogOpen,
    isPagesLoading,
    remotePages,
    createPageMutation,
    pageCreateRequestedRef: pageCreateRequested,
    draftAppLayout: draftData?.schema?.appLayout,
    setAppLayout,
    pages,
    setPages,
    activePageId,
    setActivePageId,
    selectedNode,
    setSelectedNode,
    isPreviewing,
  })
  const activePageWidgets = resolvePageWidgetsState(activePage)
  const activePageFrames = resolvePageFramesState(activePage)
  const activePageMain = resolvePageMainState(activePage)
  const appMeta = useMemo(
    () => resolveAppMeta(activePage ?? pages[0], activeApp?.name),
    [activeApp?.name, activePage, pages]
  )
  const {
    builderAssistantContext,
    eventTargets,
    eventQueries,
    eventVariables,
    eventScripts,
    eventPages,
    eventApps,
    inspectorFxContextInfo,
    canvasEvaluationContext,
  } = useBuilderShellRuntimeContexts({
    activeAppId,
    activeAppName: activeApp?.name,
    activeAppOrgSlug: activeApp?.orgSlug,
    appName,
    appUrl: appMeta?.url,
    organizationSlug: organization?.slug,
    activePage,
    pages,
    apps,
    queries,
    queryRuns,
    jsFunctions,
    appFrameWidgets,
    activePageFrameWidgets,
    activePageWidgets,
    user,
    viewport,
    normalizedThemeMode: normalizedTheme.mode,
    routerAsPath: router.asPath,
  })
  useBuilderShellAssistantSync({
    activeAppId,
    activeAppOrgSlug: activeApp?.orgSlug,
    organizationSlug: organization?.slug,
    builderAssistantContext,
    setAssistantContext: aiAssistantState.setContext,
  })
  const rootScreenId = useBuilderShellRootScreenId(pages)

  const {
    selectedWidgetId,
    selectedFrameWidgetId,
    selectedPageMain,
    selectedWidgetMode,
    selectedWidget,
    selectedWidgetParent,
    selectedWidgetIcon: SelectedWidgetIcon,
    selectedDefinition,
    activeAddonPanel,
    isAddonPanelActive,
    overlayMode,
    overlayWidgetMode,
    inspectorRoute,
    isInspectorSearchEnabled,
  } = useBuilderShellSelectedWidgetState({
    selectedNode,
    activePageWidgets,
    appFrameWidgets,
    activePageFrameWidgets,
    inspectorAddonPanel,
  })
  const {
    targetPageForFrameOps,
    canDuplicateSelectedWidget,
    runtimePayload,
    previewPolicies,
  } = useBuilderShellDerivedState({
    activePage,
    activePageId,
    pages,
    appLayout,
    appFrameWidgets,
    selectedWidget,
    selectedWidgetMode,
    activeApp,
    queries,
    jsFunctions,
    normalizedTheme,
    runtimeData,
  })
  const {
    autosave,
    handleOpenPreview,
    handleConfirmPublish,
    handleOpenPublishDialog,
    isSaving,
    isPublishing,
    isPublishDisabled,
    isPreviewDisabled,
    draftStatus,
  } = useBuilderShellPreviewPublishOps({
    autosaveEnabled: BUILDER_DRAFT_AUTOSAVE_ENABLED,
    appId: activeAppId,
    projectRef: activeProjectRef,
    pageId: activePageId,
    runtimePayload,
    draftSchema: draftData?.schema,
    isDraftLoading,
    isPagesLoading,
    remotePagesCount: remotePages.length,
    localPagesCount: pages.length,
    isDraftPersisting: upsertDraftMutation.isPending,
    upsertDraft: upsertDraftMutation.mutateAsync,
    publishRuntimeMutation,
    isAppUpdating: updateAppMutation.isPending,
    setIsPreviewing,
    setIsPublishDialogOpen,
    router,
  })
  const { normalizedSearch, sortedApps, noSearchResults } = useBuilderShellCatalogState({
    apps,
    debouncedSearch,
  })
  const catalogProps = useBuilderShellCatalogViewProps({
    apps,
    sortedApps,
    normalizedSearch,
    noSearchResults,
    search,
    setSearch,
    viewMode: viewMode as 'grid' | 'table',
    setViewMode: setViewMode as ((value: 'grid' | 'table') => void) | undefined,
    canOpenCreateApp,
    canSubmitCreateApp,
    fullFormHref,
    projectRef,
    isCreateOpen,
    setIsCreateOpen,
    createForm,
    onCreateApp: handleCreateApp,
    createAppPending: createAppMutation.isPending,
    createAppErrorMessage: createAppMutation.error?.message,
    organizations,
    isOrganizationsLoading,
    setSelectedOrgSlug,
  })

  const getExistingWidgetIds = useCallback(
    () => collectExistingWidgetIds(pages, appFrameWidgets),
    [pages, appFrameWidgets]
  )
  const buildWidgetId = useCallback(
    (widgetType: string, existingIds?: Set<string>) =>
      buildWidgetIdFromSet(widgetType, existingIds ?? getExistingWidgetIds()),
    [getExistingWidgetIds]
  )
  const {
    resolveWidgetProps,
    isWidgetPresetCompatible,
    handleAddWidget,
    handleAddWidgetAtRoot,
  } = useBuilderShellWidgetCreateOps({
    activePageId,
    activePage,
    pages,
    activePageWidgets,
    selectedWidgetId,
    updatePageWidgetSlotById,
    setActivePageId,
    selectMainWidgetNode,
    buildWidgetId,
  })

  const {
    updateAppFrameWidget,
    updatePageFrameWidget,
    updateWidget,
    handleUpdateProps,
    handleUpdateWidgetPropsById,
    handleUpdateAccess,
    handleUpdateSpacing,
    handleUpdateHidden,
    handleToggleWidgetHidden,
    handleUpdateOverlayChildProps,
    handleSetFrameWidgetHidden,
    handleDeleteWidget,
    handleReorderWidget,
    handleUpdateLayout,
    handleUpdateWidgetLayout,
    handleDropWidget,
    handleUpdateChildLayout,
    handleUpdateAppFrameChildLayout,
    handleUpdatePageFrameChildLayout,
    handleInsertAdjacentWidget,
    handleMoveWidgetAdjacent,
    handleMoveWidgetToContainer,
    handleMoveWidgetToPageRoot,
    handleUpdateAppFrameWidgetLayout,
    handleUpdatePageFrameWidgetLayout,
    handleDropAppFrameWidget,
    handleDropPageFrameWidget,
  } = useBuilderShellWidgetOps({
    pages,
    activePage,
    activePageId,
    appFrameWidgets,
    activePageFrameWidgets,
    selectedWidget,
    selectedWidgetMode,
    setAppFrameWidgets,
    updatePageWidgetSlotById,
    updatePageFrameSlotById,
    updatePageLayoutSlotById,
    clearWidgetSelection,
    selectMainWidgetNode,
    selectFrameNode,
    resolveWidgetProps,
    buildWidgetId,
    isWidgetPresetCompatible,
  })
  const onDeleteSelectedWidget =
    selectedWidgetMode && (selectedFrameWidgetId || selectedWidgetId)
      ? () =>
          handleDeleteWidget(
            selectedFrameWidgetId ?? selectedWidgetId ?? '',
            selectedWidgetMode
          )
      : undefined
  const hasClipboardWidget = Boolean(widgetClipboard)

  useBuilderShellInspectorEffects({
    selectedWidgetId,
    selectedFrameWidgetId,
    selectedWidgetMode,
    selectedPageMain,
    selectedNode,
    isPreviewing,
    selectedWidgetCurrentId: selectedWidget?.id ?? null,
    isRenamingWidget,
    renameInputRef,
    setIsRenamingWidget,
    setRenameDraft,
    isInspectorSearchEnabled,
    setInspectorSearch,
    deleteWidget: handleDeleteWidget,
  })

  const { handleAddCodeItem, handleMoveCodeItem } = useBuilderShellCodeItemOps({
    activeAppId,
    activePageId,
    queries,
    jsFunctions,
    setCodeSelection,
    createQueryMutation,
    updateQueryMutation,
    createJsMutation,
    updateJsMutation,
  })

  const {
    startWidgetRename,
    cancelWidgetRename,
    commitWidgetRename,
    handleCopyWidget,
    handleCutWidget,
    handleDuplicateWidget,
    handleResetWidgetState,
  } = useBuilderShellWidgetEditOps({
    selectedWidget,
    selectedWidgetMode,
    selectedDefinition,
    renameDraft,
    activePageId,
    pages,
    appLayout,
    targetPageForFrameOps,
    setPages,
    setAppFrameWidgets,
    setInspectorAddonPanel,
    setWidgetClipboard,
    setIsRenamingWidget,
    setRenameDraft,
    selectFrameNode,
    selectMainWidgetNode,
    updatePageFrameSlotById,
    updatePageWidgetSlotById,
    updateAppFrameWidget,
    updatePageFrameWidget,
    updateWidget,
    handleDeleteWidget,
    getExistingWidgetIds,
  })

  const {
    isSidebarWidgetSelectable,
    handleAddAppFrameComponent,
    handleAddPageFrameComponent,
  } = useBuilderShellFrameOps({
    appLayout,
    activePageFrames,
    activePage,
    activePageId,
    pages,
    appFrameWidgets,
    setAppFrameWidgets,
    updatePageFrameSlotById,
    setActivePageId,
    getExistingWidgetIds,
    buildWidgetId,
  })

  const {
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
  } = useBuilderShellPageOps({
    activeAppId,
    activeAppName: activeApp?.name,
    appName,
    activePageId,
    activePage,
    pages,
    runtimePayload,
    saveDraftNow: autosave.saveNow,
    createPageMutation,
    deletePageMutation,
    updateAppMutation,
    setPages,
    setActivePageId,
    setSelectedNode,
    updatePageLayoutSlotById,
  })

  const {
    canDeleteSelectedWidget,
    handleOpenInspectorPanel,
    handleSelectSection,
    handleCloseSidebar,
    handleShowInspector,
    handleHideInspector,
    handleOpenInspectorStatePanel,
    handleDeleteSelectedWidgetFromMenu,
    handleWidgetInspectorAddonPanelChange,
  } = useBuilderShellUiOps({
    activePageFrameWidgets,
    appFrameWidgets,
    selectedNode,
    selectedWidgetId,
    selectedFrameWidgetId,
    selectedWidgetMode,
    setShowSidebar,
    setActiveSection,
    setShowInspector,
    setInspectorAddonPanel,
    selectFrameNode,
    selectMainWidgetNode,
    handleDeleteWidget,
  })
  const { sidebarActionProps, canvasActionProps } = useBuilderShellActionProps({
    onAddAppFrameWidget: handleAddAppFrameComponent,
    onSetRootScreen: handleSetRootScreen,
    onSelectPage: selectPageNode,
    onSelectWidget: selectMainWidgetNode,
    onSelectFrameWidget: selectFrameNode,
    onSelectPageMain: selectMainNode,
    onAddPageFrameWidget: handleAddPageFrameComponent,
    onToggleWidgetHidden: handleToggleWidgetHidden,
    onReorderWidget: handleReorderWidget,
    onAddWidgetAtRoot: handleAddWidgetAtRoot,
    isWidgetSelectable: isSidebarWidgetSelectable,
    onAddPage: handleAddPage,
    onDeletePage: handleDeletePage,
    onAddWidget: handleAddWidget,
    onQueryRun: handleQueryRun,
    onSelectCodeItem: handleSelectCodeItem,
    onAddCodeItem: handleAddCodeItem,
    onMoveCodeItem: handleMoveCodeItem,
    onAppNameChange: setAppName,
    onCloseSidebar: handleCloseSidebar,
    onOpenInspectorPanel: handleOpenInspectorPanel,
    onSelectApp: handleSelectAppSettings,
    onUpdateLayout: handleUpdateLayout,
    onUpdateWidgetLayout: handleUpdateWidgetLayout,
    onUpdateChildLayout: handleUpdateChildLayout,
    onUpdateAppFrameChildLayout: handleUpdateAppFrameChildLayout,
    onUpdatePageFrameChildLayout: handleUpdatePageFrameChildLayout,
    onDropWidget: handleDropWidget,
    onDropAppFrameWidget: handleDropAppFrameWidget,
    onDropPageFrameWidget: handleDropPageFrameWidget,
    onInsertAdjacentWidget: handleInsertAdjacentWidget,
    onMoveWidgetAdjacent: handleMoveWidgetAdjacent,
    onMoveWidgetToContainer: handleMoveWidgetToContainer,
    onMoveWidgetToPageRoot: handleMoveWidgetToPageRoot,
    onUpdateAppFrameWidgetLayout: handleUpdateAppFrameWidgetLayout,
    onUpdatePageFrameWidgetLayout: handleUpdatePageFrameWidgetLayout,
    onUpdateWidgetProps: handleUpdateWidgetPropsById,
    onSetFrameWidgetHidden: handleSetFrameWidgetHidden,
  })
  const appInspectorProps = {
    appId: activeAppId ?? null,
    appName: activeApp?.name ?? appName,
    activePage: activePage ?? null,
    appMeta,
    onUpdateMeta: handleUpdateAppMeta,
  }
  const pageComponentInspectorProps = {
    page: activePage ?? null,
    onUpdateComponent: handleUpdateActivePageMain,
  }
  const pageInspectorProps = {
    page: activePage ?? null,
    pages,
    onUpdatePage: handleUpdateActivePage,
    onUpdateMeta: handleUpdateActivePageMeta,
    onUpdateMenu: handleUpdateActiveMenu,
  }
  const inspectorPaneProps = useBuilderShellInspectorPaneProps({
    isPreviewing,
    selectedWidget,
    selectedWidgetIcon: SelectedWidgetIcon,
    isRenamingWidget,
    renameInputRef,
    renameDraft,
    setRenameDraft,
    onCommitWidgetRename: commitWidgetRename,
    onCancelWidgetRename: cancelWidgetRename,
    isAddonPanelActive,
    activeAddonPanel: activeAddonPanel
      ? { key: activeAddonPanel.key, label: activeAddonPanel.label }
      : null,
    setInspectorAddonPanel,
    onStartWidgetRename: startWidgetRename,
    inspectorMenuOpen,
    setInspectorMenuOpen,
    selectedDefinitionLabel: selectedDefinition?.label,
    hasClipboardWidget,
    canDuplicateSelectedWidget,
    canDeleteSelectedWidget,
    onOpenStatePanel: handleOpenInspectorStatePanel,
    onCopyWidget: handleCopyWidget,
    onCutWidget: handleCutWidget,
    onDuplicateWidget: handleDuplicateWidget,
    onResetWidgetState: handleResetWidgetState,
    onDeleteWidget: handleDeleteSelectedWidgetFromMenu,
    onCloseInspector: handleHideInspector,
    route: inspectorRoute,
    selectedDefinition,
    selectedWidgetParent,
    search: inspectorSearch,
    overlayMode,
    overlayWidgetMode,
    eventTargets,
    eventQueries,
    eventScripts,
    eventPages,
    eventApps,
    eventVariables,
    fxContextInfo: inspectorFxContextInfo,
    onUpdateProps: handleUpdateProps,
    onUpdateAccess: handleUpdateAccess,
    onUpdateSpacing: handleUpdateSpacing,
    onUpdateHidden: handleUpdateHidden,
    onUpdateChildProps: handleUpdateOverlayChildProps,
    onDeleteSelectedWidget,
    onActiveAddonPanelChange: handleWidgetInspectorAddonPanelChange,
    appInspectorProps,
    pageComponentInspectorProps,
    pageInspectorProps,
  })
  const {
    sidebarProps,
    codeTabsProps,
    previewProps,
    codeWorkspaceProps,
    canvasProps,
    codeOutputProps,
    publishDialogProps,
  } = useBuilderShellViewProps({
    activeAppId,
    appName,
    apps,
    activeProjectRef,
    projectRestUrl: project?.restUrl,
    activeSection,
    appFrameWidgets,
    pages,
    activePageId,
    rootScreenId,
    selectedNode,
    activePageFrameWidgets,
    isDeletingPage: deletePageMutation.isPending,
    widgets: widgetRegistry,
    queryRuns,
    queries,
    jsFunctions,
    codeSelection,
    sidebarActionProps,
    codeTabs,
    activeCodeTabId,
    onSelectCodeTab: handleSelectCodeTab,
    onCloseCodeTab: handleCloseCodeTab,
    appMeta,
    themeStyle: appThemeCssVars,
    themeCustomCss: appTheme.theme.customCss,
    iconLibrary: appTheme.theme.shadcn?.iconLibrary,
    previewPolicies,
    lastQueryRun,
    setLastQueryRun,
    onQueryRun: handleQueryRun,
    onSelectPage: selectPageNode,
    gridRowHeight: GRID_ROW_HEIGHT,
    gridMargin: GRID_MARGIN,
    connectionString: project?.connectionString ?? null,
    activePageWidgets,
    selectedWidgetId,
    selectedFrameWidgetId,
    selectedPageMain,
    canvasEvaluationContext,
    activePageMain,
    activePageName: activePage?.name ?? null,
    showGrid,
    canvasActionProps,
    isPublishDialogOpen,
    isPublishing,
    isPublishDisabled,
    setIsPublishDialogOpen,
    onConfirmPublish: handleConfirmPublish,
  })

  const { earlyView, headerActions } = useBuilderShellRenderState({
    isAppsLoading,
    isOrganizationsLoading,
    organizationsCount: organizations.length,
    appIdParam,
    activeAppId,
    projectRef,
    catalogProps,
    headerRoot: headerActionsRoot,
    draftStatus,
    isSaving,
    isPreviewDisabled,
    isPublishDisabled,
    isPublishing,
    onSaveDraft: handleSaveDraft,
    onOpenPreview: handleOpenPreview,
    onOpenPublishDialog: handleOpenPublishDialog,
  })

  if (earlyView) {
    return earlyView
  }

  return (
    <BuilderShellView
      headerActions={headerActions}
      activeSection={activeSection}
      onSelectSection={handleSelectSection}
      sidebarPanelRef={sidebarPanelRef}
      isSettingsSection={isSettingsSection}
      showSidebar={showSidebar}
      sidebarProps={sidebarProps}
      isPreviewing={isPreviewing}
      isCodeMode={isCodeMode}
      isCodeTabActive={isCodeTabActive}
      codeTabsProps={codeTabsProps}
      previewProps={previewProps}
      codeWorkspaceProps={codeWorkspaceProps}
      canvasProps={canvasProps}
      showInspector={showInspector}
      onShowInspector={handleShowInspector}
      inspectorOpen={inspectorOpen}
      inspectorPanelRef={inspectorPanelRef}
      codeOutputProps={codeOutputProps}
      inspectorPaneProps={inspectorPaneProps}
      publishDialogProps={publishDialogProps}
    />
  )
}
