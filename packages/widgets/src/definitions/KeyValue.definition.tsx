import { useEffect, useRef } from 'react'

import { normalizeString, parseMaybeJson } from '../helpers'
import { createWidgetDefinition } from '../types'
import type { WidgetRenderContext } from '../types'

export type KeyValueLayout = 'single' | 'twoColumn' | 'wrap' | 'auto'

export type KeyValueEntry = {
  key: string
  label: string
  value: unknown
}

export type KeyValueProps = {
  label: string
  data: string
  value?: Record<string, unknown> | KeyValueEntry[] | null
  values?: unknown[]
  entries?: KeyValueEntry[]
  count?: number
  variant: KeyValueLayout
  showDividers: boolean
}

const normalizeEntries = (raw: unknown): KeyValueEntry[] => {
  const parsed = parseMaybeJson(raw)

  if (Array.isArray(parsed)) {
    return parsed
      .map((item, index) => {
        if (!item || typeof item !== 'object' || Array.isArray(item)) {
          return null
        }
        const candidate = item as {
          key?: unknown
          label?: unknown
          name?: unknown
          value?: unknown
        }
        const key = normalizeString(candidate.key ?? candidate.name, `item_${index + 1}`)
        const label = normalizeString(candidate.label, key)
        return {
          key,
          label,
          value: candidate.value,
        }
      })
      .filter((item): item is KeyValueEntry => Boolean(item))
  }

  if (parsed && typeof parsed === 'object') {
    return Object.entries(parsed as Record<string, unknown>).map(([key, value]) => ({
      key,
      label: key,
      value,
    }))
  }

  return []
}

const formatValue = (value: unknown) => {
  if (typeof value === 'string') {
    return value
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }
  if (value === null) {
    return 'null'
  }
  if (typeof value === 'undefined') {
    return ''
  }
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return normalizeString(value, '[object]')
  }
}

const resolveLayoutClassName = (variant: KeyValueLayout, count: number) => {
  switch (variant) {
    case 'single':
      return 'grid-cols-1'
    case 'twoColumn':
      return 'grid-cols-1 md:grid-cols-2'
    case 'wrap':
      return 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3'
    case 'auto':
    default:
      return count > 6 ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1 md:grid-cols-2'
  }
}

const KeyValueRenderer = ({
  props,
  context,
}: {
  props: KeyValueProps
  context?: WidgetRenderContext
}) => {
  const derivedSnapshotRef = useRef('')
  const entries = normalizeEntries(context?.state?.value ?? props.data)
  const layoutClassName = resolveLayoutClassName(props.variant ?? 'auto', entries.length)
  const values = entries.map((entry) => entry.value)

  useEffect(() => {
    if (!context?.setState) {
      return
    }
    const snapshot = JSON.stringify(entries)
    if (derivedSnapshotRef.current === snapshot) {
      return
    }
    derivedSnapshotRef.current = snapshot
    context.setState({
      value: entries,
      values,
      entries,
      data: entries,
      count: entries.length,
    })
  }, [entries])

  return (
    <div className="space-y-2 rounded-lg border border-border/50 bg-card p-3 shadow-sm">
      {props.label ? <div className="text-sm font-semibold text-foreground">{props.label}</div> : null}

      {entries.length > 0 ? (
        <div className={`grid gap-2 ${layoutClassName}`}>
          {entries.map((entry, index) => {
            const textValue = formatValue(entry.value)
            const isJson = textValue.includes('{') || textValue.includes('[')

            return (
              <div
                key={`${entry.key}:${index}`}
                className={[
                  'rounded-md bg-background/60 p-2',
                  props.showDividers ? 'border border-border/50' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <div className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {entry.label}
                </div>
                {isJson ? (
                  <pre className="whitespace-pre-wrap break-words rounded bg-muted/40 p-2 font-mono text-xs text-foreground">
                    {textValue}
                  </pre>
                ) : (
                  <div className="break-words text-sm text-foreground">{textValue || '-'}</div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <pre className="rounded-md border border-input bg-muted/40 p-3 text-xs font-mono text-foreground">
          {props.data}
        </pre>
      )}
    </div>
  )
}

export const KeyValueDefinition = createWidgetDefinition<KeyValueProps>({
  type: 'KeyValue',
  label: 'Key Value',
  category: 'data',
  description: 'Key/value list',
  defaultProps: {
    label: 'Details',
    data: '{\n  "id": 1,\n  "name": "Chic Footitt",\n  "email": "chic.footitt@yahoo.com"\n}',
    value: null,
    values: [],
    entries: [],
    count: 0,
    variant: 'auto',
    showDividers: true,
  },
  render: (props, context) => <KeyValueRenderer props={props} context={context} />,
})
