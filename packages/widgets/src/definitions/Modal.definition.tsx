import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogTitle,
  cn,
} from 'ui'

import { createWidgetDefinition } from '../types'

export type ModalProps = {
  title: string
  description: string
  body?: string
  open: boolean
  size: 'small' | 'medium' | 'large' | 'xlarge'
  showHeader: boolean
  showFooter: boolean
  showOverlay: boolean
  closeOnOutsideClick: boolean
  padding: 'sm' | 'md' | 'lg'
  bordered: boolean
  background: 'surface' | 'muted' | 'transparent'
  events: unknown[]
}

const sizeClasses: Record<ModalProps['size'], string> = {
  small: 'max-w-sm',
  medium: 'max-w-lg',
  large: 'max-w-xl',
  xlarge: 'max-w-3xl',
}

const sizeToDialogSize: Record<ModalProps['size'], 'small' | 'medium' | 'large' | 'xlarge'> = {
  small: 'small',
  medium: 'medium',
  large: 'large',
  xlarge: 'xlarge',
}

const backgroundClasses: Record<ModalProps['background'], string> = {
  surface: 'bg-card',
  muted: 'bg-muted',
  transparent: 'bg-transparent',
}

const paddingClasses: Record<ModalProps['padding'], string> = {
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
}

const sectionPaddingBySize: Record<ModalProps['padding'], 'small' | 'medium'> = {
  sm: 'small',
  md: 'small',
  lg: 'medium',
}

const toBoolean = (value: unknown, fallback: boolean) =>
  typeof value === 'boolean' ? value : fallback

const readStateOpen = (stateOpen: unknown, propOpen: boolean) => {
  if (typeof stateOpen === 'boolean') {
    return stateOpen
  }
  if (typeof stateOpen === 'string') {
    const normalized = stateOpen.trim().toLowerCase()
    if (['true', '1', 'yes', 'y'].includes(normalized)) {
      return true
    }
    if (['false', '0', 'no', 'n'].includes(normalized)) {
      return false
    }
  }
  return propOpen
}

export const ModalDefinition = createWidgetDefinition<ModalProps>({
  type: 'Modal',
  label: 'Modal',
  category: 'containers',
  description: 'Dialog container',
  supportsChildren: true,
  events: ['toggle'],
  defaultProps: {
    title: 'Modal title',
    description: '',
    body: 'Modal content',
    open: false,
    size: 'medium',
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
    const isOpen = readStateOpen(context?.state?.open, toBoolean(props.open, false))
    const headerSlot = context?.renderChildren?.({ slot: 'header' })
    const bodySlot = context?.renderChildren?.({ slot: 'body', includeUnassigned: true })
    const footerSlot = context?.renderChildren?.({ slot: 'footer' })

    const legacyBody = typeof props.body === 'string' && props.body.trim().length > 0 ? props.body.trim() : ''
    const fallbackBody = context?.children ? (
      <div className="space-y-3">{context.children}</div>
    ) : legacyBody ? (
      <div className="text-sm text-foreground">{legacyBody}</div>
    ) : (
      <div className="rounded-md border border-dashed border-border/40 px-3 py-4 text-xs text-muted-foreground">
        Drop widgets here
      </div>
    )
    const bodyContent = bodySlot ?? fallbackBody

    if (isCanvas) {
      return (
        <div className="relative h-full min-h-[220px] rounded-lg border border-border/40 bg-background p-4">
          {props.showOverlay ? (
            <div className="pointer-events-none absolute inset-0 rounded-lg bg-black/10" />
          ) : null}
          <div
            className={cn(
              'relative mx-auto h-full min-h-[180px] overflow-hidden rounded-lg pointer-events-none',
              sizeClasses[props.size],
              backgroundClasses[props.background],
              props.bordered ? 'border border-border/40' : 'border border-transparent'
            )}
          >
            {props.showHeader ? (
              <div
                className={cn(
                  'border-b border-border/30 px-4 py-3',
                  headerSlot ? 'pointer-events-auto' : 'pointer-events-none'
                )}
              >
                {headerSlot ?? (
                  <>
                    <div className="text-sm font-medium text-foreground">
                      {props.title || 'Modal title'}
                    </div>
                    {props.description ? (
                      <div className="mt-1 text-xs text-muted-foreground">{props.description}</div>
                    ) : null}
                  </>
                )}
              </div>
            ) : null}
            <div className={cn(paddingClasses[props.padding], 'pointer-events-auto')}>
              {bodyContent}
            </div>
            {props.showFooter ? (
              <div
                className={cn(
                  'border-t border-border/30 px-4 py-3',
                  footerSlot ? 'pointer-events-auto' : 'pointer-events-none'
                )}
              >
                {footerSlot ?? <div className="text-xs text-muted-foreground">Modal footer</div>}
              </div>
            ) : null}
          </div>
          {!isOpen ? (
            <div className="pointer-events-none absolute right-2 top-2 rounded border border-border/40 bg-card px-2 py-0.5 text-[10px] uppercase text-muted-foreground">
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
      <Dialog
        open={isOpen}
        onOpenChange={(nextOpen) => {
          context?.setState?.({ open: nextOpen })
          context?.runActions?.('toggle', { open: nextOpen })
        }}
      >
        <DialogContent
          size={sizeToDialogSize[props.size]}
          className={cn(
            'bg-card text-card-foreground',
            props.bordered ? 'border-border/40' : 'border-transparent'
          )}
          dialogOverlayProps={{
            className: props.showOverlay ? undefined : 'bg-transparent backdrop-blur-0',
          }}
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
            <DialogHeader padding={sectionPaddingBySize[props.padding]}>
              {headerSlot ?? (
                <>
                  <DialogTitle>{props.title || 'Modal title'}</DialogTitle>
                  {props.description ? (
                    <DialogDescription>{props.description}</DialogDescription>
                  ) : null}
                </>
              )}
            </DialogHeader>
          ) : null}
          <DialogSection padding={sectionPaddingBySize[props.padding]}>{bodyContent}</DialogSection>
          {props.showFooter ? (
            <DialogFooter padding={sectionPaddingBySize[props.padding]}>
              {footerSlot ?? <div className="text-xs text-muted-foreground">Modal footer</div>}
            </DialogFooter>
          ) : null}
        </DialogContent>
      </Dialog>
    )
  },
})
