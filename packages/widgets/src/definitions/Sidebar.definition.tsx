import type { CSSProperties } from 'react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarProvider,
  SidebarTrigger,
  cn,
} from 'ui'

import { createWidgetDefinition } from '../types'
import {
  buildSidebarThemeVars,
  getSidebarPaddingClass,
  getSidebarSectionPaddingClass,
  resolveSidebarPanelConfig,
} from '../sidebar-config'

export type SidebarProps = {
  title: string
  description: string
  side: 'left' | 'right'
  width: number
  open: boolean
  collapsible: boolean
  showHeader: boolean
  showFooter: boolean
  padding: 'sm' | 'md' | 'lg'
  headerPadding: 'sm' | 'md' | 'lg'
  footerPadding: 'sm' | 'md' | 'lg'
  bordered: boolean
  background: 'surface' | 'muted' | 'transparent'
  events: unknown[]
}

const SIDEBAR_DEFAULT_PROPS: SidebarProps = {
  title: 'Sidebar',
  description: '',
  side: 'left',
  width: 280,
  open: true,
  collapsible: true,
  showHeader: true,
  showFooter: false,
  padding: 'md',
  headerPadding: 'md',
  footerPadding: 'md',
  bordered: true,
  background: 'surface',
  events: [],
}

export const SidebarDefinition = createWidgetDefinition<SidebarProps>({
  type: 'Sidebar',
  label: 'Sidebar',
  category: 'containers',
  description: 'Sidebar container',
  supportsChildren: true,
  events: ['toggle'],
  defaultProps: SIDEBAR_DEFAULT_PROPS,
  render: (props, context) => {
    const rawProps = { ...SIDEBAR_DEFAULT_PROPS, ...props } as Record<string, unknown>
    const config = resolveSidebarPanelConfig(rawProps, { open: context?.state?.open })
    const sidebarEdgeBorderClass = config.bordered
      ? config.side === 'right'
        ? 'border-l border-sidebar-border'
        : 'border-r border-sidebar-border'
      : 'border-none'
    const headerSlot = context?.renderChildren?.({ slot: 'header' })
    const bodySlot = context?.renderChildren?.({ slot: 'body', includeUnassigned: true })
    const footerSlot = context?.renderChildren?.({ slot: 'footer' })
    const hasChildren = Boolean(bodySlot ?? context?.children)

    const handleOpenChange = (nextOpen: boolean) => {
      context?.setState?.({ open: nextOpen })
      if (context?.mode !== 'canvas') {
        context?.runActions?.('toggle', { open: nextOpen })
      }
    }

    return (
      <div
        className={cn(
          'h-full min-h-0 w-full',
          config.side === 'right' ? 'flex justify-end' : 'flex'
        )}
      >
        <SidebarProvider
          open={config.open}
          onOpenChange={handleOpenChange}
          className="h-full !min-h-0 !w-auto"
          style={
            {
              ...buildSidebarThemeVars(config),
              '--sidebar-width': `${config.panelWidth}px`,
              '--sidebar-width-icon': '56px',
            } as CSSProperties
          }
        >
          <Sidebar
            side={config.side}
            collapsible="none"
            variant="floating"
            className={cn(
              'h-full min-h-0 rounded-none',
              config.background === 'transparent' ? '!bg-transparent' : '',
              sidebarEdgeBorderClass
            )}
          >
            {config.showHeader ? (
              <SidebarHeader
                className={cn('gap-1 border-b border-sidebar-border', getSidebarSectionPaddingClass(config.headerPadding))}
              >
                {headerSlot ?? (
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-sidebar-foreground">
                        {config.title}
                      </div>
                      {!config.collapsed && config.description ? (
                        <div className="truncate text-xs text-sidebar-foreground/70">
                          {config.description}
                        </div>
                      ) : null}
                    </div>
                    {config.collapsible ? (
                      <SidebarTrigger
                        className={cn(
                          'h-6 w-6 shrink-0 rounded border border-sidebar-border text-sidebar-foreground/80 transition-colors',
                          'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground [&_svg]:size-3.5'
                        )}
                        onClick={(event) => {
                          event.stopPropagation()
                        }}
                      />
                    ) : null}
                  </div>
                )}
              </SidebarHeader>
            ) : null}
            <SidebarContent className={cn('min-h-0', getSidebarPaddingClass(config.padding))}>
              {hasChildren ? (
                <div className="space-y-3">{bodySlot ?? context?.children}</div>
              ) : (
                <div className="rounded-md border border-dashed border-sidebar-border px-3 py-4 text-xs text-sidebar-foreground/70">
                  Drop widgets here
                </div>
              )}
            </SidebarContent>
            {config.showFooter ? (
              <SidebarFooter
                className={cn('border-t border-sidebar-border', getSidebarSectionPaddingClass(config.footerPadding))}
              >
                {footerSlot ?? <div className="text-xs text-sidebar-foreground/70">Sidebar footer</div>}
              </SidebarFooter>
            ) : null}
          </Sidebar>
        </SidebarProvider>
      </div>
    )
  },
})
