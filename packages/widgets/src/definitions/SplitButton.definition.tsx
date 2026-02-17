import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'ui'
import { Check, ChevronDown } from 'lucide-react'

import { normalizeArray, parseMaybeJson } from '../helpers'
import { createWidgetDefinition } from '../types'
import { getWidgetButtonClassName, getWidgetButtonStyle } from './button-styles'

export type SplitButtonItem = {
  label: string
  value?: string
}

export type SplitButtonProps = {
  items: string
  selectedIndex: number
  disabled: boolean
  events: unknown[]
}

const normalizeItems = (raw: unknown): SplitButtonItem[] => {
  const parsed = normalizeArray<SplitButtonItem | string>(parseMaybeJson(raw), [])
  if (parsed.length === 0) {
    return []
  }
  if (typeof parsed[0] === 'string') {
    return (parsed as string[]).map((item) => ({ label: item, value: item }))
  }
  return (parsed as SplitButtonItem[]).map((item) => ({
    label: String(item.label ?? ''),
    value: item.value ? String(item.value) : String(item.label ?? ''),
  }))
}

export const SplitButtonDefinition = createWidgetDefinition<SplitButtonProps>({
  type: 'SplitButton',
  label: 'Split Button',
  category: 'buttons',
  description: 'Primary action with dropdown',
  defaultProps: {
    items: JSON.stringify(['Option 1', 'Option 2', 'Option 3'], null, 2),
    selectedIndex: 0,
    disabled: false,
    events: [],
  },
  render: (props, context) => {
    const items = normalizeItems(props.items)
    const safeItems = items.length > 0 ? items : [{ label: 'Option 1' }, { label: 'Option 2' }]
    const selectedIndex =
      (context?.state?.selectedIndex as number | undefined) ?? props.selectedIndex ?? 0
    const selected = safeItems[Math.max(0, Math.min(selectedIndex, safeItems.length - 1))]

    const updateSelection = (index: number, item: SplitButtonItem) => {
      context?.setState?.({ selectedIndex: index })
      context?.runActions?.('select', { index, item })
    }

    const triggerPrimary = () => {
      if (!selected) {
        return
      }
      context?.runActions?.('click', { index: selectedIndex, item: selected })
    }

    return (
      <DropdownMenu>
        <div className="inline-flex w-full items-center overflow-hidden rounded-md border border-input">
          <button
            type="button"
            className={getWidgetButtonClassName({
              variant: 'primary',
              size: 'tiny',
              className: 'min-w-0 flex-1 rounded-none border-0',
            })}
            style={getWidgetButtonStyle({ variant: 'primary' })}
            disabled={props.disabled}
            onClick={triggerPrimary}
          >
            <span className="truncate">{selected?.label ?? 'Select'}</span>
          </button>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={getWidgetButtonClassName({
                variant: 'outline',
                size: 'tiny',
                className: 'shrink-0 rounded-none border-y-0 border-r-0 border-l border-input px-2',
              })}
              style={getWidgetButtonStyle({ variant: 'outline' })}
              disabled={props.disabled}
            >
              <ChevronDown size={14} />
              <span className="sr-only">Open options</span>
            </button>
          </DropdownMenuTrigger>
        </div>
        <DropdownMenuContent>
          {safeItems.map((item, index) => (
            <DropdownMenuItem
              key={`${item.label}-${index}`}
              onClick={() => updateSelection(index, item)}
              className="flex items-center justify-between gap-2"
            >
              {item.label}
              {index === selectedIndex ? <Check size={14} className="text-primary" /> : null}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  },
})
