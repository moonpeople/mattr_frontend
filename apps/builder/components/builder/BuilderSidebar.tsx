import type { ReactNode } from 'react'
import { Activity, Code2, History, LayoutGrid, Layers, ListTree, Search, Settings } from 'lucide-react'

import type { WidgetDefinition } from 'widgets'

import { BuilderStatePanel } from './BuilderStatePanel'
import { BuilderSidebarPanelComponents } from './BuilderSidebarPanelComponents'
import { BuilderSidebarPanelCode } from './BuilderSidebarPanelCode'
import { BuilderSidebarPanelEmpty } from './BuilderSidebarPanelEmpty'
import { BuilderSidebarPanelHistory } from './BuilderSidebarPanelHistory'
import { BuilderSidebarPanelPages } from './BuilderSidebarPanelPages'
import { BuilderSidebarPanelSettings } from './BuilderSidebarPanelSettings'
import { BuilderSidebarPanelTree } from './BuilderSidebarPanelTree'
import type { BuilderJsFunction } from 'data/builder/builder-js'
import type { BuilderQuery } from 'data/builder/builder-queries'
import type { BuilderApp } from 'data/builder/builder-apps'
import type { BuilderCodeItemType, BuilderCodeSelection } from './BuilderCodeUtils'
import type {
  BuilderPage,
  BuilderQueryRunResult,
  BuilderSection,
  BuilderWidgetInstance,
} from './types'

// Основной контейнер сайдбара билдера: собирает панели и общий хедер.

// Карта разделов для шапки и иконок.
const sectionMap: Record<BuilderSection, { label: string; icon: ReactNode; description?: string }> =
  {
    components: { label: 'Components', icon: <LayoutGrid size={16} /> },
    pages: { label: 'Pages', icon: <Layers size={16} /> },
    tree: { label: 'Component tree', icon: <ListTree size={16} /> },
    code: { label: 'Code', icon: <Code2 size={16} /> },
    search: { label: 'Code search', icon: <Search size={16} /> },
    state: { label: 'State', icon: <Activity size={16} /> },
    history: { label: 'History', icon: <History size={16} /> },
    settings: { label: 'Settings', icon: <Settings size={16} /> },
  }

interface BuilderSidebarProps {
  appId?: string
  appName?: string
  apps?: BuilderApp[]
  projectRef?: string
  projectRestUrl?: string | null
  activeSection: BuilderSection
  globalWidgets?: BuilderWidgetInstance[]
  pageGlobals?: BuilderWidgetInstance[]
  onAddGlobalWidget?: (type: string) => void
  onAddPageGlobalWidget?: (type: string) => void
  pages: BuilderPage[]
  activePageId: string
  rootScreenId?: string | null
  onSetRootScreen?: (pageId: string) => void
  selectedWidgetId?: string | null
  selectedGlobalWidgetId?: string | null
  selectedPageComponent?: boolean
  onSelectPage: (pageId: string) => void
  onSelectWidget?: (widgetId: string) => void
  onSelectGlobalWidget?: (widgetId: string) => void
  onSelectPageComponent?: () => void
  onToggleWidgetHidden?: (widgetId: string, mode: 'page' | 'global' | 'page-global') => void
  onReorderWidget?: (
    activeId: string,
    overId: string,
    parentId: string | null,
    mode: 'page' | 'global' | 'page-global'
  ) => void
  onAddWidgetAtRoot?: (widgetType: string) => void
  onAddPage: () => void
  onDeletePage?: (pageId: string) => void
  isDeletingPage?: boolean
  widgets: WidgetDefinition[]
  onAddWidget: (widgetType: string) => void
  onQueryRun?: (result: BuilderQueryRunResult) => void
  queryRuns?: Record<string, BuilderQueryRunResult>
  queries: BuilderQuery[]
  jsFunctions: BuilderJsFunction[]
  codeSelection: BuilderCodeSelection
  onSelectCodeItem: (selection: BuilderCodeSelection) => void
  onAddCodeItem: (type: BuilderCodeItemType, scope: 'global' | 'page', pageId?: string) => void
  onMoveCodeItem: (type: BuilderCodeItemType, id: string, scope: 'global' | 'page', pageId?: string) => void
  onAppNameChange?: (name: string) => void
  onClose?: () => void
}

export const BuilderSidebar = ({
  appId,
  appName,
  apps,
  projectRef,
  projectRestUrl,
  activeSection,
  globalWidgets = [],
  pageGlobals = [],
  onAddGlobalWidget,
  onAddPageGlobalWidget,
  pages,
  activePageId,
  rootScreenId,
  onSetRootScreen,
  selectedWidgetId,
  selectedGlobalWidgetId,
  selectedPageComponent = false,
  onSelectPage,
  onSelectWidget,
  onSelectGlobalWidget,
  onSelectPageComponent,
  onToggleWidgetHidden,
  onReorderWidget,
  onAddWidgetAtRoot,
  onAddPage,
  onDeletePage,
  isDeletingPage,
  widgets,
  onAddWidget,
  onQueryRun,
  queryRuns,
  queries,
  jsFunctions,
  codeSelection,
  onSelectCodeItem,
  onAddCodeItem,
  onMoveCodeItem,
  onAppNameChange,
  onClose,
}: BuilderSidebarProps) => {
  const section = sectionMap[activeSection]
  const pagesSection = activeSection === 'pages' ? 'pages' : null
  const activePage = pages.find((page) => page.id === activePageId) ?? pages[0] ?? null

  return (
    <div className="builder-panel flex h-full flex-col border-r border-foreground-muted/30 bg-surface-100">
      {activeSection === 'components' ? (
        <BuilderSidebarPanelComponents
          widgets={widgets}
          onAddWidget={onAddWidget}
          onAddGlobalWidget={onAddGlobalWidget}
          onClose={onClose}
        />
      ) : (
        <>
          {activeSection === 'state' ? (
            <BuilderStatePanel
              title={section.label}
              icon={section.icon}
              onClose={onClose}
              activePage={activePage}
              pages={pages}
              globalWidgets={globalWidgets}
              pageGlobals={pageGlobals}
              widgets={widgets}
              queries={queries}
              jsFunctions={jsFunctions}
              queryRuns={queryRuns ?? {}}
              selectedWidgetId={selectedWidgetId}
              selectedGlobalWidgetId={selectedGlobalWidgetId}
              selectedPageComponent={selectedPageComponent}
            />
          ) : activeSection === 'tree' ? (
            <BuilderSidebarPanelTree
              title={section.label}
              icon={section.icon}
              onClose={onClose}
              activePage={activePage}
              pages={pages}
              globalWidgets={globalWidgets}
              pageGlobals={pageGlobals}
              selectedWidgetId={selectedWidgetId}
              selectedGlobalWidgetId={selectedGlobalWidgetId}
              selectedPageComponent={selectedPageComponent}
              widgets={widgets}
              onSelectPage={onSelectPage}
              onSelectWidget={onSelectWidget}
              onSelectGlobalWidget={onSelectGlobalWidget}
              onSelectPageComponent={onSelectPageComponent}
              onToggleWidgetHidden={onToggleWidgetHidden}
              onReorderWidget={onReorderWidget}
              onAddGlobalWidget={onAddGlobalWidget}
              onAddPageGlobalWidget={onAddPageGlobalWidget}
              onAddWidgetAtRoot={onAddWidgetAtRoot}
            />
          ) : activeSection === 'code' ? (
            <BuilderSidebarPanelCode
              title={section.label}
              icon={section.icon}
              onClose={onClose}
              pages={pages}
              activePageId={activePageId}
              onSelectPage={onSelectPage}
              queries={queries}
              jsFunctions={jsFunctions}
              selection={codeSelection}
              onSelectItem={onSelectCodeItem}
              onAddItem={onAddCodeItem}
              onMoveItem={onMoveCodeItem}
            />
          ) : pagesSection ? (
            <BuilderSidebarPanelPages
              title={section.label}
              icon={section.icon}
              onClose={onClose}
              section={pagesSection}
              appId={appId}
              projectRef={projectRef}
              projectRestUrl={projectRestUrl}
              pages={pages}
              activePageId={activePageId}
              rootScreenId={rootScreenId}
              onSetRootScreen={onSetRootScreen}
              onSelectPage={onSelectPage}
              onAddPage={onAddPage}
              onDeletePage={onDeletePage}
              isDeletingPage={isDeletingPage}
              onQueryRun={onQueryRun}
            />
          ) : activeSection === 'settings' ? (
            <BuilderSidebarPanelSettings
              appId={appId}
              appName={appName}
              apps={apps}
              projectRef={projectRef}
              onAppNameChange={onAppNameChange}
              onClose={onClose}
            />
          ) : activeSection === 'history' ? (
            <BuilderSidebarPanelHistory
              title={section.label}
              icon={section.icon}
              onClose={onClose}
              appId={appId}
              projectRef={projectRef}
            />
          ) : (
            <BuilderSidebarPanelEmpty
              title={section.label}
              icon={section.icon}
              onClose={onClose}
              label={section.label}
            />
          )}
        </>
      )}
    </div>
  )
}
