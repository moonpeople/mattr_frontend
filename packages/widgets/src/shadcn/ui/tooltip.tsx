'use client'

import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import * as React from 'react'

import { cn } from 'ui'

type TooltipPortalContextValue = {
  container: HTMLElement | null
  setContainer: (value: HTMLElement | null) => void
}

const TooltipPortalContext = React.createContext<TooltipPortalContextValue | null>(null)

function TooltipProvider({
  delayDuration = 0,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delayDuration={delayDuration}
      {...props}
    />
  )
}

function Tooltip({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  const [container, setContainer] = React.useState<HTMLElement | null>(null)
  return (
    <TooltipPortalContext.Provider value={{ container, setContainer }}>
      <TooltipProvider>
        <TooltipPrimitive.Root data-slot="tooltip" {...props} />
      </TooltipProvider>
    </TooltipPortalContext.Provider>
  )
}

const TooltipTrigger = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Trigger>
>(({ ...props }, ref) => {
  const context = React.useContext(TooltipPortalContext)

  const setRef = React.useCallback(
    (node: React.ElementRef<typeof TooltipPrimitive.Trigger> | null) => {
      if (typeof ref === 'function') {
        ref(node)
      } else if (ref) {
        ;(ref as React.MutableRefObject<
          React.ElementRef<typeof TooltipPrimitive.Trigger> | null
        >).current = node
      }

      if (!context) {
        return
      }

      if (!node) {
        context.setContainer(null)
        return
      }

      const scope = node.closest('.builder-app-theme-scope, .app-theme-scope')
      context.setContainer((scope as HTMLElement | null) ?? node.ownerDocument?.body ?? null)
    },
    [context, ref]
  )

  return <TooltipPrimitive.Trigger ref={setRef} data-slot="tooltip-trigger" {...props} />
})
TooltipTrigger.displayName = 'TooltipTrigger'

function TooltipContent({
  className,
  sideOffset = 4,
  showArrow = false,
  children,
  style,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content> & {
  showArrow?: boolean
}) {
  const context = React.useContext(TooltipPortalContext)
  return (
    <TooltipPrimitive.Portal container={context?.container ?? undefined}>
      <TooltipPrimitive.Content
        className={cn(
          'fade-in-0 zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 relative z-50 max-w-70 animate-in rounded-md border px-2 py-0.5 text-xs data-[state=closed]:animate-out',
          className,
        )}
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        // Inline styles so we don't depend on consuming app tailwind `content` scanning this file.
        style={{
          backgroundColor: 'hsl(var(--popover))',
          color: 'hsl(var(--popover-foreground))',
          borderColor: 'hsl(var(--border))',
          ...style,
        }}
        {...props}
      >
        {children}
        {showArrow && (
          <TooltipPrimitive.Arrow
            className="-my-px drop-shadow-[0_1px_0_hsl(var(--border))]"
            style={{ fill: 'hsl(var(--popover))' }}
          />
        )}
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  )
}

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger }
