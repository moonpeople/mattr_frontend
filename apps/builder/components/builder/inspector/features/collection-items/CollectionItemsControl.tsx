/**
 * Контрол элементов коллекции: управление списками item-объектов в inspector.
 */
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { ChevronUp, Copy, MoreHorizontal, Plus } from 'lucide-react'

import type { WidgetField, WidgetFieldOption } from 'widgets/runtime'
import { resolveValue } from 'lib/builder/value-resolver'
import {
  Input_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
} from 'ui'

import { FX_BASE_CONTEXT } from '../../../components'
import { SegmentedRadioGroup } from '../../shared'

type InspectorOptionNode = {
  label: string
  value: string
  caption?: string
  color?: string
  prefixImage?: string
  prefixIcon?: string
  prefixText?: string
  tooltip?: string
  disabled?: boolean | string
  hidden?: boolean | string
  parentValue?: string
  children?: InspectorOptionNode[]
  [key: string]: unknown
}

const OPTION_MODE_OPTIONS: WidgetFieldOption[] = [
  { label: 'Manual', value: 'static' },
  { label: 'Mapped', value: 'dynamic' },
]

const optionPathKey = (path: number[]) => path.join('.')

const cloneOptionNodes = (nodes: InspectorOptionNode[]): InspectorOptionNode[] =>
  nodes.map((node) => ({
    ...node,
    children: Array.isArray(node.children) ? cloneOptionNodes(node.children) : undefined,
  }))

const createDefaultOptionNode = (
  index: number,
  {
    labelPrefix = 'Option',
    valuePrefix = 'option',
  }: {
    labelPrefix?: string
    valuePrefix?: string
  } = {}
): InspectorOptionNode => ({
  label: `${labelPrefix} ${index + 1}`,
  value: `${valuePrefix}_${index + 1}`,
})

const normalizeOptionNode = (input: unknown, index: number): InspectorOptionNode | null => {
  if (typeof input === 'string' || typeof input === 'number' || typeof input === 'boolean') {
    const primitive = String(input)
    return { label: primitive, value: primitive }
  }
  if (!input || typeof input !== 'object') {
    return null
  }
  const raw = input as Record<string, unknown>
  const label = typeof raw.label === 'string' && raw.label.trim().length > 0 ? raw.label : ''
  const value = typeof raw.value === 'string' && raw.value.trim().length > 0 ? raw.value : ''
  const fallback = createDefaultOptionNode(index)
  const children = Array.isArray(raw.children)
    ? raw.children
        .map((child, childIndex) => normalizeOptionNode(child, childIndex))
        .filter((item): item is InspectorOptionNode => Boolean(item))
    : []
  return {
    ...raw,
    label: label || value || fallback.label,
    value: value || label || fallback.value,
    children: children.length > 0 ? children : undefined,
  }
}

const parseManualOptions = (rawValue: unknown): InspectorOptionNode[] => {
  if (Array.isArray(rawValue)) {
    return rawValue
      .map((item, index) => normalizeOptionNode(item, index))
      .filter((item): item is InspectorOptionNode => Boolean(item))
  }
  if (typeof rawValue !== 'string') {
    return []
  }
  const trimmed = rawValue.trim()
  if (!trimmed) {
    return []
  }
  try {
    const parsed = JSON.parse(trimmed)
    if (!Array.isArray(parsed)) {
      return []
    }
    return parsed
      .map((item, index) => normalizeOptionNode(item, index))
      .filter((item): item is InspectorOptionNode => Boolean(item))
  } catch {
    return []
  }
}

const getOptionNodeByPath = (nodes: InspectorOptionNode[], path: number[]) => {
  if (path.length === 0) {
    return null
  }
  let list = nodes
  let node: InspectorOptionNode | null = null
  for (let depth = 0; depth < path.length; depth += 1) {
    node = list[path[depth]] ?? null
    if (!node) {
      return null
    }
    if (depth < path.length - 1) {
      list = Array.isArray(node.children) ? node.children : []
    }
  }
  return node
}

const updateOptionNodeByPath = (
  nodes: InspectorOptionNode[],
  path: number[],
  updater: (node: InspectorOptionNode) => InspectorOptionNode
) => {
  const next = cloneOptionNodes(nodes)
  if (path.length === 0) {
    return next
  }
  let list = next
  for (let depth = 0; depth < path.length - 1; depth += 1) {
    const node = list[path[depth]]
    if (!node) {
      return next
    }
    if (!Array.isArray(node.children)) {
      node.children = []
    }
    list = node.children
  }
  const index = path[path.length - 1]
  const node = list[index]
  if (!node) {
    return next
  }
  list[index] = updater(node)
  return next
}

const addRootOptionNode = (
  nodes: InspectorOptionNode[],
  defaults?: {
    labelPrefix?: string
    valuePrefix?: string
  }
) => {
  const next = cloneOptionNodes(nodes)
  next.push(createDefaultOptionNode(next.length, defaults))
  return next
}

const addChildOptionNode = (
  nodes: InspectorOptionNode[],
  path: number[],
  defaults?: {
    labelPrefix?: string
    valuePrefix?: string
  }
) => {
  const next = cloneOptionNodes(nodes)
  const node = getOptionNodeByPath(next, path)
  if (!node) {
    return next
  }
  if (!Array.isArray(node.children)) {
    node.children = []
  }
  node.children.push(createDefaultOptionNode(node.children.length, defaults))
  return next
}

const duplicateOptionNode = (nodes: InspectorOptionNode[], path: number[]) => {
  const next = cloneOptionNodes(nodes)
  if (path.length === 0) {
    return next
  }
  let list = next
  for (let depth = 0; depth < path.length - 1; depth += 1) {
    const node = list[path[depth]]
    if (!node || !Array.isArray(node.children)) {
      return next
    }
    list = node.children
  }
  const index = path[path.length - 1]
  const node = list[index]
  if (!node) {
    return next
  }
  const duplicate = JSON.parse(JSON.stringify(node)) as InspectorOptionNode
  list.splice(index + 1, 0, duplicate)
  return next
}

const removeOptionNode = (nodes: InspectorOptionNode[], path: number[]) => {
  const next = cloneOptionNodes(nodes)
  if (path.length === 0) {
    return next
  }
  let list = next
  for (let depth = 0; depth < path.length - 1; depth += 1) {
    const node = list[path[depth]]
    if (!node || !Array.isArray(node.children)) {
      return next
    }
    list = node.children
  }
  list.splice(path[path.length - 1], 1)
  return next
}

const stripOptionChildren = (nodes: InspectorOptionNode[]): InspectorOptionNode[] =>
  nodes.map((node) => {
    const { children: _children, ...rest } = node
    return { ...rest }
  })

export const shouldUseCollectionItemsEditor = (
  field: WidgetField,
  widgetProps?: Record<string, unknown>
) => {
  if (field.type !== 'json') {
    return false
  }
  if (field.control === 'collectionItems') {
    return true
  }
  if (field.key !== 'options' && field.key !== 'items') {
    return false
  }
  if (!widgetProps) {
    return false
  }
  return (
    'itemsMode' in widgetProps ||
    'itemsData' in widgetProps ||
    'itemLabelKey' in widgetProps ||
    'itemValueKey' in widgetProps ||
    'optionsMode' in widgetProps ||
    'optionsData' in widgetProps ||
    'optionLabelKey' in widgetProps ||
    'optionValueKey' in widgetProps
  )
}
export const CollectionItemsFieldControl = ({
  field,
  value,
  onChange,
  disabled = false,
  widgetProps,
  evaluationContext,
}: {
  field: WidgetField
  value: unknown
  onChange: (patch: Record<string, unknown>) => void
  disabled?: boolean
  widgetProps?: Record<string, unknown>
  evaluationContext?: Record<string, unknown>
}) => {
  const widgetTypeRaw = String(widgetProps?.pluginType ?? widgetProps?.type ?? '').toLowerCase()
  const supportsNestedItems =
    widgetTypeRaw.includes('cascader') || widgetTypeRaw.includes('checkboxtree')
  const useItemKeys =
    field.key === 'items' ||
    field.control === 'collectionItems' ||
    Boolean(
      widgetProps &&
        ('itemsMode' in widgetProps ||
          'itemsData' in widgetProps ||
          'itemLabelKey' in widgetProps ||
          'itemValueKey' in widgetProps)
    )
  const modeKey = useItemKeys ? 'itemsMode' : 'optionsMode'
  const dataKey = useItemKeys ? 'itemsData' : 'optionsData'
  const valueKey = useItemKeys ? 'itemValueKey' : 'optionValueKey'
  const labelKey = useItemKeys ? 'itemLabelKey' : 'optionLabelKey'
  const descriptionKey = useItemKeys ? 'itemDescriptionKey' : 'optionDescriptionKey'
  const colorKey = useItemKeys ? 'itemColorKey' : 'optionColorKey'
  const prefixImageKey = useItemKeys ? 'itemPrefixImageKey' : 'optionPrefixImageKey'
  const prefixIconKey = useItemKeys ? 'itemPrefixIconKey' : 'optionPrefixIconKey'
  const prefixTextKey = useItemKeys ? 'itemPrefixTextKey' : 'optionPrefixTextKey'
  const tooltipKey = useItemKeys ? 'itemTooltipKey' : 'optionTooltipKey'
  const disabledKey = useItemKeys ? 'itemDisabledKey' : 'optionDisabledKey'
  const hiddenKey = useItemKeys ? 'itemHiddenKey' : 'optionHiddenKey'
  const parentValueKey = useItemKeys ? 'itemParentValueKey' : 'optionParentValueKey'
  const childrenKey = useItemKeys ? 'itemChildrenKey' : 'optionChildrenKey'
  const collectionPluralLabel = useItemKeys ? 'Items' : 'Options'
  const collectionSingularLabel = useItemKeys ? 'Item' : 'Option'
  const defaultNodeConfig = {
    labelPrefix: collectionSingularLabel,
    valuePrefix: useItemKeys ? 'item' : 'option',
  }
  const mode = widgetProps?.[modeKey] === 'dynamic' ? 'dynamic' : 'static'
  const collectionValueRaw =
    typeof value === 'undefined'
      ? useItemKeys
        ? widgetProps?.items ?? widgetProps?.options
        : widgetProps?.options ?? widgetProps?.items
      : value
  const parsedOptions = useMemo(() => {
    const parsed = parseManualOptions(collectionValueRaw)
    return supportsNestedItems ? parsed : stripOptionChildren(parsed)
  }, [collectionValueRaw, supportsNestedItems])
  const [selectedPath, setSelectedPath] = useState<number[] | null>(null)
  const [menuPath, setMenuPath] = useState<string | null>(null)
  const [editPath, setEditPath] = useState<number[] | null>(null)

  const commitOptions = (nodes: InspectorOptionNode[]) => {
    const normalized = supportsNestedItems ? nodes : stripOptionChildren(nodes)
    onChange({ [field.key]: JSON.stringify(normalized, null, 2) })
  }

  const selectedNode = useMemo(
    () => (selectedPath ? getOptionNodeByPath(parsedOptions, selectedPath) : null),
    [parsedOptions, selectedPath]
  )
  const editNode = useMemo(
    () => (editPath ? getOptionNodeByPath(parsedOptions, editPath) : null),
    [parsedOptions, editPath]
  )

  useEffect(() => {
    if (!selectedPath) {
      return
    }
    if (!getOptionNodeByPath(parsedOptions, selectedPath)) {
      setSelectedPath(null)
    }
  }, [parsedOptions, selectedPath])

  useEffect(() => {
    if (!editPath) {
      return
    }
    if (!getOptionNodeByPath(parsedOptions, editPath)) {
      setEditPath(null)
    }
  }, [parsedOptions, editPath])

  const editFields = [
    { key: 'value', label: 'Value', placeholder: '' },
    { key: 'label', label: 'Label', placeholder: '' },
    { key: 'caption', label: 'Caption', placeholder: '' },
    { key: 'color', label: 'Color', placeholder: '' },
    { key: 'prefixImage', label: 'Prefix image', placeholder: '' },
    { key: 'prefixIcon', label: 'Prefix icon', placeholder: 'Select an icon' },
    { key: 'prefixText', label: 'Prefix text', placeholder: '' },
    { key: 'tooltip', label: 'Tooltip', placeholder: '' },
    { key: 'disabled', label: 'Disabled', placeholder: 'false' },
    { key: 'hidden', label: 'Hidden', placeholder: 'false' },
  ] as const

  const renderNode = (node: InspectorOptionNode, path: number[], depth: number): ReactNode => {
    const rowKey = optionPathKey(path)
    const isSelected = selectedPath ? optionPathKey(selectedPath) === rowKey : false
    const isEditOpen = editPath ? optionPathKey(editPath) === rowKey : false
    const label =
      typeof node.label === 'string' && node.label.trim().length > 0 ? node.label : node.value
    const children = Array.isArray(node.children) ? node.children : []
    const rowNode = isEditOpen ? editNode : node

    return (
      <div key={rowKey}>
        <div
          className={`group flex min-h-8 items-center gap-2 rounded px-2 ${
            isSelected ? 'bg-brand-500/10' : 'hover:bg-surface-200'
          }`}
          style={{ marginLeft: depth * 18 }}
        >
          {depth > 0 ? <span className="text-foreground-muted">└</span> : <span className="w-3" />}
          <Popover_Shadcn_
            open={isEditOpen}
            onOpenChange={(open) => {
              if (!open && isEditOpen) {
                setEditPath(null)
              }
            }}
          >
            <PopoverTrigger_Shadcn_ asChild>
              <button
                type="button"
                className="min-w-0 flex-1 truncate text-left text-[12px] text-foreground"
                disabled={disabled}
                onClick={() => {
                  setSelectedPath(path)
                  setEditPath(path)
                }}
              >
                {label || collectionSingularLabel}
              </button>
            </PopoverTrigger_Shadcn_>
            <PopoverContent_Shadcn_
              className="w-[440px] max-w-[calc(100vw-32px)] p-3"
              align="start"
              side="right"
              sideOffset={8}
            >
              <div className="mb-2 text-[13px] font-medium text-foreground">
                {`Edit ${collectionSingularLabel.toLowerCase()}`}
              </div>
              <div className="space-y-2">
                {editFields.map((item) => (
                  <div key={item.key} className="flex items-center gap-2">
                    <div className="w-24 text-[12px] text-foreground">{item.label}</div>
                    <Input_Shadcn_
                      value={
                        rowNode && typeof rowNode[item.key] !== 'undefined'
                          ? String(rowNode[item.key] ?? '')
                          : ''
                      }
                      onChange={(event) => {
                        const next = updateOptionNodeByPath(parsedOptions, path, (current) => ({
                          ...current,
                          [item.key]: event.target.value,
                        }))
                        commitOptions(next)
                      }}
                      placeholder={item.placeholder}
                      className="h-8"
                      disabled={disabled}
                    />
                  </div>
                ))}
              </div>
            </PopoverContent_Shadcn_>
          </Popover_Shadcn_>
          {!disabled && (
            <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
              <Popover_Shadcn_
                open={menuPath === rowKey}
                onOpenChange={(open) => setMenuPath(open ? rowKey : null)}
              >
                <PopoverTrigger_Shadcn_ asChild>
                  <button
                    type="button"
                    className="rounded p-1 text-foreground-muted hover:bg-surface-300 hover:text-foreground"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <MoreHorizontal size={12} />
                  </button>
                </PopoverTrigger_Shadcn_>
                <PopoverContent_Shadcn_ className="w-32 p-1" align="end">
                  <button
                    type="button"
                    className="flex w-full rounded-sm px-2 py-1 text-xs text-foreground hover:bg-surface-200"
                    onClick={() => {
                      commitOptions(duplicateOptionNode(parsedOptions, path))
                      setMenuPath(null)
                    }}
                  >
                    Duplicate
                  </button>
                  <button
                    type="button"
                    className="flex w-full rounded-sm px-2 py-1 text-xs text-red-500 hover:bg-red-500/10"
                    onClick={() => {
                      commitOptions(removeOptionNode(parsedOptions, path))
                      setMenuPath(null)
                    }}
                  >
                    Delete
                  </button>
                </PopoverContent_Shadcn_>
              </Popover_Shadcn_>
              {supportsNestedItems ? (
                <button
                  type="button"
                  className="rounded p-1 text-foreground-muted hover:bg-surface-300 hover:text-foreground"
                  onClick={(event) => {
                    event.stopPropagation()
                    const next = addChildOptionNode(parsedOptions, path, defaultNodeConfig)
                    const nextPath = [...path, children.length]
                    commitOptions(next)
                    setSelectedPath(nextPath)
                    setEditPath(nextPath)
                  }}
                >
                  <Plus size={12} />
                </button>
              ) : null}
            </div>
          )}
        </div>
        {children.map((child, index) => renderNode(child, [...path, index], depth + 1))}
      </div>
    )
  }

  const dataSourceRaw = typeof widgetProps?.[dataKey] === 'string' ? String(widgetProps[dataKey]) : ''
  const evaluatedData =
    mode === 'dynamic' && dataSourceRaw.trim()
      ? resolveValue(dataSourceRaw, evaluationContext ?? FX_BASE_CONTEXT)
      : undefined
  const isDynamicSourceEmpty = Array.isArray(evaluatedData) && evaluatedData.length === 0

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="w-12 text-[12px] text-foreground">Mode</div>
        <div className="w-48">
          <SegmentedRadioGroup
            options={OPTION_MODE_OPTIONS}
            value={mode}
            onValueChange={(nextMode) => {
              if (nextMode === mode) {
                return
              }
              if (nextMode === 'dynamic') {
                onChange({
                  [modeKey]: 'dynamic',
                  [dataKey]:
                    typeof widgetProps?.[dataKey] === 'string' ? String(widgetProps[dataKey]) : '',
                  [valueKey]:
                    typeof widgetProps?.[valueKey] === 'string' &&
                    String(widgetProps[valueKey]).trim()
                      ? String(widgetProps[valueKey])
                      : '{{ item }}',
                  [labelKey]:
                    typeof widgetProps?.[labelKey] === 'string' &&
                    String(widgetProps[labelKey]).trim()
                      ? String(widgetProps[labelKey])
                      : '{{ item }}',
                  [descriptionKey]:
                    typeof widgetProps?.[descriptionKey] === 'string'
                      ? String(widgetProps[descriptionKey])
                      : '',
                  [childrenKey]:
                    supportsNestedItems &&
                    typeof widgetProps?.[childrenKey] === 'string'
                      ? String(widgetProps[childrenKey])
                      : '',
                })
                return
              }
              onChange({ [modeKey]: 'static' })
            }}
            disabled={disabled}
          />
        </div>
      </div>

      {mode === 'dynamic' ? (
        <div className="space-y-2 rounded-md border border-foreground-muted/20 bg-background p-2">
          <div className="flex items-center gap-2">
            <div className="w-20 text-[12px] text-foreground">Data source</div>
            <Input_Shadcn_
              value={dataSourceRaw}
              onChange={(event) => onChange({ [dataKey]: event.target.value })}
              placeholder="Select a source"
              className="h-7"
              disabled={disabled}
            />
          </div>
          {!dataSourceRaw.trim() ? (
            <div className="text-xs text-foreground-muted">
              {`Choose a data source above to map your ${collectionPluralLabel.toLowerCase()}.`}
            </div>
          ) : null}
          {isDynamicSourceEmpty ? (
            <div className="text-xs text-amber-600">The selected data source is empty.</div>
          ) : null}
          <div className="rounded-md border border-foreground-muted/20">
            <div className="border-b border-foreground-muted/20 px-2 py-2 text-[12px] font-medium text-foreground">
              {`Mapped ${collectionPluralLabel.toLowerCase()}`}
            </div>
            <div className="space-y-2 p-2">
              {[
                { key: valueKey, label: 'Value', placeholder: '{{ item }}' },
                { key: labelKey, label: 'Label', placeholder: '{{ item }}' },
                { key: descriptionKey, label: 'Caption', placeholder: '' },
                { key: colorKey, label: 'Color', placeholder: '' },
                { key: prefixImageKey, label: 'Prefix image', placeholder: '' },
                { key: prefixIconKey, label: 'Prefix icon', placeholder: 'Select an icon' },
                { key: prefixTextKey, label: 'Prefix text', placeholder: '' },
                { key: tooltipKey, label: 'Tooltip', placeholder: '' },
                { key: disabledKey, label: 'Disabled', placeholder: '' },
                { key: hiddenKey, label: 'Hidden', placeholder: '' },
                ...(supportsNestedItems
                  ? [{ key: parentValueKey, label: 'Parent value', placeholder: '' }]
                  : []),
                ...(supportsNestedItems
                  ? [{ key: childrenKey, label: 'Children key', placeholder: 'children' }]
                  : []),
              ].map((item) => (
                <div key={item.key} className="flex items-center gap-2">
                  <div className="w-24 text-[12px] text-foreground">{item.label}</div>
                  <Input_Shadcn_
                    value={
                      typeof widgetProps?.[item.key] === 'string'
                        ? (widgetProps?.[item.key] as string)
                        : ''
                    }
                    onChange={(event) => onChange({ [item.key]: event.target.value })}
                    placeholder={item.placeholder}
                    className="h-7"
                    disabled={disabled}
                  />
                </div>
              ))}
            </div>
          </div>
          <div className="text-xs text-foreground-muted">
            {`Mapped ${collectionPluralLabel.toLowerCase()} are evaluated per item. Use `}
            <code>item</code>
            {' or '}
            <code>i</code>.
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-[12px] font-medium text-foreground">{collectionPluralLabel}</div>
            {!disabled ? (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  className="rounded p-1 text-foreground-muted hover:bg-surface-200 hover:text-foreground"
                  onClick={() => {
                    if (typeof navigator !== 'undefined' && navigator.clipboard) {
                      navigator.clipboard
                        .writeText(JSON.stringify(parsedOptions, null, 2))
                        .catch(() => {})
                    }
                  }}
                >
                  <Copy size={12} />
                </button>
                <button
                  type="button"
                  className="rounded p-1 text-foreground-muted hover:bg-surface-200 hover:text-foreground"
                  onClick={() =>
                    commitOptions([
                      createDefaultOptionNode(0, defaultNodeConfig),
                      createDefaultOptionNode(1, defaultNodeConfig),
                    ])
                  }
                >
                  <ChevronUp size={12} />
                </button>
                <button
                  type="button"
                  className="rounded p-1 text-foreground-muted hover:bg-surface-200 hover:text-foreground"
                  onClick={() => {
                    const next = addRootOptionNode(parsedOptions, defaultNodeConfig)
                    const nextPath = [parsedOptions.length]
                    commitOptions(next)
                    setSelectedPath(nextPath)
                    setEditPath(nextPath)
                  }}
                >
                  <Plus size={12} />
                </button>
              </div>
            ) : null}
          </div>
          <div className="max-h-64 overflow-auto rounded-md border border-foreground-muted/20 bg-background p-1">
            {parsedOptions.length === 0 ? (
              <div className="px-2 py-2 text-xs text-foreground-muted">{`No ${collectionPluralLabel.toLowerCase()}`}</div>
            ) : (
              parsedOptions.map((node, index) => renderNode(node, [index], 0))
            )}
          </div>
        </div>
      )}

      {mode === 'static' && selectedNode ? (
        <div className="text-[11px] text-foreground-muted">
          Selected: {selectedNode.label || selectedNode.value}
        </div>
      ) : null}
    </div>
  )
}
