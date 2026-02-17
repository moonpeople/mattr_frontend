import { XIcon } from 'lucide-react'
import {
  type ComponentPropsWithoutRef,
  type KeyboardEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  CommandGroup_Shadcn_,
  CommandInput_Shadcn_,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
  CommandSeparator_Shadcn_,
  Command_Shadcn_,
  cn,
} from 'ui'

export type Option = {
  value: string
  label: string
  disabled?: boolean
  fixed?: boolean
  description?: string
  icon?: string
  prefix?: string
  meta?: string
  [key: string]: string | boolean | undefined
}

type GroupedOptions = Record<string, Option[]>

const groupOptions = (options: Option[], groupBy?: string) => {
  if (!groupBy) {
    return { '': options } as GroupedOptions
  }

  return options.reduce<GroupedOptions>((acc, option) => {
    const key = typeof option[groupBy] === 'string' ? (option[groupBy] as string) : ''
    if (!acc[key]) {
      acc[key] = []
    }
    acc[key].push(option)
    return acc
  }, {})
}

const filterGroupedOptions = (grouped: GroupedOptions, search: string) => {
  const query = search.trim().toLowerCase()
  if (!query) {
    return grouped
  }

  return Object.entries(grouped).reduce<GroupedOptions>((acc, [group, options]) => {
    const filtered = options.filter((option) =>
      [option.label, option.value, option.description, option.meta].join(' ').toLowerCase().includes(query)
    )
    if (filtered.length > 0) {
      acc[group] = filtered
    }
    return acc
  }, {})
}

const removeSelectedFromGroups = (groups: GroupedOptions, selected: Option[]) => {
  const selectedValues = new Set(selected.map((item) => item.value))
  return Object.entries(groups).reduce<GroupedOptions>((acc, [group, options]) => {
    const nextOptions = options.filter((option) => !selectedValues.has(option.value))
    if (nextOptions.length > 0) {
      acc[group] = nextOptions
    }
    return acc
  }, {})
}

export type MultipleSelectorProps = {
  value?: Option[]
  defaultOptions?: Option[]
  options?: Option[]
  searchable?: boolean
  showSelectAll?: boolean
  selectAllLabel?: string
  placeholder?: string
  searchPlaceholder?: string
  emptyIndicator?: ReactNode
  maxSelected?: number
  maxVisibleBadges?: number
  onMaxSelected?: (limit: number) => void
  hidePlaceholderWhenSelected?: boolean
  disabled?: boolean
  groupBy?: string
  className?: string
  badgeClassName?: string
  hideClearAllButton?: boolean
  onChange?: (options: Option[]) => void
  commandProps?: ComponentPropsWithoutRef<typeof Command_Shadcn_>
  inputProps?: Omit<
    ComponentPropsWithoutRef<typeof CommandInput_Shadcn_>,
    'value' | 'onValueChange' | 'placeholder' | 'disabled'
  >
}

export const MultipleSelector = ({
  value,
  defaultOptions = [],
  options,
  searchable = true,
  showSelectAll = false,
  selectAllLabel = 'Select all',
  placeholder = 'Select options',
  searchPlaceholder = 'Search options...',
  emptyIndicator = <p className="px-2 py-2 text-center text-sm text-muted-foreground">No results found</p>,
  maxSelected = Number.MAX_SAFE_INTEGER,
  maxVisibleBadges,
  onMaxSelected,
  hidePlaceholderWhenSelected = false,
  disabled = false,
  groupBy,
  className,
  badgeClassName,
  hideClearAllButton = false,
  onChange,
  commandProps,
  inputProps,
}: MultipleSelectorProps) => {
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Option[]>(value ?? [])

  const sourceOptions = options ?? defaultOptions

  useEffect(() => {
    if (value) {
      setSelected(value)
    }
  }, [value])

  useEffect(() => {
    if (!open) {
      return
    }

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      if (!rootRef.current) {
        return
      }
      if (!rootRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    window.addEventListener('mousedown', onPointerDown)
    window.addEventListener('touchend', onPointerDown)

    return () => {
      window.removeEventListener('mousedown', onPointerDown)
      window.removeEventListener('touchend', onPointerDown)
    }
  }, [open])

  const groupedOptions = useMemo(() => groupOptions(sourceOptions, groupBy), [sourceOptions, groupBy])
  const filteredGrouped = useMemo(() => filterGroupedOptions(groupedOptions, search), [groupedOptions, search])
  const selectableGroups = useMemo(
    () => removeSelectedFromGroups(filteredGrouped, selected),
    [filteredGrouped, selected]
  )

  const hasSelectableItems = useMemo(
    () => Object.values(selectableGroups).some((groupItems) => groupItems.length > 0),
    [selectableGroups]
  )
  const allSelectableOptions = useMemo(
    () => Object.values(groupedOptions).flat().filter((option) => !option.disabled),
    [groupedOptions]
  )
  const hiddenBadgeCount =
    typeof maxVisibleBadges === 'number' && Number.isFinite(maxVisibleBadges)
      ? Math.max(0, selected.length - Math.max(1, Math.floor(maxVisibleBadges)))
      : 0
  const visibleBadges =
    typeof maxVisibleBadges === 'number' && Number.isFinite(maxVisibleBadges)
      ? selected.slice(0, Math.max(1, Math.floor(maxVisibleBadges)))
      : selected

  const handleUnselect = (option: Option) => {
    const nextSelected = selected.filter((item) => item.value !== option.value)
    setSelected(nextSelected)
    onChange?.(nextSelected)
  }

  const handleSelect = (option: Option) => {
    if (selected.length >= maxSelected) {
      onMaxSelected?.(maxSelected)
      return
    }
    const nextSelected = [...selected, option]
    setSelected(nextSelected)
    onChange?.(nextSelected)
    setSearch('')
  }

  const handleSelectAll = () => {
    const selectedValues = new Set(selected.map((option) => option.value))
    const available = allSelectableOptions.filter((option) => !selectedValues.has(option.value))
    if (available.length === 0) {
      return
    }

    const room = Math.max(0, maxSelected - selected.length)
    const additions = available.slice(0, room)
    if (additions.length === 0) {
      onMaxSelected?.(maxSelected)
      return
    }

    const nextSelected = [...selected, ...additions]
    setSelected(nextSelected)
    onChange?.(nextSelected)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (disabled) {
      return
    }

    if ((event.key === 'Backspace' || event.key === 'Delete') && !search && selected.length > 0) {
      const lastOption = selected[selected.length - 1]
      if (!lastOption?.fixed) {
        handleUnselect(lastOption)
      }
    }

    if (event.key === 'Escape') {
      setOpen(false)
      inputRef.current?.blur()
    }
  }

  return (
    <Command_Shadcn_
      ref={rootRef}
      {...commandProps}
      className={cn('h-auto overflow-visible bg-transparent', commandProps?.className)}
      onKeyDown={(event) => {
        handleKeyDown(event)
        commandProps?.onKeyDown?.(event)
      }}
      shouldFilter={false}
    >
      <div
        className={cn(
          'relative min-h-[36px] rounded-md border border-input text-sm outline-none transition-[color,box-shadow] focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50',
          'has-[input:disabled]:pointer-events-none has-[input:disabled]:cursor-not-allowed has-[input:disabled]:opacity-50',
          !hideClearAllButton ? 'pe-9' : null,
          selected.length > 0 ? 'p-1' : null,
          className
        )}
        onClick={() => {
          if (!disabled) {
            inputRef.current?.focus()
            setOpen(true)
          }
        }}
      >
        <div className="flex flex-wrap gap-1">
          {visibleBadges.map((option) => (
            <div
              key={option.value}
              className={cn(
                'relative inline-flex h-7 items-center rounded-md border bg-background ps-2 pe-7 text-xs font-medium',
                'data-[fixed=true]:pe-2',
                badgeClassName
              )}
              data-fixed={option.fixed || undefined}
            >
              {option.label}
              {!option.fixed ? (
                <button
                  type="button"
                  aria-label="Remove"
                  className="absolute -end-px -inset-y-px flex size-7 items-center justify-center rounded-e-md text-muted-foreground/80 hover:text-foreground"
                  onClick={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                    handleUnselect(option)
                  }}
                >
                  <XIcon size={14} />
                </button>
              ) : null}
            </div>
          ))}
          {hiddenBadgeCount > 0 ? (
            <span className="inline-flex h-7 items-center rounded-md border bg-background px-2 text-xs font-medium text-muted-foreground">
              +{hiddenBadgeCount}
            </span>
          ) : null}
          {!searchable && selected.length === 0 ? (
            <span className="px-3 py-2 text-sm text-muted-foreground/70">{placeholder}</span>
          ) : null}
          <CommandInput_Shadcn_
            ref={inputRef}
            {...inputProps}
            value={search}
            onValueChange={(value) => {
              setSearch(value)
            }}
            placeholder={hidePlaceholderWhenSelected && selected.length > 0 ? '' : searchPlaceholder || placeholder}
            disabled={disabled}
            className={cn(
              'flex-1 border-0 bg-transparent px-2 py-1.5 text-sm outline-none placeholder:text-muted-foreground/70',
              !searchable ? 'h-0 w-0 p-0 opacity-0' : null,
              selected.length === 0 ? 'px-3 py-2' : null,
              inputProps?.className
            )}
            onFocus={(event) => {
              setOpen(true)
              inputProps?.onFocus?.(event)
            }}
            onBlur={(event) => {
              inputProps?.onBlur?.(event)
            }}
          />
          {!hideClearAllButton && selected.length > 0 ? (
            <button
              type="button"
              aria-label="Clear all"
              className="absolute end-0 top-0 flex size-9 items-center justify-center text-muted-foreground/80 hover:text-foreground"
              onClick={(event) => {
                event.preventDefault()
                event.stopPropagation()
                const fixedOnly = selected.filter((option) => option.fixed)
                setSelected(fixedOnly)
                onChange?.(fixedOnly)
              }}
            >
              <XIcon size={16} />
            </button>
          ) : null}
        </div>
      </div>

      <div className="relative">
        <div
          className={cn(
            'absolute top-2 z-10 w-full overflow-hidden rounded-md border border-input bg-popover text-popover-foreground shadow-lg',
            !open ? 'hidden' : null
          )}
        >
          <CommandList_Shadcn_
            onMouseDown={(event) => {
              event.preventDefault()
              event.stopPropagation()
            }}
          >
            {showSelectAll ? (
              <CommandGroup_Shadcn_>
                <CommandItem_Shadcn_
                  disabled={disabled || allSelectableOptions.length === 0}
                  value="__select_all__"
                  onSelect={handleSelectAll}
                >
                  {selectAllLabel}
                </CommandItem_Shadcn_>
              </CommandGroup_Shadcn_>
            ) : null}
            {showSelectAll ? <CommandSeparator_Shadcn_ /> : null}
            {!hasSelectableItems ? (
              <CommandItem_Shadcn_ disabled value="__empty__">
                {emptyIndicator}
              </CommandItem_Shadcn_>
            ) : null}
            {Object.entries(selectableGroups).map(([group, groupItems], groupIndex) => (
              <div key={`${group}-${groupIndex}`}>
                {group ? (
                  <div className="px-2 py-1 text-xs font-medium text-muted-foreground">{group}</div>
                ) : null}
                <CommandGroup_Shadcn_>
                  {groupItems.map((option) => (
                    <CommandItem_Shadcn_
                      key={option.value}
                      value={option.value}
                      disabled={option.disabled}
                      className={cn(option.disabled ? 'pointer-events-none opacity-50' : null)}
                      onSelect={() => {
                        handleSelect(option)
                      }}
                    >
                      <span className="truncate">{option.label}</span>
                    </CommandItem_Shadcn_>
                  ))}
                </CommandGroup_Shadcn_>
                {groupIndex < Object.keys(selectableGroups).length - 1 ? <CommandSeparator_Shadcn_ /> : null}
              </div>
            ))}
          </CommandList_Shadcn_>
        </div>
      </div>
    </Command_Shadcn_>
  )
}

MultipleSelector.displayName = 'MultipleSelector'

export default MultipleSelector
