import { ChevronRight, X } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { cn } from 'ui'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  Input,
} from '../shadcn'
import { normalizeString } from '../helpers'
import { createWidgetDefinition, type WidgetRenderContext } from '../types'
import {
  flattenSelectOptions,
  normalizeSelectLabelVariant,
  normalizeSingleSelectValue,
  parseSelectOptionsByMode,
  type SelectOptionNode,
} from './select-utils'

export type CascaderProps = {
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
  placeholder: string
  searchable?: boolean
  searchPlaceholder?: string
  showClear?: boolean
  showPath?: boolean
  pathSeparator?: string
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
  {
    label: 'Clothing',
    value: 'clothing',
    children: [
      { label: 'Pants', value: 'pants' },
      { label: 'Shoes', value: 'shoes' },
    ],
  },
  {
    label: 'Accessories',
    value: 'accessories',
    children: [
      { label: 'Hats', value: 'hats' },
      { label: 'Bags', value: 'bags' },
    ],
  },
]

const CascaderRenderer = ({
  props,
  context,
}: {
  props: CascaderProps
  context?: WidgetRenderContext
}) => {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  const selectedValue = normalizeSingleSelectValue(context?.state?.value ?? props.value)
  const searchable = parseBoolean(props.searchable, true)
  const showClear = parseBoolean(props.showClear)
  const label = normalizeString(props.label, '')
  const labelVariant = normalizeSelectLabelVariant(props.labelVariant)
  const showOverlappingLabel = Boolean(label && labelVariant === 'overlapping')
  const showInsetLabel = Boolean(label && labelVariant === 'inset')
  const showDefaultLabel = Boolean(label && labelVariant === 'default')
  const showPath = parseBoolean(props.showPath, true)
  const separator = normalizeString(props.pathSeparator, ' / ') || ' / '
  const placeholder = normalizeString(props.placeholder, 'Select an option')
  const searchPlaceholder = normalizeString(props.searchPlaceholder, 'Search items...')
  const emptyMessage = normalizeString(props.emptyMessage, 'No items found')

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

  const flatLeafOptions = useMemo(
    () => flattenSelectOptions(options, { separator }),
    [options, separator]
  )

  const selectedOption = flatLeafOptions.find((option) => option.value === selectedValue) ?? null

  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!searchable || !normalizedQuery) {
      return flatLeafOptions.filter((option) => !option.separator && !option.hidden)
    }

    return flatLeafOptions.filter(
      (option) =>
        !option.separator &&
        !option.hidden &&
        [option.label, option.value, option.description].join(' ').toLowerCase().includes(normalizedQuery)
    )
  }, [flatLeafOptions, query, searchable])

  const commitValue = (nextValue: string) => {
    context?.setState?.({ value: nextValue })
    if (context?.mode !== 'canvas') {
      context?.runActions?.('change', { value: nextValue })
    }
  }

  const selectValue = (value: string) => {
    commitValue(value)
    setOpen(false)
    setQuery('')
  }

  const renderNodes = (nodes: SelectOptionNode[], parentPath: string[] = []): ReactNode[] => {
    return nodes.map((node, index) => {
      if (node.separator) {
        return <DropdownMenuSeparator key={`separator-${parentPath.join('.')}-${index}`} />
      }
      if (node.hidden) {
        return null
      }

      const currentPath = [...parentPath, node.label]
      const hasChildren = Boolean(node.children && node.children.length > 0)
      const itemLabel = showPath ? currentPath.join(separator) : node.label

      if (hasChildren) {
        return (
          <DropdownMenuSub key={`${node.value}-${currentPath.join('.')}`}>
            <DropdownMenuSubTrigger disabled={node.disabled} className="gap-2">
              <span className="truncate">{itemLabel}</span>
              <ChevronRight className="ml-auto h-4 w-4 opacity-70" />
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="max-h-80 overflow-auto">
              {renderNodes(node.children ?? [], currentPath)}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        )
      }

      return (
        <DropdownMenuItem
          key={`${node.value}-${currentPath.join('.')}`}
          disabled={node.disabled}
          onSelect={() => {
            selectValue(node.value)
          }}
        >
          <span className="truncate">{itemLabel}</span>
          {node.meta ? <span className="ml-auto text-xs text-muted-foreground">{node.meta}</span> : null}
        </DropdownMenuItem>
      )
    })
  }

  const triggerClassName = cn(
    'h-9 w-full rounded-md border border-input bg-background px-3 text-left text-sm font-normal shadow-xs outline-none transition-[color,box-shadow] hover:bg-accent/20 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
    showClear && selectedOption ? 'pr-9' : null,
    showInsetLabel ? 'border-none bg-transparent shadow-none focus-visible:ring-0' : null
  )

  const control = (
    <div className="relative">
      <DropdownMenu
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen)
          if (!nextOpen) {
            setQuery('')
          }
        }}
      >
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            disabled={props.disabled}
            className={triggerClassName}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <span className={cn('block truncate', !selectedOption ? 'text-muted-foreground' : null)}>
              {selectedOption
                ? showPath
                  ? selectedOption.path.join(separator)
                  : selectedOption.path[selectedOption.path.length - 1]
                : placeholder}
            </span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="min-w-[220px] max-w-[420px] p-1" align="start" sideOffset={4}>
          {searchable ? (
            <div className="border-b border-border p-1">
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={searchPlaceholder}
                className="h-8"
                onKeyDown={(event) => event.stopPropagation()}
              />
            </div>
          ) : null}

          {searchable && query.trim() ? (
            filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <DropdownMenuItem
                  key={`search-${option.value}`}
                  disabled={option.disabled}
                  onSelect={() => {
                    selectValue(option.value)
                  }}
                >
                  <span className="truncate">{option.path.join(separator)}</span>
                  {option.meta ? <span className="ml-auto text-xs text-muted-foreground">{option.meta}</span> : null}
                </DropdownMenuItem>
              ))
            ) : (
              <div className="px-2 py-2 text-sm text-muted-foreground">{emptyMessage}</div>
            )
          ) : (
            renderNodes(options)
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {showClear && selectedOption ? (
        <button
          type="button"
          className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-sm p-0.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          onMouseDown={(event) => {
            event.preventDefault()
            event.stopPropagation()
          }}
          onClick={(event) => {
            event.preventDefault()
            event.stopPropagation()
            commitValue('')
            setQuery('')
            setOpen(false)
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

export const CascaderDefinition = createWidgetDefinition<CascaderProps>({
  type: 'Cascader',
  label: 'Cascader',
  category: 'inputs',
  description: 'Select from hierarchical options',
  defaultProps: {
    label: 'Label',
    labelVariant: 'default',
    value: '',
    itemsMode: 'static',
    items: JSON.stringify(
      [
        {
          label: 'Clothing',
          children: [
            { label: 'Pants', value: 'pants' },
            { label: 'Shoes', value: 'shoes' },
          ],
        },
        {
          label: 'Accessories',
          children: [
            { label: 'Hats', value: 'hats' },
            { label: 'Bags', value: 'bags' },
          ],
        },
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
    placeholder: 'Select an option',
    searchable: true,
    searchPlaceholder: 'Search items...',
    showClear: true,
    showPath: true,
    pathSeparator: ' / ',
    emptyMessage: 'No items found',
    helperText: '',
    disabled: false,
    events: '[]',
  },
  render: (props, context) => <CascaderRenderer props={props} context={context} />,
})
