import { ChevronDown } from 'lucide-react'
import {
  Collapsible_Shadcn_,
  CollapsibleContent_Shadcn_,
  CollapsibleTrigger_Shadcn_,
  cn,
} from 'ui'

import { createWidgetDefinition } from '../types'

export type CollapsibleContainerProps = {
  title: string
  subtitle: string
  open: boolean
  padding: 'sm' | 'md' | 'lg'
  bordered: boolean
  background: 'surface' | 'muted' | 'transparent'
  events: string
}

const paddingClasses: Record<CollapsibleContainerProps['padding'], string> = {
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
}

const backgroundClasses: Record<CollapsibleContainerProps['background'], string> = {
  surface: 'bg-card',
  muted: 'bg-muted',
  transparent: 'bg-transparent',
}

export const CollapsibleContainerDefinition = createWidgetDefinition<CollapsibleContainerProps>({
  type: 'CollapsibleContainer',
  label: 'Collapsible Container',
  category: 'containers',
  description: 'Container with collapsible body',
  supportsChildren: true,
  defaultProps: {
    title: 'Section',
    subtitle: '',
    open: true,
    padding: 'md',
    bordered: true,
    background: 'surface',
    events: '[]',
  },
  render: (props, context) => {
    const isOpen = Boolean(context?.state?.open ?? props.open)
    const content = context?.children ? (
      <div className="space-y-3">{context.children}</div>
    ) : (
      <div className="text-xs text-muted-foreground">Collapsible content</div>
    )

    return (
      <Collapsible_Shadcn_
        open={isOpen}
        onOpenChange={(nextOpen) => {
          context?.setState?.({ open: nextOpen })
          if (context?.mode !== 'canvas') {
            context?.runActions?.('toggle', { open: nextOpen })
          }
        }}
      >
        <div
          className={cn(
            'rounded-lg',
            backgroundClasses[props.background],
            props.bordered ? 'border border-border/40' : 'border border-transparent'
          )}
        >
          <CollapsibleTrigger_Shadcn_ asChild>
            <button
              type="button"
              className={cn(
                'group flex w-full items-center justify-between gap-3 px-4 py-3 text-left',
                'transition-colors hover:bg-accent/30'
              )}
            >
              <div className="min-w-0">
                {props.title ? <div className="truncate text-sm font-medium text-foreground">{props.title}</div> : null}
                {props.subtitle ? (
                  <div className="truncate text-xs text-muted-foreground">{props.subtitle}</div>
                ) : null}
              </div>
              <ChevronDown
                className={cn(
                  'h-4 w-4 shrink-0 text-muted-foreground transition-transform',
                  isOpen ? 'rotate-180' : null
                )}
              />
            </button>
          </CollapsibleTrigger_Shadcn_>
          <CollapsibleContent_Shadcn_ className="border-t border-border/30 data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
            <div className={paddingClasses[props.padding]}>{content}</div>
          </CollapsibleContent_Shadcn_>
        </div>
      </Collapsible_Shadcn_>
    )
  },
})
