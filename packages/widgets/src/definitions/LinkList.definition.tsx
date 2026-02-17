import { normalizeArray, parseMaybeJson } from '../helpers'
import { createWidgetDefinition } from '../types'

export type LinkItem = {
  label: string
  href?: string
}

export type LinkListProps = {
  label: string
  items: string
  underline: boolean
  disabled: boolean
  events: string
}

const normalizeItems = (raw: unknown): LinkItem[] => {
  const parsed = normalizeArray<LinkItem | string>(parseMaybeJson(raw), [])
  if (parsed.length === 0) {
    return []
  }
  if (typeof parsed[0] === 'string') {
    return (parsed as string[]).map((item) => ({ label: item }))
  }
  return (parsed as LinkItem[]).map((item) => ({
    label: String(item.label ?? ''),
    href: item.href ? String(item.href) : undefined,
  }))
}

export const LinkListDefinition = createWidgetDefinition<LinkListProps>({
  type: 'LinkList',
  label: 'Link List',
  category: 'navigation',
  description: 'List of links',
  defaultProps: {
    label: '',
    items: JSON.stringify(['Action 1', 'Action 2', 'Action 3'], null, 2),
    underline: false,
    disabled: false,
    events: '[]',
  },
  render: (props, context) => {
    const items = normalizeItems(props.items)
    const safeItems = items.length > 0 ? items : [{ label: 'Action 1' }, { label: 'Action 2' }]
    const linkClass = `${props.underline ? 'underline' : 'no-underline'} text-primary text-sm transition-colors hover:text-primary/80`

    return (
      <div className="space-y-1">
        {props.label && <div className="text-xs text-muted-foreground">{props.label}</div>}
        <div className="flex flex-col gap-1">
          {safeItems.map((item, index) =>
            props.disabled ? (
              <span
                key={`${item.label}-${index}`}
                className={`${linkClass} cursor-not-allowed text-muted-foreground opacity-60`}
              >
                {item.label}
              </span>
            ) : (
              <a
                key={`${item.label}-${index}`}
                href={item.href ?? '#'}
                className={linkClass}
                onClick={(event) => {
                  context?.runActions?.('click', { index, item })
                  if (context?.mode === 'canvas') {
                    event.preventDefault()
                  }
                }}
              >
                {item.label}
              </a>
            )
          )}
        </div>
      </div>
    )
  },
})
