/**
 * Контрол колонок таблицы: управление Column item-списком и действиями колонок в inspector.
 */
import { useEffect, useMemo, useState } from 'react'
import {
  ArrowUpRight,
  Calendar,
  Check,
  Hash,
  Link2,
  MoreHorizontal,
  Plus,
  RotateCcw,
  Tag,
  Type,
  User,
  X,
  ChevronRight,
} from 'lucide-react'

import type { WidgetField, WidgetFieldOption } from 'widgets/runtime'
import { resolveValue } from 'lib/builder/value-resolver'
import {
  Input_Shadcn_,
  Checkbox_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  Select_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
} from 'ui'

import { FX_BASE_CONTEXT } from '../../../components'
import {
  type InspectorPanel,
  buildTableColumnPanelKey,
  parseTableColumnPanelIndex,
} from '../../model'

type InspectorTableColumn = {
  source: string
  id: string
  label: string
  format: string
  value: string
  editable: boolean
  hidden: boolean
  headerTooltip: string
  cellTooltip: string
  caption: string
  statusIndicator: string
}

const TABLE_COLUMN_FORMAT_OPTIONS: WidgetFieldOption[] = [
  { label: 'String', value: 'String' },
  { label: 'Multiple String', value: 'Multiple String' },
  { label: 'Number', value: 'Number' },
  { label: 'Percent', value: 'Percent' },
  { label: 'Progress', value: 'Progress' },
  { label: 'Currency', value: 'Currency' },
  { label: 'Phone Number', value: 'Phone Number' },
  { label: 'Date', value: 'Date' },
  { label: 'Datetime', value: 'Datetime' },
  { label: 'Time', value: 'Time' },
  { label: 'Boolean', value: 'Boolean' },
  { label: 'Tags', value: 'Tags' },
  { label: 'Tag', value: 'Tag' },
  { label: 'Icon', value: 'Icon' },
  { label: 'Avatar', value: 'Avatar' },
  { label: 'Image', value: 'Image' },
  { label: 'Button', value: 'Button' },
  { label: 'Link', value: 'Link' },
  { label: 'Rating', value: 'Rating' },
  { label: 'JSON', value: 'JSON' },
  { label: 'Bigint', value: 'Bigint' },
  { label: 'Markdown', value: 'Markdown' },
  { label: 'Email', value: 'Email' },
  { label: 'HTML', value: 'HTML' },
]

const createDefaultTableColumn = (index: number, source = ''): InspectorTableColumn => ({
  source,
  id: `column${index + 1}`,
  label: source || `Column ${index + 1}`,
  format: 'String',
  value: '',
  editable: false,
  hidden: false,
  headerTooltip: '',
  cellTooltip: '',
  caption: '',
  statusIndicator: '',
})

const parseTableColumns = (rawValue: unknown): InspectorTableColumn[] => {
  if (Array.isArray(rawValue)) {
    return rawValue
      .map((item, index) => {
        if (!item || typeof item !== 'object' || Array.isArray(item)) {
          return null
        }
        const row = item as Record<string, unknown>
        const source = typeof row.source === 'string' ? row.source : typeof row.key === 'string' ? row.key : ''
        if (!source) {
          return null
        }
        return {
          source,
          id: typeof row.id === 'string' && row.id.trim() ? row.id : `column${index + 1}`,
          label: typeof row.label === 'string' ? row.label : source,
          format: typeof row.format === 'string' && row.format ? row.format : 'String',
          value: typeof row.value === 'string' ? row.value : '',
          editable: Boolean(row.editable),
          hidden: Boolean(row.hidden),
          headerTooltip: typeof row.headerTooltip === 'string' ? row.headerTooltip : '',
          cellTooltip: typeof row.cellTooltip === 'string' ? row.cellTooltip : '',
          caption: typeof row.caption === 'string' ? row.caption : '',
          statusIndicator: typeof row.statusIndicator === 'string' ? row.statusIndicator : '',
        }
      })
      .filter((item): item is InspectorTableColumn => Boolean(item))
  }

  if (typeof rawValue !== 'string') {
    return []
  }
  const trimmed = rawValue.trim()
  if (!trimmed || (trimmed.includes('{{') && trimmed.includes('}}'))) {
    return []
  }
  try {
    const parsed = JSON.parse(trimmed)
    return parseTableColumns(parsed)
  } catch {
    return []
  }
}

export const shouldUseTableColumnsEditor = (field: WidgetField, widgetProps?: Record<string, unknown>) => {
  if (field.type !== 'json') {
    return false
  }
  if (field.control === 'collectionColumns') {
    return true
  }
  if (field.key !== 'columns') {
    return false
  }
  if (!widgetProps) {
    return false
  }
  const widgetTypeRaw = String(widgetProps.pluginType ?? widgetProps.type ?? '').toLowerCase()
  if (widgetTypeRaw.includes('table')) {
    return true
  }
  return 'data' in widgetProps
}

const resolveDataSourceKeys = (
  widgetProps?: Record<string, unknown>,
  evaluationContext?: Record<string, unknown>
) => {
  const rawData = widgetProps?.data
  let candidate: unknown = rawData

  if (typeof rawData === 'string') {
    const trimmed = rawData.trim()
    if (trimmed.includes('{{') && trimmed.includes('}}')) {
      candidate = resolveValue(trimmed, evaluationContext ?? FX_BASE_CONTEXT)
    } else if (trimmed) {
      try {
        candidate = JSON.parse(trimmed)
      } catch {
        candidate = []
      }
    } else {
      candidate = []
    }
  }

  const rows =
    Array.isArray(candidate)
      ? candidate.filter((row) => Boolean(row) && typeof row === 'object')
      : []
  if (rows.length === 0) {
    return [] as string[]
  }

  const keySet = new Set<string>()
  rows.slice(0, 100).forEach((row) => {
    Object.keys(row as Record<string, unknown>).forEach((key) => keySet.add(key))
  })
  return Array.from(keySet)
}

export const TableColumnsFieldControl = ({
  field,
  value,
  onChange,
  disabled = false,
  widgetProps,
  evaluationContext,
  activePanel,
  onPanelChange,
}: {
  field: WidgetField
  value: unknown
  onChange: (patch: Record<string, unknown>) => void
  disabled?: boolean
  widgetProps?: Record<string, unknown>
  evaluationContext?: Record<string, unknown>
  activePanel?: InspectorPanel | null
  onPanelChange?: (panel: InspectorPanel | null) => void
}) => {
  const parsedColumns = useMemo(() => parseTableColumns(value), [value])
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [activeMenuIndex, setActiveMenuIndex] = useState<number | null>(null)
  const [isTableDialogOpen, setIsTableDialogOpen] = useState(false)
  const inspectorPanelIndex = parseTableColumnPanelIndex(activePanel?.key)
  const dataKeys = useMemo(
    () => resolveDataSourceKeys(widgetProps, evaluationContext),
    [evaluationContext, widgetProps]
  )
  const widgetId = typeof widgetProps?.id === 'string' ? widgetProps.id : 'table'
  const isPanelControlled = Boolean(onPanelChange)
  const selectedColumnIndex =
    isPanelControlled
      ? inspectorPanelIndex !== null && parsedColumns[inspectorPanelIndex]
        ? inspectorPanelIndex
        : null
      : selectedIndex !== null && parsedColumns[selectedIndex]
        ? selectedIndex
        : null

  useEffect(() => {
    if (parsedColumns.length === 0) {
      setSelectedIndex(null)
      return
    }
    if (selectedIndex !== null && selectedIndex >= parsedColumns.length) {
      setSelectedIndex(parsedColumns.length - 1)
    }
  }, [parsedColumns.length, selectedIndex])

  useEffect(() => {
    if (inspectorPanelIndex === null) {
      return
    }
    if (inspectorPanelIndex >= parsedColumns.length) {
      onPanelChange?.(null)
    }
  }, [inspectorPanelIndex, onPanelChange, parsedColumns.length])

  const formatIcon = (format: string) => {
    switch (format) {
      case 'Number':
      case 'Percent':
      case 'Currency':
      case 'Bigint':
        return <Hash size={14} className="text-foreground-muted" />
      case 'Avatar':
        return <User size={14} className="text-foreground-muted" />
      case 'Tag':
      case 'Tags':
        return <Tag size={14} className="text-foreground-muted" />
      case 'Boolean':
        return <Check size={14} className="text-foreground-muted" />
      case 'Date':
      case 'Datetime':
      case 'Time':
        return <Calendar size={14} className="text-foreground-muted" />
      case 'Link':
      case 'Email':
      case 'Phone Number':
        return <Link2 size={14} className="text-foreground-muted" />
      case 'Markdown':
      case 'HTML':
      case 'Multiple String':
      case 'String':
      default:
        return <Type size={14} className="text-foreground-muted" />
    }
  }

  const commit = (nextColumns: InspectorTableColumn[]) => {
    onChange({ [field.key]: JSON.stringify(nextColumns, null, 2) })
  }

  const updateColumn = (index: number, patch: Partial<InspectorTableColumn>) => {
    const next = parsedColumns.map((column, currentIndex) =>
      currentIndex === index ? { ...column, ...patch } : column
    )
    commit(next)
  }

  const removeColumn = (index: number) => {
    const next = parsedColumns.filter((_, currentIndex) => currentIndex !== index)
    commit(next)
    if (inspectorPanelIndex !== null && inspectorPanelIndex === index) {
      onPanelChange?.(null)
    }
  }

  const addColumn = () => {
    const fallbackSource =
      dataKeys.find((key) => !parsedColumns.some((column) => column.source === key)) ?? dataKeys[0] ?? ''
    const next = [...parsedColumns, createDefaultTableColumn(parsedColumns.length, fallbackSource)]
    commit(next)
    setSelectedIndex(next.length - 1)
  }

  const selectedColumn =
    selectedColumnIndex !== null && parsedColumns[selectedColumnIndex]
      ? parsedColumns[selectedColumnIndex]
      : null

  const resolveColumnPanelLabel = (
    column: InspectorTableColumn | undefined,
    index: number
  ) => column?.label || column?.id || `Column ${index + 1}`

  const openColumnPanel = (index: number) => {
    const column = parsedColumns[index]
    setSelectedIndex(index)
    onPanelChange?.({
      key: buildTableColumnPanelKey(index),
      label: resolveColumnPanelLabel(column, index),
    })
  }

  const closeColumnPanel = () => {
    setSelectedIndex(null)
    setActiveMenuIndex(null)
    if (inspectorPanelIndex !== null) {
      onPanelChange?.(null)
    }
  }

  useEffect(() => {
    if (!onPanelChange) {
      return
    }
    if (inspectorPanelIndex === null) {
      return
    }
    const column = parsedColumns[inspectorPanelIndex]
    if (!column) {
      return
    }
    const nextLabel = resolveColumnPanelLabel(column, inspectorPanelIndex)
    if (activePanel?.label === nextLabel) {
      return
    }
    onPanelChange?.({
      key: buildTableColumnPanelKey(inspectorPanelIndex),
      label: nextLabel,
    })
  }, [activePanel?.label, inspectorPanelIndex, onPanelChange, parsedColumns])

  const makeAllEditable = () => {
    const next = parsedColumns.map((column) => ({ ...column, editable: true }))
    commit(next)
  }

  const clearColumns = () => {
    commit([])
    setSelectedIndex(null)
    onPanelChange?.(null)
  }

  const regenerateFromData = () => {
    if (dataKeys.length === 0) {
      return
    }
    const next = dataKeys.map((key, index) => {
      const existing = parsedColumns.find((column) => column.source === key)
      return existing ?? createDefaultTableColumn(index, key)
    })
    commit(next)
    setSelectedIndex(next.length > 0 ? 0 : null)
  }

  return (
    <div className="space-y-2">
      {selectedColumn ? (
        <div className="space-y-3 rounded-md border border-foreground-muted/20 p-3">
          <div className="flex items-center justify-between">
            <button
              type="button"
              className="flex min-w-0 items-center gap-2 text-left text-[13px] font-semibold text-foreground"
              onClick={closeColumnPanel}
            >
              <ChevronRight size={14} className="rotate-180 text-foreground-muted" />
              <span className="truncate">{widgetId} › {selectedColumn.label || selectedColumn.id}</span>
            </button>
            <div className="flex items-center gap-1">
              <Popover_Shadcn_>
                <PopoverTrigger_Shadcn_ asChild>
                  <button
                    type="button"
                    className="rounded p-1 text-foreground-muted hover:bg-surface-200 hover:text-foreground"
                    aria-label="Column actions"
                  >
                    <MoreHorizontal size={14} />
                  </button>
                </PopoverTrigger_Shadcn_>
                <PopoverContent_Shadcn_ className="w-44 p-1" align="end">
                  <button
                    type="button"
                    className="flex w-full rounded-sm px-2 py-1 text-xs text-foreground hover:bg-surface-200 disabled:opacity-50"
                    onClick={() =>
                      updateColumn(selectedColumnIndex as number, { editable: true })
                    }
                    disabled={selectedColumn.editable}
                  >
                    Make editable
                  </button>
                  <button
                    type="button"
                    className="flex w-full rounded-sm px-2 py-1 text-xs text-foreground hover:bg-surface-200"
                    onClick={() =>
                      updateColumn(selectedColumnIndex as number, {
                        hidden: !selectedColumn.hidden,
                      })
                    }
                  >
                    {selectedColumn.hidden ? 'Unhide column' : 'Hide column'}
                  </button>
                </PopoverContent_Shadcn_>
              </Popover_Shadcn_>
              <button
                type="button"
                className="rounded p-1 text-foreground-muted hover:bg-surface-200 hover:text-foreground"
                onClick={closeColumnPanel}
                aria-label="Close column panel"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-[12px] font-semibold text-foreground">Content</div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <div className="text-[11px] text-foreground-muted">Source</div>
                <Select_Shadcn_
                  value={selectedColumn.source || '__empty__'}
                  onValueChange={(next) =>
                    updateColumn(selectedColumnIndex as number, { source: next === '__empty__' ? '' : next })
                  }
                  disabled={disabled}
                >
                  <SelectTrigger_Shadcn_ className="h-7 w-full">
                    <SelectValue_Shadcn_ placeholder="Select source" />
                  </SelectTrigger_Shadcn_>
                  <SelectContent_Shadcn_>
                    {dataKeys.length === 0 ? (
                      <SelectItem_Shadcn_ value="__empty__">No keys</SelectItem_Shadcn_>
                    ) : (
                      dataKeys.map((key) => (
                        <SelectItem_Shadcn_ key={key} value={key}>
                          {key}
                        </SelectItem_Shadcn_>
                      ))
                    )}
                  </SelectContent_Shadcn_>
                </Select_Shadcn_>
              </div>

              <div className="space-y-1">
                <div className="text-[11px] text-foreground-muted">ID</div>
                <Input_Shadcn_
                  value={selectedColumn.id}
                  onChange={(event) => updateColumn(selectedColumnIndex as number, { id: event.target.value })}
                  className="h-7"
                  placeholder={`column${(selectedColumnIndex ?? 0) + 1}`}
                  disabled={disabled}
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-[11px] text-foreground-muted">Label</div>
              <Input_Shadcn_
                value={selectedColumn.label}
                onChange={(event) => updateColumn(selectedColumnIndex as number, { label: event.target.value })}
                className="h-7"
                placeholder="Column label"
                disabled={disabled}
              />
            </div>

            <div className="space-y-1">
              <div className="text-[11px] text-foreground-muted">Format</div>
              <Select_Shadcn_
                value={selectedColumn.format || 'String'}
                onValueChange={(next) => updateColumn(selectedColumnIndex as number, { format: next })}
                disabled={disabled}
              >
                <SelectTrigger_Shadcn_ className="h-7 w-full">
                  <SelectValue_Shadcn_ placeholder="Format" />
                </SelectTrigger_Shadcn_>
                <SelectContent_Shadcn_>
                  {TABLE_COLUMN_FORMAT_OPTIONS.map((option) => (
                    <SelectItem_Shadcn_ key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem_Shadcn_>
                  ))}
                </SelectContent_Shadcn_>
              </Select_Shadcn_>
            </div>

            <div className="space-y-1">
              <div className="text-[11px] text-foreground-muted">Mapped value</div>
              <Input_Shadcn_
                value={selectedColumn.value}
                onChange={(event) => updateColumn(selectedColumnIndex as number, { value: event.target.value })}
                className="h-7"
                placeholder="{{ currentSourceRow.field }}"
                disabled={disabled}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-[12px] font-semibold text-foreground">Add-ons</div>
              <span className="text-foreground-muted">
                <Plus size={14} />
              </span>
            </div>

            <div className="space-y-2 rounded-md border border-foreground-muted/20 p-2">
              <div className="space-y-1">
                <div className="text-[11px] text-foreground-muted">Header tooltip</div>
                <Input_Shadcn_
                  value={selectedColumn.headerTooltip}
                  onChange={(event) =>
                    updateColumn(selectedColumnIndex as number, { headerTooltip: event.target.value })
                  }
                  className="h-7"
                  placeholder="{{ currentSourceRow.field }}"
                  disabled={disabled}
                />
              </div>
              <div className="space-y-1">
                <div className="text-[11px] text-foreground-muted">Cell tooltip</div>
                <Input_Shadcn_
                  value={selectedColumn.cellTooltip}
                  onChange={(event) =>
                    updateColumn(selectedColumnIndex as number, { cellTooltip: event.target.value })
                  }
                  className="h-7"
                  placeholder="{{ currentSourceRow.field }}"
                  disabled={disabled}
                />
              </div>
              <div className="space-y-1">
                <div className="text-[11px] text-foreground-muted">Caption</div>
                <Input_Shadcn_
                  value={selectedColumn.caption}
                  onChange={(event) => updateColumn(selectedColumnIndex as number, { caption: event.target.value })}
                  className="h-7"
                  placeholder="{{ currentSourceRow.field }}"
                  disabled={disabled}
                />
              </div>
              <div className="space-y-1">
                <div className="text-[11px] text-foreground-muted">Status indicator</div>
                <Input_Shadcn_
                  value={selectedColumn.statusIndicator}
                  onChange={(event) =>
                    updateColumn(selectedColumnIndex as number, { statusIndicator: event.target.value })
                  }
                  className="h-7"
                  placeholder="{{ currentSourceRow.enabled }}"
                  disabled={disabled}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <label className="flex items-center gap-2 text-[12px] text-foreground">
              <Checkbox_Shadcn_
                checked={selectedColumn.editable}
                onCheckedChange={(checked) =>
                  updateColumn(selectedColumnIndex as number, { editable: Boolean(checked) })
                }
              />
              Editable
            </label>
            <label className="flex items-center gap-2 text-[12px] text-foreground">
              <Checkbox_Shadcn_
                checked={selectedColumn.hidden}
                onCheckedChange={(checked) =>
                  updateColumn(selectedColumnIndex as number, { hidden: Boolean(checked) })
                }
              />
              Hidden
            </label>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div className="text-[12px] font-medium text-foreground">Columns</div>
            <div className="flex items-center gap-1">
              <Popover_Shadcn_>
                <PopoverTrigger_Shadcn_ asChild>
                  <button
                    type="button"
                    className="rounded p-1 text-foreground-muted hover:bg-surface-200 hover:text-foreground disabled:opacity-50"
                    disabled={disabled}
                    aria-label="Columns actions"
                  >
                    <MoreHorizontal size={14} />
                  </button>
                </PopoverTrigger_Shadcn_>
                <PopoverContent_Shadcn_ className="w-56 p-1" align="end">
                  <button
                    type="button"
                    className="flex w-full rounded-sm px-2 py-1 text-xs text-foreground hover:bg-surface-200"
                    onClick={makeAllEditable}
                  >
                    Make all columns editable
                  </button>
                  <button
                    type="button"
                    className="flex w-full rounded-sm px-2 py-1 text-xs text-red-500 hover:bg-red-500/10"
                    onClick={clearColumns}
                  >
                    Clear columns
                  </button>
                </PopoverContent_Shadcn_>
              </Popover_Shadcn_>

              <button
                type="button"
                className="rounded p-1 text-foreground-muted hover:bg-surface-200 hover:text-foreground disabled:opacity-50"
                onClick={() => setIsTableDialogOpen(true)}
                disabled={disabled}
                aria-label="Open edit columns table"
              >
                <ArrowUpRight size={14} />
              </button>

              <button
                type="button"
                className="rounded p-1 text-foreground-muted hover:bg-surface-200 hover:text-foreground disabled:opacity-50"
                onClick={regenerateFromData}
                disabled={disabled}
                aria-label="Regenerate columns from data"
              >
                <RotateCcw size={14} />
              </button>

              <button
                type="button"
                className="rounded p-1 text-foreground-muted hover:bg-surface-200 hover:text-foreground disabled:opacity-50"
                onClick={addColumn}
                disabled={disabled}
                aria-label="Add column"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          {parsedColumns.length === 0 ? (
            <div className="rounded-md border border-dashed border-foreground-muted/30 px-2 py-2 text-xs text-foreground-muted">
              No columns configured.
            </div>
          ) : (
            <div className="rounded-md border border-foreground-muted/20 bg-background p-1">
              {parsedColumns.map((column, index) => (
                <div
                  key={`${column.id}:${index}`}
                  className={[
                    'group flex min-h-8 items-center gap-2 rounded px-2 py-1',
                    selectedColumnIndex === index ? 'bg-brand-500/10' : 'hover:bg-surface-100',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  <button
                    type="button"
                    className="flex min-w-0 flex-1 items-center gap-2 text-left"
                    onClick={() => openColumnPanel(index)}
                  >
                    {formatIcon(column.format)}
                    <span className={column.hidden ? 'text-foreground-muted line-through' : 'text-foreground'}>
                      {column.label || column.id || `Column ${index + 1}`}
                    </span>
                  </button>
                  <Popover_Shadcn_
                    open={activeMenuIndex === index}
                    onOpenChange={(open) => setActiveMenuIndex(open ? index : null)}
                  >
                    <PopoverTrigger_Shadcn_ asChild>
                      <button
                        type="button"
                        className="rounded p-1 text-foreground-muted transition-opacity hover:bg-surface-200 hover:text-foreground disabled:opacity-50 md:opacity-0 md:group-hover:opacity-100"
                        disabled={disabled}
                        aria-label="Column row actions"
                      >
                        <MoreHorizontal size={14} />
                      </button>
                    </PopoverTrigger_Shadcn_>
                    <PopoverContent_Shadcn_ className="w-44 p-1" align="end">
                      <button
                        type="button"
                        className="flex w-full rounded-sm px-2 py-1 text-xs text-foreground hover:bg-surface-200 disabled:opacity-50"
                        onClick={() => {
                          updateColumn(index, { editable: true })
                          setActiveMenuIndex(null)
                        }}
                        disabled={column.editable}
                      >
                        Make editable
                      </button>
                      <button
                        type="button"
                        className="flex w-full rounded-sm px-2 py-1 text-xs text-foreground hover:bg-surface-200"
                        onClick={() => {
                          updateColumn(index, { hidden: !column.hidden })
                          setActiveMenuIndex(null)
                        }}
                      >
                        {column.hidden ? 'Unhide column' : 'Hide column'}
                      </button>
                    </PopoverContent_Shadcn_>
                  </Popover_Shadcn_>
                  <button
                    type="button"
                    className="rounded p-1 text-foreground-muted transition-opacity hover:bg-surface-200 hover:text-foreground disabled:opacity-50 md:opacity-0 md:group-hover:opacity-100"
                    onClick={() => removeColumn(index)}
                    disabled={disabled}
                    aria-label="Delete column"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {dataKeys.length === 0 ? (
        <div className="text-[11px] text-foreground-muted">
          Add valid array data first to get `Source` suggestions.
        </div>
      ) : null}

      <Dialog open={isTableDialogOpen} onOpenChange={setIsTableDialogOpen}>
        <DialogContent size="large" className="max-w-4xl p-0">
          <DialogHeader className="border-b" padding="small">
            <DialogTitle>{widgetId} / Edit Columns</DialogTitle>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-background">
                <tr className="border-b">
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Format</th>
                  <th className="px-4 py-3 font-semibold">Editable</th>
                  <th className="px-4 py-3 font-semibold">Hidden</th>
                </tr>
              </thead>
              <tbody>
                {parsedColumns.map((column, index) => (
                  <tr key={`${column.id}:table:${index}`} className="border-b">
                    <td className="px-4 py-3">{column.label || column.id || `Column ${index + 1}`}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs">
                        {formatIcon(column.format)}
                        {column.format || 'String'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Checkbox_Shadcn_
                        checked={column.editable}
                        onCheckedChange={(checked) => updateColumn(index, { editable: Boolean(checked) })}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Checkbox_Shadcn_
                        checked={column.hidden}
                        onCheckedChange={(checked) => updateColumn(index, { hidden: Boolean(checked) })}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <DialogFooter padding="small">
            <button
              type="button"
              className="rounded bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
              onClick={() => setIsTableDialogOpen(false)}
            >
              Done
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
