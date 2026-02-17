import { useMemo, type ReactNode } from 'react'
import { Checkbox_Shadcn_, cn } from 'ui'

import { normalizeString } from '../helpers'
import { createWidgetDefinition, type WidgetRenderContext } from '../types'
import {
  normalizeMultiSelectValue,
  normalizeSelectLabelVariant,
  parseSelectOptionsByMode,
  type SelectOptionNode,
} from './select-utils'

type CheckboxTreeNode = {
  label: string
  value: string
  description: string
  disabled: boolean
  hidden: boolean
  parentValue: string
  children?: CheckboxTreeNode[]
}

type TreeIndexItem = {
  value: string
  label: string
  description: string
  disabled: boolean
  hidden: boolean
  parentValue: string
  depth: number
  path: string[]
  isLeaf: boolean
}

export type CheckboxTreeProps = {
  label: string
  labelVariant?: string
  value: string
  selectedValues?: string[] | string
  selectedLabels?: string[] | string
  selectedIndexes?: number[] | string
  selectedItems?: unknown[] | string
  checkedPathArray?: string[][] | string
  checkedPathStrings?: string[] | string
  leafPathArray?: string[][] | string
  leafPathStrings?: string[] | string
  parentKeysByIndex?: string[] | string
  count?: number
  valid?: boolean
  invalid?: boolean
  validationMessage?: string
  optionsMode?: string
  options: string
  optionsData?: string
  optionLabelKey?: string
  optionValueKey?: string
  optionDescriptionKey?: string
  optionColorKey?: string
  optionPrefixImageKey?: string
  optionPrefixIconKey?: string
  optionPrefixTextKey?: string
  optionTooltipKey?: string
  optionDisabledKey?: string
  optionHiddenKey?: string
  optionParentValueKey?: string
  optionChildrenKey?: string
  labels?: string
  values?: string
  helperText: string
  disabled: boolean
  required?: boolean
  minCount?: number
  maxCount?: number
  checkStrictly?: boolean
  events: string
}

const DEFAULT_OPTIONS: SelectOptionNode[] = [
  {
    label: 'Shoes',
    value: 'shoes',
    children: [
      { label: 'Athletic', value: 'athletic' },
      { label: 'Dress', value: 'dress' },
    ],
  },
  {
    label: 'Accessories',
    value: 'accessories',
    children: [{ label: 'Bags', value: 'bags' }],
  },
]

const parseBoolean = (value: unknown, fallback = false) => {
  if (typeof value === 'boolean') {
    return value
  }
  if (typeof value === 'number') {
    return value !== 0
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (['true', '1', 'yes', 'y'].includes(normalized)) {
      return true
    }
    if (['false', '0', 'no', 'n'].includes(normalized)) {
      return false
    }
  }
  return fallback
}

const parseCount = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(0, Math.floor(value))
  }
  if (typeof value === 'string') {
    const parsed = Number(value.trim())
    if (Number.isFinite(parsed)) {
      return Math.max(0, Math.floor(parsed))
    }
  }
  return undefined
}

const resolveValidation = ({
  count,
  required,
  minCount,
  maxCount,
}: {
  count: number
  required: boolean
  minCount?: number
  maxCount?: number
}) => {
  if (required && count === 0) {
    return { invalid: true, message: 'Required' }
  }
  if (typeof minCount === 'number' && count < minCount) {
    return { invalid: true, message: `Select at least ${minCount}` }
  }
  if (typeof maxCount === 'number' && count > maxCount) {
    return { invalid: true, message: `Select no more than ${maxCount}` }
  }
  return { invalid: false, message: '' }
}

const normalizeTreeNode = (input: SelectOptionNode): CheckboxTreeNode | null => {
  const label = normalizeString(input.label).trim()
  const value = normalizeString(input.value).trim() || label
  if (!label && !value) {
    return null
  }

  const children = Array.isArray(input.children)
    ? input.children
        .map((child) => normalizeTreeNode(child))
        .filter((child): child is CheckboxTreeNode => Boolean(child))
    : []

  return {
    label: label || value,
    value: value || label,
    description: normalizeString(input.description || input.caption),
    disabled: Boolean(input.disabled),
    hidden: Boolean(input.hidden),
    parentValue: normalizeString(input.parentValue),
    children: children.length > 0 ? children : undefined,
  }
}

const normalizeTree = (nodes: SelectOptionNode[]): CheckboxTreeNode[] => {
  const normalized = nodes
    .filter((node) => !node.separator)
    .map((node) => normalizeTreeNode(node))
    .filter((node): node is CheckboxTreeNode => Boolean(node))

  if (normalized.length === 0) {
    return []
  }

  const hasChildren = normalized.some((node) => Array.isArray(node.children) && node.children.length > 0)
  const hasParentValue = normalized.some((node) => node.parentValue)

  if (hasChildren || !hasParentValue) {
    return normalized
  }

  const byValue = new Map<string, CheckboxTreeNode>()
  normalized.forEach((node) => {
    byValue.set(node.value, { ...node, children: undefined })
  })

  const roots: CheckboxTreeNode[] = []
  byValue.forEach((node) => {
    if (node.parentValue && byValue.has(node.parentValue) && node.parentValue !== node.value) {
      const parent = byValue.get(node.parentValue)
      if (parent) {
        if (!Array.isArray(parent.children)) {
          parent.children = []
        }
        parent.children.push(node)
      }
      return
    }
    roots.push(node)
  })

  return roots
}

const pruneHiddenNodes = (nodes: CheckboxTreeNode[]): CheckboxTreeNode[] =>
  nodes
    .filter((node) => !node.hidden)
    .map((node) => ({
      ...node,
      children: node.children ? pruneHiddenNodes(node.children) : undefined,
    }))

const buildTreeIndexes = (nodes: CheckboxTreeNode[]) => {
  const items: TreeIndexItem[] = []
  const itemByValue = new Map<string, TreeIndexItem>()
  const leafDescendantsByValue = new Map<string, string[]>()
  const toggleableLeafDescendantsByValue = new Map<string, string[]>()

  const walk = (
    node: CheckboxTreeNode,
    depth: number,
    parentValue: string,
    path: string[]
  ): { leaves: string[]; toggleableLeaves: string[] } => {
    const nextPath = [...path, node.label]
    const children = Array.isArray(node.children) ? node.children : []
    const isLeaf = children.length === 0
    const item: TreeIndexItem = {
      value: node.value,
      label: node.label,
      description: node.description,
      disabled: node.disabled,
      hidden: node.hidden,
      parentValue,
      depth,
      path: nextPath,
      isLeaf,
    }
    items.push(item)
    itemByValue.set(item.value, item)

    if (children.length === 0) {
      const leaves = [item.value]
      const toggleableLeaves = item.disabled ? [] : [item.value]
      leafDescendantsByValue.set(item.value, leaves)
      toggleableLeafDescendantsByValue.set(item.value, toggleableLeaves)
      return { leaves, toggleableLeaves }
    }

    const leaves: string[] = []
    const toggleableLeaves: string[] = []
    children.forEach((child) => {
      const result = walk(child, depth + 1, item.value, nextPath)
      leaves.push(...result.leaves)
      toggleableLeaves.push(...result.toggleableLeaves)
    })

    leafDescendantsByValue.set(item.value, leaves)
    toggleableLeafDescendantsByValue.set(item.value, toggleableLeaves)
    return { leaves, toggleableLeaves }
  }

  nodes.forEach((node) => {
    walk(node, 0, '', [])
  })

  return {
    items,
    itemByValue,
    leafDescendantsByValue,
    toggleableLeafDescendantsByValue,
  }
}

const CheckboxTreeRenderer = ({
  props,
  context,
}: {
  props: CheckboxTreeProps
  context?: WidgetRenderContext
}) => {
  const label = normalizeString(props.label)
  const labelVariant = normalizeSelectLabelVariant(props.labelVariant)
  const showDefaultLabel = Boolean(label && labelVariant === 'default')
  const showOverlappingLabel = Boolean(label && labelVariant === 'overlapping')
  const showInsetLabel = Boolean(label && labelVariant === 'inset')

  const required = parseBoolean(props.required)
  const minCount = parseCount(props.minCount)
  const maxCount = parseCount(props.maxCount)
  const checkStrictly = parseBoolean(props.checkStrictly)

  const optionNodes = useMemo(
    () =>
      parseSelectOptionsByMode({
        modeRaw: props.optionsMode,
        optionsRaw: props.options,
        labelsRaw: props.labels,
        valuesRaw: props.values,
        dataRaw: props.optionsData,
        labelKeyRaw: props.optionLabelKey,
        valueKeyRaw: props.optionValueKey,
        descriptionKeyRaw: props.optionDescriptionKey,
        colorKeyRaw: props.optionColorKey,
        prefixImageKeyRaw: props.optionPrefixImageKey,
        prefixIconKeyRaw: props.optionPrefixIconKey,
        prefixTextKeyRaw: props.optionPrefixTextKey,
        tooltipKeyRaw: props.optionTooltipKey,
        disabledKeyRaw: props.optionDisabledKey,
        hiddenKeyRaw: props.optionHiddenKey,
        parentValueKeyRaw: props.optionParentValueKey,
        childrenKeyRaw: props.optionChildrenKey,
        fallback: DEFAULT_OPTIONS,
      }),
    [
      props.optionsMode,
      props.options,
      props.labels,
      props.values,
      props.optionsData,
      props.optionLabelKey,
      props.optionValueKey,
      props.optionDescriptionKey,
      props.optionColorKey,
      props.optionPrefixImageKey,
      props.optionPrefixIconKey,
      props.optionPrefixTextKey,
      props.optionTooltipKey,
      props.optionDisabledKey,
      props.optionHiddenKey,
      props.optionParentValueKey,
      props.optionChildrenKey,
    ]
  )

  const normalizedTree = useMemo(
    () => pruneHiddenNodes(normalizeTree(optionNodes)),
    [optionNodes]
  )

  const indexes = useMemo(() => buildTreeIndexes(normalizedTree), [normalizedTree])
  const knownValues = new Set(indexes.items.map((item) => item.value))

  const selectedValuesRaw = normalizeMultiSelectValue(context?.state?.value ?? props.value)
  const selectedValues = selectedValuesRaw.filter((value) => knownValues.has(value))
  const selectedSet = new Set(selectedValues)

  const currentSelectionCount = selectedValues.length
  const validation = resolveValidation({
    count: currentSelectionCount,
    required,
    minCount,
    maxCount,
  })
  const helperText = normalizeString(props.helperText)
  const helperMessage = validation.invalid ? validation.message : helperText

  const commit = (nextSet: Set<string>) => {
    const orderedSelectedValues = indexes.items
      .map((item) => item.value)
      .filter((value) => nextSet.has(value))

    const selectedItems = orderedSelectedValues
      .map((value) => {
        const item = indexes.itemByValue.get(value)
        if (!item) {
          return null
        }
        return {
          value: item.value,
          label: item.label,
          description: item.description,
          depth: item.depth,
          path: item.path,
          parentValue: item.parentValue,
          isLeaf: item.isLeaf,
        }
      })
      .filter(
        (item): item is {
          value: string
          label: string
          description: string
          depth: number
          path: string[]
          parentValue: string
          isLeaf: boolean
        } => Boolean(item)
      )

    const selectedLabels = selectedItems.map((item) => item.label)
    const selectedIndexes = selectedItems.map((item) =>
      indexes.items.findIndex((node) => node.value === item.value)
    )
    const checkedPathArray = selectedItems.map((item) => item.path)
    const checkedPathStrings = checkedPathArray.map((path) => path.join(' / '))
    const leafPathArray = selectedItems.filter((item) => item.isLeaf).map((item) => item.path)
    const leafPathStrings = leafPathArray.map((path) => path.join(' / '))
    const parentKeysByIndex = selectedItems.map((item) => item.parentValue)

    const nextValidation = resolveValidation({
      count: orderedSelectedValues.length,
      required,
      minCount,
      maxCount,
    })

    const patch = {
      value: orderedSelectedValues,
      values: orderedSelectedValues,
      labels: selectedLabels,
      selectedValues: orderedSelectedValues,
      selectedLabels,
      selectedIndexes,
      selectedItems,
      checkedPathArray,
      checkedPathStrings,
      leafPathArray,
      leafPathStrings,
      parentKeysByIndex,
      invalid: nextValidation.invalid,
      valid: !nextValidation.invalid,
      validationMessage: nextValidation.message,
      count: orderedSelectedValues.length,
    }

    context?.setState?.(patch)
    if (context?.mode !== 'canvas') {
      context?.runActions?.('change', patch)
    }
  }

  const toggleValue = (nodeValue: string, checked: boolean) => {
    const node = indexes.itemByValue.get(nodeValue)
    if (!node || node.disabled) {
      return
    }

    const next = new Set(selectedSet)
    if (checkStrictly) {
      if (checked) {
        if (typeof maxCount === 'number' && next.size >= maxCount && !next.has(nodeValue)) {
          return
        }
        next.add(nodeValue)
      } else {
        next.delete(nodeValue)
      }
      commit(next)
      return
    }

    const targetLeaves = indexes.toggleableLeafDescendantsByValue.get(nodeValue) ?? []
    if (targetLeaves.length === 0) {
      return
    }

    if (!checked) {
      targetLeaves.forEach((leafValue) => next.delete(leafValue))
      commit(next)
      return
    }

    const additions = targetLeaves.filter((leafValue) => !next.has(leafValue)).length
    if (additions === 0) {
      return
    }
    if (typeof maxCount === 'number' && next.size + additions > maxCount) {
      return
    }
    targetLeaves.forEach((leafValue) => next.add(leafValue))
    commit(next)
  }

  const getNodeCheckState = (nodeValue: string): boolean | 'indeterminate' => {
    if (checkStrictly) {
      return selectedSet.has(nodeValue)
    }

    const leaves = indexes.leafDescendantsByValue.get(nodeValue) ?? []
    if (leaves.length === 0) {
      return selectedSet.has(nodeValue)
    }
    const checkedLeaves = leaves.filter((leaf) => selectedSet.has(leaf)).length
    if (checkedLeaves === 0) {
      return false
    }
    if (checkedLeaves === leaves.length) {
      return true
    }
    return 'indeterminate'
  }

  const renderNodes = (nodes: CheckboxTreeNode[], depth = 0): ReactNode => (
    <div className={depth > 0 ? 'space-y-1 pl-4' : 'space-y-1'}>
      {nodes.map((node) => {
        const checkedState = getNodeCheckState(node.value)
        const hasChildren = Array.isArray(node.children) && node.children.length > 0

        return (
          <div key={node.value} className="space-y-1">
            <label
              className={cn(
                'flex items-start gap-2 text-sm text-foreground',
                node.disabled || props.disabled ? 'opacity-60' : null
              )}
            >
              <Checkbox_Shadcn_
                checked={checkedState}
                disabled={props.disabled || node.disabled}
                onCheckedChange={(nextValue) => {
                  toggleValue(node.value, nextValue === true)
                }}
              />
              <span className="min-w-0">
                <span className="block truncate">{node.label}</span>
                {node.description ? (
                  <span className="block text-xs text-muted-foreground">{node.description}</span>
                ) : null}
              </span>
            </label>
            {hasChildren ? renderNodes(node.children ?? [], depth + 1) : null}
          </div>
        )
      })}
    </div>
  )

  const treeControl = renderNodes(normalizedTree)

  return (
    <div className="space-y-1">
      {showDefaultLabel ? (
        <>
          <label className="text-xs font-medium text-foreground">{label}</label>
          {treeControl}
        </>
      ) : null}
      {showOverlappingLabel ? (
        <div className="group relative pt-1">
          <label className="pointer-events-none absolute start-2 top-0 z-10 -translate-y-1/2 bg-background px-1 text-xs font-medium text-foreground">
            {label}
          </label>
          {treeControl}
        </div>
      ) : null}
      {showInsetLabel ? (
        <div className="rounded-md border border-input bg-background p-3 shadow-xs">
          <label className="mb-2 block text-xs font-medium text-foreground">{label}</label>
          {treeControl}
        </div>
      ) : null}
      {!showDefaultLabel && !showOverlappingLabel && !showInsetLabel ? treeControl : null}
      {helperMessage ? (
        <div className={`text-xs ${validation.invalid ? 'text-destructive' : 'text-muted-foreground'}`}>
          {helperMessage}
        </div>
      ) : null}
    </div>
  )
}

export const CheckboxTreeDefinition = createWidgetDefinition<CheckboxTreeProps>({
  type: 'CheckboxTree',
  label: 'Checkbox Tree',
  category: 'inputs',
  description: 'Hierarchical checkbox selection',
  defaultProps: {
    label: 'Label',
    labelVariant: 'default',
    value: '[]',
    selectedValues: [],
    selectedLabels: [],
    selectedIndexes: [],
    selectedItems: [],
    checkedPathArray: [],
    checkedPathStrings: [],
    leafPathArray: [],
    leafPathStrings: [],
    parentKeysByIndex: [],
    count: 0,
    valid: true,
    invalid: false,
    validationMessage: '',
    optionsMode: 'static',
    options: JSON.stringify(
      [
        {
          label: 'Shoes',
          value: 'shoes',
          children: [
            { label: 'Athletic', value: 'athletic' },
            { label: 'Dress', value: 'dress' },
          ],
        },
        {
          label: 'Accessories',
          value: 'accessories',
          children: [{ label: 'Bags', value: 'bags' }],
        },
      ],
      null,
      2
    ),
    optionsData: '[]',
    optionLabelKey: 'label',
    optionValueKey: 'value',
    optionDescriptionKey: 'description',
    optionColorKey: '',
    optionPrefixImageKey: '',
    optionPrefixIconKey: '',
    optionPrefixTextKey: '',
    optionTooltipKey: '',
    optionDisabledKey: '',
    optionHiddenKey: '',
    optionParentValueKey: 'parentValue',
    optionChildrenKey: 'children',
    labels: '[]',
    values: '[]',
    helperText: '',
    disabled: false,
    required: false,
    minCount: undefined,
    maxCount: undefined,
    checkStrictly: false,
    events: '[]',
  },
  render: (props, context) => <CheckboxTreeRenderer props={props} context={context} />,
})
