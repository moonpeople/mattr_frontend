import { useEffect, useMemo, useRef, useState } from 'react'

import { renderWidgetIcon } from '../icon-library'
import { normalizeArray, normalizeString, parseMaybeJson } from '../helpers'
import { createWidgetDefinition } from '../types'
import type { WidgetRenderContext } from '../types'

export type ReorderableListProps = {
  items: string
  value?: string[]
  values?: string[]
  data?: string[]
  count?: number
  fromIndex?: number | null
  toIndex?: number | null
  helperText: string
  disabled: boolean
  events: string
}

type ReorderItem = {
  id: string
  label: string
}

const normalizeItems = (raw: unknown): ReorderItem[] => {
  const parsed = parseMaybeJson(raw)
  const normalized = normalizeArray<unknown>(parsed, [])

  if (normalized.length > 0) {
    return normalized
      .map((item, index) => {
        if (typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean') {
          const label = String(item)
          return { id: `${index}:${label}`, label }
        }

        if (item && typeof item === 'object' && !Array.isArray(item)) {
          const candidate = item as { id?: unknown; key?: unknown; value?: unknown; label?: unknown }
          const label = normalizeString(candidate.label ?? candidate.value ?? candidate.key, '')
          if (!label) {
            return null
          }
          const id = normalizeString(candidate.id ?? candidate.key, `${index}:${label}`)
          return { id, label }
        }

        return null
      })
      .filter((item): item is ReorderItem => Boolean(item))
  }

  if (typeof raw === 'string' && raw.trim()) {
    return raw
      .replace(/\[/g, '')
      .replace(/\]/g, '')
      .split(',')
      .map((item) => item.replace(/['"]/g, '').trim())
      .filter(Boolean)
      .map((label, index) => ({ id: `${index}:${label}`, label }))
  }

  return []
}

const reorder = (items: ReorderItem[], from: number, to: number) => {
  if (from < 0 || to < 0 || from >= items.length || to >= items.length || from === to) {
    return items
  }

  const next = [...items]
  const [moved] = next.splice(from, 1)
  next.splice(to, 0, moved)
  return next
}

const ReorderableListRenderer = ({
  props,
  context,
}: {
  props: ReorderableListProps
  context?: WidgetRenderContext
}) => {
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null)
  const [overIndex, setOverIndex] = useState<number | null>(null)
  const derivedSnapshotRef = useRef('')

  const items = useMemo(() => {
    const stateItems = context?.state?.items
    return normalizeItems(stateItems ?? props.items)
  }, [context?.state?.items, props.items])

  const disabled = Boolean(props.disabled)
  const isCanvasMode = context?.mode === 'canvas'
  const isDragDisabled = disabled || isCanvasMode

  const buildPatch = (
    nextItems: ReorderItem[],
    from: number | null,
    to: number | null,
    source?: 'drag' | 'button'
  ) => {
    const labels = nextItems.map((item) => item.label)
    return {
      items: nextItems,
      value: labels,
      values: labels,
      data: labels,
      count: labels.length,
      fromIndex: from,
      toIndex: to,
      source: source ?? null,
    }
  }

  const commit = (nextItems: ReorderItem[], from: number, to: number, source: 'drag' | 'button') => {
    const patch = buildPatch(nextItems, from, to, source)
    context?.setState?.(patch)
    context?.runActions?.('reorder', patch)
    context?.runActions?.('change', patch)
  }

  const moveByButton = (from: number, offset: number) => {
    if (disabled) {
      return
    }
    const to = from + offset
    const nextItems = reorder(items, from, to)
    if (nextItems === items) {
      return
    }
    commit(nextItems, from, to, 'button')
  }

  useEffect(() => {
    if (!context?.setState) {
      return
    }
    const snapshot = JSON.stringify(items)
    if (derivedSnapshotRef.current === snapshot) {
      return
    }
    derivedSnapshotRef.current = snapshot
    context.setState(buildPatch(items, null, null))
  }, [items])

  return (
    <div className="space-y-2 rounded-lg border border-border/50 bg-card p-2 shadow-sm">
      <div className="space-y-2">
        {items.length > 0 ? (
          items.map((item, index) => {
            const isDragging = draggingIndex === index
            const isOver = overIndex === index
            return (
              <div
                key={`${item.id}:${index}`}
                draggable={!isDragDisabled}
                onDragStart={(event) => {
                  if (isDragDisabled) {
                    return
                  }
                  event.dataTransfer.effectAllowed = 'move'
                  event.dataTransfer.setData('text/plain', String(index))
                  setDraggingIndex(index)
                }}
                onDragEnd={() => {
                  setDraggingIndex(null)
                  setOverIndex(null)
                }}
                onDragOver={(event) => {
                  if (isDragDisabled) {
                    return
                  }
                  event.preventDefault()
                  setOverIndex(index)
                }}
                onDrop={(event) => {
                  if (isDragDisabled) {
                    return
                  }
                  event.preventDefault()
                  const from = Number(event.dataTransfer.getData('text/plain'))
                  const to = index
                  const nextItems = reorder(items, from, to)
                  setDraggingIndex(null)
                  setOverIndex(null)
                  if (nextItems !== items) {
                    commit(nextItems, from, to, 'drag')
                  }
                }}
                className={[
                  'flex items-center gap-2 rounded-md border px-2 py-2 text-sm transition-colors',
                  isDragging ? 'border-primary bg-accent/35 opacity-80' : 'border-border/50 bg-background',
                  isOver && !isDragging ? 'border-primary/60' : '',
                  isDragDisabled
                    ? 'cursor-not-allowed opacity-60'
                    : 'cursor-grab active:cursor-grabbing',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <span className="text-muted-foreground">
                  {renderWidgetIcon('gripvertical', {
                    library: context?.iconLibrary,
                    className: 'h-4 w-4',
                  })}
                </span>

                <span className="min-w-0 flex-1 truncate text-foreground">{item.label}</span>

                <div className="ml-auto flex items-center gap-1">
                  <button
                    type="button"
                    className="rounded border border-border/50 bg-card px-2 py-1 text-xs text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={isDragDisabled || index === 0}
                    onClick={() => moveByButton(index, -1)}
                  >
                    Up
                  </button>
                  <button
                    type="button"
                    className="rounded border border-border/50 bg-card px-2 py-1 text-xs text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={isDragDisabled || index === items.length - 1}
                    onClick={() => moveByButton(index, 1)}
                  >
                    Down
                  </button>
                </div>
              </div>
            )
          })
        ) : (
          <div className="rounded-md border border-dashed border-border/50 px-3 py-4 text-xs text-muted-foreground">
            No items
          </div>
        )}
      </div>

      {isCanvasMode ? (
        <div className="text-xs text-muted-foreground">
          Reordering is available in preview/runtime mode.
        </div>
      ) : null}
      {props.helperText ? <div className="text-xs text-muted-foreground">{props.helperText}</div> : null}
    </div>
  )
}

export const ReorderableListDefinition = createWidgetDefinition<ReorderableListProps>({
  type: 'ReorderableList',
  label: 'Reorderable List',
  category: 'data',
  description: 'Draggable list of items',
  defaultProps: {
    items: '["The first card", "The second card", "And me!"]',
    value: [],
    values: [],
    data: [],
    count: 0,
    fromIndex: null,
    toIndex: null,
    helperText: '',
    disabled: false,
    events: '[]',
  },
  render: (props, context) => <ReorderableListRenderer props={props} context={context} />,
})
