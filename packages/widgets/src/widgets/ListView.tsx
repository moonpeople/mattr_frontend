import { cn } from 'ui'

import type { WidgetDefinition } from '../types'
import { normalizeArray, parseMaybeJson } from '../helpers'

type ListViewProps = {
  items: string
  titleKey: string
  descriptionKey: string
  showDividers: boolean
}

export const ListViewWidget: WidgetDefinition<ListViewProps> = {
  type: 'ListView',
  label: 'List View',
  category: 'data',
  description: 'List of items',
  defaultProps: {
    items: JSON.stringify(
      [
        { title: 'Acme', description: 'Active subscription' },
        { title: 'Globex', description: 'Trial' },
      ],
      null,
      2
    ),
    titleKey: 'title',
    descriptionKey: 'description',
    showDividers: true,
  },
  fields: [
    {
      key: 'items',
      label: 'Items (JSON)',
      type: 'json',
      placeholder: '[{\"title\":\"Acme\",\"description\":\"Active\"}]',
    },
    { key: 'titleKey', label: 'Title key', type: 'text', placeholder: 'title' },
    { key: 'descriptionKey', label: 'Description key', type: 'text', placeholder: 'description' },
    { key: 'showDividers', label: 'Dividers', type: 'boolean' },
  ],
  render: (props) => {
    const items = normalizeArray<Record<string, unknown> | string>(parseMaybeJson(props.items), [])
    if (items.length === 0) {
      return (
        <div className="rounded-md border border-dashed border-foreground-muted/40 px-3 py-6 text-center text-xs text-foreground-muted">
          No list items
        </div>
      )
    }

    return (
      <div className="rounded-md border border-foreground-muted/30 bg-surface-100">
        <div
          className={cn(
            'flex flex-col',
            props.showDividers ? 'divide-y divide-foreground-muted/30' : 'gap-2'
          )}
        >
          {items.map((item, index) => {
            const isObject = typeof item === 'object' && item !== null
            const title = isObject ? String(item[props.titleKey] ?? '') : String(item)
            const description = isObject ? String(item[props.descriptionKey] ?? '') : ''
            return (
              <div
                key={index}
                className="px-4 py-3"
              >
                <div className="text-sm font-medium text-foreground">{title || 'Item'}</div>
                {description && <div className="text-xs text-foreground-muted">{description}</div>}
              </div>
            )
          })}
        </div>
      </div>
    )
  },
}
