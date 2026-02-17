import { useEffect, useRef } from 'react'

import {
  Button,
  Input_Shadcn_ as Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'ui'

import { renderWidgetIcon } from '../icon-library'
import { normalizeArray, normalizeString, parseMaybeJson } from '../helpers'
import { createWidgetDefinition } from '../types'
import type { WidgetRenderContext } from '../types'

export type TableColumnFormat =
  | 'String'
  | 'Multiple String'
  | 'Number'
  | 'Percent'
  | 'Progress'
  | 'Currency'
  | 'Phone Number'
  | 'Date'
  | 'Datetime'
  | 'Time'
  | 'Boolean'
  | 'Tags'
  | 'Tag'
  | 'Icon'
  | 'Avatar'
  | 'Image'
  | 'Button'
  | 'Link'
  | 'Rating'
  | 'JSON'
  | 'Bigint'
  | 'Markdown'
  | 'Email'
  | 'HTML'

export type TableColumn = {
  source?: string
  key?: string
  id?: string
  label?: string
  format?: TableColumnFormat
  value?: string
  editable?: boolean
  hidden?: boolean
  align?: 'left' | 'center' | 'right'
  sortable?: boolean
  searchable?: boolean
  width?: string | number
  headerTooltip?: string
  cellTooltip?: string
  caption?: string
  statusIndicator?: string
}

export type TableFilterRule = {
  columnId?: string
  operator?:
    | 'is'
    | 'isNot'
    | 'contains'
    | 'notContains'
    | 'startsWith'
    | 'endsWith'
    | 'isEmpty'
    | 'isNotEmpty'
    | 'gt'
    | 'gte'
    | 'lt'
    | 'lte'
  value?: unknown
  disabled?: boolean
}

export type TableFilterStack = {
  operator?: 'and' | 'or'
  filters?: TableFilterRule[]
}

export type TableProps = {
  data: string
  columnsMode?: string
  columns: string
  primaryKey: string
  filterStack: string
  value?: Record<string, unknown> | null
  values?: Record<string, unknown>[]
  displayedData?: Record<string, unknown>[]
  selectedRow?: Record<string, unknown> | null
  selectedRows?: Record<string, unknown>[]
  selectedSourceRow?: Record<string, unknown> | null
  selectedSourceRows?: Record<string, unknown>[]
  selectedRowIndex?: number | null
  selectedDataIndex?: number | null
  selectedIndexes?: number[]
  currentPage?: number
  pageSize?: number
  totalRows?: number
  sortArray?: Array<{ columnId: string; direction: SortDirection }>
  showHeader: boolean
  striped: boolean
  rowLimit: number
  searchable: boolean
  events: string
}

type SortDirection = 'asc' | 'desc'

type SortState = {
  key: string
  direction: SortDirection
}

type ResolvedColumn = {
  key: string
  source: string
  id: string
  label: string
  format: TableColumnFormat
  value: string
  editable: boolean
  hidden: boolean
  align?: 'left' | 'center' | 'right'
  sortable: boolean
  searchable: boolean
  width?: string | number
  headerTooltip: string
  cellTooltip: string
  caption: string
  statusIndicator: string
}

const COLUMN_FORMATS = new Set<TableColumnFormat>([
  'String',
  'Multiple String',
  'Number',
  'Percent',
  'Progress',
  'Currency',
  'Phone Number',
  'Date',
  'Datetime',
  'Time',
  'Boolean',
  'Tags',
  'Tag',
  'Icon',
  'Avatar',
  'Image',
  'Button',
  'Link',
  'Rating',
  'JSON',
  'Bigint',
  'Markdown',
  'Email',
  'HTML',
])

const normalizeDataRows = (raw: unknown): Record<string, unknown>[] => {
  const parsed = parseMaybeJson(raw)
  return normalizeArray<Record<string, unknown>>(parsed, []).filter(
    (item) => Boolean(item) && typeof item === 'object' && !Array.isArray(item)
  )
}

const inferDataKeys = (data: Record<string, unknown>[]) => {
  if (data.length === 0) {
    return [] as string[]
  }
  const keys = new Set<string>()
  data.slice(0, 100).forEach((row) => {
    Object.keys(row).forEach((key) => keys.add(key))
  })
  return Array.from(keys)
}

type TableColumnsMode = 'manual' | 'mapped'

const normalizeColumnsMode = (value: unknown): TableColumnsMode => {
  const normalized = normalizeString(value, '').trim().toLowerCase()
  if (normalized === 'mapped' || normalized === 'dynamic') {
    return 'mapped'
  }
  return 'manual'
}

const getPathValue = (source: Record<string, unknown>, path: string): unknown => {
  if (!path.trim()) {
    return source
  }

  const normalized = path.replace(/\[(\d+)\]/g, '.$1')
  const parts = normalized.split('.').map((part) => part.trim()).filter(Boolean)

  let cursor: unknown = source
  for (const part of parts) {
    if (cursor === null || typeof cursor === 'undefined') {
      return undefined
    }
    if (Array.isArray(cursor)) {
      const index = Number(part)
      if (!Number.isFinite(index)) {
        return undefined
      }
      cursor = cursor[index]
      continue
    }
    if (typeof cursor === 'object') {
      cursor = (cursor as Record<string, unknown>)[part]
      continue
    }
    return undefined
  }

  return cursor
}

const resolveMappedPath = (value: string): string => {
  const raw = value.trim()
  if (!raw) {
    return ''
  }

  if (raw.startsWith('{{') && raw.endsWith('}}')) {
    const body = raw.slice(2, -2).trim()
    const withoutPrefix = body.replace(/^(currentRow|currentSourceRow|row|item)\./, '')
    return withoutPrefix
  }

  return raw
}

const resolveColumnValue = (row: Record<string, unknown>, column: ResolvedColumn): unknown => {
  const mappedPath = resolveMappedPath(column.value)
  if (mappedPath) {
    return getPathValue(row, mappedPath)
  }
  return getPathValue(row, column.source)
}

const toColumns = (columnsRaw: unknown, data: Record<string, unknown>[]): ResolvedColumn[] => {
  const parsed = normalizeArray<TableColumn | string>(columnsRaw, [])
  if (parsed.length > 0) {
    const result: ResolvedColumn[] = []

    parsed.forEach((entry, index) => {
      if (typeof entry === 'string') {
        const key = entry
        result.push({
          key,
          source: key,
          id: `column${index + 1}`,
          label: key,
          format: 'String',
          value: '',
          editable: false,
          hidden: false,
          sortable: true,
          searchable: true,
          headerTooltip: '',
          cellTooltip: '',
          caption: '',
          statusIndicator: '',
        })
        return
      }

      if (!entry || typeof entry !== 'object') {
        return
      }

      const source = normalizeString(entry.source ?? entry.key, '')
      if (!source) {
        return
      }

      const formatCandidate = normalizeString(entry.format, 'String') as TableColumnFormat
      const format = COLUMN_FORMATS.has(formatCandidate) ? formatCandidate : 'String'
      const id = normalizeString(entry.id, `column${index + 1}`)

      result.push({
        key: id,
        source,
        id,
        label: normalizeString(entry.label, source),
        format,
        value: normalizeString(entry.value, ''),
        editable: Boolean(entry.editable),
        hidden: Boolean(entry.hidden),
        align: entry.align,
        sortable: typeof entry.sortable === 'boolean' ? entry.sortable : true,
        searchable: typeof entry.searchable === 'boolean' ? entry.searchable : true,
        width: entry.width,
        headerTooltip: normalizeString(entry.headerTooltip, ''),
        cellTooltip: normalizeString(entry.cellTooltip, ''),
        caption: normalizeString(entry.caption, ''),
        statusIndicator: normalizeString(entry.statusIndicator, ''),
      })
    })

    return result
  }

  if (data.length === 0) {
    return []
  }

  return inferDataKeys(data).map((source, index) => ({
    key: `column${index + 1}`,
    source,
    id: `column${index + 1}`,
    label: source,
    format: 'String',
    value: '',
    editable: false,
    hidden: false,
    sortable: true,
    searchable: true,
    headerTooltip: '',
    cellTooltip: '',
    caption: '',
    statusIndicator: '',
  }))
}

const toFilterStack = (raw: unknown): TableFilterStack | null => {
  const parsed = parseMaybeJson(raw)
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return null
  }
  const stack = parsed as TableFilterStack
  return {
    operator: stack.operator === 'or' ? 'or' : 'and',
    filters: normalizeArray<TableFilterRule>(stack.filters, []).filter((filter) =>
      Boolean(filter?.columnId)
    ),
  }
}

const toStringValue = (value: unknown) => {
  if (typeof value === 'string') {
    return value
  }
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return String(value)
  }
  if (value === null || typeof value === 'undefined') {
    return ''
  }
  try {
    return JSON.stringify(value)
  } catch {
    return ''
  }
}

const isNumberLike = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return true
  }
  if (typeof value === 'string' && value.trim()) {
    return Number.isFinite(Number(value))
  }
  return false
}

const compareValues = (a: unknown, b: unknown) => {
  if (isNumberLike(a) && isNumberLike(b)) {
    return Number(a) - Number(b)
  }
  return toStringValue(a).localeCompare(toStringValue(b), undefined, {
    numeric: true,
    sensitivity: 'base',
  })
}

const matchesFilter = (rawValue: unknown, rule: TableFilterRule) => {
  const operator = rule.operator ?? 'contains'
  const left = toStringValue(rawValue).toLowerCase()
  const right = toStringValue(rule.value).toLowerCase()

  switch (operator) {
    case 'is':
      return left === right
    case 'isNot':
      return left !== right
    case 'contains':
      return left.includes(right)
    case 'notContains':
      return !left.includes(right)
    case 'startsWith':
      return left.startsWith(right)
    case 'endsWith':
      return left.endsWith(right)
    case 'isEmpty':
      return left.trim() === ''
    case 'isNotEmpty':
      return left.trim() !== ''
    case 'gt':
      return Number(rawValue) > Number(rule.value)
    case 'gte':
      return Number(rawValue) >= Number(rule.value)
    case 'lt':
      return Number(rawValue) < Number(rule.value)
    case 'lte':
      return Number(rawValue) <= Number(rule.value)
    default:
      return left.includes(right)
  }
}

const applyFilterStack = (
  rows: Record<string, unknown>[],
  stack: TableFilterStack | null,
  columns: ResolvedColumn[]
) => {
  if (!stack?.filters?.length) {
    return rows
  }

  const activeFilters = stack.filters.filter((item) => !item.disabled && item.columnId)
  if (activeFilters.length === 0) {
    return rows
  }

  const mode = stack.operator === 'or' ? 'or' : 'and'

  return rows.filter((row) => {
    const results = activeFilters.map((rule) => {
      const matchColumn = columns.find(
        (column) => column.id === rule.columnId || column.source === rule.columnId
      )
      const value = matchColumn ? resolveColumnValue(row, matchColumn) : row[rule.columnId as string]
      return matchesFilter(value, rule)
    })
    return mode === 'or' ? results.some(Boolean) : results.every(Boolean)
  })
}

const applySearch = (rows: Record<string, unknown>[], columns: ResolvedColumn[], query: string) => {
  const normalizedQuery = query.trim().toLowerCase()
  if (!normalizedQuery) {
    return rows
  }

  const searchableColumns = columns.filter((column) => column.searchable !== false)
  if (searchableColumns.length === 0) {
    return rows
  }

  return rows.filter((row) =>
    searchableColumns.some((column) =>
      toStringValue(resolveColumnValue(row, column)).toLowerCase().includes(normalizedQuery)
    )
  )
}

const resolveSort = (rawSort: unknown, columns: ResolvedColumn[]): SortState | null => {
  if (!rawSort || typeof rawSort !== 'object' || Array.isArray(rawSort)) {
    return null
  }
  const candidate = rawSort as { key?: unknown; direction?: unknown }
  const key = typeof candidate.key === 'string' ? candidate.key : ''
  if (!key || !columns.some((column) => column.key === key)) {
    return null
  }
  const direction = candidate.direction === 'desc' ? 'desc' : 'asc'
  return { key, direction }
}

const formatCellValue = (value: unknown, column: ResolvedColumn, context?: WidgetRenderContext) => {
  if (value === null || typeof value === 'undefined') {
    return <span className="text-muted-foreground">-</span>
  }

  switch (column.format) {
    case 'Multiple String': {
      if (Array.isArray(value)) {
        return value.map((item) => toStringValue(item)).filter(Boolean).join(', ')
      }
      return toStringValue(value)
    }
    case 'Number': {
      const n = Number(value)
      return Number.isFinite(n) ? n.toLocaleString() : toStringValue(value)
    }
    case 'Percent': {
      const n = Number(value)
      return Number.isFinite(n) ? `${n}%` : toStringValue(value)
    }
    case 'Progress': {
      const n = Number(value)
      const safe = Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : 0
      return (
        <div className="space-y-1">
          <div className="h-1.5 overflow-hidden rounded bg-muted">
            <div className="h-full rounded bg-primary" style={{ width: `${safe}%` }} />
          </div>
          <div className="text-[10px] text-muted-foreground">{safe}%</div>
        </div>
      )
    }
    case 'Currency': {
      const n = Number(value)
      return Number.isFinite(n)
        ? new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(n)
        : toStringValue(value)
    }
    case 'Date':
    case 'Datetime':
    case 'Time': {
      const date = new Date(toStringValue(value))
      if (Number.isNaN(date.getTime())) {
        return toStringValue(value)
      }
      if (column.format === 'Date') {
        return date.toLocaleDateString()
      }
      if (column.format === 'Time') {
        return date.toLocaleTimeString()
      }
      return date.toLocaleString()
    }
    case 'Boolean': {
      return Boolean(value) ? 'true' : 'false'
    }
    case 'Tags': {
      const list = Array.isArray(value) ? value : [value]
      return (
        <div className="flex flex-wrap gap-1">
          {list.map((item, index) => (
            <span key={`${toStringValue(item)}:${index}`} className="rounded bg-muted px-1.5 py-0.5 text-[10px]">
              {toStringValue(item)}
            </span>
          ))}
        </div>
      )
    }
    case 'Tag': {
      return <span className="rounded bg-muted px-1.5 py-0.5 text-[10px]">{toStringValue(value)}</span>
    }
    case 'Icon': {
      const iconName = toStringValue(value) || 'star'
      return renderWidgetIcon(iconName, { library: context?.iconLibrary, size: 14 })
    }
    case 'Avatar': {
      const text = toStringValue(value)
      const initials = text
        .split(' ')
        .map((part) => part[0])
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase()
      return (
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-muted text-[10px] font-semibold">
          {initials || '?'}
        </span>
      )
    }
    case 'Image': {
      const src = toStringValue(value)
      return src ? <img src={src} alt="" className="h-8 w-8 rounded object-cover" /> : '-'
    }
    case 'Button': {
      return (
        <button type="button" className="rounded border border-border px-2 py-0.5 text-[11px]">
          {toStringValue(value) || 'Action'}
        </button>
      )
    }
    case 'Link': {
      const href = toStringValue(value)
      return href ? (
        <a href={href} target="_blank" rel="noreferrer" className="text-primary underline">
          {href}
        </a>
      ) : (
        '-'
      )
    }
    case 'Rating': {
      const rating = Math.max(0, Math.min(5, Math.round(Number(value) || 0)))
      return (
        <span className="inline-flex items-center gap-0.5 text-amber-500">
          {Array.from({ length: 5 }).map((_, index) =>
            renderWidgetIcon(index < rating ? 'star' : 'star', {
              library: context?.iconLibrary,
              size: 12,
              className: index < rating ? 'opacity-100' : 'opacity-25',
            })
          )}
        </span>
      )
    }
    case 'JSON': {
      return <pre className="whitespace-pre-wrap text-[10px]">{toStringValue(value)}</pre>
    }
    case 'Bigint': {
      try {
        return BigInt(toStringValue(value)).toString()
      } catch {
        return toStringValue(value)
      }
    }
    case 'Markdown': {
      return <span className="whitespace-pre-wrap">{toStringValue(value)}</span>
    }
    case 'Email': {
      const email = toStringValue(value)
      return email ? (
        <a href={`mailto:${email}`} className="text-primary underline">
          {email}
        </a>
      ) : (
        '-'
      )
    }
    case 'HTML': {
      return <span dangerouslySetInnerHTML={{ __html: toStringValue(value) }} />
    }
    case 'Phone Number':
    case 'String':
    default: {
      if (typeof value === 'object') {
        return <span className="font-mono text-xs">{toStringValue(value)}</span>
      }
      return toStringValue(value)
    }
  }
}

const TableRenderer = ({
  props,
  context,
}: {
  props: TableProps
  context?: WidgetRenderContext
}) => {
  const derivedSnapshotRef = useRef('')
  const parsedData = normalizeDataRows(props.data)
  const columnsMode = normalizeColumnsMode(context?.state?.columnsMode ?? props.columnsMode)
  const columns =
    columnsMode === 'mapped'
      ? toColumns([], parsedData)
      : toColumns(parseMaybeJson(props.columns), parsedData)
  const visibleColumns = columns.filter((column) => !column.hidden)
  const rowLimit =
    typeof props.rowLimit === 'number' && props.rowLimit > 0
      ? Math.floor(props.rowLimit)
      : Math.max(parsedData.length, 1)

  if (visibleColumns.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border/50 px-3 py-6 text-center text-xs text-muted-foreground">
        Provide table data to preview rows.
      </div>
    )
  }

  const dataKeys = inferDataKeys(parsedData)
  const primaryKey = normalizeString(context?.state?.primaryKey ?? props.primaryKey, dataKeys[0] ?? '')

  const search = normalizeString(context?.state?.search, '')
  const currentPageRaw = Number(context?.state?.currentPage ?? 1)
  const currentPage = Number.isFinite(currentPageRaw) && currentPageRaw > 0 ? currentPageRaw : 1

  const filterStack =
    toFilterStack(context?.state?.filterStack) ??
    toFilterStack(props.filterStack) ??
    toFilterStack(context?.evaluationContext?.filterStack) ??
    null

  const withFilters = applyFilterStack(parsedData, filterStack, columns)
  const withSearch = props.searchable ? applySearch(withFilters, visibleColumns, search) : withFilters

  const sort = resolveSort(context?.state?.sort, visibleColumns)
  let preparedRows = withSearch
  if (sort) {
    const sortedColumn = columns.find((column) => column.key === sort.key)
    if (sortedColumn) {
      const direction = sort.direction === 'desc' ? -1 : 1
      preparedRows = [...withSearch].sort(
        (left, right) =>
          compareValues(resolveColumnValue(left, sortedColumn), resolveColumnValue(right, sortedColumn)) *
          direction
      )
    }
  }

  const totalRows = preparedRows.length
  const totalPages = Math.max(1, Math.ceil(totalRows / rowLimit))
  const safePage = Math.min(currentPage, totalPages)
  const pageStart = (safePage - 1) * rowLimit
  const pageRows = preparedRows.slice(pageStart, pageStart + rowLimit)

  const selectedIndexes = normalizeArray<number>(context?.state?.selectedIndexes, [])
  const selectedRows = selectedIndexes
    .map((index) => preparedRows[index])
    .filter((item): item is Record<string, unknown> => Boolean(item))
  const selectedRow = selectedRows[0] ?? null
  const selectedRowIndex =
    selectedIndexes.length > 0 && Number.isFinite(selectedIndexes[0]) ? selectedIndexes[0] : null
  const sortArray = sort ? [{ columnId: sort.key, direction: sort.direction }] : []

  const buildPatch = (overrides?: Record<string, unknown>) => ({
    value: selectedRow,
    values: selectedRows,
    displayedData: pageRows,
    data: parsedData,
    columns,
    columnsMode,
    visibleColumns,
    primaryKey,
    selectedRow,
    selectedRows,
    selectedSourceRow: selectedRow,
    selectedSourceRows: selectedRows,
    selectedRowIndex,
    selectedDataIndex: selectedRowIndex,
    selectedIndexes,
    pageSize: rowLimit,
    currentPage: safePage,
    totalRows,
    search,
    filterStack,
    sort: sort ?? null,
    sortArray,
    ...(overrides ?? {}),
  })

  useEffect(() => {
    if (!context?.setState) {
      return
    }
    const snapshot = JSON.stringify({
      selectedIndexes,
      search,
      safePage,
      rowLimit,
      totalRows,
      sort,
      filterStack,
      pageRows,
      primaryKey,
      columns,
      columnsMode,
      visibleColumns,
    })
    if (derivedSnapshotRef.current === snapshot) {
      return
    }
    derivedSnapshotRef.current = snapshot
    context.setState(buildPatch())
  }, [columns, columnsMode, filterStack, pageRows, primaryKey, rowLimit, safePage, search, selectedIndexes, sort, totalRows, visibleColumns])

  const setSearch = (nextSearch: string) => {
    const patch = buildPatch({ search: nextSearch, currentPage: 1 })
    context?.setState?.(patch)
    context?.runActions?.('change', patch)
  }

  const toggleSort = (columnKey: string) => {
    const current = resolveSort(context?.state?.sort, visibleColumns)
    const nextDirection: SortDirection =
      current?.key === columnKey && current.direction === 'asc' ? 'desc' : 'asc'
    const nextSort = { key: columnKey, direction: nextDirection }
    const patch = buildPatch({
      sort: nextSort,
      sortArray: [{ columnId: nextSort.key, direction: nextSort.direction }],
    })
    context?.setState?.(patch)
    context?.runActions?.('sortChange', patch)
  }

  const setPage = (page: number) => {
    const next = Math.max(1, Math.min(totalPages, page))
    const patch = buildPatch({ currentPage: next, page: next, totalPages })
    context?.setState?.(patch)
    context?.runActions?.('pageChange', patch)
  }

  const toggleRowSelection = (row: Record<string, unknown>, absoluteIndex: number) => {
    const has = selectedIndexes.includes(absoluteIndex)
    const nextIndexes = has
      ? selectedIndexes.filter((index) => index !== absoluteIndex)
      : [...selectedIndexes, absoluteIndex]

    const nextSelectedRows = nextIndexes
      .map((index) => preparedRows[index])
      .filter((item): item is Record<string, unknown> => Boolean(item))
    const nextSelectedRow = nextSelectedRows[0] ?? null
    const nextSelectedRowIndex =
      nextIndexes.length > 0 && Number.isFinite(nextIndexes[0]) ? nextIndexes[0] : null

    const patch = buildPatch({
      value: nextSelectedRow,
      values: nextSelectedRows,
      selectedRow: nextSelectedRow,
      selectedRows: nextSelectedRows,
      selectedSourceRow: nextSelectedRow,
      selectedSourceRows: nextSelectedRows,
      selectedRowIndex: nextSelectedRowIndex,
      selectedDataIndex: nextSelectedRowIndex,
      selectedIndexes: nextIndexes,
    })
    context?.setState?.(patch)
    context?.runActions?.('rowSelect', {
      ...patch,
      row,
      selected: !has,
    })
  }

  return (
    <div className="space-y-2 rounded-lg border border-border/50 bg-card p-2 shadow-sm">
      {props.searchable ? (
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search rows"
              className="pr-8"
            />
            <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">
              {renderWidgetIcon('search', { library: context?.iconLibrary, size: 14 })}
            </div>
          </div>
          {search ? (
            <Button type="default" size="small" htmlType="button" onClick={() => setSearch('')}>
              Clear
            </Button>
          ) : null}
        </div>
      ) : null}

      <div className="max-h-[28rem] overflow-auto rounded-md border border-border/50">
        <Table>
          {props.showHeader ? (
            <TableHeader className="sticky top-0 z-[1] bg-card">
              <TableRow className="bg-card hover:bg-card">
                <TableHead className="w-10" />
                {visibleColumns.map((column) => {
                  const currentSort = resolveSort(context?.state?.sort, visibleColumns)
                  const isCurrentSort = currentSort?.key === column.key
                  return (
                    <TableHead
                      key={column.key}
                      className={
                        column.align === 'right'
                          ? 'text-right'
                          : column.align === 'center'
                            ? 'text-center'
                            : undefined
                      }
                      style={column.width ? { width: column.width } : undefined}
                      title={column.headerTooltip || undefined}
                    >
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-foreground"
                        onClick={() => toggleSort(column.key)}
                        disabled={column.sortable === false}
                      >
                        <span>{column.label}</span>
                        {column.sortable === false ? null : isCurrentSort ? (
                          renderWidgetIcon(currentSort?.direction === 'desc' ? 'arrowdown' : 'arrowup', {
                            library: context?.iconLibrary,
                            size: 12,
                            className: 'text-foreground',
                          })
                        ) : (
                          <span className="text-muted-foreground">
                            {renderWidgetIcon('arrowup', {
                              library: context?.iconLibrary,
                              size: 12,
                              className: 'opacity-60',
                            })}
                          </span>
                        )}
                      </button>
                      {column.caption ? <div className="text-[10px] text-muted-foreground">{column.caption}</div> : null}
                    </TableHead>
                  )
                })}
              </TableRow>
            </TableHeader>
          ) : null}
          <TableBody>
            {pageRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={visibleColumns.length + 1} className="h-20 text-center text-xs text-muted-foreground">
                  No rows
                </TableCell>
              </TableRow>
            ) : (
              pageRows.map((row, index) => {
                const absoluteIndex = pageStart + index
                const selected = selectedIndexes.includes(absoluteIndex)
                const rowPrimaryKey = primaryKey ? toStringValue(getPathValue(row, primaryKey)) : ''
                const rowKey = rowPrimaryKey || String(absoluteIndex)

                return (
                  <TableRow
                    key={rowKey}
                    className={[
                      props.striped && index % 2 === 1 ? 'bg-muted/35' : '',
                      selected ? 'bg-accent/40' : '',
                      'cursor-pointer',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onClick={() => {
                      context?.runActions?.('rowClick', {
                        ...buildPatch(),
                        row,
                        index: absoluteIndex,
                        pageIndex: index,
                      })
                    }}
                  >
                    <TableCell className="w-10">
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleRowSelection(row, absoluteIndex)}
                        onClick={(event) => event.stopPropagation()}
                        aria-label={`Select row ${absoluteIndex + 1}`}
                      />
                    </TableCell>
                    {visibleColumns.map((column) => {
                      const rawValue = resolveColumnValue(row, column)
                      const statusValue = column.statusIndicator
                        ? Boolean(getPathValue(row, resolveMappedPath(column.statusIndicator)))
                        : false
                      return (
                        <TableCell
                          key={`${rowKey}-${column.key}`}
                          className={
                            column.align === 'right'
                              ? 'text-right'
                              : column.align === 'center'
                                ? 'text-center'
                                : undefined
                          }
                          title={column.cellTooltip || undefined}
                        >
                          <div className="flex items-center gap-1.5">
                            {column.statusIndicator ? (
                              <span
                                className={[
                                  'inline-block h-1.5 w-1.5 rounded-full',
                                  statusValue ? 'bg-emerald-500' : 'bg-muted-foreground/40',
                                ]
                                  .filter(Boolean)
                                  .join(' ')}
                              />
                            ) : null}
                            {formatCellValue(rawValue, column, context)}
                          </div>
                        </TableCell>
                      )
                    })}
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {totalRows === 0
            ? '0 rows'
            : `${pageStart + 1}-${Math.min(pageStart + pageRows.length, totalRows)} of ${totalRows}`}
        </span>
        <div className="flex items-center gap-1">
          <Button
            type="default"
            size="tiny"
            htmlType="button"
            disabled={safePage <= 1}
            onClick={() => setPage(safePage - 1)}
          >
            Prev
          </Button>
          <span className="px-1">{safePage}</span>
          <Button
            type="default"
            size="tiny"
            htmlType="button"
            disabled={safePage >= totalPages}
            onClick={() => setPage(safePage + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}

export const TableDefinition = createWidgetDefinition<TableProps>({
  type: 'Table',
  label: 'Table',
  category: 'data',
  description: 'Tabular data view',
  defaultProps: {
    data: JSON.stringify(
      [
        { id: 10, name: 'Amberly Fender', role: 'Editor', active: true },
        { id: 96, name: 'Amberly Hellcat', role: 'Editor', active: false },
        { id: 73, name: 'Amberly Worling', role: 'Viewer', active: false },
      ],
      null,
      2
    ),
    columnsMode: 'manual',
    columns: JSON.stringify(
      [
        { id: 'column1', source: 'id', label: 'ID', format: 'Number' },
        { id: 'column2', source: 'name', label: 'Name', format: 'String' },
        { id: 'column3', source: 'role', label: 'Role', format: 'Tag' },
      ],
      null,
      2
    ),
    primaryKey: 'id',
    filterStack: '{"operator":"and","filters":[]}',
    value: null,
    values: [],
    displayedData: [],
    selectedRow: null,
    selectedRows: [],
    selectedSourceRow: null,
    selectedSourceRows: [],
    selectedRowIndex: null,
    selectedDataIndex: null,
    selectedIndexes: [],
    currentPage: 1,
    pageSize: 10,
    totalRows: 0,
    sortArray: [],
    showHeader: true,
    striped: true,
    rowLimit: 10,
    searchable: true,
    events: '[]',
  },
  render: (props, context) => <TableRenderer props={props} context={context} />,
})
