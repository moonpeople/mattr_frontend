'use client'

import * as PopoverPrimitive from '@radix-ui/react-popover'
import * as React from 'react'

import { cn } from '../../../lib/utils/cn'
import styles from './popover.module.css'

type PopoverPortalContextValue = {
  container: HTMLElement | null
  setContainer: (value: HTMLElement | null) => void
}

const PopoverPortalContext = React.createContext<PopoverPortalContextValue | null>(null)

const Popover = ({ ...props }: React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Root>) => {
  const [container, setContainer] = React.useState<HTMLElement | null>(null)
  return (
    <PopoverPortalContext.Provider value={{ container, setContainer }}>
      <PopoverPrimitive.Root {...props} />
    </PopoverPortalContext.Provider>
  )
}

const PopoverTrigger = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Trigger>
>(({ ...props }, ref) => {
  const context = React.useContext(PopoverPortalContext)

  const setRef = React.useCallback(
    (node: React.ElementRef<typeof PopoverPrimitive.Trigger> | null) => {
      if (typeof ref === 'function') {
        ref(node)
      } else if (ref) {
        ;(ref as React.MutableRefObject<
          React.ElementRef<typeof PopoverPrimitive.Trigger> | null
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

  return <PopoverPrimitive.Trigger ref={setRef} {...props} />
})
PopoverTrigger.displayName = PopoverPrimitive.Trigger.displayName

const PopoverAnchor = PopoverPrimitive.Anchor

type PopoverContentProps = {
  align?: 'center' | 'start' | 'end'
  sideOffset?: number
  sameWidthAsTrigger?: boolean
  portal?: boolean
} & React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  PopoverContentProps
>(
  (
    { className, align = 'center', sideOffset = 4, sameWidthAsTrigger = false, portal = true, ...props },
    ref
  ) => {
  const context = React.useContext(PopoverPortalContext)
  const content = (
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        sameWidthAsTrigger ? styles['popover-trigger-width'] : '',
        'z-50 w-72 rounded-md border border-overlay bg-overlay p-4 text-popover-foreground shadow-md outline-none animate-in data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
        className
      )}
      {...props}
    />
  )

  if (!portal) {
    return content
  }

  return <PopoverPrimitive.Portal container={context?.container ?? undefined}>{content}</PopoverPrimitive.Portal>
})
PopoverContent.displayName = 'PopoverContent'

const PopoverSeparator = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} {...props} className={cn('w-full h-px bg-border-overlay', className)} />
  )
)
PopoverSeparator.displayName = 'PopoverSeparator'

export { Popover, PopoverAnchor, PopoverContent, PopoverSeparator, PopoverTrigger }
