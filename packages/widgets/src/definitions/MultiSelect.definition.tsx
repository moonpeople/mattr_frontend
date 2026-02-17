import { useMemo } from 'react'

import { normalizeString } from '../helpers'
import { createWidgetDefinition, type WidgetRenderContext } from '../types'
import { MultipleSelector, type Option } from '../shadcn'
import {
  flattenSelectOptions,
  normalizeSelectLabelVariant,
  normalizeMultiSelectValue,
  parseSelectOptionsByMode,
  type SelectOptionNode,
} from './select-utils'

export type MultiSelectProps = {
  label: string
  labelVariant?: string
  placeholder: string
  searchPlaceholder?: string
  value: string
  itemsMode?: string
  items: string
  itemsData?: string
  itemLabelKey?: string
  itemValueKey?: string
  itemDescriptionKey?: string
  itemColorKey?: string
  itemPrefixImageKey?: string
  itemPrefixIconKey?: string
  itemPrefixTextKey?: string
  itemTooltipKey?: string
  itemDisabledKey?: string
  itemHiddenKey?: string
  itemParentValueKey?: string
  itemChildrenKey?: string
  optionsMode?: string
  options?: string
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
  searchable?: boolean
  showClear?: boolean
  showSelectAll?: boolean
  maxSelections?: number
  maxVisibleTags?: number
  emptyMessage?: string
  size: number
  helperText: string
  disabled: boolean
  events: string
}

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

const DEFAULT_OPTIONS: SelectOptionNode[] = [
  { label: 'Option 1', value: 'option_1' },
  { label: 'Option 2', value: 'option_2' },
  { label: 'Option 3', value: 'option_3' },
]

const MultiSelectRenderer = ({
  props,
  context,
}: {
  props: MultiSelectProps
  context?: WidgetRenderContext
}) => {
  const searchable = parseBoolean(props.searchable, true)
  const showClear = parseBoolean(props.showClear)
  const showSelectAll = parseBoolean(props.showSelectAll)
  const label = normalizeString(props.label, '')
  const labelVariant = normalizeSelectLabelVariant(props.labelVariant)
  const showOverlappingLabel = Boolean(label && labelVariant === 'overlapping')
  const showInsetLabel = Boolean(label && labelVariant === 'inset')
  const showDefaultLabel = Boolean(label && labelVariant === 'default')
  const placeholder = normalizeString(props.placeholder, 'Select options')
  const searchPlaceholder = normalizeString(props.searchPlaceholder, 'Search items...')
  const emptyMessage = normalizeString(props.emptyMessage, 'No items found')
  const selectedValues = normalizeMultiSelectValue(context?.state?.value ?? props.value)

  const maxSelections =
    typeof props.maxSelections === 'number' && Number.isFinite(props.maxSelections)
      ? Math.max(1, Math.floor(props.maxSelections))
      : Number.MAX_SAFE_INTEGER
  const maxVisibleTags =
    typeof props.maxVisibleTags === 'number' && Number.isFinite(props.maxVisibleTags)
      ? Math.max(1, Math.floor(props.maxVisibleTags))
      : undefined

  const options = useMemo(
    () =>
      parseSelectOptionsByMode({
        modeRaw: props.itemsMode ?? props.optionsMode,
        optionsRaw: props.items ?? props.options,
        labelsRaw: props.labels,
        valuesRaw: props.values,
        dataRaw: props.itemsData ?? props.optionsData,
        labelKeyRaw: props.itemLabelKey ?? props.optionLabelKey,
        valueKeyRaw: props.itemValueKey ?? props.optionValueKey,
        descriptionKeyRaw: props.itemDescriptionKey ?? props.optionDescriptionKey,
        colorKeyRaw: props.itemColorKey ?? props.optionColorKey,
        prefixImageKeyRaw: props.itemPrefixImageKey ?? props.optionPrefixImageKey,
        prefixIconKeyRaw: props.itemPrefixIconKey ?? props.optionPrefixIconKey,
        prefixTextKeyRaw: props.itemPrefixTextKey ?? props.optionPrefixTextKey,
        tooltipKeyRaw: props.itemTooltipKey ?? props.optionTooltipKey,
        disabledKeyRaw: props.itemDisabledKey ?? props.optionDisabledKey,
        hiddenKeyRaw: props.itemHiddenKey ?? props.optionHiddenKey,
        parentValueKeyRaw: props.itemParentValueKey ?? props.optionParentValueKey,
        childrenKeyRaw: props.itemChildrenKey ?? props.optionChildrenKey,
        fallback: DEFAULT_OPTIONS,
      }),
    [
      props.itemsMode,
      props.optionsMode,
      props.items,
      props.options,
      props.labels,
      props.values,
      props.itemsData,
      props.optionsData,
      props.itemLabelKey,
      props.optionLabelKey,
      props.itemValueKey,
      props.optionValueKey,
      props.itemDescriptionKey,
      props.optionDescriptionKey,
      props.itemColorKey,
      props.optionColorKey,
      props.itemPrefixImageKey,
      props.optionPrefixImageKey,
      props.itemPrefixIconKey,
      props.optionPrefixIconKey,
      props.itemPrefixTextKey,
      props.optionPrefixTextKey,
      props.itemTooltipKey,
      props.optionTooltipKey,
      props.itemDisabledKey,
      props.optionDisabledKey,
      props.itemHiddenKey,
      props.optionHiddenKey,
      props.itemParentValueKey,
      props.optionParentValueKey,
      props.itemChildrenKey,
      props.optionChildrenKey,
    ]
  )
  const flatOptions = useMemo(() => flattenSelectOptions(options), [options])

  const selectableOptions = useMemo<Option[]>(
    () =>
      flatOptions
        .filter((option) => !option.separator)
        .filter((option) => !option.hidden)
        .map((option) => ({
          value: option.value,
          label: option.label,
          disabled: option.disabled,
          description: option.caption || option.description,
          meta: option.meta,
          group: option.path.length > 1 ? option.path[0] : '',
        })),
    [flatOptions]
  )

  const optionByValue = useMemo(() => {
    const map = new Map<string, Option>()
    selectableOptions.forEach((option) => {
      map.set(option.value, option)
    })
    return map
  }, [selectableOptions])

  const selectedOptions = useMemo<Option[]>(
    () =>
      selectedValues.map((value) => {
        const resolved = optionByValue.get(value)
        return resolved ?? { value, label: value }
      }),
    [selectedValues, optionByValue]
  )

  const commitValue = (nextValue: string[]) => {
    context?.setState?.({ value: nextValue })
    if (context?.mode !== 'canvas') {
      context?.runActions?.('change', { value: nextValue })
    }
  }

  const control = (
    <MultipleSelector
      value={selectedOptions}
      options={selectableOptions}
      searchable={searchable}
      showSelectAll={showSelectAll}
      placeholder={placeholder}
      searchPlaceholder={searchPlaceholder}
      emptyIndicator={<p className="px-2 py-2 text-center text-sm text-muted-foreground">{emptyMessage}</p>}
      maxSelected={maxSelections}
      maxVisibleBadges={maxVisibleTags}
      hideClearAllButton={!showClear}
      hidePlaceholderWhenSelected
      disabled={props.disabled}
      groupBy="group"
      className={showInsetLabel ? 'border-none bg-transparent shadow-none focus-within:ring-0' : undefined}
      onChange={(nextSelected) => commitValue(nextSelected.map((item) => item.value))}
    />
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
          <label className="pointer-events-none absolute start-2 top-0 z-10 -translate-y-1/2 bg-background px-1 text-xs font-medium text-foreground group-has-[input:disabled]:opacity-50">
            {label}
          </label>
          {control}
        </div>
      ) : null}
      {showInsetLabel ? (
        <div className="overflow-hidden rounded-md border border-input bg-background shadow-xs transition-[color,box-shadow] focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50 has-[input:disabled]:cursor-not-allowed has-[input:disabled]:opacity-50">
          <label className="block px-3 pt-2 text-xs font-medium text-foreground">{label}</label>
          {control}
        </div>
      ) : null}
      {!showDefaultLabel && !showOverlappingLabel && !showInsetLabel ? control : null}
      {props.helperText ? <div className="text-xs text-muted-foreground">{props.helperText}</div> : null}
    </div>
  )
}

export const MultiSelectDefinition = createWidgetDefinition<MultiSelectProps>({
  type: 'MultiSelect',
  label: 'Multi Select',
  category: 'inputs',
  description: 'Select multiple options',
  defaultProps: {
    label: 'Label',
    labelVariant: 'default',
    placeholder: 'Select options',
    searchPlaceholder: 'Search items...',
    value: '[]',
    itemsMode: 'static',
    items: JSON.stringify(
      [
        { label: 'Option 1', value: 'option_1' },
        { label: 'Option 2', value: 'option_2' },
        { label: 'Option 3', value: 'option_3' },
      ],
      null,
      2
    ),
    itemsData: '[]',
    itemLabelKey: 'label',
    itemValueKey: 'value',
    itemDescriptionKey: 'description',
    itemColorKey: '',
    itemPrefixImageKey: '',
    itemPrefixIconKey: '',
    itemPrefixTextKey: '',
    itemTooltipKey: '',
    itemDisabledKey: '',
    itemHiddenKey: '',
    itemParentValueKey: '',
    itemChildrenKey: 'children',
    labels: '[]',
    values: '[]',
    searchable: true,
    showClear: true,
    showSelectAll: false,
    maxSelections: undefined,
    maxVisibleTags: 3,
    emptyMessage: 'No items found',
    size: 4,
    helperText: '',
    disabled: false,
    events: '[]',
  },
  render: (props, context) => <MultiSelectRenderer props={props} context={context} />,
})
