import { useId, useMemo } from 'react'
import { Plus, X } from 'lucide-react'

import {
  Button,
  Input_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  Select_Shadcn_,
  Textarea,
  ToggleGroup,
  ToggleGroupItem,
} from 'ui'
import CodeEditor from 'components/ui/CodeEditor/CodeEditor'
import { useTablesQuery } from 'data/tables/tables-query'

import { normalizeKeyValueItems, type KeyValueItem } from './BuilderResourceKeyValueList'

type BuilderResourceMattrDatabaseProps = {
  config: Record<string, unknown>
  onChange: (config: Record<string, unknown>) => void
  projectRef?: string
  connectionString?: string | null
}

type FilterItem = {
  column: string
  operator: string
  value: string
}

const ACTION_OPTIONS = [
  { value: 'select', label: 'Select' },
  { value: 'insert', label: 'Insert' },
  { value: 'update', label: 'Update' },
  { value: 'delete', label: 'Delete' },
  { value: 'upsert', label: 'Upsert' },
]

const OPERATOR_OPTIONS = ['=', '!=', '>', '>=', '<', '<=']

const normalizeFilterItems = (value: unknown): FilterItem[] => {
  if (!value) {
    return []
  }
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === 'object' && item !== null) {
          const record = item as Record<string, unknown>
          return {
            column: typeof record.column === 'string' ? record.column : '',
            operator: typeof record.operator === 'string' ? record.operator : '=',
            value: typeof record.value === 'string' ? record.value : '',
          }
        }
        return { column: '', operator: '=', value: '' }
      })
      .filter((item) => item.column || item.value)
  }
  if (typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).map(([key, rawValue]) => ({
      column: key,
      operator: '=',
      value: rawValue == null ? '' : String(rawValue),
    }))
  }
  return []
}

export const BuilderResourceMattrDatabase = ({
  config,
  onChange,
  projectRef,
  connectionString,
}: BuilderResourceMattrDatabaseProps) => {
  const editorId = useId()
  const editorMode = config.editorMode === 'gui' ? 'gui' : 'sql'
  const sql = typeof config.query === 'string' ? config.query : ''
  const tableName = typeof config.tableName === 'string' ? config.tableName : ''
  const actionType = typeof config.actionType === 'string' ? config.actionType : ''
  const { data: tables = [], isLoading: isTablesLoading, isError: isTablesError } = useTablesQuery(
    { projectRef, connectionString },
    { enabled: Boolean(projectRef) }
  )
  const tableOptions = useMemo(() => {
    const options = tables.map((table) => {
      const label = table.schema ? `${table.schema}.${table.name}` : table.name
      return { label, value: label }
    })
    const hasTableName = tableName.trim().length > 0
    const hasMatch = options.some((option) => option.value === tableName)
    if (hasTableName && !hasMatch) {
      return [{ label: tableName, value: tableName }, ...options]
    }
    return options
  }, [tableName, tables])
  const filterItems = useMemo(() => normalizeFilterItems(config.filterBy), [config.filterBy])
  const changesetIsObject = Boolean(config.changesetIsObject)
  const changesetObject = typeof config.changesetObject === 'string' ? config.changesetObject : ''
  const changesetPairs = useMemo<KeyValueItem[]>(
    () => normalizeKeyValueItems(config.changeset),
    [config.changeset]
  )

  const handleUpdate = (partial: Record<string, unknown>) => {
    onChange({ ...config, ...partial })
  }

  const visibleFilters =
    filterItems.length === 0 ? [{ column: '', operator: '=', value: '' }] : filterItems

  const handleFilterUpdate = (index: number, field: keyof FilterItem, value: string) => {
    const next = visibleFilters.map((item, idx) =>
      idx === index ? { ...item, [field]: value } : item
    )
    handleUpdate({ filterBy: next })
  }

  const handleFilterRemove = (index: number) => {
    const next = visibleFilters.filter((_, idx) => idx !== index)
    handleUpdate({ filterBy: next.length === 0 ? [] : next })
  }

  const handleFilterAdd = () => {
    handleUpdate({
      filterBy: [...visibleFilters, { column: '', operator: '=', value: '' }],
    })
  }

  const visibleChangesetPairs =
    changesetPairs.length === 0 ? [{ key: '', value: '' }] : changesetPairs

  const handleChangesetUpdate = (index: number, field: 'key' | 'value', value: string) => {
    const next = visibleChangesetPairs.map((item, idx) =>
      idx === index ? { ...item, [field]: value } : item
    )
    handleUpdate({ changeset: next })
  }

  const handleChangesetRemove = (index: number) => {
    const next = visibleChangesetPairs.filter((_, idx) => idx !== index)
    handleUpdate({ changeset: next.length === 0 ? [] : next })
  }

  const handleChangesetAdd = () => {
    handleUpdate({ changeset: [...visibleChangesetPairs, { key: '', value: '' }] })
  }

  return (
    <div className="space-y-4">
      <ToggleGroup
        type="single"
        size="sm"
        value={editorMode}
        onValueChange={(value) => handleUpdate({ editorMode: value || 'sql' })}
        className="w-full justify-start"
      >
        <ToggleGroupItem value="sql" size="sm" className="h-8 flex-1">
          SQL
        </ToggleGroupItem>
        <ToggleGroupItem value="gui" size="sm" className="h-8 flex-1">
          GUI
        </ToggleGroupItem>
      </ToggleGroup>

      {editorMode === 'sql' ? (
        <div className="space-y-2">
          <div className="text-[11px] uppercase text-foreground-muted">SQL</div>
          <div className="relative h-[220px] overflow-hidden rounded-md border border-foreground-muted/30 bg-surface-100">
            <CodeEditor
              id={`mattr-db-sql-${editorId}`}
              language="pgsql"
              value={sql}
              placeholder="SELECT * FROM table;"
              onInputChange={(value) => handleUpdate({ query: value ?? '' })}
              className="h-full"
            />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <div className="text-xs">Table</div>
              <Select_Shadcn_
                value={tableName}
                onValueChange={(value) => handleUpdate({ tableName: value })}
              >
                <SelectTrigger_Shadcn_ className="h-8 text-xs">
                  <SelectValue_Shadcn_ placeholder="Select a table" />
                </SelectTrigger_Shadcn_>
                <SelectContent_Shadcn_>
                  {tableOptions.length === 0 ? (
                    <SelectItem_Shadcn_ value="__empty__" disabled>
                      No tables found
                    </SelectItem_Shadcn_>
                  ) : (
                    tableOptions.map((option) => (
                      <SelectItem_Shadcn_ key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem_Shadcn_>
                    ))
                  )}
                </SelectContent_Shadcn_>
              </Select_Shadcn_>
              {isTablesLoading && (
                <div className="text-[11px] text-foreground-muted">Loading tables...</div>
              )}
              {isTablesError && (
                <div className="text-[11px] text-destructive">Failed to load tables</div>
              )}
            </div>
            <div className="space-y-1">
              <div className="text-xs">Action type</div>
              <Select_Shadcn_ value={actionType} onValueChange={(value) => handleUpdate({ actionType: value })}>
                <SelectTrigger_Shadcn_ className="h-8 text-xs">
                  <SelectValue_Shadcn_ placeholder="Select an action" />
                </SelectTrigger_Shadcn_>
                <SelectContent_Shadcn_>
                  {ACTION_OPTIONS.map((option) => (
                    <SelectItem_Shadcn_ key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem_Shadcn_>
                  ))}
                </SelectContent_Shadcn_>
              </Select_Shadcn_>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-[11px] uppercase text-foreground-muted">Filter by</div>
            <div className="space-y-2">
              {visibleFilters.map((item, index) => (
                <div key={`filter-${index}`} className="grid grid-cols-[1fr_72px_1fr_auto_auto] gap-2">
                  <Input_Shadcn_
                    placeholder="Choose an option"
                    value={item.column}
                    onChange={(event) => handleFilterUpdate(index, 'column', event.target.value)}
                    className="h-8 text-xs"
                  />
                  <Select_Shadcn_
                    value={item.operator}
                    onValueChange={(value) => handleFilterUpdate(index, 'operator', value)}
                  >
                    <SelectTrigger_Shadcn_ className="h-8 text-xs">
                      <SelectValue_Shadcn_ />
                    </SelectTrigger_Shadcn_>
                    <SelectContent_Shadcn_>
                      {OPERATOR_OPTIONS.map((operator) => (
                        <SelectItem_Shadcn_ key={operator} value={operator}>
                          {operator}
                        </SelectItem_Shadcn_>
                      ))}
                    </SelectContent_Shadcn_>
                  </Select_Shadcn_>
                  <Input_Shadcn_
                    placeholder="value"
                    value={item.value}
                    onChange={(event) => handleFilterUpdate(index, 'value', event.target.value)}
                    className="h-8 text-xs"
                  />
                  <Button
                    type="text"
                    size="tiny"
                    icon={<Plus size={12} />}
                    onClick={handleFilterAdd}
                    className="h-8 w-8"
                  />
                  <Button
                    type="text"
                    size="tiny"
                    icon={<X size={12} />}
                    onClick={() => handleFilterRemove(index)}
                    className="h-8 w-8"
                    disabled={visibleFilters.length === 1 && !item.column && !item.value}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-[11px] uppercase text-foreground-muted">Changeset</div>
            <ToggleGroup
              type="single"
              size="sm"
              value={changesetIsObject ? 'object' : 'pairs'}
              onValueChange={(value) =>
                handleUpdate({ changesetIsObject: value === 'object' })
              }
            >
              <ToggleGroupItem value="pairs" size="sm" className="h-8">
                Key value pairs
              </ToggleGroupItem>
              <ToggleGroupItem value="object" size="sm" className="h-8">
                Object
              </ToggleGroupItem>
            </ToggleGroup>

            {changesetIsObject ? (
              <Textarea
                className="min-h-[120px] font-mono text-xs"
                placeholder='{"key": "value"}'
                value={changesetObject}
                onChange={(event) => handleUpdate({ changesetObject: event.target.value })}
              />
            ) : (
              <div className="space-y-2">
                <div className="text-[11px] uppercase text-foreground-muted">Key value pairs</div>
                <div className="space-y-2">
                  {visibleChangesetPairs.map((item, index) => (
                    <div key={`changeset-${index}`} className="grid grid-cols-[1fr_1fr_auto_auto] gap-2">
                      <Input_Shadcn_
                        placeholder="key"
                        value={item.key}
                        onChange={(event) =>
                          handleChangesetUpdate(index, 'key', event.target.value)
                        }
                        className="h-8 text-xs"
                      />
                      <Input_Shadcn_
                        placeholder="value"
                        value={item.value}
                        onChange={(event) =>
                          handleChangesetUpdate(index, 'value', event.target.value)
                        }
                        className="h-8 text-xs"
                      />
                      <Button
                        type="text"
                        size="tiny"
                        icon={<Plus size={12} />}
                        onClick={handleChangesetAdd}
                        className="h-8 w-8"
                      />
                      <Button
                        type="text"
                        size="tiny"
                        icon={<X size={12} />}
                        onClick={() => handleChangesetRemove(index)}
                        className="h-8 w-8"
                        disabled={visibleChangesetPairs.length === 1 && !item.key && !item.value}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
