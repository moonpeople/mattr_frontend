import { useMemo } from 'react'
import { RadioGroupItem_Shadcn_, RadioGroup_Shadcn_, cn } from 'ui'

import { normalizeString } from '../helpers'
import { createWidgetDefinition, type WidgetRenderContext } from '../types'
import {
  flattenSelectOptions,
  normalizeSelectLabelVariant,
  parseSelectOptionsByMode,
  type SelectOptionNode,
} from './select-utils'

type RadioGroupOption = {
  label: string
  value: string
  description: string
  disabled: boolean
  index: number
}

export type RadioGroupProps = {
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
  helperText: string
  disabled: boolean
  required?: boolean
  groupLayout?: string
  events: string
}

const DEFAULT_OPTIONS: SelectOptionNode[] = [
  { label: 'Option 1', value: 'option_1' },
  { label: 'Option 2', value: 'option_2' },
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

const RadioGroupRenderer = ({
  props,
  context,
}: {
  props: RadioGroupProps
  context?: WidgetRenderContext
}) => {
  const label = normalizeString(props.label)
  const labelVariant = normalizeSelectLabelVariant(props.labelVariant)
  const showDefaultLabel = Boolean(label && labelVariant === 'default')
  const showOverlappingLabel = Boolean(label && labelVariant === 'overlapping')
  const showInsetLabel = Boolean(label && labelVariant === 'inset')
  const isHorizontal = normalizeString(props.groupLayout, 'vertical').toLowerCase() === 'horizontal'

  const options = useMemo<RadioGroupOption[]>(
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
  const currentRaw = normalizeString(context?.state?.value ?? props.value)
  const value = optionByValue.has(currentRaw) ? currentRaw : ''
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
    <RadioGroup_Shadcn_
      value={value}
      disabled={props.disabled}
      onValueChange={(nextValue) => {
        commit(nextValue)
      }}
      className={isHorizontal ? 'flex flex-wrap gap-x-4 gap-y-2' : 'space-y-2'}
    >
      {options.map((option) => (
        <label key={option.value} className="flex items-start gap-2 text-sm text-foreground">
          <RadioGroupItem_Shadcn_ value={option.value} disabled={props.disabled || option.disabled} />
          <span className="min-w-0">
            <span className="block truncate">{option.label}</span>
            {option.description ? (
              <span className="block text-xs text-muted-foreground">{option.description}</span>
            ) : null}
          </span>
        </label>
      ))}
    </RadioGroup_Shadcn_>
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

export const RadioGroupDefinition = createWidgetDefinition<RadioGroupProps>({
  type: 'RadioGroup',
  label: 'Radio Group',
  category: 'inputs',
  description: 'Single choice radio group',
  defaultProps: {
    label: 'Label',
    labelVariant: 'default',
    value: '',
    selectedLabel: '',
    selectedIndex: -1,
    selectedItem: null,
    valid: true,
    invalid: false,
    validationMessage: '',
    optionsMode: 'static',
    options: JSON.stringify(
      [
        { label: 'Option 1', value: 'option_1' },
        { label: 'Option 2', value: 'option_2' },
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
    groupLayout: 'vertical',
    events: '[]',
  },
  render: (props, context) => <RadioGroupRenderer props={props} context={context} />,
})
