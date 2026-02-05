import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'ui'

import type { WidgetDefinition } from '../types'
import { normalizeArray, parseMaybeJson } from '../helpers'

type DropdownItem = {
  label: string
  value?: string
}

type DropdownButtonProps = {
  label: string
  items: string
  disabled: boolean
  events: string
}

const normalizeItems = (raw: unknown): DropdownItem[] => {
  const parsed = normalizeArray<DropdownItem | string>(parseMaybeJson(raw), [])
  if (parsed.length === 0) {
    return []
  }
  if (typeof parsed[0] === 'string') {
    return (parsed as string[]).map((item) => ({ label: item, value: item }))
  }
  return (parsed as DropdownItem[]).map((item) => ({
    label: String(item.label ?? ''),
    value: item.value ? String(item.value) : String(item.label ?? ''),
  }))
}

export const DropdownButtonWidget: WidgetDefinition<DropdownButtonProps> = {
  type: 'DropdownButton',
  label: 'Dropdown Button',
  category: 'buttons',
  description: 'Button with dropdown menu',
  defaultProps: {
    label: 'Menu',
    items: JSON.stringify(['Option 1', 'Option 2', 'Option 3'], null, 2),
    disabled: false,
    events: '[]',
  },
  fields: [
    { key: 'label', label: 'Label', type: 'text', placeholder: 'Menu' },
    {
      key: 'items',
      label: 'Items (JSON)',
      type: 'json',
      placeholder: '[\"Option 1\",\"Option 2\"]',
    },
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

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="outline" size="tiny" disabled={props.disabled}>
            {props.label}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {safeItems.map((item, index) => (
            <DropdownMenuItem
              key={`${item.label}-${index}`}
              onClick={() => context?.runActions?.('select', { index, item })}
            >
              {item.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  },
}
