import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetSection, SheetTitle, cn } from 'ui'

import { createWidgetDefinition } from '../types'

type DrawerSide = 'left' | 'right' | 'top' | 'bottom'
type DrawerSize = 'sm' | 'md' | 'lg' | 'full'

export type DrawerProps = {
  title: string
  description: string
  open: boolean
  side: DrawerSide
  size: DrawerSize
  showHeader: boolean
  showFooter: boolean
  showOverlay: boolean
  closeOnOutsideClick: boolean
  padding: 'sm' | 'md' | 'lg'
  bordered: boolean
  background: 'surface' | 'muted' | 'transparent'
  events: unknown[]
}

const paddingClasses: Record<DrawerProps['padding'], string> = {
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
}

const backgroundClasses: Record<DrawerProps['background'], string> = {
  surface: 'bg-card',
  muted: 'bg-muted',
  transparent: 'bg-transparent',
}

const sidePreviewClasses: Record<DrawerSide, string> = {
  left: 'left-0 top-0 h-full border-r',
  right: 'right-0 top-0 h-full border-l',
  top: 'left-0 top-0 w-full border-b',
  bottom: 'left-0 bottom-0 w-full border-t',
}

const sideSizePreviewClasses: Record<DrawerSide, Record<DrawerSize, string>> = {
  left: {
    sm: 'w-1/3',
    md: 'w-1/2',
    lg: 'w-2/3',
    full: 'w-full',
  },
  right: {
    sm: 'w-1/3',
    md: 'w-1/2',
    lg: 'w-2/3',
    full: 'w-full',
  },
  top: {
    sm: 'h-1/3',
    md: 'h-1/2',
    lg: 'h-2/3',
    full: 'h-full',
  },
  bottom: {
    sm: 'h-1/3',
    md: 'h-1/2',
    lg: 'h-2/3',
    full: 'h-full',
  },
}

const sizeToSheetSize: Record<DrawerSize, 'sm' | 'default' | 'lg' | 'full'> = {
  sm: 'sm',
  md: 'default',
  lg: 'lg',
  full: 'full',
}

const toBoolean = (value: unknown, fallback: boolean) =>
  typeof value === 'boolean' ? value : fallback

export const DrawerDefinition = createWidgetDefinition<DrawerProps>({
  type: 'Drawer',
  label: 'Drawer',
  category: 'containers',
  description: 'Slide-over container panel',
  supportsChildren: true,
  events: ['toggle'],
  defaultProps: {
    title: 'Drawer title',
    description: '',
    open: false,
    side: 'right',
    size: 'md',
    showHeader: true,
    showFooter: false,
    showOverlay: true,
    closeOnOutsideClick: true,
    padding: 'md',
    bordered: true,
    background: 'surface',
    events: [],
  },
  render: (props, context) => {
    const isCanvas = context?.mode === 'canvas'
    const isOpen = toBoolean(context?.state?.open, props.open)
    const headerSlot = context?.renderChildren?.({ slot: 'header' })
    const bodySlot = context?.renderChildren?.({ slot: 'body', includeUnassigned: true })
    const footerSlot = context?.renderChildren?.({ slot: 'footer' })
    const fallbackBody = context?.children ? (
      <div className="space-y-3">{context.children}</div>
    ) : (
      <div className="rounded-md border border-dashed border-border/40 px-3 py-4 text-xs text-muted-foreground">
        Drop widgets here
      </div>
    )
    const bodyContent = bodySlot ?? fallbackBody

    if (isCanvas) {
      return (
        <div className="relative h-full min-h-[220px] overflow-hidden rounded-lg border border-border/40 bg-background">
          {props.showOverlay ? <div className="absolute inset-0 bg-black/10" /> : null}
          <div
            className={cn(
              'absolute rounded-none bg-card text-card-foreground',
              backgroundClasses[props.background],
              props.bordered ? 'border-border/40' : 'border-transparent',
              sidePreviewClasses[props.side],
              sideSizePreviewClasses[props.side][props.size]
            )}
          >
            {props.showHeader ? (
              <div className="border-b border-border/30 px-4 py-3">
                {headerSlot ?? (
                  <>
                    <div className="text-sm font-medium text-foreground">
                      {props.title || 'Drawer title'}
                    </div>
                    {props.description ? (
                      <div className="mt-1 text-xs text-muted-foreground">{props.description}</div>
                    ) : null}
                  </>
                )}
              </div>
            ) : null}
            <div className={paddingClasses[props.padding]}>{bodyContent}</div>
            {props.showFooter ? (
              <div className="border-t border-border/30 px-4 py-3">
                {footerSlot ?? <div className="text-xs text-muted-foreground">Drawer footer</div>}
              </div>
            ) : null}
          </div>
          {!isOpen ? (
            <div className="absolute right-2 top-2 rounded border border-border/40 bg-card px-2 py-0.5 text-[10px] uppercase text-muted-foreground">
              Closed in runtime
            </div>
          ) : null}
        </div>
      )
    }

    if (!isOpen) {
      return null
    }

    return (
      <Sheet
        open={isOpen}
        onOpenChange={(nextOpen) => {
          context?.setState?.({ open: nextOpen })
          context?.runActions?.('toggle', { open: nextOpen })
        }}
      >
        <SheetContent
          side={props.side}
          size={sizeToSheetSize[props.size]}
          hasOverlay={props.showOverlay}
          className={cn(
            'bg-card text-card-foreground',
            props.bordered ? 'border-border/40' : 'border-transparent'
          )}
          onInteractOutside={(event) => {
            if (!props.closeOnOutsideClick) {
              event.preventDefault()
            }
          }}
          onPointerDownOutside={(event) => {
            if (!props.closeOnOutsideClick) {
              event.preventDefault()
            }
          }}
        >
          {props.showHeader ? (
            <SheetHeader className="bg-transparent">
              {headerSlot ?? (
                <>
                  <SheetTitle>{props.title || 'Drawer title'}</SheetTitle>
                  {props.description ? <SheetDescription>{props.description}</SheetDescription> : null}
                </>
              )}
            </SheetHeader>
          ) : null}
          <SheetSection className={paddingClasses[props.padding]}>{bodyContent}</SheetSection>
          {props.showFooter ? (
            <SheetFooter>{footerSlot ?? <div className="text-xs text-muted-foreground">Drawer footer</div>}</SheetFooter>
          ) : null}
        </SheetContent>
      </Sheet>
    )
  },
})
