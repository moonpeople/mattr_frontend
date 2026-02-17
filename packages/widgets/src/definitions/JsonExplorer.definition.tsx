import { useEffect, useMemo, useRef, useState } from 'react'
import { Button, Input_Shadcn_ as Input } from 'ui'

import { normalizeString, parseMaybeJson } from '../helpers'
import { createWidgetDefinition } from '../types'
import type { WidgetRenderContext } from '../types'

export type JsonExplorerProps = {
  label: string
  value: string
  data?: unknown
  count?: number
  expandedPathList?: string[]
  highlightedPathList?: string[]
  search?: string
  helperText: string
  searchable: boolean
}

type JsonNodeProps = {
  name: string
  value: unknown
  path: string
  depth: number
  expandedPaths: Set<string>
  onToggle: (path: string) => void
  highlightedPaths: Set<string>
}

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)

const parseValue = (raw: unknown): unknown => {
  if (typeof raw === 'string') {
    const parsed = parseMaybeJson(raw)
    if (parsed !== null) {
      return parsed
    }
    return raw
  }
  return raw
}

const typeLabel = (value: unknown) => {
  if (value === null) {
    return 'null'
  }
  if (Array.isArray(value)) {
    return 'array'
  }
  return typeof value
}

const formatInline = (value: unknown) => {
  if (typeof value === 'string') {
    return `"${value}"`
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }
  if (value === null) {
    return 'null'
  }
  if (Array.isArray(value)) {
    return `[${value.length}]`
  }
  if (isPlainObject(value)) {
    return `{${Object.keys(value).length}}`
  }
  return normalizeString(value, '')
}

const collectPaths = (value: unknown, base = 'root', output: string[] = []): string[] => {
  output.push(base)

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      collectPaths(item, `${base}[${index}]`, output)
    })
    return output
  }

  if (isPlainObject(value)) {
    Object.entries(value).forEach(([key, item]) => {
      collectPaths(item, `${base}.${key}`, output)
    })
  }

  return output
}

const getSearchMatches = (value: unknown, query: string) => {
  const matches = new Set<string>()
  if (!query.trim()) {
    return matches
  }

  const normalized = query.trim().toLowerCase()

  const visit = (node: unknown, path: string) => {
    const nodeText = formatInline(node).toLowerCase()
    const pathText = path.toLowerCase()
    if (nodeText.includes(normalized) || pathText.includes(normalized)) {
      matches.add(path)

      // Also expand all ancestors for visibility.
      const segments = path.split('.')
      for (let index = 1; index < segments.length; index += 1) {
        matches.add(segments.slice(0, index).join('.'))
      }
    }

    if (Array.isArray(node)) {
      node.forEach((item, index) => visit(item, `${path}[${index}]`))
      return
    }

    if (isPlainObject(node)) {
      Object.entries(node).forEach(([key, item]) => visit(item, `${path}.${key}`))
    }
  }

  visit(value, 'root')
  return matches
}

const JsonNode = ({
  name,
  value,
  path,
  depth,
  expandedPaths,
  onToggle,
  highlightedPaths,
}: JsonNodeProps) => {
  const isArray = Array.isArray(value)
  const isObject = isPlainObject(value)
  const hasChildren = isArray || isObject
  const isExpanded = expandedPaths.has(path)
  const isHighlighted = highlightedPaths.has(path)

  const childEntries: Array<[string, unknown]> = useMemo(() => {
    if (isArray) {
      return value.map((item, index) => [String(index), item])
    }
    if (isObject) {
      return Object.entries(value)
    }
    return []
  }, [isArray, isObject, value])

  return (
    <div>
      <div
        className={[
          'group flex min-h-7 items-center gap-2 rounded px-2 py-1 text-xs',
          isHighlighted ? 'bg-accent/45' : 'hover:bg-muted/50',
        ]
          .filter(Boolean)
          .join(' ')}
        style={{ marginLeft: `${depth * 12}px` }}
      >
        <button
          type="button"
          className="h-4 w-4 rounded text-muted-foreground hover:bg-muted disabled:cursor-default disabled:opacity-40"
          disabled={!hasChildren}
          onClick={() => onToggle(path)}
          aria-label={isExpanded ? `Collapse ${name}` : `Expand ${name}`}
        >
          {hasChildren ? (isExpanded ? 'v' : '>') : ''}
        </button>

        <span className="font-mono text-foreground">{name}</span>
        <span className="text-muted-foreground">:</span>
        <span className="font-mono text-foreground">{formatInline(value)}</span>
        <span className="ml-auto text-[10px] uppercase tracking-wide text-muted-foreground">
          {typeLabel(value)}
        </span>
      </div>

      {hasChildren && isExpanded ? (
        <div className="space-y-0.5">
          {childEntries.map(([childKey, childValue]) => {
            const childPath = isArray ? `${path}[${childKey}]` : `${path}.${childKey}`
            return (
              <JsonNode
                key={childPath}
                name={childKey}
                value={childValue}
                path={childPath}
                depth={depth + 1}
                expandedPaths={expandedPaths}
                onToggle={onToggle}
                highlightedPaths={highlightedPaths}
              />
            )
          })}
        </div>
      ) : null}
    </div>
  )
}

const JsonExplorerRenderer = ({
  props,
  context,
}: {
  props: JsonExplorerProps
  context?: WidgetRenderContext
}) => {
  const parsedValue = parseValue(context?.state?.value ?? props.value)
  const derivedSnapshotRef = useRef('')

  const [search, setSearch] = useState('')
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set(['root']))

  const allPaths = useMemo(() => collectPaths(parsedValue), [parsedValue])
  const highlightedPaths = useMemo(() => getSearchMatches(parsedValue, search), [parsedValue, search])

  useEffect(() => {
    if (!context?.setState) {
      return
    }
    const expandedPathList = Array.from(expandedPaths)
    const highlightedPathList = Array.from(highlightedPaths)
    const snapshot = JSON.stringify({
      value: parsedValue,
      expandedPathList,
      highlightedPathList,
      search,
    })
    if (derivedSnapshotRef.current === snapshot) {
      return
    }
    derivedSnapshotRef.current = snapshot
    context.setState({
      value: parsedValue,
      data: parsedValue,
      count: allPaths.length,
      expandedPathList,
      highlightedPathList,
      search,
    })
  }, [allPaths.length, expandedPaths, highlightedPaths, parsedValue, search])

  useEffect(() => {
    if (!search.trim()) {
      return
    }
    if (highlightedPaths.size === 0) {
      return
    }
    setExpandedPaths((previous) => {
      const next = new Set(previous)
      highlightedPaths.forEach((path) => next.add(path))
      return next
    })
  }, [highlightedPaths, search])

  const onTogglePath = (path: string) => {
    setExpandedPaths((previous) => {
      const next = new Set(previous)
      if (next.has(path)) {
        next.delete(path)
      } else {
        next.add(path)
      }
      return next
    })
  }

  const expandAll = () => setExpandedPaths(new Set(allPaths))
  const collapseAll = () => setExpandedPaths(new Set(['root']))

  const copyCurrentValue = () => {
    const text = typeof parsedValue === 'string' ? parsedValue : JSON.stringify(parsedValue, null, 2)
    if (!text) {
      return
    }
    void navigator?.clipboard?.writeText(text)
  }

  if (typeof parsedValue !== 'object' || parsedValue === null) {
    return (
      <div className="space-y-1 rounded-lg border border-border/50 bg-card p-3 shadow-sm">
        {props.label ? <label className="text-xs font-medium text-foreground">{props.label}</label> : null}
        <pre className="max-h-72 overflow-auto rounded-md border border-input bg-muted/40 p-3 text-xs font-mono text-foreground">
          {formatInline(parsedValue)}
        </pre>
        {props.helperText ? <div className="text-xs text-muted-foreground">{props.helperText}</div> : null}
      </div>
    )
  }

  return (
    <div className="space-y-2 rounded-lg border border-border/50 bg-card p-3 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        {props.label ? <label className="text-xs font-medium text-foreground">{props.label}</label> : null}
        <div className="flex items-center gap-1">
          <Button type="default" size="tiny" htmlType="button" onClick={expandAll}>
            Expand
          </Button>
          <Button type="default" size="tiny" htmlType="button" onClick={collapseAll}>
            Collapse
          </Button>
          <Button type="default" size="tiny" htmlType="button" onClick={copyCurrentValue}>
            Copy
          </Button>
        </div>
      </div>

      {props.searchable ? (
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search JSON"
          className="h-9"
        />
      ) : null}

      <div className="max-h-80 overflow-auto rounded-md border border-input bg-background/60 p-1">
        <JsonNode
          name="root"
          value={parsedValue}
          path="root"
          depth={0}
          expandedPaths={expandedPaths}
          onToggle={onTogglePath}
          highlightedPaths={highlightedPaths}
        />
      </div>

      {props.helperText ? <div className="text-xs text-muted-foreground">{props.helperText}</div> : null}
    </div>
  )
}

export const JsonExplorerDefinition = createWidgetDefinition<JsonExplorerProps>({
  type: 'JsonExplorer',
  label: 'JSON Explorer',
  category: 'data',
  description: 'Inspect JSON data',
  defaultProps: {
    label: 'JSON',
    value: '{\n  "key": "value"\n}',
    data: null,
    count: 0,
    expandedPathList: ['root'],
    highlightedPathList: [],
    search: '',
    helperText: '',
    searchable: true,
  },
  render: (props, context) => <JsonExplorerRenderer props={props} context={context} />,
})
