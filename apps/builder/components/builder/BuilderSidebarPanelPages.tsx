import type { ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { Home, Plus, Trash2, X } from 'lucide-react'

import {
  Button,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Input_Shadcn_,
  ScrollArea,
  Separator,
  cn,
} from 'ui'

import { BuilderDataPanel } from './BuilderDataPanel'
import type { BuilderPage, BuilderQueryRunResult } from './types'

// Вкладки Pages/Data и диалог удаления страницы.

type BuilderSidebarPanelSection = 'pages' | 'data'

type BuilderSidebarPanelPagesProps = {
  title: string
  icon: ReactNode
  onClose?: () => void
  section: BuilderSidebarPanelSection
  appId?: string
  projectRef?: string
  projectRestUrl?: string | null
  pages: BuilderPage[]
  activePageId: string
  rootScreenId?: string | null
  onSetRootScreen?: (pageId: string) => void
  onSelectPage: (pageId: string) => void
  onAddPage: () => void
  onDeletePage?: (pageId: string) => void
  isDeletingPage?: boolean
  onQueryRun?: (result: BuilderQueryRunResult) => void
}

export const BuilderSidebarPanelPages = ({
  title,
  icon,
  onClose,
  section,
  appId,
  projectRef,
  projectRestUrl,
  pages,
  activePageId,
  rootScreenId,
  onSetRootScreen,
  onSelectPage,
  onAddPage,
  onDeletePage,
  isDeletingPage,
  onQueryRun,
}: BuilderSidebarPanelPagesProps) => {
  const PAGE_LIMIT_STEP = 50
  const [deleteTarget, setDeleteTarget] = useState<BuilderPage | null>(null)
  const [search, setSearch] = useState('')
  const [pageLimit, setPageLimit] = useState(PAGE_LIMIT_STEP)
  const hasSearch = search.trim().length > 0
  const filteredPages = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) {
      return pages
    }
    return pages.filter((page) => page.name.toLowerCase().includes(query))
  }, [pages, search])
  const visiblePages = useMemo(() => filteredPages.slice(0, pageLimit), [filteredPages, pageLimit])
  const hasMorePages = filteredPages.length > pageLimit

  useEffect(() => {
    setPageLimit(PAGE_LIMIT_STEP)
  }, [pages.length, search])

  return (
    <>
      <div className="flex h-full min-h-0 flex-col">
        <div className="flex items-center justify-between pl-3 pr-2">
          <div className="flex h-9 items-center gap-2 text-xs font-medium">
            {title}
          </div>
          <Button className="px-1" type="text" size="tiny" icon={<X size={14} />} onClick={() => onClose?.()} />
        </div>
        <div className="flex h-8 items-center justify-between pl-3 pr-2">
          <div className="flex items-center gap-2">
            <div className="text-xs font-medium">
              List of pages {filteredPages.length}/{pages.length}
            </div>
          </div>
          <div className="flex items-center gap-1">
            {section === 'pages' && (
              <Button
                type="text"
                size="tiny"
                className="px-1"
                icon={<Plus size={14} />}
                aria-label="New page"
                onClick={onAddPage}
              />
            )}
          </div>
        </div>
        {section === 'pages' ? (
          <>
            <ScrollArea className="min-h-0 flex-1 px-2 py-2">
              <div className="mb-2">
                <Input_Shadcn_
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search pages"
                  className="h-7 text-xs"
                />
              </div>
              <div className="flex min-h-full flex-col gap-0.5">
                {filteredPages.length > 0 ? (
                  visiblePages.map((page) => {
                    const isRoot = rootScreenId === page.id
                    return (
                      <div
                        key={page.id}
                        role="button"
                        tabIndex={0}
                        className={cn(
                          'group flex w-full items-center justify-between gap-2 rounded-sm text-[11px] transition',
                          activePageId === page.id
                            ? 'bg-surface-200'
                            : 'hover:bg-surface-200'
                        )}
                        onClick={() => onSelectPage(page.id)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault()
                            onSelectPage(page.id)
                          }
                        }}
                      >
                        <Button
                          type="text"
                          size="tiny"
                          className={cn(
                            'px-1 transition-opacity',
                            isRoot
                              ? 'text-brand-500 opacity-100'
                              : 'text-foreground-muted opacity-0 group-hover:opacity-100'
                          )}
                          icon={<Home size={12} />}
                          aria-label={isRoot ? 'Home page' : 'Set as home page'}
                          onClick={(event) => {
                            event.stopPropagation()
                            onSetRootScreen?.(page.id)
                          }}
                          disabled={!onSetRootScreen}
                        />
                        <div className="flex-1 text-left font-medium">
                          {page.name}
                        </div>

                        <Button
                          type="text"
                          size="tiny"
                          className="px-1"
                          icon={<Trash2 size={12} />}
                          aria-label={`Delete ${page.name}`}
                          onClick={(event) => {
                            event.stopPropagation()
                            setDeleteTarget(page)
                          }}
                          disabled={!onDeletePage || isDeletingPage}
                        />
                      </div>
                    )
                  })
                ) : (
                  <div className="rounded-md border border-dashed border-foreground-muted/40 px-3 py-2.5 text-xs text-foreground-muted">
                    {hasSearch ? 'No matches' : 'No pages yet'}
                  </div>
                )}
                {hasMorePages && (
                  <Button
                    type="text"
                    size="tiny"
                    className="mt-1 w-full justify-center"
                    onClick={() => setPageLimit((prev) => prev + PAGE_LIMIT_STEP)}
                  >
                    Show more
                  </Button>
                )}
              </div>
            </ScrollArea>
          </>
        ) : (
          <>
            <ScrollArea className="min-h-0 flex-1 px-3 py-3">
              <BuilderDataPanel
                appId={appId}
                projectRef={projectRef}
                projectRestUrl={projectRestUrl}
                onQueryRun={onQueryRun}
              />
            </ScrollArea>
          </>
        )}
      </div>

      {/* Диалог подтверждения удаления страницы. */}
      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete page</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `Delete "${deleteTarget.name}"? This cannot be undone.`
                : 'Delete this page? This cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={Boolean(isDeletingPage)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="danger"
              onClick={() => {
                if (!deleteTarget || !onDeletePage) {
                  return
                }
                onDeletePage(deleteTarget.id)
                setDeleteTarget(null)
              }}
              disabled={!onDeletePage || Boolean(isDeletingPage)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
