import { useMemo } from 'react'
import { ToggleGroup, ToggleGroupItem, cn } from 'ui'

import { normalizeString } from '../helpers'
import { createWidgetDefinition, type WidgetRenderContext } from '../types'
import {
  flattenSelectOptions,
  normalizeSelectLabelVariant,
  parseSelectOptionsByMode,
  type SelectOptionNode,
} from './select-utils'

type SegmentedOption = {
  label: string
  value: string
  description: string
  disabled: boolean
  index: number
}

export type SegmentedControlProps = {
  label: string
  labelVariant?: string
  value: string
  selectedLabel?: string
  selectedIndex?: number
  selectedItem?: unknown
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
  helperText?: string
  disabled: boolean
  required?: boolean
  events: string
}

const DEFAULT_OPTIONS: SelectOptionNode[] = [
  { label: 'Left', value: 'left' },
  { label: 'Right', value: 'right' },
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

const resolveValidation = (value: string, required: boolean) => {
  if (!required || value.trim()) {
    return { invalid: false, message: '' }
  }
  return { invalid: true, message: 'Required' }
}

const SegmentedControlRenderer = ({
  props,
  context,
}: {
  props: SegmentedControlProps
  context?: WidgetRenderContext
}) => {
  const label = normalizeString(props.label)
  const labelVariant = normalizeSelectLabelVariant(props.labelVariant)
  const showDefaultLabel = Boolean(label && labelVariant === 'default')
  const showOverlappingLabel = Boolean(label && labelVariant === 'overlapping')
  const showInsetLabel = Boolean(label && labelVariant === 'inset')

  const options = useMemo<SegmentedOption[]>(
    () =>
      flattenSelectOptions(
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
        })
      )
        .filter((option) => option.isLeaf && !option.separator && !option.hidden)
        .map((option, index) => ({
          label: option.label,
          value: option.value,
          description: option.description || option.caption || '',
          disabled: option.disabled,
          index,
        })),
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

  const optionByValue = new Map(options.map((option) => [option.value, option] as const))
  const firstOption = options[0]?.value ?? ''
  const initialValue = normalizeString(props.value || firstOption)
  const currentRaw = normalizeString(context?.state?.value ?? initialValue)
  const value = optionByValue.has(currentRaw) ? currentRaw : firstOption

  const required = parseBoolean(props.required)
  const validation = resolveValidation(value, required)
  const helperText = normalizeString(props.helperText)
  const helperMessage = validation.invalid ? validation.message : helperText

  const commit = (nextValue: string) => {
    const selected = optionByValue.get(nextValue)
    const nextValidation = resolveValidation(nextValue, required)
    const patch = {
      value: nextValue,
      selectedLabel: selected?.label ?? '',
      selectedIndex: selected?.index ?? -1,
      selectedItem: selected
        ? {
            value: selected.value,
            label: selected.label,
            description: selected.description,
            index: selected.index,
          }
        : null,
      invalid: nextValidation.invalid,
      valid: !nextValidation.invalid,
      validationMessage: nextValidation.message,
    }
    context?.setState?.(patch)
    if (context?.mode !== 'canvas') {
      context?.runActions?.('change', patch)
    }
  }

  const control = (
    <ToggleGroup
      type="single"
      value={value}
      disabled={props.disabled}
      onValueChange={(nextValue) => {
        if (!nextValue) {
          return
        }
        commit(nextValue)
      }}
      className="flex w-full items-stretch rounded-md border border-input bg-muted/40 p-1"
    >
      {options.map((option) => (
        <ToggleGroupItem
          key={option.value}
          value={option.value}
          disabled={option.disabled}
          className="flex-1 rounded-sm px-3 py-1.5 data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-sm"
        >
          {option.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )

  return (
    <div className="space-y-1">
      {showDefaultLabel ? (
        <>
          <label className="text-xs font-medium text-foreground">{label}</label>
          {control}
        </>
      ) : null}
      {showOverlappingLabel ? (
        <div className="group relative pt-1">
          <label className="pointer-events-none absolute start-2 top-0 z-10 -translate-y-1/2 bg-background px-1 text-xs font-medium text-foreground">
            {label}
          </label>
          {control}
        </div>
      ) : null}
      {showInsetLabel ? (
        <div className="rounded-md border border-input bg-background p-3 shadow-xs">
          <label className="mb-2 block text-xs font-medium text-foreground">{label}</label>
          {control}
        </div>
      ) : null}
      {!showDefaultLabel && !showOverlappingLabel && !showInsetLabel ? control : null}
      {helperMessage ? (
        <div className={cn('text-xs', validation.invalid ? 'text-destructive' : 'text-muted-foreground')}>
          {helperMessage}
        </div>
      ) : null}
    </div>
  )
}

export const SegmentedControlDefinition = createWidgetDefinition<SegmentedControlProps>({
  type: 'SegmentedControl',
  label: 'Segmented Control',
  category: 'inputs',
  description: 'Segmented control',
  defaultProps: {
    label: 'Label',
    labelVariant: 'default',
    value: 'left',
    selectedLabel: 'Left',
    selectedIndex: 0,
    selectedItem: { value: 'left', label: 'Left', description: '', index: 0 },
    valid: true,
    invalid: false,
    validationMessage: '',
    optionsMode: 'static',
    options: JSON.stringify(
      [
        { label: 'Left', value: 'left' },
        { label: 'Right', value: 'right' },
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
    events: '[]',
  },
  render: (props, context) => <SegmentedControlRenderer props={props} context={context} />,
})
