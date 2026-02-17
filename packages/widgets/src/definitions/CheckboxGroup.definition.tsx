import { useMemo } from 'react'
import { Checkbox_Shadcn_, cn } from 'ui'

import { normalizeString } from '../helpers'
import { createWidgetDefinition, type WidgetRenderContext } from '../types'
import {
  flattenSelectOptions,
  normalizeMultiSelectValue,
  normalizeSelectLabelVariant,
  parseSelectOptionsByMode,
  type SelectOptionNode,
} from './select-utils'

type CheckboxGroupOption = {
  label: string
  value: string
  description: string
  disabled: boolean
  index: number
}

export type CheckboxGroupProps = {
  label: string
  labelVariant?: string
  value: string
  selectedValues?: string[] | string
  selectedLabels?: string[] | string
  selectedIndexes?: number[] | string
  selectedItems?: unknown[] | string
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
  groupLayout?: string
  events: string
}

const DEFAULT_OPTIONS: SelectOptionNode[] = [
  { label: 'Option 1', value: 'option_1' },
  { label: 'Option 2', value: 'option_2' },
  { label: 'Option 3', value: 'option_3' },
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

const toUniqueValues = (values: string[]) => Array.from(new Set(values))

const buildSelectionPatch = ({
  nextValues,
  options,
  required,
  minCount,
  maxCount,
}: {
  nextValues: string[]
  options: CheckboxGroupOption[]
  required: boolean
  minCount?: number
  maxCount?: number
}) => {
  const optionByValue = new Map(options.map((option) => [option.value, option] as const))
  const selectedItems = nextValues
    .map((value) => {
      const option = optionByValue.get(value)
      if (!option) {
        return null
      }
      return {
        value: option.value,
        label: option.label,
        description: option.description,
        index: option.index,
      }
    })
    .filter((item): item is { value: string; label: string; description: string; index: number } => Boolean(item))
  const selectedLabels = selectedItems.map((item) => item.label)
  const selectedIndexes = selectedItems.map((item) => item.index)
  const validation = resolveValidation({
    count: nextValues.length,
    required,
    minCount,
    maxCount,
  })

  return {
    value: nextValues,
    values: nextValues,
    labels: selectedLabels,
    selectedValues: nextValues,
    selectedLabels,
    selectedIndexes,
    selectedItems,
    invalid: validation.invalid,
    valid: !validation.invalid,
    validationMessage: validation.message,
    count: nextValues.length,
  }
}

const CheckboxGroupRenderer = ({
  props,
  context,
}: {
  props: CheckboxGroupProps
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
  const isHorizontal = normalizeString(props.groupLayout, 'vertical').toLowerCase() === 'horizontal'

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

  const options = useMemo<CheckboxGroupOption[]>(
    () =>
      flattenSelectOptions(optionNodes)
        .filter((option) => option.isLeaf && !option.separator && !option.hidden)
        .map((option, index) => ({
          label: option.label,
          value: option.value,
          description: option.description || option.caption || '',
          disabled: option.disabled,
          index,
        })),
    [optionNodes]
  )

  const selectedValuesRaw = normalizeMultiSelectValue(context?.state?.value ?? props.value)
  const selectableValues = new Set(options.map((option) => option.value))
  const selectedValues = toUniqueValues(
    selectedValuesRaw.filter((value) => selectableValues.has(value))
  )
  const selectedSet = new Set(selectedValues)

  const validation = resolveValidation({
    count: selectedValues.length,
    required,
    minCount,
    maxCount,
  })
  const helperText = normalizeString(props.helperText)
  const helperMessage = validation.invalid ? validation.message : helperText

  const commit = (nextValuesRaw: string[]) => {
    const nextValues = toUniqueValues(nextValuesRaw.filter((value) => selectableValues.has(value)))
    const patch = buildSelectionPatch({
      nextValues,
      options,
      required,
      minCount,
      maxCount,
    })
    context?.setState?.(patch)
    if (context?.mode !== 'canvas') {
      context?.runActions?.('change', patch)
    }
  }

  const toggleValue = (value: string, checked: boolean) => {
    if (!selectableValues.has(value)) {
      return
    }
    if (!checked) {
      commit(selectedValues.filter((item) => item !== value))
      return
    }

    const hasValue = selectedSet.has(value)
    if (hasValue) {
      return
    }
    if (typeof maxCount === 'number' && selectedValues.length >= maxCount) {
      return
    }
    commit([...selectedValues, value])
  }

  const optionsControl = (
    <div className={isHorizontal ? 'flex flex-wrap gap-x-4 gap-y-2' : 'space-y-2'}>
      {options.map((option) => (
        <label
          key={option.value}
          className={cn(
            'flex items-start gap-2 text-sm text-foreground',
            option.disabled || props.disabled ? 'opacity-60' : null
          )}
        >
          <Checkbox_Shadcn_
            checked={selectedSet.has(option.value)}
            disabled={props.disabled || option.disabled}
            onCheckedChange={(nextValue) => {
              toggleValue(option.value, nextValue === true)
            }}
          />
          <span className="min-w-0">
            <span className="block truncate">{option.label}</span>
            {option.description ? (
              <span className="block text-xs text-muted-foreground">{option.description}</span>
            ) : null}
          </span>
        </label>
      ))}
    </div>
  )

  return (
    <div className="space-y-1">
      {showDefaultLabel ? (
        <>
          <label className="text-xs font-medium text-foreground">{label}</label>
          {optionsControl}
        </>
      ) : null}
      {showOverlappingLabel ? (
        <div className="group relative pt-1">
          <label className="pointer-events-none absolute start-2 top-0 z-10 -translate-y-1/2 bg-background px-1 text-xs font-medium text-foreground">
            {label}
          </label>
          {optionsControl}
        </div>
      ) : null}
      {showInsetLabel ? (
        <div className="rounded-md border border-input bg-background p-3 shadow-xs">
          <label className="mb-2 block text-xs font-medium text-foreground">{label}</label>
          {optionsControl}
        </div>
      ) : null}
      {!showDefaultLabel && !showOverlappingLabel && !showInsetLabel ? optionsControl : null}
      {helperMessage ? (
        <div className={`text-xs ${validation.invalid ? 'text-destructive' : 'text-muted-foreground'}`}>
          {helperMessage}
        </div>
      ) : null}
    </div>
  )
}

export const CheckboxGroupDefinition = createWidgetDefinition<CheckboxGroupProps>({
  type: 'CheckboxGroup',
  label: 'Checkbox Group',
  category: 'inputs',
  description: 'Multiple choice checkbox group',
  defaultProps: {
    label: 'Label',
    labelVariant: 'default',
    value: '[]',
    selectedValues: [],
    selectedLabels: [],
    selectedIndexes: [],
    selectedItems: [],
    count: 0,
    valid: true,
    invalid: false,
    validationMessage: '',
    optionsMode: 'static',
    options: JSON.stringify(
      [
        { label: 'Option 1', value: 'option_1' },
        { label: 'Option 2', value: 'option_2' },
        { label: 'Option 3', value: 'option_3' },
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
    optionParentValueKey: '',
    optionChildrenKey: 'children',
    labels: '[]',
    values: '[]',
    helperText: '',
    disabled: false,
    required: false,
    minCount: undefined,
    maxCount: undefined,
    groupLayout: 'vertical',
    events: '[]',
  },
  render: (props, context) => <CheckboxGroupRenderer props={props} context={context} />,
})
