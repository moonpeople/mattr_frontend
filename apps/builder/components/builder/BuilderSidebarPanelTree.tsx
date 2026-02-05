import type { ReactNode } from 'react'
import { useMemo, useState } from 'react'
import { Boxes, ChevronDown, ChevronRight, ChevronsUpDown, Layers, LayoutGrid, ListTree, Plus, X } from 'lucide-react'
import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'

import type { WidgetDefinition } from 'widgets'
import {
  Button,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
  ScrollArea,
  Separator,
  cn,
} from 'ui'

import type { BuilderPage, BuilderWidgetInstance } from './types'
import {
  type BuilderWidgetMode,
  findWidgetById,
  TreeDragOverlayRow,
  TreeRow,
} from './BuilderSidebarItems'

// Панель дерева: структура страницы и глобальные элементы с drag-and-drop.

const commonWidgetTypes = [
  'Table',
  'Text',
  'Button',
  'TextInput',
  'NumberInput',
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
  { type: 'GlobalDrawer', label: 'Drawer', icon: <ListTree size={14} /> },
  { type: 'GlobalModal', label: 'Modal', icon: <Boxes size={14} /> },
  { type: 'GlobalSplitPane', label: 'Split pane', icon: <LayoutGrid size={14} /> },
]

const pageGlobalOptions = [
  { type: 'GlobalHeader', label: 'Header', icon: <LayoutGrid size={14} /> },
  { type: 'GlobalSidebar', label: 'Sidebar', icon: <Layers size={14} /> },
]

type BuilderSidebarPanelTreeProps = {
  title: string
  icon: ReactNode
  onClose?: () => void
  activePage: BuilderPage | null
  pages: BuilderPage[]
  globalWidgets: BuilderWidgetInstance[]
  pageGlobals: BuilderWidgetInstance[]
  selectedWidgetId?: string | null
  selectedGlobalWidgetId?: string | null
  selectedPageComponent?: boolean
  widgets: WidgetDefinition[]
  onSelectPage: (pageId: string) => void
  onSelectWidget?: (widgetId: string) => void
  onSelectGlobalWidget?: (widgetId: string) => void
  onSelectPageComponent?: () => void
  onToggleWidgetHidden?: (widgetId: string, mode: BuilderWidgetMode) => void
  onReorderWidget?: (
    activeId: string,
    overId: string,
    parentId: string | null,
    mode: BuilderWidgetMode
  ) => void
  onAddGlobalWidget?: (type: string) => void
  onAddPageGlobalWidget?: (type: string) => void
  onAddWidgetAtRoot?: (widgetType: string) => void
}

export const BuilderSidebarPanelTree = ({
  title,
  icon,
  onClose,
  activePage,
  pages,
  globalWidgets,
  pageGlobals,
  selectedWidgetId,
  selectedGlobalWidgetId,
  selectedPageComponent,
  widgets,
  onSelectPage,
  onSelectWidget,
  onSelectGlobalWidget,
  onSelectPageComponent,
  onToggleWidgetHidden,
  onReorderWidget,
  onAddGlobalWidget,
  onAddPageGlobalWidget,
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
  const [activeDrag, setActiveDrag] = useState<{ id: string; mode: BuilderWidgetMode } | null>(
    null
  )

  // DND-kit: drag/drop только по вертикали.
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))
  const availableWidgets = useMemo(
    () => widgets.filter((widget) => widget.category !== 'globals'),
    [widgets]
  )
  const commonWidgets = useMemo(() => {
    return commonWidgetTypes
      .map((type) => availableWidgets.find((widget) => widget.type === type))
      .filter(Boolean) as WidgetDefinition[]
  }, [availableWidgets])
  const widgetMenu = commonWidgets.length > 0 ? commonWidgets : availableWidgets.slice(0, 8)
  const isPageSettingsSelected = Boolean(
    activePage && !selectedWidgetId && !selectedGlobalWidgetId && !selectedPageComponent
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

  // Данные активного dnd-элемента для оверлея.
  const activeDragWidget = useMemo(() => {
    if (!activeDrag?.id) {
      return null
    }
    const sourceWidgets =
      activeDrag.mode === 'global'
        ? globalWidgets
        : activeDrag.mode === 'page-global'
          ? pageGlobals
          : activePage?.widgets
    if (!sourceWidgets) {
      return null
    }
    return findWidgetById(sourceWidgets, activeDrag.id)
  }, [activeDrag, activePage, globalWidgets, pageGlobals])

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between pl-3 pr-2">
        <div className="flex h-9 items-center gap-2 text-xs font-medium">
          <div className="text-xs font-medium">{title}</div>
        </div>
        <Button className="px-1" type="text" size="tiny" icon={<X size={14} />} onClick={() => onClose?.()} />
      </div>
      <Separator />
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis]}
        onDragStart={(event: DragStartEvent) => {
          const data = event.active.data.current as
            | { parentId: string | null; mode: BuilderWidgetMode }
            | undefined
          setActiveDrag({
            id: String(event.active.id),
            mode: data?.mode ?? 'page',
          })
        }}
        onDragEnd={(event: DragEndEvent) => {
          const { active, over } = event
          setActiveDrag(null)
          if (!over || active.id === over.id) {
            return
          }
          const activeData = active.data.current as
            | { parentId: string | null; mode: BuilderWidgetMode }
            | undefined
          const overData = over.data.current as
            | { parentId: string | null; mode: BuilderWidgetMode }
            | undefined
          if (!activeData || !overData) {
            return
          }
          if (activeData.mode !== overData.mode) {
            return
          }
          if (activeData.parentId !== overData.parentId) {
            return
          }
          onReorderWidget?.(
            String(active.id),
            String(over.id),
            activeData.parentId ?? null,
            activeData.mode
          )
        }}
        onDragCancel={() => setActiveDrag(null)}
      >
        <ScrollArea className="min-h-0 flex-1">
          <div className="space-y-2 px-2 py-2">
            <div>
              <div className="flex items-center justify-between px-1.5 py-1 text-[10px] uppercase text-foreground-muted">
                <button
                  type="button"
                  className="flex items-center gap-2"
                  onClick={() => setIsGlobalOpen((prev) => !prev)}
                >
                  
                  <span>GLOBAL</span>
                </button>
                <div className='flex gap-1'>
                  <Popover_Shadcn_ open={globalAddOpen} onOpenChange={setGlobalAddOpen}>
                    <PopoverTrigger_Shadcn_ asChild>
                      <Button className='px-1' type="text" size="tiny" icon={<Plus size={12} />} />
                    </PopoverTrigger_Shadcn_>
                    <PopoverContent_Shadcn_ className="w-56 p-2" align="start">
                      <div className="space-y-1">
                        <div className="px-2 py-1 text-xs uppercase text-foreground-muted">
                          Add global component
                        </div>
                        {globalComponentOptions.map((option) => (
                          <Button
                            key={option.type}
                            type="text"
                            size="tiny"
                            className="w-full justify-start"
                            icon={option.icon}
                            onClick={() => {
                              onAddGlobalWidget?.(option.type)
                              setGlobalAddOpen(false)
                            }}
                          >
                            {option.label}
                          </Button>
                        ))}
                      </div>
                    </PopoverContent_Shadcn_>
                  </Popover_Shadcn_>
                  <button
                    type="button"
                    className="flex items-center gap-2"
                    onClick={() => setIsGlobalOpen((prev) => !prev)}
                  >
                    <ChevronsUpDown size={12} />
                  </button>
                </div>
              </div>
              {isGlobalOpen && (
                <div className="space-y-3">
                  <SortableContext
                    items={globalWidgets.map((widget) => widget.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-1">
                      {globalWidgets.length > 0 ? (
                        globalWidgets.map((widget) => (
                          <TreeRow
                            key={widget.id}
                            widget={widget}
                            depth={0}
                            mode="global"
                            parentId={null}
                            collapsed={collapsed}
                            setCollapsed={setCollapsed}
                            selectedWidgetId={selectedWidgetId}
                            selectedGlobalWidgetId={selectedGlobalWidgetId}
                            onSelectWidget={onSelectWidget}
                            onSelectGlobalWidget={onSelectGlobalWidget}
                            onToggleWidgetHidden={onToggleWidgetHidden}
                            onFocusWidget={focusWidget}
                          />
                        ))
                      ) : (
                        <div className="px-1.5 py-1 text-[11px] text-foreground-muted">
                          No global components yet.
                        </div>
                      )}
                    </div>
                  </SortableContext>
                </div>
              )}
            </div>
            <Separator />
            <div>
              <div
                className={cn(
                  'flex items-center justify-between rounded-sm px-1.5 py-1 text-[10px] uppercase transition',
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
                        className="flex items-center gap-1 text-[11px] normal-case text-foreground"
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
                      <div className="space-y-2">
                        <div className="px-2 py-1 text-[11px] uppercase text-foreground-muted">
                          Add layout
                        </div>
                        {pageGlobalOptions.map((option) => (
                          <Button
                            key={option.type}
                            type="text"
                            size="tiny"
                            className="w-full justify-start"
                            icon={option.icon}
                            onClick={() => {
                              onAddPageGlobalWidget?.(option.type)
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
                  {pageGlobals.length > 0 && (
                    <SortableContext
                      items={pageGlobals.map((widget) => widget.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-0.5">
                        {pageGlobals.map((widget) => (
                          <TreeRow
                            key={widget.id}
                            widget={widget}
                            depth={0}
                            mode="page-global"
                            parentId={null}
                            collapsed={collapsed}
                            setCollapsed={setCollapsed}
                            selectedWidgetId={selectedWidgetId}
                            selectedGlobalWidgetId={selectedGlobalWidgetId}
                            onSelectWidget={onSelectWidget}
                            onSelectGlobalWidget={onSelectGlobalWidget}
                            onToggleWidgetHidden={onToggleWidgetHidden}
                            onFocusWidget={focusWidget}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  )}
                  <div
                    className={cn(
                      'flex w-full items-center justify-between rounded-sm px-1.5 py-1 text-[10px] uppercase transition',
                      selectedPageComponent
                        ? 'bg-brand-500/10 text-foreground'
                        : 'text-foreground-muted hover:bg-surface-200'
                    )}
                    onClick={() => onSelectPageComponent?.()}
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
                    <SortableContext
                      items={activePage?.widgets?.map((widget) => widget.id) ?? []}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-0.5">
                        {activePage?.widgets?.length
                          ? activePage.widgets.map((widget) => (
                              <TreeRow
                                key={widget.id}
                                widget={widget}
                                depth={0}
                                mode="page"
                                parentId={null}
                                collapsed={collapsed}
                                setCollapsed={setCollapsed}
                                selectedWidgetId={selectedWidgetId}
                                selectedGlobalWidgetId={selectedGlobalWidgetId}
                                onSelectWidget={onSelectWidget}
                                onSelectGlobalWidget={onSelectGlobalWidget}
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
                    </SortableContext>
                  )}
                </div>
              )}
            </div>
            <Separator />
            <div>
              <div className="flex items-center justify-between px-1.5 py-1 text-[10px] uppercase text-foreground-muted">
                <button
                  type="button"
                  className="flex items-center gap-2"
                  onClick={() => setIsGraphOpen((prev) => !prev)}
                >
                  {isGraphOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
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
        <DragOverlay>{activeDragWidget ? <TreeDragOverlayRow widget={activeDragWidget} /> : null}</DragOverlay>
      </DndContext>
    </div>
  )
}
