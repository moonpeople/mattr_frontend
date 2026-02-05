import { Button, Input } from 'ui'

import type { WidgetDefinition } from '../types'

import { normalizeArray, parseMaybeJson } from '../helpers'

type FilterProps = {
  label: string
  columns: string
}

const normalizeColumns = (raw: unknown): string[] => {
  const parsed = parseMaybeJson(raw)
  const normalized = normalizeArray<string | { name?: string }>(parsed, [])
  return normalized
    .map((item) => (typeof item === 'string' ? item : item?.name))
    .filter((item): item is string => Boolean(item))
}

export const FilterWidget: WidgetDefinition<FilterProps> = {
  type: 'Filter',
  label: 'Filter',
  category: 'data',
  description: 'Filter controls',
  defaultProps: {
    label: 'Filters',
    columns: '[]',
  },
  fields: [
    { key: 'label', label: 'Label', type: 'text', placeholder: 'Filters' },
    { key: 'columns', label: 'Columns (JSON)', type: 'json', placeholder: '["name","status"]' },
  ],
  render: (props, context) => {
    const columns = normalizeColumns(props.columns)
    const filters = (context?.state?.filters as Record<string, string>) ?? {}

    return (
      <div className="space-y-3 rounded border border-foreground-muted/40 bg-surface-100 p-3">
        <div className="text-xs font-medium text-foreground">{props.label}</div>
        <div className="flex flex-wrap gap-2">
          {columns.length > 0 ? (
            columns.map((column) => (
              <span key={column} className="rounded-full bg-surface-200 px-2 py-1 text-xs text-foreground">
                {column}
              </span>
            ))
          ) : (
            <span className="text-xs text-foreground-muted">No filter columns</span>
          )}
        </div>
        <div className="space-y-2">
          {columns.length > 0 ? (
            columns.map((column) => (
              <div key={column} className="flex items-center gap-2">
                <span className="w-24 text-xs text-foreground-muted">{column}</span>
                <Input
                  placeholder="Value"
                  value={filters[column] ?? ''}
                  onChange={(event) => {
                    context?.setState?.({
                      filters: { ...filters, [column]: event.target.value },
                    })
                  }}
                />
              </div>
            ))
          ) : (
            <Input placeholder="No columns configured" disabled />
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="secondary"
            size="small"
            htmlType="button"
            onClick={() => context?.setState?.({ filters: {} })}
          >
            Clear
          </Button>
          <Button
            type="primary"
            size="small"
            htmlType="button"
            onClick={() => context?.runActions?.('apply', { filters })}
          >
            Apply
          </Button>
        </div>
      </div>
    )
  },
}
