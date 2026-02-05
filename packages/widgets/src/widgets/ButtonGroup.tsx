import { Button } from 'ui'

import type { WidgetDefinition } from '../types'
import { normalizeArray, parseMaybeJson } from '../helpers'

type ButtonGroupItem = {
  label: string
  variant?: string
}

type ButtonGroupProps = {
  items: string
  selectedIndex: number
  events: string
}

const normalizeItems = (raw: unknown): ButtonGroupItem[] => {
  const parsed = normalizeArray<ButtonGroupItem | string>(parseMaybeJson(raw), [])
  if (parsed.length === 0) {
    return []
  }
  if (typeof parsed[0] === 'string') {
    return (parsed as string[]).map((item) => ({ label: item }))
  }
  return (parsed as ButtonGroupItem[]).map((item) => ({
    label: String(item.label ?? ''),
    variant: item.variant ? String(item.variant) : undefined,
  }))
}

export const ButtonGroupWidget: WidgetDefinition<ButtonGroupProps> = {
  type: 'ButtonGroup',
  label: 'Button Group',
  category: 'buttons',
  description: 'Grouped buttons',
  defaultProps: {
    items: JSON.stringify(
      [
        { label: 'Solid', variant: 'primary' },
        { label: 'Outline', variant: 'outline' },
        { label: 'Danger', variant: 'danger' },
      ],
      null,
      2
    ),
    selectedIndex: -1,
    events: '[]',
  },
  fields: [
    {
      key: 'items',
      label: 'Items (JSON)',
      type: 'json',
      placeholder: '[{\"label\":\"Solid\",\"variant\":\"primary\"}]',
    },
    { key: 'selectedIndex', label: 'Selected index', type: 'number', min: -1, step: 1 },
    {
      key: 'events',
      label: 'Events (JSON)',
      type: 'json',
      placeholder: '[{\"event\":\"click\",\"type\":\"query\",\"queryName\":\"onClick\"}]',
    },
  ],
  render: (props, context) => {
    const items = normalizeItems(props.items)
    const safeItems =
      items.length > 0
        ? items
        : [
            { label: 'Solid', variant: 'primary' },
            { label: 'Outline', variant: 'outline' },
            { label: 'Danger', variant: 'danger' },
          ]

    const selectedIndex =
      (context?.state?.selectedIndex as number | undefined) ?? props.selectedIndex ?? -1

    return (
      <div className="flex flex-wrap gap-2">
        {safeItems.map((item, index) => (
          <Button
            key={`${item.label}-${index}`}
            type={(item.variant as any) || 'default'}
            size="tiny"
            onClick={() => {
              context?.setState?.({ selectedIndex: index })
              context?.runActions?.('click', { index, item })
            }}
            aria-pressed={selectedIndex === index}
          >
            {item.label}
          </Button>
        ))}
      </div>
    )
  },
}
