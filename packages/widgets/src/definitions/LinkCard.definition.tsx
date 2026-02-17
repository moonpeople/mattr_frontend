import { ArrowUpRight, Link as LinkIcon } from 'lucide-react'
import { cn } from 'ui'

import { normalizeString } from '../helpers'
import { createWidgetDefinition } from '../types'

export type LinkCardProps = {
  title: string
  subtitle: string
  description: string
  href: string
  newTab: boolean
  variant: 'primary' | 'default' | 'secondary' | 'outline' | 'danger' | 'destructive' | 'ghost'
  disabled: boolean
  events: unknown[]
}

const variantClasses: Record<LinkCardProps['variant'], string> = {
  primary: 'border-border bg-background hover:bg-accent/20',
  default: 'border-border/40 bg-card hover:bg-accent/20',
  secondary: 'border-border/20 bg-muted hover:bg-muted/80',
  outline: 'border-border bg-background hover:bg-accent/20',
  danger: 'border-border bg-background hover:bg-accent/20',
  destructive: 'border-border bg-background hover:bg-accent/20',
  ghost: 'border-transparent bg-transparent hover:bg-accent/25',
}

export const LinkCardDefinition = createWidgetDefinition<LinkCardProps>({
  type: 'LinkCard',
  label: 'Link Card',
  category: 'buttons',
  description: 'Card-shaped link button',
  defaultProps: {
    title: 'Documentation',
    subtitle: '',
    description: 'Open destination link',
    href: 'https://example.com',
    newTab: true,
    variant: 'default',
    disabled: false,
    events: [],
  },
  render: (props, context) => {
    const href = normalizeString(props.href, '').trim() || '#'
    const isDisabled = Boolean(props.disabled)

    const cardClassName = cn(
      'group block w-full rounded-lg border p-4 text-left transition-colors',
      variantClasses[props.variant],
      isDisabled ? 'cursor-not-allowed opacity-60' : null
    )

    if (isDisabled) {
      return (
        <div className={cardClassName}>
          <div className="flex items-start gap-3">
            <span className="mt-0.5 rounded-md bg-background/60 p-1 text-muted-foreground">
              <LinkIcon size={14} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-foreground">{props.title || 'Link Card'}</div>
              {props.subtitle ? (
                <div className="truncate text-xs text-muted-foreground">{props.subtitle}</div>
              ) : null}
              {props.description ? (
                <div className="mt-2 text-xs text-muted-foreground">{props.description}</div>
              ) : null}
            </div>
          </div>
        </div>
      )
    }

    return (
      <a
        href={href}
        target={props.newTab ? '_blank' : undefined}
        rel={props.newTab ? 'noreferrer' : undefined}
        className={cardClassName}
        onClick={(event) => {
          context?.runActions?.('click', { href })
          if (context?.mode === 'canvas') {
            event.preventDefault()
          }
        }}
      >
        <div className="flex items-start gap-3">
          <span className="mt-0.5 rounded-md bg-background/60 p-1 text-muted-foreground">
            <LinkIcon size={14} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <div className="truncate text-sm font-medium text-foreground">{props.title || 'Link Card'}</div>
              <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
            </div>
            {props.subtitle ? (
              <div className="truncate text-xs text-muted-foreground">{props.subtitle}</div>
            ) : null}
            {props.description ? <div className="mt-2 text-xs text-muted-foreground">{props.description}</div> : null}
          </div>
        </div>
      </a>
    )
  },
})
