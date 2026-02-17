/**
 * Hook сборки view-props для BuilderShellView (sidebar/workspace/canvas/publish).
 */
import type { ComponentProps, CSSProperties } from 'react'
import type { WidgetDefinition } from 'widgets/runtime'

import type { BuilderApp } from 'data/builder/builder-apps'
import type { BuilderJsFunction } from 'data/builder/builder-js'
import type { BuilderQuery } from 'data/builder/builder-queries'

import { BuilderCanvas } from '../../canvas'
import { BuilderCodeOutputPanel } from '../../BuilderCodeOutputPanel'
import { type BuilderCodeTab, BuilderCodeTabs } from '../../BuilderCodeTabs'
import { type BuilderCodeSelection } from '../../BuilderCodeUtils'
import { BuilderCodeWorkspace } from '../../BuilderCodeWorkspace'
import { BuilderPreview } from '../../BuilderPreview'
import { BuilderSidebar } from '../../BuilderSidebar'
import type {
  BuilderAppMeta,
  BuilderPage,
  BuilderPageLayout,
  BuilderQueryRunResult,
  BuilderSection,
  BuilderSelectedNode,
  BuilderWidgetInstance,
} from '../../types'
import { BuilderPublishDialog } from '../components/BuilderPublishDialog'
import type {
  BuilderShellCanvasActionProps,
  BuilderShellSidebarActionProps,
} from './useBuilderShellActionProps'

export interface UseBuilderShellViewPropsParams {
  activeAppId?: string
  appName: string
  apps: BuilderApp[]
  activeProjectRef?: string
  projectRestUrl?: string | null
  activeSection: BuilderSection | null
  appFrameWidgets: BuilderWidgetInstance[]
  pages: BuilderPage[]
  activePageId: string | null
  rootScreenId?: string | null
  selectedNode: BuilderSelectedNode | null
  activePageFrameWidgets: BuilderWidgetInstance[]
  isDeletingPage: boolean
  widgets: WidgetDefinition[]
  queryRuns: Record<string, BuilderQueryRunResult>
  queries: BuilderQuery[]
  jsFunctions: BuilderJsFunction[]
  codeSelection: BuilderCodeSelection
  sidebarActionProps: BuilderShellSidebarActionProps

  codeTabs: BuilderCodeTab[]
  activeCodeTabId: string
  onSelectCodeTab: (tabId: string) => void
  onCloseCodeTab: (tabId: string) => void

  appMeta: BuilderAppMeta
  themeStyle?: CSSProperties
  themeCustomCss?: string
  iconLibrary?: string
  previewPolicies?: ComponentProps<typeof BuilderPreview>['policies']
  lastQueryRun: BuilderQueryRunResult | null
  setLastQueryRun: (value: BuilderQueryRunResult | null) => void
  onQueryRun: (result: BuilderQueryRunResult) => void
  onSelectPage: (pageId: string) => void
  gridRowHeight: number
  gridMargin: number

  connectionString: string | null
  activePageWidgets: BuilderWidgetInstance[]
  selectedWidgetId: string | null
  selectedFrameWidgetId: string | null
  selectedPageMain: boolean
  canvasEvaluationContext?: Record<string, unknown>
  activePageMain: BuilderPageLayout['main']
  activePageName?: string | null
  showGrid: boolean
  canvasActionProps: BuilderShellCanvasActionProps

  isPublishDialogOpen: boolean
  isPublishing: boolean
  isPublishDisabled: boolean
  setIsPublishDialogOpen: (open: boolean) => void
  onConfirmPublish: () => void
}

export const useBuilderShellViewProps = ({
  activeAppId,
  appName,
  apps,
  activeProjectRef,
  projectRestUrl,
  activeSection,
  appFrameWidgets,
  pages,
  activePageId,
  rootScreenId,
  selectedNode,
  activePageFrameWidgets,
  isDeletingPage,
  widgets,
  queryRuns,
  queries,
  jsFunctions,
  codeSelection,
  sidebarActionProps,
  codeTabs,
  activeCodeTabId,
  onSelectCodeTab,
  onCloseCodeTab,
  appMeta,
  themeStyle,
  themeCustomCss,
  iconLibrary,
  previewPolicies,
  lastQueryRun,
  setLastQueryRun,
  onQueryRun,
  onSelectPage,
  gridRowHeight,
  gridMargin,
  connectionString,
  activePageWidgets,
  selectedWidgetId,
  selectedFrameWidgetId,
  selectedPageMain,
  canvasEvaluationContext,
  activePageMain,
  activePageName,
  showGrid,
  canvasActionProps,
  isPublishDialogOpen,
  isPublishing,
  isPublishDisabled,
  setIsPublishDialogOpen,
  onConfirmPublish,
}: UseBuilderShellViewPropsParams) => {
  const sidebarProps: ComponentProps<typeof BuilderSidebar> = {
    appId: activeAppId,
    appName,
    apps,
    projectRef: activeProjectRef,
    projectRestUrl,
    activeSection: activeSection ?? 'components',
    appFrameWidgets,
    pages,
    activePageId: activePageId ?? '',
    rootScreenId,
    selectedNode,
    pageFrameWidgets: activePageFrameWidgets,
    isDeletingPage,
    widgets,
    queryRuns,
    queries,
    jsFunctions,
    codeSelection,
    ...sidebarActionProps,
  }

  const codeTabsProps: ComponentProps<typeof BuilderCodeTabs> = {
    tabs: codeTabs,
    activeTabId: activeCodeTabId,
    queries,
    jsFunctions,
    onSelectTab: onSelectCodeTab,
    onCloseTab: onCloseCodeTab,
  }

  const previewProps: ComponentProps<typeof BuilderPreview> = {
    pages,
    activePageId,
    appMeta,
    themeStyle,
    themeCustomCss,
    iconLibrary,
    appFrameWidgets,
    policies: previewPolicies,
    queryRun: lastQueryRun ?? undefined,
    onClearQueryRun: () => setLastQueryRun(null),
    onQueryRun,
    queries,
    jsFunctions,
    projectRef: activeProjectRef,
    projectRestUrl,
    onSelectPage,
    gridRowHeight,
    gridMargin,
  }

  const codeWorkspaceProps: ComponentProps<typeof BuilderCodeWorkspace> = {
    appId: activeAppId ?? '',
    projectRef: activeProjectRef,
    projectRestUrl,
    connectionString,
    pages,
    activePageId,
    queries,
    jsFunctions,
    selection: codeSelection,
    onSelectItem: sidebarActionProps.onSelectCodeItem,
    onQueryRun,
  }

  const canvasProps: ComponentProps<typeof BuilderCanvas> = {
    widgets: activePageWidgets,
    appFrameWidgets,
    pageFrameWidgets: activePageFrameWidgets,
    appMeta,
    themeStyle,
    themeCustomCss,
    iconLibrary,
    selectedWidgetId,
    selectedFrameWidgetId,
    isPageMainSelected: selectedPageMain,
    evaluationContext: canvasEvaluationContext,
    pageMain: activePageMain,
    pageLabel: activePageName ? `${activePageName} Main` : 'Main',
    availableWidgets: widgets,
    gridRowHeight,
    gridMargin,
    showGrid,
    ...canvasActionProps,
  }

  const codeOutputProps: ComponentProps<typeof BuilderCodeOutputPanel> = { result: lastQueryRun }

  const publishDialogProps: ComponentProps<typeof BuilderPublishDialog> = {
    open: isPublishDialogOpen,
    isPublishing,
    isPublishDisabled,
    onOpenChange: setIsPublishDialogOpen,
    onConfirmPublish,
  }

  return {
    sidebarProps,
    codeTabsProps,
    previewProps,
    codeWorkspaceProps,
    canvasProps,
    codeOutputProps,
    publishDialogProps,
  }
}
