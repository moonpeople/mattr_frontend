import { normalizeArray, parseMaybeJson } from '../helpers'
import { createWidgetDefinition } from '../types'
import { getWidgetButtonClassName, getWidgetButtonStyle } from './button-styles'

export type ButtonGroupItem = {
  label: string
  variant?: string
}

export type ButtonGroupProps = {
  items: string
  selectedIndex: number
  events: unknown[]
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

export const ButtonGroupDefinition = createWidgetDefinition<ButtonGroupProps>({
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
    events: [],
  },
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
          <button
            key={`${item.label}-${index}`}
            type="button"
            className={getWidgetButtonClassName({
              variant: item.variant || 'default',
              size: 'tiny',
              pressed: selectedIndex === index,
            })}
            style={getWidgetButtonStyle({ variant: item.variant || 'default' })}
            onClick={() => {
              context?.setState?.({ selectedIndex: index })
              context?.runActions?.('click', { index, item })
            }}
            aria-pressed={selectedIndex === index}
          >
            {item.label}
          </button>
        ))}
      </div>
    )
  },
})
