import { cn } from 'ui'

import type { WidgetDefinition } from '../types'
import { normalizeArray, parseMaybeJson } from '../helpers'

type NavigationItem = {
  label: string
  to?: string
}

type NavigationProps = {
  items: string
  variant: 'horizontal' | 'vertical'
  showPath: boolean
}

export const NavigationWidget: WidgetDefinition<NavigationProps> = {
  type: 'Navigation',
  label: 'Navigation',
  category: 'navigation',
  description: 'Menu links and routes',
  defaultProps: {
    items: JSON.stringify(
      [
        { label: 'Page 1', to: '/page1' },
        { label: 'Page 2', to: '/page2' },
        { label: 'Settings', to: '/settings' },
      ],
      null,
      2
    ),
    variant: 'vertical',
    showPath: false,
  },
  fields: [
    {
      key: 'items',
      label: 'Items (JSON)',
      type: 'json',
      placeholder: '[{\"label\":\"Page 1\",\"to\":\"/page1\"}]',
    },
    {
      key: 'variant',
      label: 'Layout',
      type: 'select',
      options: [
        { label: 'Vertical', value: 'vertical' },
        { label: 'Horizontal', value: 'horizontal' },
      ],
    },
    { key: 'showPath', label: 'Show paths', type: 'boolean' },
  ],
  render: (props) => {
    const parsedItems = normalizeArray<NavigationItem>(parseMaybeJson(props.items), [])
    const items =
      parsedItems.length > 0
        ? parsedItems
        : [
            { label: 'Page 1', to: '/page1' },
            { label: 'Page 2', to: '/page2' },
          ]
    const isHorizontal = props.variant === 'horizontal'

    return (
      <nav
        className={cn(
          'w-full',
          isHorizontal ? 'flex items-center gap-2' : 'flex flex-col gap-1'
        )}
      >
        {items.map((item, index) => {
          const label = item.label || `Item ${index + 1}`
          return (
            <div
              key={`${label}-${index}`}
              className={cn(
                'rounded-md border border-transparent px-3 py-2 text-sm transition',
                index === 0
                  ? 'bg-brand-500/10 text-foreground'
                  : 'text-foreground-muted hover:border-foreground-muted/40 hover:bg-surface-200'
              )}
            >
              <div className="font-medium text-foreground">{label}</div>
              {props.showPath && item.to && (
                <div className="text-xs text-foreground-muted">{item.to}</div>
              )}
            </div>
          )
        })}
      </nav>
    )
  },
}
