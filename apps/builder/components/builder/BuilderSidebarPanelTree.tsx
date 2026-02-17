import type { Dispatch, ReactNode, SetStateAction } from 'react'
import { useMemo, useState } from 'react'
import { Boxes, ChevronDown, ChevronRight, ChevronsUpDown, Layers, LayoutGrid, ListTree, Plus, X } from 'lucide-react'

import type { WidgetDefinition } from 'widgets/runtime'
import {
  Button,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
  ScrollArea,
  Separator,
  cn,
} from 'ui'

import type {
  BuilderPage,
  BuilderSelectedNode,
  BuilderWidgetAddOptions,
  BuilderWidgetInstance,
} from './types'
import {
  canAddAppFrame,
  canAddPageFrame,
  createPageFramesFromWidgets,
  isFrameType,
} from './types'
import {
  type BuilderWidgetMode,
  TreeRow,
} from './BuilderSidebarItems'

// Панель дерева: структура страницы и глобальные элементы с drag-and-drop.

const commonWidgetTypes = [
  'Table',
  'Text',
  'Button',
  'OutlineButton',
  'CloseButton',
  'TextInput',
  'Email',
  'Url',
  'EditableNumber',
  'Select',
  'Container',
  'Form',
  'Tabs',
  'Chart',
  'KeyValue',
  'Image',
  'Navigation',
]

const globalComponentOptions = [
  { type: 'GlobalHeader', label: 'Header', icon: <LayoutGrid size={14} /> },
  { type: 'GlobalSidebar', label: 'Sidebar', icon: <Layers size={14} /> },
]

const pageFrameOptions = [
  { type: 'GlobalSplitPane', label: 'Split pane', icon: <LayoutGrid size={14} /> },
  { type: 'GlobalDrawer', label: 'Drawer', icon: <ListTree size={14} /> },
  { type: 'GlobalModal', label: 'Modal', icon: <Boxes size={14} /> },
]

type BuilderSidebarPanelTreeProps = {
  title: string
  icon: ReactNode
  onClose?: () => void
  activePage: BuilderPage | null
  pages: BuilderPage[]
  appFrameWidgets: BuilderWidgetInstance[]
  pageFrameWidgets: BuilderWidgetInstance[]
  selectedNode?: BuilderSelectedNode | null
  widgets: WidgetDefinition[]
  onSelectPage: (pageId: string) => void
  onSelectWidget?: (widgetId: string) => void
  onSelectFrameWidget?: (widgetId: string) => void
  onSelectPageMain?: () => void
  onToggleWidgetHidden?: (widgetId: string, mode: BuilderWidgetMode) => void
  onReorderWidget?: (
    activeId: string,
    overId: string,
    parentId: string | null,
    mode: BuilderWidgetMode
  ) => void
  onAddAppFrameWidget?: (type: string) => void
  onAddPageFrameWidget?: (type: string) => void
  onAddWidgetAtRoot?: (widgetType: string, options?: BuilderWidgetAddOptions) => void
}

export const BuilderSidebarPanelTree = ({
  title,
  icon,
  onClose,
  activePage,
  pages,
  appFrameWidgets,
  pageFrameWidgets,
  selectedNode,
  widgets,
  onSelectPage,
  onSelectWidget,
  onSelectFrameWidget,
  onSelectPageMain,
  onToggleWidgetHidden,
  onAddAppFrameWidget,
  onAddPageFrameWidget,
  onAddWidgetAtRoot,
}: BuilderSidebarPanelTreeProps) => {
  const [isGlobalOpen, setIsGlobalOpen] = useState(true)
  const [isPageOpen, setIsPageOpen] = useState(true)
  const [isRootOpen, setIsRootOpen] = useState(true)
  const [isGraphOpen, setIsGraphOpen] = useState(true)
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const [globalAddOpen, setGlobalAddOpen] = useState(false)
  const [pageAddOpen, setPageAddOpen] = useState(false)
  const [pageSelectOpen, setPageSelectOpen] = useState(false)
  const availableWidgets = useMemo(
    () => widgets.filter((widget) => widget.category !== 'globals' && !isFrameType(widget.type)),
    [widgets]
  )
  const commonWidgets = useMemo(() => {
    return commonWidgetTypes
      .map((type) => availableWidgets.find((widget) => widget.type === type))
      .filter(Boolean) as WidgetDefinition[]
  }, [availableWidgets])
  const widgetMenu = commonWidgets.length > 0 ? commonWidgets : availableWidgets.slice(0, 8)
  const activePageWidgets = useMemo(
    () => activePage?.pageLayout.widgets ?? [],
    [activePage]
  )
  const appFrames = useMemo(
    () =>
      appFrameWidgets.filter(
        (widget) => widget.type === 'GlobalHeader' || widget.type === 'GlobalSidebar'
      ),
    [appFrameWidgets]
  )
  const appLayoutForAdd = useMemo(
    () => ({
      header: appFrames.find((widget) => widget.type === 'GlobalHeader'),
      sidebar: appFrames.find((widget) => widget.type === 'GlobalSidebar'),
    }),
    [appFrames]
  )
  const globalFrameMenuOptions = useMemo(
    () =>
      globalComponentOptions.map((option) => ({
        ...option,
        addCheck: canAddAppFrame(option.type, appLayoutForAdd),
      })),
    [appLayoutForAdd]
  )
  const pageFramesForAdd = useMemo(
    () => createPageFramesFromWidgets(pageFrameWidgets),
    [pageFrameWidgets]
  )
  const pageFrameMenuOptions = useMemo(
    () =>
      pageFrameOptions.map((option) => ({
        ...option,
        addCheck: canAddPageFrame(option.type, pageFramesForAdd),
      })),
    [pageFramesForAdd]
  )
  const pageSplitFrames = useMemo(
    () => pageFrameWidgets.filter((widget) => widget.type === 'GlobalSplitPane'),
    [pageFrameWidgets]
  )
  const pageDrawerFrames = useMemo(
    () => pageFrameWidgets.filter((widget) => widget.type === 'GlobalDrawer'),
    [pageFrameWidgets]
  )
  const pageModalFrames = useMemo(
    () => pageFrameWidgets.filter((widget) => widget.type === 'GlobalModal'),
    [pageFrameWidgets]
  )
  const pageOtherFrames = useMemo(
    () =>
      pageFrameWidgets.filter(
        (widget) =>
          widget.type !== 'GlobalSplitPane' &&
          widget.type !== 'GlobalDrawer' &&
          widget.type !== 'GlobalModal'
      ),
    [pageFrameWidgets]
  )
  const selectedWidgetId =
    selectedNode?.kind === 'widget' && selectedNode.scope === 'main'
      ? selectedNode.widgetId
      : null
  const selectedFrameWidgetId =
    selectedNode?.kind === 'frame'
      ? selectedNode.frameId
      : selectedNode?.kind === 'widget' && selectedNode.scope !== 'main'
        ? selectedNode.widgetId
        : null
  const selectedPageMain =
    selectedNode?.kind === 'main' && selectedNode.pageId === activePage?.id
  const isPageSettingsSelected = Boolean(
    activePage && selectedNode?.kind === 'page' && selectedNode.pageId === activePage.id
  )

  // Фокусируем виджет на канвасе из дерева.
  const focusWidget = (widgetId: string) => {
    if (typeof document === 'undefined') {
      return
    }
    const target = document.querySelector(
      `[data-builder-widget-id="${widgetId}"]`
    ) as HTMLElement | null
    if (!target) {
      return
    }
    target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' })
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between pl-3 pr-2">
        <div className="flex h-9 items-center gap-2 text-xs font-medium">
          <div className="text-xs font-medium">{title}</div>
        </div>
        <Button className="px-1" type="text" size="tiny" icon={<X size={14} />} onClick={() => onClose?.()} />
      </div>
      <Separator />
        <ScrollArea className="min-h-0 flex-1">
          <div className="space-y-2  py-2">
            <div className='px-1'>
              <div className="flex items-center justify-between px-1 text-xs uppercase text-foreground">
                <button
                  type="button"
                  className="flex items-center gap-2 px-1"
                  onClick={() => setIsGlobalOpen((prev) => !prev)}
                >
                  <span className='font-mono'>APP</span>
                </button>
                <div className='flex gap-1'>
                  <Popover_Shadcn_ open={globalAddOpen} onOpenChange={setGlobalAddOpen}>
                    <PopoverTrigger_Shadcn_ asChild>
                      <Button className='px-1' type="text" size="tiny" icon={<Plus size={12} />} />
                    </PopoverTrigger_Shadcn_>
                    <PopoverContent_Shadcn_ className="w-56 p-2" align="start">
                      <div className="space-y-1">
                        <div className="px-2 py-1 text-xs uppercase text-foreground-muted">
                          Add app frame
                        </div>
                        {globalFrameMenuOptions.map((option) => (
                          <Button
                            key={option.type}
                            type="text"
                            size="tiny"
                            className="w-full justify-start"
                            icon={option.icon}
                            disabled={!option.addCheck.allowed}
                            onClick={() => {
                              if (!option.addCheck.allowed) {
                                return
                              }
                              onAddAppFrameWidget?.(option.type)
                              setGlobalAddOpen(false)
                            }}
                          >
                            {option.label}
                          </Button>
                        ))}
                      </div>
                    </PopoverContent_Shadcn_>
                  </Popover_Shadcn_>
                </div>
              </div>
              {isGlobalOpen && (
                <div className="space-y-1">
                  <div className="space-y-1">
                    {appFrames.length > 0 ? (
                      appFrames.map((widget) => (
                          <TreeRow
                            key={widget.id}
                            widget={widget}
                            depth={0}
                            mode="app-frame"
                            collapsed={collapsed}
                            setCollapsed={setCollapsed}
                          selectedWidgetId={selectedWidgetId}
                          selectedFrameWidgetId={selectedFrameWidgetId}
                          onSelectWidget={onSelectWidget}
                          onSelectFrameWidget={onSelectFrameWidget}
                          onToggleWidgetHidden={onToggleWidgetHidden}
                          onFocusWidget={focusWidget}
                        />
                      ))
                    ) : (
                      <div className="px-1.5 py-1 text-[11px] text-foreground-muted">
                        No app frame components yet.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <Separator />
            <div className='px-2'>
              <div
                className={cn(
                  'flex items-center justify-between rounded-sm px-1.5 text-xs uppercase transition',
                  isPageSettingsSelected
                    ? 'bg-brand-500/10 text-foreground'
                    : 'text-foreground-muted hover:bg-surface-200'
                )}
                onClick={() => {
                  if (!activePage?.id) {
                    return
                  }
                  onSelectPage(activePage.id)
                }}
              >
                <div className="flex items-center gap-2">
                  <Popover_Shadcn_ open={pageSelectOpen} onOpenChange={setPageSelectOpen}>
                    <PopoverTrigger_Shadcn_ asChild>
                      <button
                        type="button"
                        className="flex items-center gap-1 text-xs normal-case text-foreground"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <span>{activePage?.name ?? 'Page'}</span>
                        <ChevronDown size={12} className="text-foreground-muted" />
                      </button>
                    </PopoverTrigger_Shadcn_>
                    <PopoverContent_Shadcn_ className="w-56 p-1" align="start">
                      <ScrollArea className="max-h-64">
                        <div className="space-y-1 p-1">
                          {pages.map((page) => (
                            <Button
                              key={page.id}
                              type="text"
                              size="tiny"
                              className={cn(
                                'w-full justify-start',
                                activePage?.id === page.id ? 'text-foreground' : 'text-foreground-muted'
                              )}
                              onClick={(event) => {
                                event.stopPropagation()
                                onSelectPage(page.id)
                                setPageSelectOpen(false)
                              }}
                            >
                              {page.name}
                            </Button>
                          ))}
                        </div>
                      </ScrollArea>
                    </PopoverContent_Shadcn_>
                  </Popover_Shadcn_>
                </div>
                <div className='flex gap-1'>
                  <Popover_Shadcn_ open={pageAddOpen} onOpenChange={setPageAddOpen}>
                    <PopoverTrigger_Shadcn_ asChild>
                      <Button
                        className='px-1'
                        type="text"
                        size="tiny"
                        icon={<Plus size={12} />}
                        onClick={(event) => event.stopPropagation()}
                      />
                    </PopoverTrigger_Shadcn_>
                    <PopoverContent_Shadcn_ className="w-64 p-2" align="end">
                      <ScrollArea className="max-h-80">
                        <div className="space-y-2 pr-1">
                          <div className="px-2 py-1 text-[11px] uppercase text-foreground-muted">
                            Add page layout
                          </div>
                          {pageFrameMenuOptions.map((option) => (
                            <Button
                              key={option.type}
                              type="text"
                              size="tiny"
                              className="w-full justify-start"
                              icon={option.icon}
                              disabled={!option.addCheck.allowed}
                              onClick={() => {
                                if (!option.addCheck.allowed) {
                                  return
                                }
                                onAddPageFrameWidget?.(option.type)
                                setPageAddOpen(false)
                              }}
                            >
                              {option.label}
                            </Button>
                          ))}
                          <Separator />
                          <div className="px-2 py-1 text-[11px] uppercase text-foreground-muted">
                            Add component
                          </div>
                          {widgetMenu.map((widget) => (
                            <Button
                              key={widget.type}
                              type="text"
                              size="tiny"
                              className="w-full justify-start"
                              onClick={() => {
                                onAddWidgetAtRoot?.(widget.type)
                                setPageAddOpen(false)
                              }}
                            >
                              {widget.label}
                            </Button>
                          ))}
                        </div>
                      </ScrollArea>
                    </PopoverContent_Shadcn_>
                  </Popover_Shadcn_>
                  <button
                    type="button"
                    className="flex items-center  px-1"
                    onClick={(event) => {
                      event.stopPropagation()
                      setIsPageOpen((prev) => !prev)
                    }}
                  >
                    <ChevronsUpDown size={12} />
                  </button>
                </div>
              </div>
              {isPageOpen && (
                <div className="space-y-1">
                  {pageSplitFrames.length > 0 && (
                    <FrameGroup
                      title="Split pane"
                      widgets={pageSplitFrames}
                      collapsed={collapsed}
                      setCollapsed={setCollapsed}
                      selectedWidgetId={selectedWidgetId}
                      selectedFrameWidgetId={selectedFrameWidgetId}
                      onSelectWidget={onSelectWidget}
                      onSelectFrameWidget={onSelectFrameWidget}
                      onToggleWidgetHidden={onToggleWidgetHidden}
                      onFocusWidget={focusWidget}
                    />
                  )}
                  {pageDrawerFrames.length > 0 && (
                    <FrameGroup
                      title="Drawers"
                      widgets={pageDrawerFrames}
                      collapsed={collapsed}
                      setCollapsed={setCollapsed}
                      selectedWidgetId={selectedWidgetId}
                      selectedFrameWidgetId={selectedFrameWidgetId}
                      onSelectWidget={onSelectWidget}
                      onSelectFrameWidget={onSelectFrameWidget}
                      onToggleWidgetHidden={onToggleWidgetHidden}
                      onFocusWidget={focusWidget}
                    />
                  )}
                  {pageModalFrames.length > 0 && (
                    <FrameGroup
                      title="Modals"
                      widgets={pageModalFrames}
                      collapsed={collapsed}
                      setCollapsed={setCollapsed}
                      selectedWidgetId={selectedWidgetId}
                      selectedFrameWidgetId={selectedFrameWidgetId}
                      onSelectWidget={onSelectWidget}
                      onSelectFrameWidget={onSelectFrameWidget}
                      onToggleWidgetHidden={onToggleWidgetHidden}
                      onFocusWidget={focusWidget}
                    />
                  )}
                  {pageOtherFrames.length > 0 && (
                    <FrameGroup
                      title="Other frames"
                      widgets={pageOtherFrames}
                      collapsed={collapsed}
                      setCollapsed={setCollapsed}
                      selectedWidgetId={selectedWidgetId}
                      selectedFrameWidgetId={selectedFrameWidgetId}
                      onSelectWidget={onSelectWidget}
                      onSelectFrameWidget={onSelectFrameWidget}
                      onToggleWidgetHidden={onToggleWidgetHidden}
                      onFocusWidget={focusWidget}
                    />
                  )}
                  <div
                    className={cn(
                      'flex w-full items-center justify-between rounded-sm px-1.5 py-1 text-[10px] uppercase transition',
                      selectedPageMain
                        ? 'bg-brand-500/10 text-foreground'
                        : 'text-foreground-muted hover:bg-surface-200'
                    )}
                    onClick={() => onSelectPageMain?.()}
                  >
                    <span className="flex items-center gap-1.5">
                      <button
                        type="button"
                        className="text-foreground-muted"
                        onClick={(event) => {
                          event.stopPropagation()
                          setIsRootOpen((prev) => !prev)
                        }}
                      >
                        {isRootOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                      </button>
                      <Layers size={12} />
                      <span>Main</span>
                    </span>
                  </div>
                  {isRootOpen && (
                    <div className="space-y-0.5">
                      {activePageWidgets.length
                        ? activePageWidgets.map((widget) => (
                            <TreeRow
                              key={widget.id}
                              widget={widget}
                              depth={0}
                              mode="page"
                              collapsed={collapsed}
                              setCollapsed={setCollapsed}
                              selectedWidgetId={selectedWidgetId}
                              selectedFrameWidgetId={selectedFrameWidgetId}
                              onSelectWidget={onSelectWidget}
                              onSelectFrameWidget={onSelectFrameWidget}
                              onToggleWidgetHidden={onToggleWidgetHidden}
                              onFocusWidget={focusWidget}
                            />
                          ))
                        : (
                          <div className="px-1.5 py-1 text-[11px] text-foreground-muted">
                            No components on this page.
                          </div>
                        )}
                    </div>
                  )}
                </div>
              )}
            </div>
            <Separator />
            <div className='px-2'>
              <div className="flex items-center justify-between px-1.5 text-xs uppercase text-foreground">
                <button
                  type="button"
                  className="flex items-center gap-2"
                  onClick={() => setIsGraphOpen((prev) => !prev)}
                >
                  <span>Graph</span>
                </button>
                <div className="flex items-center gap-2 text-foreground-muted">
                  <Button type="text" size="tiny" icon={<ListTree size={12} />} />
                  <Button type="text" size="tiny" icon={<Layers size={12} />} />
                </div>
              </div>
              {isGraphOpen && (
                <div className="mt-1.5 rounded-md border border-dashed border-foreground-muted/40 px-2 py-2.5 text-center text-[11px] text-foreground-muted">
                  No connections
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
    </div>
  )
}

type FrameGroupProps = {
  title: string
  widgets: BuilderWidgetInstance[]
  collapsed: Record<string, boolean>
  setCollapsed: Dispatch<SetStateAction<Record<string, boolean>>>
  selectedWidgetId?: string | null
  selectedFrameWidgetId?: string | null
  onSelectWidget?: (widgetId: string) => void
  onSelectFrameWidget?: (widgetId: string) => void
  onToggleWidgetHidden?: (widgetId: string, mode: BuilderWidgetMode) => void
  onFocusWidget?: (widgetId: string) => void
}

const FrameGroup = ({
  title,
  widgets,
  collapsed,
  setCollapsed,
  selectedWidgetId,
  selectedFrameWidgetId,
  onSelectWidget,
  onSelectFrameWidget,
  onToggleWidgetHidden,
  onFocusWidget,
}: FrameGroupProps) => (
  <div className="space-y-0.5">
    <div className="px-1.5 py-0.5 text-[10px] uppercase text-foreground-muted">{title}</div>
    {widgets.map((widget) => (
      <TreeRow
        key={widget.id}
        widget={widget}
        depth={0}
        mode="page-frame"
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        selectedWidgetId={selectedWidgetId}
        selectedFrameWidgetId={selectedFrameWidgetId}
        onSelectWidget={onSelectWidget}
        onSelectFrameWidget={onSelectFrameWidget}
        onToggleWidgetHidden={onToggleWidgetHidden}
        onFocusWidget={onFocusWidget}
      />
    ))}
  </div>
)
