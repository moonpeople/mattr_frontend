import { useEffect, useRef } from 'react'
import { Button, Input_Shadcn_ as Input } from 'ui'

import { normalizeArray, normalizeString, parseMaybeJson } from '../helpers'
import { createWidgetDefinition } from '../types'
import type { WidgetRenderContext } from '../types'

export type FilterRule = {
  columnId: string
  operator:
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
  value?: string
  disabled?: boolean
}

export type FilterStackValue = {
  operator: 'and' | 'or'
  filters: FilterRule[]
}

type FilterColumn = {
  id: string
  label: string
}

export type FilterProps = {
  label: string
  columns: string
  value: string
  values?: FilterRule[]
  filterStack?: FilterStackValue
  filters?: Record<string, string>
  count?: number
  valid?: boolean
  invalid?: boolean
  appliedValue?: FilterStackValue | null
  helperText: string
  events: string
}

const DEFAULT_RULE: FilterRule = {
  columnId: '',
  operator: 'contains',
  value: '',
  disabled: false,
}

const OPERATOR_OPTIONS: Array<{ value: FilterRule['operator']; label: string }> = [
  { value: 'contains', label: 'contains' },
  { value: 'notContains', label: 'does not contain' },
  { value: 'is', label: 'is' },
  { value: 'isNot', label: 'is not' },
  { value: 'startsWith', label: 'starts with' },
  { value: 'endsWith', label: 'ends with' },
  { value: 'isEmpty', label: 'is empty' },
  { value: 'isNotEmpty', label: 'is not empty' },
  { value: 'gt', label: '>' },
  { value: 'gte', label: '>=' },
  { value: 'lt', label: '<' },
  { value: 'lte', label: '<=' },
]

const normalizeColumns = (raw: unknown): FilterColumn[] => {
  const parsed = parseMaybeJson(raw)
  const normalized = normalizeArray<string | { id?: string; key?: string; name?: string; label?: string }>(
    parsed,
    []
  )

  return normalized
    .map((item) => {
      if (typeof item === 'string') {
        return { id: item, label: item }
      }
      const id = item.id ?? item.key ?? item.name
      if (!id) {
        return null
      }
      return { id, label: item.label ?? id }
    })
    .filter((item): item is FilterColumn => Boolean(item?.id))
}

const normalizeLegacyFilters = (raw: unknown, fallbackColumnId?: string): FilterRule[] => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return []
  }

  return Object.entries(raw as Record<string, unknown>).map(([columnId, value]) => ({
    columnId,
    operator: 'contains',
    value: normalizeString(value, ''),
    disabled: false,
  }))
}

const normalizeFilterStack = (
  raw: unknown,
  columns: FilterColumn[],
  fallbackRule?: FilterRule
): FilterStackValue => {
  const parsed = parseMaybeJson(raw)
  const defaultColumnId = fallbackRule?.columnId ?? columns[0]?.id ?? ''

  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
    const candidate = parsed as Partial<FilterStackValue>
    const filters = normalizeArray<Partial<FilterRule>>(candidate.filters, [])
      .map((rule) => {
        const operator = OPERATOR_OPTIONS.some((item) => item.value === rule.operator)
          ? (rule.operator as FilterRule['operator'])
          : 'contains'
        return {
          columnId: normalizeString(rule.columnId, defaultColumnId),
          operator,
          value: normalizeString(rule.value, ''),
          disabled: Boolean(rule.disabled),
        }
      })
      .filter((rule) => Boolean(rule.columnId))

    return {
      operator: candidate.operator === 'or' ? 'or' : 'and',
      filters,
    }
  }

  const legacyFilters = normalizeLegacyFilters(parsed, defaultColumnId)
  if (legacyFilters.length > 0) {
    return {
      operator: 'and',
      filters: legacyFilters,
    }
  }

  return {
    operator: 'and',
    filters: fallbackRule ? [fallbackRule] : [],
  }
}

const isValueOptionalOperator = (operator: FilterRule['operator']) =>
  operator === 'isEmpty' || operator === 'isNotEmpty'

const toLegacyMap = (stack: FilterStackValue) =>
  stack.filters.reduce((acc, item) => {
    if (!item.disabled) {
      acc[item.columnId] = item.value ?? ''
    }
    return acc
  }, {} as Record<string, string>)

const FilterRenderer = ({
  props,
  context,
}: {
  props: FilterProps
  context?: WidgetRenderContext
}) => {
  const derivedSnapshotRef = useRef('')
  const columns = normalizeColumns(props.columns)
  const firstColumnId = columns[0]?.id ?? ''

  const stateValue = context?.state?.value ?? context?.state?.filterStack
  const legacyState = context?.state?.filters
  const baseStack = normalizeFilterStack(
    stateValue ?? props.value ?? legacyState,
    columns,
    firstColumnId ? { ...DEFAULT_RULE, columnId: firstColumnId } : undefined
  )

  const buildPatch = (next: FilterStackValue, emitApply = false) => {
    const nextValue = {
      operator: next.operator,
      filters: next.filters,
    }
    const nextLegacy = toLegacyMap(nextValue)
    const count = nextValue.filters.filter((item) => !item.disabled).length

    return {
      value: nextValue,
      values: nextValue.filters,
      filterStack: nextValue,
      filters: nextLegacy,
      count,
      valid: true,
      invalid: false,
      appliedValue: emitApply ? nextValue : context?.state?.appliedValue ?? null,
    }
  }

  const setStack = (next: FilterStackValue, emitApply = false) => {
    const patch = buildPatch(next, emitApply)
    context?.setState?.(patch)
    context?.runActions?.('change', patch)

    if (emitApply) {
      context?.runActions?.('apply', patch)
    }
  }

  const updateRule = (index: number, patch: Partial<FilterRule>) => {
    const nextRules = baseStack.filters.map((rule, currentIndex) =>
      currentIndex === index ? { ...rule, ...patch } : rule
    )
    setStack({ ...baseStack, filters: nextRules })
  }

  const removeRule = (index: number) => {
    const nextRules = baseStack.filters.filter((_, currentIndex) => currentIndex !== index)
    setStack({ ...baseStack, filters: nextRules })
  }

  const addRule = () => {
    if (!firstColumnId) {
      return
    }
    const nextRules = [...baseStack.filters, { ...DEFAULT_RULE, columnId: firstColumnId }]
    setStack({ ...baseStack, filters: nextRules })
  }

  const clear = () => {
    setStack({ operator: 'and', filters: [] }, true)
  }

  useEffect(() => {
    if (!context?.setState) {
      return
    }
    const snapshot = JSON.stringify(baseStack)
    if (derivedSnapshotRef.current === snapshot) {
      return
    }
    derivedSnapshotRef.current = snapshot
    context.setState(buildPatch(baseStack))
  }, [baseStack])

  return (
    <div className="space-y-3 rounded-lg border border-border/50 bg-card p-3 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {props.label || 'Filters'}
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground" htmlFor={`${context?.widgetId}-group-operator`}>
            Match
          </label>
          <select
            id={`${context?.widgetId}-group-operator`}
            value={baseStack.operator}
            onChange={(event) =>
              setStack({
                ...baseStack,
                operator: event.target.value === 'or' ? 'or' : 'and',
              })
            }
            className="h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground"
          >
            <option value="and">All (AND)</option>
            <option value="or">Any (OR)</option>
          </select>
        </div>
      </div>

      {columns.length === 0 ? (
        <div className="rounded-md border border-dashed border-border/50 px-3 py-4 text-xs text-muted-foreground">
          Configure columns to build filters.
        </div>
      ) : (
        <div className="space-y-2">
          {baseStack.filters.length === 0 ? (
            <div className="rounded-md border border-dashed border-border/50 px-3 py-4 text-xs text-muted-foreground">
              No rules yet.
            </div>
          ) : (
            baseStack.filters.map((rule, index) => {
              const hideValue = isValueOptionalOperator(rule.operator)
              return (
                <div key={`rule-${index}`} className="grid grid-cols-12 gap-2">
                  <select
                    value={rule.columnId}
                    onChange={(event) => updateRule(index, { columnId: event.target.value })}
                    className="col-span-4 h-9 rounded-md border border-input bg-background px-2 text-xs text-foreground"
                  >
                    {columns.map((column) => (
                      <option key={column.id} value={column.id}>
                        {column.label}
                      </option>
                    ))}
                  </select>

                  <select
                    value={rule.operator}
                    onChange={(event) =>
                      updateRule(index, { operator: event.target.value as FilterRule['operator'] })
                    }
                    className="col-span-3 h-9 rounded-md border border-input bg-background px-2 text-xs text-foreground"
                  >
                    {OPERATOR_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>

                  <div className="col-span-4">
                    {hideValue ? (
                      <div className="flex h-9 items-center rounded-md border border-input bg-muted/40 px-2 text-xs text-muted-foreground">
                        No value
                      </div>
                    ) : (
                      <Input
                        value={normalizeString(rule.value, '')}
                        placeholder="Value"
                        onChange={(event) => updateRule(index, { value: event.target.value })}
                        className="h-9"
                      />
                    )}
                  </div>

                  <button
                    type="button"
                    className="col-span-1 rounded-md border border-border bg-background text-xs text-foreground hover:bg-muted"
                    onClick={() => removeRule(index)}
                    aria-label={`Remove filter rule ${index + 1}`}
                  >
                    x
                  </button>
                </div>
              )
            })
          )}
        </div>
      )}

      <div className="flex items-center gap-2">
        <Button type="default" size="small" htmlType="button" onClick={addRule} disabled={!firstColumnId}>
          Add rule
        </Button>
        <Button type="secondary" size="small" htmlType="button" onClick={clear}>
          Clear
        </Button>
        <Button type="primary" size="small" htmlType="button" onClick={() => setStack(baseStack, true)}>
          Apply
        </Button>
      </div>

      {props.helperText ? <div className="text-xs text-muted-foreground">{props.helperText}</div> : null}
    </div>
  )
}

export const FilterDefinition = createWidgetDefinition<FilterProps>({
  type: 'Filter',
  label: 'Filter',
  category: 'data',
  description: 'Filter controls',
  defaultProps: {
    label: 'Filters',
    columns: '["name","role","active"]',
    value: '{"operator":"and","filters":[]}',
    values: [],
    filterStack: { operator: 'and', filters: [] },
    filters: {},
    count: 0,
    valid: true,
    invalid: false,
    appliedValue: null,
    helperText: '',
    events: '[]',
  },
  render: (props, context) => <FilterRenderer props={props} context={context} />,
})
