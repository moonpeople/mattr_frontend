import { normalizeArray, normalizeString, parseMaybeJson } from '../helpers'

export type SelectOptionNode = {
  label: string
  value: string
  disabled?: boolean
  hidden?: boolean
  description?: string
  caption?: string
  color?: string
  prefixImage?: string
  prefixIcon?: string
  prefixText?: string
  tooltip?: string
  parentValue?: string
  icon?: string
  meta?: string
  prefix?: string
  separator?: boolean
  children?: SelectOptionNode[]
}

export type SelectLabelVariant = 'default' | 'overlapping' | 'inset'
export type SelectOptionsMode = 'static' | 'dynamic'

export type FlatSelectOption = {
  label: string
  value: string
  disabled: boolean
  hidden: boolean
  description: string
  caption: string
  color: string
  prefixImage: string
  prefixIcon: string
  prefixText: string
  tooltip: string
  parentValue: string
  icon: string
  meta: string
  prefix: string
  path: string[]
  depth: number
  isLeaf: boolean
  separator: boolean
}

const toStringValue = (value: unknown) => {
  if (typeof value === 'string') {
    return value
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }
  return ''
}

const normalizeNode = (input: unknown, path: string[] = []): SelectOptionNode | null => {
  if (typeof input === 'string' || typeof input === 'number' || typeof input === 'boolean') {
    const primitive = String(input)
    return {
      label: primitive,
      value: primitive,
    }
  }

  if (!input || typeof input !== 'object') {
    return null
  }

  const raw = input as Record<string, unknown>
  const isSeparator = Boolean(raw.separator) || raw.type === 'separator'
  if (isSeparator) {
    const separatorKey = toStringValue(raw.id ?? raw.key ?? raw.value).trim() || path.join('_') || 'root'
    return {
      label: 'separator',
      value: `__separator__${separatorKey}`,
      separator: true,
    }
  }

  const label = toStringValue(raw.label ?? raw.name ?? raw.title).trim()
  const fallbackValue = label || toStringValue(raw.id).trim()
  const value = toStringValue(raw.value).trim() || fallbackValue
  if (!label && !value) {
    return null
  }

  const nextPath = [...path, label || value]
  const childrenSource = raw.children ?? raw.items ?? raw.options
  const children = normalizeArray<unknown>(childrenSource, [])
    .map((child) => normalizeNode(child, nextPath))
    .filter((item): item is SelectOptionNode => Boolean(item))

  const numberValue = raw.number
  const countValue = raw.count
  const computedMeta = toStringValue(raw.meta ?? raw.right ?? countValue ?? numberValue).trim()
  const computedPrefix = toStringValue(raw.prefix ?? raw.flag ?? raw.leading ?? raw.leadingText).trim()

  const normalized: SelectOptionNode = {
    label: label || value,
    value: value || label,
    disabled: Boolean(raw.disabled),
    hidden: Boolean(raw.hidden),
    description: normalizeString(raw.description ?? raw.caption, '').trim(),
    caption: normalizeString(raw.caption, '').trim(),
    color: normalizeString(raw.color, '').trim(),
    prefixImage: normalizeString(raw.prefixImage, '').trim(),
    prefixIcon: normalizeString(raw.prefixIcon, '').trim(),
    prefixText: normalizeString(raw.prefixText, '').trim(),
    tooltip: normalizeString(raw.tooltip, '').trim(),
    parentValue: normalizeString(raw.parentValue, '').trim(),
    icon: normalizeString(raw.icon ?? raw.prefixIcon, '').trim(),
    meta: computedMeta,
    prefix: computedPrefix || normalizeString(raw.prefixText, '').trim(),
  }

  if (children.length > 0) {
    normalized.children = children
  }

  return normalized
}

const parseLabelsValues = (labelsRaw: unknown, valuesRaw: unknown): SelectOptionNode[] => {
  const labels = normalizeArray<unknown>(parseMaybeJson(labelsRaw), []).map((item) =>
    toStringValue(item).trim()
  )
  const values = normalizeArray<unknown>(parseMaybeJson(valuesRaw), []).map((item) =>
    toStringValue(item).trim()
  )

  if (labels.length === 0 && values.length === 0) {
    return []
  }

  const length = Math.max(labels.length, values.length)
  return Array.from({ length }, (_, index) => {
    const label = labels[index] || values[index] || `Option ${index + 1}`
    const value = values[index] || labels[index] || `option_${index + 1}`
    return { label, value }
  })
}

const normalizeOptionsMode = (value: unknown): SelectOptionsMode => {
  if (typeof value === 'string' && value.trim().toLowerCase() === 'dynamic') {
    return 'dynamic'
  }
  return 'static'
}

const toPathSegments = (value: string) =>
  value
    .split('.')
    .map((segment) => segment.trim())
    .filter(Boolean)

const readPathValue = (item: unknown, selector: string): unknown => {
  if (!selector) {
    return undefined
  }
  if (!item || typeof item !== 'object') {
    return undefined
  }
  const path = toPathSegments(selector)
  if (path.length === 0) {
    return undefined
  }

  return path.reduce<unknown>((current, segment) => {
    if (!current || typeof current !== 'object') {
      return undefined
    }
    return (current as Record<string, unknown>)[segment]
  }, item)
}

const evaluateSelectorExpression = (selector: string, item: unknown, index: number): unknown => {
  const trimmed = selector.trim()
  if (!(trimmed.startsWith('{{') && trimmed.endsWith('}}'))) {
    return undefined
  }
  const expression = trimmed.slice(2, -2).trim()
  if (!expression) {
    return undefined
  }
  try {
    // eslint-disable-next-line no-new-func
    const fn = new Function('item', 'index', `return (${expression});`)
    return fn(item, index)
  } catch {
    return undefined
  }
}

const readSelectorValue = (
  item: unknown,
  selectorRaw: unknown,
  index: number
): unknown => {
  const selector = normalizeString(selectorRaw, '').trim()
  if (!selector) {
    return undefined
  }

  const expressionValue = evaluateSelectorExpression(selector, item, index)
  if (typeof expressionValue !== 'undefined') {
    return expressionValue
  }

  if (selector.includes('.')) {
    return readPathValue(item, selector)
  }

  if (item && typeof item === 'object') {
    const direct = (item as Record<string, unknown>)[selector]
    if (typeof direct !== 'undefined') {
      return direct
    }
  }

  return readPathValue(item, selector)
}

const toDynamicNode = (
  input: unknown,
  index: number,
  config: {
    labelKey: string
    valueKey: string
    descriptionKey: string
    colorKey: string
    prefixImageKey: string
    prefixIconKey: string
    prefixTextKey: string
    tooltipKey: string
    disabledKey: string
    hiddenKey: string
    parentValueKey: string
    childrenKey: string
    visited: WeakSet<object>
  }
): SelectOptionNode | null => {
  if (typeof input === 'string' || typeof input === 'number' || typeof input === 'boolean') {
    const primitive = String(input)
    return {
      label: primitive,
      value: primitive,
    }
  }

  if (!input || typeof input !== 'object') {
    return null
  }

  if (config.visited.has(input)) {
    return null
  }
  config.visited.add(input)

  const raw = input as Record<string, unknown>
  const labelRaw = readSelectorValue(raw, config.labelKey, index)
  const valueRaw = readSelectorValue(raw, config.valueKey, index)
  const descriptionRaw = config.descriptionKey
    ? readSelectorValue(raw, config.descriptionKey, index)
    : undefined
  const colorRaw = config.colorKey
    ? readSelectorValue(raw, config.colorKey, index)
    : undefined
  const prefixImageRaw = config.prefixImageKey
    ? readSelectorValue(raw, config.prefixImageKey, index)
    : undefined
  const prefixIconRaw = config.prefixIconKey
    ? readSelectorValue(raw, config.prefixIconKey, index)
    : undefined
  const prefixTextRaw = config.prefixTextKey
    ? readSelectorValue(raw, config.prefixTextKey, index)
    : undefined
  const tooltipRaw = config.tooltipKey
    ? readSelectorValue(raw, config.tooltipKey, index)
    : undefined
  const disabledRaw = config.disabledKey
    ? readSelectorValue(raw, config.disabledKey, index)
    : undefined
  const hiddenRaw = config.hiddenKey
    ? readSelectorValue(raw, config.hiddenKey, index)
    : undefined
  const parentValueRaw = config.parentValueKey
    ? readSelectorValue(raw, config.parentValueKey, index)
    : undefined
  const childrenRaw = config.childrenKey
    ? readSelectorValue(raw, config.childrenKey, index)
    : undefined

  const label = toStringValue(labelRaw ?? raw.label ?? raw.name ?? raw.title).trim()
  const valueFallback = toStringValue(raw.id ?? raw.key).trim()
  const value = toStringValue(valueRaw ?? raw.value ?? valueFallback ?? label).trim()
  if (!label && !value) {
    return null
  }

  const childrenSource = normalizeArray<unknown>(childrenRaw, [])
  const children = childrenSource
    .map((child, childIndex) => toDynamicNode(child, childIndex, config))
    .filter((item): item is SelectOptionNode => Boolean(item))

  return {
    label: label || value,
    value: value || label,
    disabled: Boolean(disabledRaw ?? raw.disabled),
    hidden: Boolean(hiddenRaw ?? raw.hidden),
    description: normalizeString(descriptionRaw ?? raw.description ?? raw.caption, '').trim(),
    caption: normalizeString(raw.caption ?? descriptionRaw, '').trim(),
    color: normalizeString(colorRaw ?? raw.color, '').trim(),
    prefixImage: normalizeString(prefixImageRaw ?? raw.prefixImage, '').trim(),
    prefixIcon: normalizeString(prefixIconRaw ?? raw.prefixIcon, '').trim(),
    prefixText: normalizeString(prefixTextRaw ?? raw.prefixText, '').trim(),
    tooltip: normalizeString(tooltipRaw ?? raw.tooltip, '').trim(),
    parentValue: normalizeString(parentValueRaw ?? raw.parentValue, '').trim(),
    icon: normalizeString(prefixIconRaw ?? raw.prefixIcon ?? raw.icon, '').trim(),
    meta: toStringValue(raw.meta ?? raw.right).trim(),
    prefix: toStringValue(prefixTextRaw ?? raw.prefixText ?? raw.prefix ?? raw.flag ?? raw.leading).trim(),
    children: children.length > 0 ? children : undefined,
  }
}

const parseDynamicSelectOptions = (
  dataRaw: unknown,
  labelKeyRaw: unknown,
  valueKeyRaw: unknown,
  descriptionKeyRaw: unknown,
  colorKeyRaw: unknown,
  prefixImageKeyRaw: unknown,
  prefixIconKeyRaw: unknown,
  prefixTextKeyRaw: unknown,
  tooltipKeyRaw: unknown,
  disabledKeyRaw: unknown,
  hiddenKeyRaw: unknown,
  parentValueKeyRaw: unknown,
  childrenKeyRaw: unknown
): SelectOptionNode[] => {
  const data = normalizeArray<unknown>(parseMaybeJson(dataRaw), [])
  if (data.length === 0) {
    return []
  }

  const labelKey = normalizeString(labelKeyRaw, 'label').trim() || 'label'
  const valueKey = normalizeString(valueKeyRaw, 'value').trim() || 'value'
  const descriptionKey = normalizeString(descriptionKeyRaw, 'description').trim()
  const colorKey = normalizeString(colorKeyRaw, '').trim()
  const prefixImageKey = normalizeString(prefixImageKeyRaw, '').trim()
  const prefixIconKey = normalizeString(prefixIconKeyRaw, '').trim()
  const prefixTextKey = normalizeString(prefixTextKeyRaw, '').trim()
  const tooltipKey = normalizeString(tooltipKeyRaw, '').trim()
  const disabledKey = normalizeString(disabledKeyRaw, '').trim()
  const hiddenKey = normalizeString(hiddenKeyRaw, '').trim()
  const parentValueKey = normalizeString(parentValueKeyRaw, '').trim()
  const childrenKey = normalizeString(childrenKeyRaw, 'children').trim() || 'children'
  const visited = new WeakSet<object>()

  return data
    .map((item, index) =>
      toDynamicNode(item, index, {
        labelKey,
        valueKey,
        descriptionKey,
        colorKey,
        prefixImageKey,
        prefixIconKey,
        prefixTextKey,
        tooltipKey,
        disabledKey,
        hiddenKey,
        parentValueKey,
        childrenKey,
        visited,
      })
    )
    .filter((item): item is SelectOptionNode => Boolean(item))
}

export const parseSelectOptions = (
  optionsRaw: unknown,
  labelsRaw: unknown,
  valuesRaw: unknown,
  fallback: SelectOptionNode[]
) => {
  const parsedOptions = normalizeArray<unknown>(parseMaybeJson(optionsRaw), [])
    .map((item) => normalizeNode(item))
    .filter((item): item is SelectOptionNode => Boolean(item))

  if (parsedOptions.length > 0) {
    return parsedOptions
  }

  const labelsValuesOptions = parseLabelsValues(labelsRaw, valuesRaw)
  if (labelsValuesOptions.length > 0) {
    return labelsValuesOptions
  }

  return fallback
}

export const parseSelectOptionsByMode = ({
  modeRaw,
  optionsRaw,
  labelsRaw,
  valuesRaw,
  dataRaw,
  labelKeyRaw,
  valueKeyRaw,
  descriptionKeyRaw,
  colorKeyRaw,
  prefixImageKeyRaw,
  prefixIconKeyRaw,
  prefixTextKeyRaw,
  tooltipKeyRaw,
  disabledKeyRaw,
  hiddenKeyRaw,
  parentValueKeyRaw,
  childrenKeyRaw,
  fallback,
}: {
  modeRaw: unknown
  optionsRaw: unknown
  labelsRaw: unknown
  valuesRaw: unknown
  dataRaw: unknown
  labelKeyRaw: unknown
  valueKeyRaw: unknown
  descriptionKeyRaw?: unknown
  colorKeyRaw?: unknown
  prefixImageKeyRaw?: unknown
  prefixIconKeyRaw?: unknown
  prefixTextKeyRaw?: unknown
  tooltipKeyRaw?: unknown
  disabledKeyRaw?: unknown
  hiddenKeyRaw?: unknown
  parentValueKeyRaw?: unknown
  childrenKeyRaw?: unknown
  fallback: SelectOptionNode[]
}) => {
  const mode = normalizeOptionsMode(modeRaw)
  if (mode === 'dynamic') {
    return parseDynamicSelectOptions(
      dataRaw,
      labelKeyRaw,
      valueKeyRaw,
      descriptionKeyRaw,
      colorKeyRaw,
      prefixImageKeyRaw,
      prefixIconKeyRaw,
      prefixTextKeyRaw,
      tooltipKeyRaw,
      disabledKeyRaw,
      hiddenKeyRaw,
      parentValueKeyRaw,
      childrenKeyRaw
    )
  }

  return parseSelectOptions(optionsRaw, labelsRaw, valuesRaw, fallback)
}

export const flattenSelectOptions = (
  nodes: SelectOptionNode[],
  {
    includeBranches = false,
    separator = ' / ',
  }: {
    includeBranches?: boolean
    separator?: string
  } = {}
): FlatSelectOption[] => {
  const walk = (items: SelectOptionNode[], path: string[] = [], depth = 0): FlatSelectOption[] => {
    return items.flatMap((item) => {
      const nextPath = [...path, item.label]
      const hasChildren = Array.isArray(item.children) && item.children.length > 0
      const isSeparator = Boolean(item.separator)
      const current: FlatSelectOption = {
        label: includeBranches || !hasChildren ? nextPath.join(separator) : item.label,
        value: item.value,
        disabled: Boolean(item.disabled),
        hidden: Boolean(item.hidden),
        description: item.description ?? '',
        caption: item.caption ?? '',
        color: item.color ?? '',
        prefixImage: item.prefixImage ?? '',
        prefixIcon: item.prefixIcon ?? '',
        prefixText: item.prefixText ?? '',
        tooltip: item.tooltip ?? '',
        parentValue: item.parentValue ?? '',
        icon: item.icon ?? '',
        meta: item.meta ?? '',
        prefix: item.prefix ?? '',
        path: nextPath,
        depth,
        isLeaf: !hasChildren && !isSeparator,
        separator: isSeparator,
      }

      const descendants = hasChildren ? walk(item.children ?? [], nextPath, depth + 1) : []
      if (isSeparator) {
        return [current]
      }
      if (includeBranches || !hasChildren) {
        return [current, ...descendants]
      }
      return descendants
    })
  }

  return walk(nodes, [], 0)
}

export const normalizeSingleSelectValue = (value: unknown) => {
  return toStringValue(value).trim()
}

export const normalizeMultiSelectValue = (value: unknown) => {
  if (Array.isArray(value)) {
    return value.map((item) => toStringValue(item).trim()).filter(Boolean)
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) {
      return []
    }
    const parsed = parseMaybeJson(trimmed)
    if (Array.isArray(parsed)) {
      return parsed.map((item) => toStringValue(item).trim()).filter(Boolean)
    }
    if (trimmed.includes(',')) {
      return trimmed
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    }
    return [trimmed]
  }

  const primitive = toStringValue(value).trim()
  return primitive ? [primitive] : []
}

export const normalizeSelectLabelVariant = (
  value: unknown,
  fallback: SelectLabelVariant = 'default'
): SelectLabelVariant => {
  const normalized = toStringValue(value).trim().toLowerCase()
  if (normalized === 'overlapping') {
    return 'overlapping'
  }
  if (normalized === 'inset') {
    return 'inset'
  }
  return fallback
}
