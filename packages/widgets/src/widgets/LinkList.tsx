import type { WidgetDefinition } from '../types'
import { normalizeArray, parseMaybeJson } from '../helpers'

type LinkItem = {
  label: string
  href?: string
}

type LinkListProps = {
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

export const LinkListWidget: WidgetDefinition<LinkListProps> = {
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
  fields: [
    { key: 'label', label: 'Label', type: 'text', placeholder: 'Links' },
    {
      key: 'items',
      label: 'Items (JSON)',
      type: 'json',
      placeholder: '[\"Action 1\",\"Action 2\"]',
    },
    { key: 'underline', label: 'Underline', type: 'boolean' },
    { key: 'disabled', label: 'Disabled', type: 'boolean' },
    {
      key: 'events',
      label: 'Events (JSON)',
      type: 'json',
      placeholder: '[{\"event\":\"click\",\"type\":\"query\",\"queryName\":\"onClick\"}]',
    },
  ],
  render: (props, context) => {
    const items = normalizeItems(props.items)
    const safeItems = items.length > 0 ? items : [{ label: 'Action 1' }, { label: 'Action 2' }]
    const linkClass = `${props.underline ? 'underline' : 'no-underline'} text-brand-600 text-sm`

    return (
      <div className="space-y-1">
        {props.label && <div className="text-xs text-foreground-muted">{props.label}</div>}
        <div className="flex flex-col gap-1">
          {safeItems.map((item, index) =>
            props.disabled ? (
              <span key={`${item.label}-${index}`} className={`${linkClass} opacity-50`}>
                {item.label}
              </span>
            ) : (
              <a
                key={`${item.label}-${index}`}
                href={item.href ?? '#'}
                className={linkClass}
                onClick={() => context?.runActions?.('click', { index, item })}
              >
                {item.label}
              </a>
            )
          )}
        </div>
      </div>
    )
  },
}
