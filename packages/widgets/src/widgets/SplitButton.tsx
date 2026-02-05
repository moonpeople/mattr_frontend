import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'ui'

import type { WidgetDefinition } from '../types'
import { normalizeArray, parseMaybeJson } from '../helpers'

type SplitButtonItem = {
  label: string
  value?: string
}

type SplitButtonProps = {
  items: string
  selectedIndex: number
  disabled: boolean
  events: string
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

export const SplitButtonWidget: WidgetDefinition<SplitButtonProps> = {
  type: 'SplitButton',
  label: 'Split Button',
  category: 'buttons',
  description: 'Primary action with dropdown',
  defaultProps: {
    items: JSON.stringify(['Option 1', 'Option 2', 'Option 3'], null, 2),
    selectedIndex: 0,
    disabled: false,
    events: '[]',
  },
  fields: [
    {
      key: 'items',
      label: 'Items (JSON)',
      type: 'json',
      placeholder: '[\"Option 1\",\"Option 2\"]',
    },
    { key: 'selectedIndex', label: 'Selected index', type: 'number', min: 0, step: 1 },
    { key: 'disabled', label: 'Disabled', type: 'boolean' },
    {
      key: 'events',
      label: 'Events (JSON)',
      type: 'json',
      placeholder: '[{\"event\":\"select\",\"type\":\"query\",\"queryName\":\"onSelect\"}]',
    },
  ],
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

    return (
      <DropdownMenu>
        <div className="inline-flex items-center rounded-md border border-input overflow-hidden">
          <Button
            type="primary"
            size="tiny"
            disabled={props.disabled}
            className="rounded-none"
            onClick={() => updateSelection(selectedIndex, selected)}
          >
            {selected?.label ?? 'Select'}
          </Button>
          <DropdownMenuTrigger asChild>
            <Button
              type="outline"
              size="tiny"
              disabled={props.disabled}
              className="rounded-none border-l border-input"
            >
              ▾
            </Button>
          </DropdownMenuTrigger>
        </div>
        <DropdownMenuContent>
          {safeItems.map((item, index) => (
            <DropdownMenuItem
              key={`${item.label}-${index}`}
              onClick={() => updateSelection(index, item)}
            >
              {item.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  },
}
