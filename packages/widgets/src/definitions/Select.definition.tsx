import { X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { cn } from 'ui'

import { normalizeString } from '../helpers'
import { createWidgetDefinition, type WidgetRenderContext } from '../types'
import {
  Input,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '../shadcn'
import {
  flattenSelectOptions,
  normalizeSelectLabelVariant,
  normalizeSingleSelectValue,
  parseSelectOptionsByMode,
  type SelectOptionNode,
} from './select-utils'

export type SelectProps = {
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
  emptyMessage?: string
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
]

const SelectRenderer = ({
  props,
  context,
}: {
  props: SelectProps
  context?: WidgetRenderContext
}) => {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const searchable = parseBoolean(props.searchable, true)
  const showClear = parseBoolean(props.showClear)
  const label = normalizeString(props.label, '')
  const labelVariant = normalizeSelectLabelVariant(props.labelVariant)
  const showOverlappingLabel = Boolean(label && labelVariant === 'overlapping')
  const showInsetLabel = Boolean(label && labelVariant === 'inset')
  const showDefaultLabel = Boolean(label && labelVariant === 'default')
  const placeholder = normalizeString(props.placeholder, 'Select option')
  const searchPlaceholder = normalizeString(props.searchPlaceholder, 'Search items...')
  const emptyMessage = normalizeString(props.emptyMessage, 'No items found')
  const selectedValue = normalizeSingleSelectValue(context?.state?.value ?? props.value)

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

  const groupedOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    const grouped: Array<{ key: string; label: string; items: typeof flatOptions }> = []
    const groupIndexByKey = new Map<string, number>()

    flatOptions.forEach((option) => {
      if (option.separator || option.hidden) {
        return
      }
      if (
        normalizedQuery &&
        ![option.label, option.value, option.description, option.meta].join(' ').toLowerCase().includes(normalizedQuery)
      ) {
        return
      }

      const groupKey = option.path.length > 1 ? option.path[0] : '__root__'
      const groupLabel = option.path.length > 1 ? option.path[0] : ''
      const existingIndex = groupIndexByKey.get(groupKey)
      if (existingIndex === undefined) {
        groupIndexByKey.set(groupKey, grouped.length)
        grouped.push({ key: groupKey, label: groupLabel, items: [option] })
        return
      }
      grouped[existingIndex]?.items.push(option)
    })

    return grouped
  }, [flatOptions, query])

  const hasOptions = groupedOptions.some((group) => group.items.length > 0)

  const commitValue = (nextValue: string) => {
    context?.setState?.({ value: nextValue })
    if (context?.mode !== 'canvas') {
      context?.runActions?.('change', { value: nextValue })
    }
  }

  const triggerClassName = cn(
    'h-9 w-full px-3 text-left font-normal',
    showClear && selectedValue ? 'pr-9' : null,
    showInsetLabel ? 'border-none bg-transparent shadow-none focus:ring-0 focus:ring-offset-0' : null
  )

  const control = (
    <div className="relative">
      <Select
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen)
          if (!nextOpen) {
            setQuery('')
          }
        }}
        value={selectedValue || undefined}
        onValueChange={commitValue}
        disabled={props.disabled}
      >
        <SelectTrigger className={triggerClassName} onMouseDown={(event) => event.stopPropagation()}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {searchable ? (
            <div className="border-b border-border p-1">
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => event.stopPropagation()}
                placeholder={searchPlaceholder}
                className="h-8"
              />
            </div>
          ) : null}
          {hasOptions ? (
            groupedOptions.map((group) => (
              <SelectGroup key={group.key}>
                {group.label ? <SelectLabel>{group.label}</SelectLabel> : null}
                {group.items.map((option) => (
                  <SelectItem key={option.value} value={option.value} disabled={option.disabled}>
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="truncate">{option.label}</span>
                      {option.meta ? (
                        <span className="ml-auto text-xs text-muted-foreground">{option.meta}</span>
                      ) : null}
                    </div>
                  </SelectItem>
                ))}
              </SelectGroup>
            ))
          ) : (
            <div className="px-2 py-2 text-sm text-muted-foreground">{emptyMessage}</div>
          )}
        </SelectContent>
      </Select>
      {showClear && selectedValue ? (
        <button
          type="button"
          className="absolute right-7 top-1/2 z-10 -translate-y-1/2 rounded-sm p-0.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          onMouseDown={(event) => {
            event.preventDefault()
            event.stopPropagation()
          }}
          onClick={(event) => {
            event.preventDefault()
            event.stopPropagation()
            commitValue('')
          }}
          aria-label="Clear selection"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </div>
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
          <label className="pointer-events-none absolute start-2 top-0 z-10 -translate-y-1/2 bg-background px-1 text-xs font-medium text-foreground group-has-[button:disabled]:opacity-50">
            {label}
          </label>
          {control}
        </div>
      ) : null}
      {showInsetLabel ? (
        <div className="relative rounded-md border border-input bg-background shadow-xs transition-[color,box-shadow] focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50 has-[button:disabled]:cursor-not-allowed has-[button:disabled]:opacity-50">
          <label className="block px-3 pt-2 text-xs font-medium text-foreground">{label}</label>
          {control}
        </div>
      ) : null}
      {!showDefaultLabel && !showOverlappingLabel && !showInsetLabel ? control : null}
      {props.helperText ? <div className="text-xs text-muted-foreground">{props.helperText}</div> : null}
    </div>
  )
}

export const SelectDefinition = createWidgetDefinition<SelectProps>({
  type: 'Select',
  label: 'Select',
  category: 'inputs',
  description: 'Dropdown select input',
  defaultProps: {
    label: 'Label',
    labelVariant: 'default',
    placeholder: 'Select option',
    searchPlaceholder: 'Search items...',
    value: '',
    itemsMode: 'static',
    items: JSON.stringify(
      [
        { label: 'Option 1', value: 'option_1' },
        { label: 'Option 2', value: 'option_2' },
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
    showClear: false,
    emptyMessage: 'No items found',
    helperText: '',
    disabled: false,
    events: '[]',
  },
  render: (props, context) => <SelectRenderer props={props} context={context} />,
})
