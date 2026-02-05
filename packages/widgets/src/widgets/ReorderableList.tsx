import { GripVertical } from 'lucide-react'

import type { WidgetDefinition } from '../types'
import { normalizeArray, parseMaybeJson } from '../helpers'

type ReorderableListProps = {
  items: string
  helperText: string
}

const normalizeItems = (raw: unknown): string[] => {
  const parsed = parseMaybeJson(raw)
  const normalized = normalizeArray<string>(parsed, [])
  if (normalized.length > 0) {
    return normalized.map((item) => String(item))
  }
  if (typeof raw === 'string' && raw.trim()) {
    return raw
      .replace(/\[/g, '')
      .replace(/\]/g, '')
      .split(',')
      .map((item) => item.replace(/['"]/g, '').trim())
      .filter(Boolean)
  }
  return []
}

export const ReorderableListWidget: WidgetDefinition<ReorderableListProps> = {
  type: 'ReorderableList',
  label: 'Reorderable List',
  category: 'data',
  description: 'Draggable list of items',
  defaultProps: {
    items: '["The first card", "The second card", "And me!"]',
    helperText: '',
  },
  fields: [
    { key: 'items', label: 'Items (JSON)', type: 'json', placeholder: '["Item 1","Item 2"]' },
    { key: 'helperText', label: 'Helper text', type: 'text', placeholder: 'Help text' },
  ],
  render: (props, context) => {
    const stateItems = context?.state?.items
    const items = normalizeItems(stateItems ?? props.items)

    const moveItem = (from: number, to: number) => {
      if (to < 0 || to >= items.length) {
        return
      }
      const nextItems = [...items]
      const [item] = nextItems.splice(from, 1)
      nextItems.splice(to, 0, item)
      context?.setState?.({ items: nextItems })
      context?.runActions?.('reorder', { items: nextItems })
    }

    return (
      <div className="space-y-2">
        <div className="space-y-2">
          {items.length > 0 ? (
            items.map((item, index) => (
              <div key={`${item}-${index}`} className="flex items-center gap-2 rounded border border-foreground-muted/40 bg-surface-100 px-3 py-2 text-sm">
                <GripVertical className="h-4 w-4 text-foreground-muted" />
                <span>{item}</span>
                <div className="ml-auto flex items-center gap-1">
                  <button
                    type="button"
                    className="rounded border border-foreground-muted/40 px-1 text-xs text-foreground"
                    onClick={() => moveItem(index, index - 1)}
                  >
                    Up
                  </button>
                  <button
                    type="button"
                    className="rounded border border-foreground-muted/40 px-1 text-xs text-foreground"
                    onClick={() => moveItem(index, index + 1)}
                  >
                    Down
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-xs text-foreground-muted">No items</div>
          )}
        </div>
        {props.helperText && <div className="text-xs text-foreground-muted">{props.helperText}</div>}
      </div>
    )
  },
}
