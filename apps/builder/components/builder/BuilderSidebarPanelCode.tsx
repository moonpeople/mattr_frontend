import type { DragEvent, ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
import {
  Braces,
  ChevronDown,
  ChevronRight,
  FileCode,
  Hash,
  Layers,
  ListTree,
  Plus,
  X,
} from 'lucide-react'

import {
  Button,
  Input_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
  ScrollArea,
  Separator,
  cn,
} from 'ui'
import type { BuilderQuery } from 'data/builder/builder-queries'
import type { BuilderJsFunction } from 'data/builder/builder-js'

import type { BuilderPage } from './types'
import {
  type BuilderCodeItemType,
  type BuilderCodeSelection,
  getBuilderMeta,
  parseTransformerMeta,
} from './BuilderCodeUtils'

type BuilderSidebarPanelCodeProps = {
  title: string
  icon: ReactNode
  onClose?: () => void
  pages: BuilderPage[]
  activePageId: string
  onSelectPage: (pageId: string) => void
  queries: BuilderQuery[]
  jsFunctions: BuilderJsFunction[]
  selection: BuilderCodeSelection
  onSelectItem: (selection: BuilderCodeSelection) => void
  onAddItem: (type: BuilderCodeItemType, scope: 'global' | 'page', pageId?: string) => void
  onMoveItem?: (type: BuilderCodeItemType, id: string, scope: 'global' | 'page', pageId?: string) => void
}

type CodeListItem = {
  id: string
  name: string
  type: BuilderCodeItemType
}

const getItemIcon = (type: BuilderCodeItemType) => {
  if (type === 'query') {
    return Braces
  }
  if (type === 'transformer') {
    return FileCode
  }
  return Hash
}

export const BuilderSidebarPanelCode = ({
  title,
  icon,
  onClose,
  pages,
  activePageId,
  onSelectPage,
  queries,
  jsFunctions,
  selection,
  onSelectItem,
  onAddItem,
  onMoveItem,
}: BuilderSidebarPanelCodeProps) => {
  const CODE_LIMIT_STEP = 50
  const [isGlobalOpen, setIsGlobalOpen] = useState(true)
  const [isPageOpen, setIsPageOpen] = useState(true)
  const [isGraphOpen, setIsGraphOpen] = useState(true)
  const [pageSelectOpen, setPageSelectOpen] = useState(false)
  const [globalAddOpen, setGlobalAddOpen] = useState(false)
  const [pageAddOpen, setPageAddOpen] = useState(false)
  const [dragScope, setDragScope] = useState<'global' | 'page' | null>(null)
  const [search, setSearch] = useState('')
  const [globalLimit, setGlobalLimit] = useState(CODE_LIMIT_STEP)
  const [pageLimit, setPageLimit] = useState(CODE_LIMIT_STEP)
  const hasSearch = search.trim().length > 0

  const activePage = pages.find((page) => page.id === activePageId) ?? pages[0]

  const { globalItems, pageItems } = useMemo(() => {
    const globalQueries: CodeListItem[] = []
    const pageQueries: CodeListItem[] = []
    const globalTransformers: CodeListItem[] = []
    const pageTransformers: CodeListItem[] = []

    queries.forEach((query) => {
      const meta = getBuilderMeta(query.config)
      const scope = meta.scope ?? 'global'
      const pageId = meta.pageId
      const itemType: BuilderCodeItemType = query.type === 'variable' ? 'variable' : 'query'
      const item = { id: query.id, name: query.name, type: itemType }
      if (scope === 'page' && pageId && pageId === activePageId) {
        pageQueries.push(item)
      } else {
        globalQueries.push(item)
      }
    })

    jsFunctions.forEach((func) => {
      const parsed = parseTransformerMeta(func.code ?? '')
      const scope = parsed.meta.scope ?? 'global'
      const pageId = parsed.meta.pageId
      const item = { id: func.id, name: func.name, type: 'transformer' as const }
      if (scope === 'page') {
        if (pageId && pageId === activePageId) {
          pageTransformers.push(item)
        } else if (!pageId) {
          globalTransformers.push(item)
        }
        return
      }
      globalTransformers.push(item)
    })

    const sortedGlobal = [...globalQueries, ...globalTransformers].sort((a, b) =>
      a.name.localeCompare(b.name)
    )
    const sortedPage = [...pageQueries, ...pageTransformers].sort((a, b) =>
      a.name.localeCompare(b.name)
    )
    return { globalItems: sortedGlobal, pageItems: sortedPage }
  }, [activePageId, jsFunctions, queries])

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) {
      return { globalItems, pageItems }
    }
    return {
      globalItems: globalItems.filter((item) => item.name.toLowerCase().includes(query)),
      pageItems: pageItems.filter((item) => item.name.toLowerCase().includes(query)),
    }
  }, [globalItems, pageItems, search])

  const visibleGlobalItems = useMemo(
    () => filteredItems.globalItems.slice(0, globalLimit),
    [filteredItems.globalItems, globalLimit]
  )
  const visiblePageItems = useMemo(
    () => filteredItems.pageItems.slice(0, pageLimit),
    [filteredItems.pageItems, pageLimit]
  )
  const hasMoreGlobal = filteredItems.globalItems.length > globalLimit
  const hasMorePage = filteredItems.pageItems.length > pageLimit

  useEffect(() => {
    setGlobalLimit(CODE_LIMIT_STEP)
    setPageLimit(CODE_LIMIT_STEP)
  }, [activePageId, search, jsFunctions.length, queries.length])

  const renderItem = (item: CodeListItem) => {
    const Icon = getItemIcon(item.type)
    const isSelected = selection?.type === item.type && selection.id === item.id
    return (
      <button
        key={`${item.type}-${item.id}`}
        type="button"
        draggable
        className={cn(
          'flex w-full items-center gap-1.5 rounded-sm px-1.5 py-0.5 text-[11px] transition',
          isSelected
            ? 'bg-brand-500/10 text-foreground'
            : 'text-foreground-muted hover:bg-surface-200'
        )}
        onClick={() => onSelectItem({ type: item.type, id: item.id })}
        onDragStart={(event) => {
          event.dataTransfer.setData(
            'application/json',
            JSON.stringify({ id: item.id, type: item.type })
          )
          event.dataTransfer.effectAllowed = 'move'
        }}
      >
        <Icon size={12} className="text-foreground-muted" />
        <span className="text-foreground">{item.name}</span>
      </button>
    )
  }

  const handleDrop = (event: DragEvent<HTMLDivElement>, scope: 'global' | 'page') => {
    event.preventDefault()
    const payload =
      event.dataTransfer.getData('application/json') ||
      event.dataTransfer.getData('text/plain')
    setDragScope(null)
    if (!payload) {
      return
    }
    try {
      const parsed = JSON.parse(payload) as { id?: string; type?: BuilderCodeItemType }
      if (!parsed?.id || !parsed?.type) {
        return
      }
      onMoveItem?.(
        parsed.type,
        parsed.id,
        scope,
        scope === 'page' ? activePage?.id : undefined
      )
    } catch {
      return
    }
  }

  const handleDragEnter = (scope: 'global' | 'page') => {
    setDragScope(scope)
  }

  const handleDragLeave = (
    event: DragEvent<HTMLDivElement>,
    scope: 'global' | 'page'
  ) => {
    const relatedTarget = event.relatedTarget as Node | null
    if (relatedTarget && event.currentTarget.contains(relatedTarget)) {
      return
    }
    if (dragScope === scope) {
      setDragScope(null)
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between pl-3 pr-2">
        <div className="flex h-9 items-center gap-2">
          <div className="text-xs font-medium">{title}</div>
        </div>
        <Button className="px-1" type="text" size="tiny" icon={<X size={14} />} onClick={() => onClose?.()} />
      </div>
      <Separator />
      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-2 px-2 py-2">
          <Input_Shadcn_
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search code"
            className="h-7 text-xs"
          />
          <div
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => handleDrop(event, 'global')}
            onDragEnter={() => handleDragEnter('global')}
            onDragLeave={(event) => handleDragLeave(event, 'global')}
            className={cn(
              'rounded-md',
              dragScope === 'global' ? 'bg-brand-500/5 ring-1 ring-brand-500/40' : ''
            )}
          >
            <div className="flex items-center justify-between px-1.5 py-1 text-[10px] uppercase text-foreground-muted">
              <button
                type="button"
                className="flex items-center gap-2"
                onClick={() => setIsGlobalOpen((prev) => !prev)}
              >
                {isGlobalOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                <span>Global</span>
              </button>
              <Popover_Shadcn_ open={globalAddOpen} onOpenChange={setGlobalAddOpen}>
                <PopoverTrigger_Shadcn_ asChild>
                  <Button type="text" size="tiny" icon={<Plus size={12} />} />
                </PopoverTrigger_Shadcn_>
                <PopoverContent_Shadcn_ className="w-40 p-1" align="end">
                  <div className="space-y-1">
                    <Button
                      type="text"
                      size="tiny"
                      className="w-full justify-start"
                      onClick={() => {
                        onAddItem('query', 'global')
                        setGlobalAddOpen(false)
                      }}
                    >
                      Query
                    </Button>
                    <Button
                      type="text"
                      size="tiny"
                      className="w-full justify-start"
                      onClick={() => {
                        onAddItem('transformer', 'global')
                        setGlobalAddOpen(false)
                      }}
                    >
                      Transformer
                    </Button>
                    <Button
                      type="text"
                      size="tiny"
                      className="w-full justify-start"
                      onClick={() => {
                        onAddItem('variable', 'global')
                        setGlobalAddOpen(false)
                      }}
                    >
                      Variable
                    </Button>
                  </div>
                </PopoverContent_Shadcn_>
              </Popover_Shadcn_>
            </div>
            {isGlobalOpen && (
              <div className="space-y-1">
                {filteredItems.globalItems.length > 0 ? (
                  visibleGlobalItems.map(renderItem)
                ) : (
                  <div className="px-1.5 py-1 text-[11px] text-foreground-muted">
                    {hasSearch ? 'No matches' : 'No global items yet.'}
                  </div>
                )}
                {hasMoreGlobal && (
                  <Button
                    type="text"
                    size="tiny"
                    className="w-full justify-center"
                    onClick={() => setGlobalLimit((prev) => prev + CODE_LIMIT_STEP)}
                  >
                    Show more
                  </Button>
                )}
              </div>
            )}
          </div>
          <Separator />
          <div
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => handleDrop(event, 'page')}
            onDragEnter={() => handleDragEnter('page')}
            onDragLeave={(event) => handleDragLeave(event, 'page')}
            className={cn(
              'rounded-md',
              dragScope === 'page' ? 'bg-brand-500/5 ring-1 ring-brand-500/40' : ''
            )}
          >
            <div className="flex items-center justify-between px-1.5 py-1 text-[10px] uppercase text-foreground-muted">
              <button
                type="button"
                className="flex items-center gap-2"
                onClick={() => setIsPageOpen((prev) => !prev)}
              >
                {isPageOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                <span>Page</span>
              </button>
              <div className="flex items-center gap-1">
                <Popover_Shadcn_ open={pageSelectOpen} onOpenChange={setPageSelectOpen}>
                  <PopoverTrigger_Shadcn_ asChild>
                    <button
                      type="button"
                      className="flex items-center gap-1 text-[11px] normal-case text-foreground"
                    >
                      <Layers size={12} className="text-foreground-muted" />
                      <span>{activePage?.name ?? 'Page'}</span>
                      <ChevronDown size={12} className="text-foreground-muted" />
                    </button>
                  </PopoverTrigger_Shadcn_>
                  <PopoverContent_Shadcn_ className="w-48 p-1" align="start">
                    <ScrollArea className="max-h-64">
                      <div className="space-y-1 p-1">
                        {pages.map((page) => (
                          <Button
                            key={page.id}
                            type="text"
                            size="tiny"
                            className={cn(
                              'w-full justify-start',
                              activePage?.id === page.id
                                ? 'text-foreground'
                                : 'text-foreground-muted'
                            )}
                            onClick={() => {
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
                <Popover_Shadcn_ open={pageAddOpen} onOpenChange={setPageAddOpen}>
                  <PopoverTrigger_Shadcn_ asChild>
                    <Button type="text" size="tiny" icon={<Plus size={12} />} />
                  </PopoverTrigger_Shadcn_>
                  <PopoverContent_Shadcn_ className="w-40 p-1" align="end">
                    <div className="space-y-1">
                      <Button
                        type="text"
                        size="tiny"
                        className="w-full justify-start"
                        onClick={() => {
                          onAddItem('query', 'page', activePage?.id)
                          setPageAddOpen(false)
                        }}
                        disabled={!activePage}
                      >
                        Query
                      </Button>
                      <Button
                        type="text"
                        size="tiny"
                        className="w-full justify-start"
                        onClick={() => {
                          onAddItem('transformer', 'page', activePage?.id)
                          setPageAddOpen(false)
                        }}
                        disabled={!activePage}
                      >
                        Transformer
                      </Button>
                      <Button
                        type="text"
                        size="tiny"
                        className="w-full justify-start"
                        onClick={() => {
                          onAddItem('variable', 'page', activePage?.id)
                          setPageAddOpen(false)
                        }}
                        disabled={!activePage}
                      >
                        Variable
                      </Button>
                    </div>
                  </PopoverContent_Shadcn_>
                </Popover_Shadcn_>
              </div>
            </div>
            {isPageOpen && (
              <div className="space-y-1">
                {filteredItems.pageItems.length > 0 ? (
                  visiblePageItems.map(renderItem)
                ) : (
                  <div className="px-1.5 py-1 text-[11px] text-foreground-muted">
                    {hasSearch ? 'No matches' : 'No page items yet.'}
                  </div>
                )}
                {hasMorePage && (
                  <Button
                    type="text"
                    size="tiny"
                    className="w-full justify-center"
                    onClick={() => setPageLimit((prev) => prev + CODE_LIMIT_STEP)}
                  >
                    Show more
                  </Button>
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
    </div>
  )
}
