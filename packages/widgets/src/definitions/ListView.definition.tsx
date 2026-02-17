import { cn } from 'ui'

import { normalizeArray, parseMaybeJson } from '../helpers'
import { createWidgetDefinition } from '../types'

export type ListViewProps = {
  items: string
  titleKey: string
  descriptionKey: string
  showDividers: boolean
}

export const ListViewDefinition = createWidgetDefinition<ListViewProps>({
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
  render: (props) => {
    const items = normalizeArray<Record<string, unknown> | string>(parseMaybeJson(props.items), [])
    if (items.length === 0) {
      return (
        <div className="rounded-md border border-dashed border-border/40 px-3 py-6 text-center text-xs text-muted-foreground">
          No list items
        </div>
      )
    }

    return (
      <div className="rounded-md border border-border/30 bg-card">
        <div
          className={cn(
            'flex flex-col',
            props.showDividers ? 'divide-y divide-border/30' : 'gap-2'
          )}
        >
          {items.map((item, index) => {
            const isObject = typeof item === 'object' && item !== null
            const title = isObject ? String(item[props.titleKey] ?? '') : String(item)
            const description = isObject ? String(item[props.descriptionKey] ?? '') : ''
            return (
              <div key={index} className="px-4 py-3">
                <div className="text-sm font-medium text-foreground">{title || 'Item'}</div>
                {description && <div className="text-xs text-muted-foreground">{description}</div>}
              </div>
            )
          })}
        </div>
      </div>
    )
  },
})
