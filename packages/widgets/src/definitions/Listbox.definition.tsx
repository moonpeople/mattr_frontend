import { Check } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { ListBox as AriaListBox, ListBoxItem } from 'react-aria-components'
import { cn } from 'ui'

import { Input } from '../shadcn'
import { normalizeString } from '../helpers'
import { createWidgetDefinition, type WidgetRenderContext } from '../types'
import {
  flattenSelectOptions,
  normalizeSelectLabelVariant,
  normalizeSingleSelectValue,
  parseSelectOptionsByMode,
  type SelectOptionNode,
} from './select-utils'

export type ListboxProps = {
  label: string
  labelVariant?: string
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
  searchPlaceholder?: string
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

const ListboxRenderer = ({
  props,
  context,
}: {
  props: ListboxProps
  context?: WidgetRenderContext
}) => {
  const [query, setQuery] = useState('')
  const searchable = parseBoolean(props.searchable)
  const label = normalizeString(props.label, '')
  const labelVariant = normalizeSelectLabelVariant(props.labelVariant)
  const showOverlappingLabel = Boolean(label && labelVariant === 'overlapping')
  const showInsetLabel = Boolean(label && labelVariant === 'inset')
  const showDefaultLabel = Boolean(label && labelVariant === 'default')
  const searchPlaceholder = normalizeString(props.searchPlaceholder, 'Search items...')
  const emptyMessage = normalizeString(props.emptyMessage, 'No items found')
  const selectedValue = normalizeSingleSelectValue(context?.state?.value ?? props.value)
  const [selectedValueLocal, setSelectedValueLocal] = useState(selectedValue)
  const visibleRows =
    typeof props.size === 'number' && Number.isFinite(props.size)
      ? Math.max(2, Math.floor(props.size))
      : 4

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

  const listOptions = useMemo(
    () => flatOptions.filter((option) => !option.separator && !option.hidden),
    [flatOptions]
  )

  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!searchable || !normalizedQuery) {
      return listOptions
    }
    return listOptions.filter((option) =>
      [option.label, option.value, option.description].join(' ').toLowerCase().includes(normalizedQuery)
    )
  }, [listOptions, query, searchable])

  useEffect(() => {
    setSelectedValueLocal(selectedValue)
  }, [selectedValue])

  const commitValue = (nextValue: string) => {
    context?.setState?.({ value: nextValue })
    if (context?.mode !== 'canvas') {
      context?.runActions?.('change', { value: nextValue })
    }
  }

  const inputClassName = cn(
    'h-8',
    showInsetLabel ? 'rounded-none border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0' : null
  )
  const listClassName = cn(
    'overflow-auto rounded-md bg-background p-1',
    showInsetLabel ? 'border-0' : 'border border-input'
  )

  const control = (
    <>
      {searchable ? (
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={searchPlaceholder}
          disabled={props.disabled}
          className={inputClassName}
          onMouseDown={(event) => event.stopPropagation()}
        />
      ) : null}
      <div className={listClassName} style={{ maxHeight: `${visibleRows * 34}px` }}>
        {filteredOptions.length === 0 ? (
          <div className="px-3 py-2 text-sm text-muted-foreground">{emptyMessage}</div>
        ) : (
          <AriaListBox
            aria-label={label || 'Listbox'}
            selectionMode="single"
            selectedKeys={selectedValueLocal ? new Set([selectedValueLocal]) : new Set()}
            disabledKeys={new Set(filteredOptions.filter((option) => option.disabled).map((option) => option.value))}
            onSelectionChange={(keys) => {
              if (keys === 'all') {
                return
              }
              const [first] = Array.from(keys)
              const nextValue = first ? String(first) : ''
              setSelectedValueLocal(nextValue)
              commitValue(nextValue)
            }}
            onAction={(key) => {
              const nextValue = String(key)
              setSelectedValueLocal(nextValue)
              commitValue(nextValue)
            }}
            className="outline-none"
            onMouseDown={(event) => event.stopPropagation()}
          >
            {filteredOptions.map((option) => (
              <ListBoxItem
                id={option.value}
                key={option.value}
                textValue={option.label}
                className={({ isFocused, isFocusVisible }) =>
                  cn(
                    'flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm cursor-pointer outline-none',
                    selectedValueLocal === option.value
                      ? 'bg-accent text-accent-foreground font-medium'
                      : 'hover:bg-muted/50',
                    isFocused || isFocusVisible ? 'ring-1 ring-ring/40' : null
                  )
                }
              >
                {() => (
                  <>
                    <Check
                      className={cn(
                        'h-4 w-4 shrink-0',
                        selectedValueLocal === option.value ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate">{option.label}</div>
                      {option.description ? (
                        <div className="truncate text-xs text-muted-foreground">{option.description}</div>
                      ) : null}
                    </div>
                    {option.meta ? (
                      <div className="ml-auto shrink-0 text-xs text-muted-foreground">{option.meta}</div>
                    ) : null}
                  </>
                )}
              </ListBoxItem>
            ))}
          </AriaListBox>
        )}
      </div>
    </>
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

export const ListboxDefinition = createWidgetDefinition<ListboxProps>({
  type: 'Listbox',
  label: 'Listbox',
  category: 'inputs',
  description: 'Select from a list',
  defaultProps: {
    label: 'Label',
    labelVariant: 'default',
    value: '',
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
    searchable: false,
    searchPlaceholder: 'Search items...',
    emptyMessage: 'No items found',
    size: 4,
    helperText: '',
    disabled: false,
    events: '[]',
  },
  render: (props, context) => <ListboxRenderer props={props} context={context} />,
})
