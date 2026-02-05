import {
  Tabs_Shadcn_,
  TabsContent_Shadcn_,
  TabsList_Shadcn_,
  TabsTrigger_Shadcn_,
} from 'ui'

import type { WidgetDefinition } from '../types'
import { normalizeArray, parseMaybeJson } from '../helpers'

type TabConfig = {
  label: string
  content?: string
}

type TabsProps = {
  tabs: string
  defaultTab: string
}

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

export const TabsWidget: WidgetDefinition<TabsProps> = {
  type: 'Tabs',
  label: 'Tabs',
  category: 'navigation',
  description: 'Tabbed navigation',
  defaultProps: {
    tabs: JSON.stringify(
      [
        { label: 'Tab 1', content: 'Tab 1 content' },
        { label: 'Tab 2', content: 'Tab 2 content' },
      ],
      null,
      2
    ),
    defaultTab: '',
  },
  fields: [
    {
      key: 'tabs',
      label: 'Tabs (JSON)',
      type: 'json',
      placeholder: '[{\"label\":\"Tab 1\",\"content\":\"Tab 1 content\"}]',
    },
    { key: 'defaultTab', label: 'Default tab', type: 'text', placeholder: 'Tab 1' },
  ],
  render: (props) => {
    const parsedTabs = normalizeArray<TabConfig>(parseMaybeJson(props.tabs), [])
    const fallbackTabs =
      parsedTabs.length > 0
        ? parsedTabs
        : [
            { label: 'Tab 1', content: 'Tab 1 content' },
            { label: 'Tab 2', content: 'Tab 2 content' },
          ]

    const tabs = fallbackTabs.map((tab, index) => {
      const label = tab.label || `Tab ${index + 1}`
      const id = slugify(label) || `tab-${index + 1}`
      return { id, label, content: tab.content ?? '' }
    })

    const defaultTab = props.defaultTab
      ? slugify(props.defaultTab)
      : tabs[0]?.id ?? 'tab-1'

    return (
      <Tabs_Shadcn_ defaultValue={defaultTab} className="w-full">
        <TabsList_Shadcn_ className="w-full">
          {tabs.map((tab) => (
            <TabsTrigger_Shadcn_ key={tab.id} value={tab.id}>
              {tab.label}
            </TabsTrigger_Shadcn_>
          ))}
        </TabsList_Shadcn_>
        {tabs.map((tab) => (
          <TabsContent_Shadcn_ key={tab.id} value={tab.id} className="mt-3">
            <div className="rounded-md border border-foreground-muted/30 bg-surface-100 p-4 text-sm text-foreground">
              {tab.content || 'Tab content'}
            </div>
          </TabsContent_Shadcn_>
        ))}
      </Tabs_Shadcn_>
    )
  },
}
