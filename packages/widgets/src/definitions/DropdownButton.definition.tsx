import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'ui'
import { ChevronDown } from 'lucide-react'

import { normalizeArray, parseMaybeJson } from '../helpers'
import { createWidgetDefinition } from '../types'
import { getWidgetButtonClassName, getWidgetButtonStyle } from './button-styles'

export type DropdownItem = {
  label: string
  value?: string
}

export type DropdownButtonProps = {
  label: string
  items: string
  disabled: boolean
  events: unknown[]
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

export const DropdownButtonDefinition = createWidgetDefinition<DropdownButtonProps>({
  type: 'DropdownButton',
  label: 'Dropdown Button',
  category: 'buttons',
  description: 'Button with dropdown menu',
  defaultProps: {
    label: 'Menu',
    items: JSON.stringify(['Option 1', 'Option 2', 'Option 3'], null, 2),
    disabled: false,
    events: [],
  },
  render: (props, context) => {
    const items = normalizeItems(props.items)
    const safeItems = items.length > 0 ? items : [{ label: 'Option 1' }, { label: 'Option 2' }]

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={getWidgetButtonClassName({
              variant: 'outline',
              size: 'tiny',
              fullWidth: true,
            })}
            style={getWidgetButtonStyle({ variant: 'outline' })}
            disabled={props.disabled}
            onClick={() => context?.runActions?.('click')}
          >
            <span className="truncate">{props.label}</span>
            <ChevronDown size={14} />
          </button>
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
})
