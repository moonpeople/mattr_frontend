import {
  Breadcrumb_Shadcn_,
  BreadcrumbItem_Shadcn_,
  BreadcrumbLink_Shadcn_,
  BreadcrumbList_Shadcn_,
  BreadcrumbPage_Shadcn_,
  BreadcrumbSeparator_Shadcn_,
} from 'ui'

import type { WidgetDefinition } from '../types'
import { normalizeArray, parseMaybeJson } from '../helpers'

type BreadcrumbItem = {
  label: string
  href?: string
}

type BreadcrumbsProps = {
  items: string
  activeIndex: number
  disabled: boolean
  events: string
}

export const BreadcrumbsWidget: WidgetDefinition<BreadcrumbsProps> = {
  type: 'Breadcrumbs',
  label: 'Breadcrumbs',
  category: 'navigation',
  description: 'Breadcrumb navigation trail',
  defaultProps: {
    items: JSON.stringify(
      [
        { label: 'Home', href: '/' },
        { label: 'Page', href: '/page' },
        { label: 'Current' },
      ],
      null,
      2
    ),
    activeIndex: -1,
    disabled: false,
    events: '[]',
  },
  fields: [
    {
      key: 'items',
      label: 'Items (JSON)',
      type: 'json',
      placeholder: '[{\"label\":\"Home\",\"href\":\"/\"}]',
    },
    { key: 'activeIndex', label: 'Active index', type: 'number', min: -1, step: 1 },
    { key: 'disabled', label: 'Disabled', type: 'boolean' },
    {
      key: 'events',
      label: 'Events (JSON)',
      type: 'json',
      placeholder: '[{\"event\":\"click\",\"type\":\"query\",\"queryName\":\"onCrumb\"}]',
    },
  ],
  render: (props, context) => {
    const parsedItems = normalizeArray<BreadcrumbItem>(parseMaybeJson(props.items), [])
    const items =
      parsedItems.length > 0
        ? parsedItems
        : [
            { label: 'Home', href: '/' },
            { label: 'Page', href: '/page' },
            { label: 'Current' },
          ]

    const activeIndex =
      props.activeIndex >= 0 && props.activeIndex < items.length
        ? props.activeIndex
        : items.length - 1

    return (
      <Breadcrumb_Shadcn_>
        <BreadcrumbList_Shadcn_>
          {items.map((item, index) => {
            const isActive = index === activeIndex
            const content = isActive ? (
              <BreadcrumbPage_Shadcn_>{item.label}</BreadcrumbPage_Shadcn_>
            ) : (
              <BreadcrumbLink_Shadcn_
                href={item.href || '#'}
                onClick={(event) => {
                  if (props.disabled) {
                    event.preventDefault()
                    return
                  }
                  context?.runActions?.('click', { index, item })
                }}
              >
                {item.label}
              </BreadcrumbLink_Shadcn_>
            )

            return (
              <BreadcrumbItem_Shadcn_ key={`${item.label}-${index}`}>
                {content}
                {index < items.length - 1 && <BreadcrumbSeparator_Shadcn_ />}
              </BreadcrumbItem_Shadcn_>
            )
          })}
        </BreadcrumbList_Shadcn_>
      </Breadcrumb_Shadcn_>
    )
  },
}
