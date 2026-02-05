import { Braces, FileCode, Hash, LayoutGrid, X } from 'lucide-react'

import { TabsList_Shadcn_, TabsTrigger_Shadcn_, Tabs_Shadcn_, cn } from 'ui'
import type { BuilderJsFunction } from 'data/builder/builder-js'
import type { BuilderQuery } from 'data/builder/builder-queries'

import type { BuilderCodeItemType } from './BuilderCodeUtils'

export type BuilderCodeTab = {
  id: string
  type: 'canvas' | BuilderCodeItemType
  entityId?: string
}

type BuilderCodeTabsProps = {
  tabs: BuilderCodeTab[]
  activeTabId: string
  queries: BuilderQuery[]
  jsFunctions: BuilderJsFunction[]
  onSelectTab: (tabId: string) => void
  onCloseTab: (tabId: string) => void
}

const getTabLabel = (
  tab: BuilderCodeTab,
  queries: BuilderQuery[],
  jsFunctions: BuilderJsFunction[]
) => {
  if (tab.type === 'canvas') {
    return { label: 'Canvas', Icon: LayoutGrid }
  }
  if (tab.type === 'transformer') {
    const match = jsFunctions.find((func) => func.id === tab.entityId)
    return { label: match?.name ?? tab.entityId ?? 'Transformer', Icon: FileCode }
  }
  const match = queries.find((query) => query.id === tab.entityId)
  const Icon = tab.type === 'variable' ? Hash : Braces
  return { label: match?.name ?? tab.entityId ?? 'Query', Icon }
}

export const BuilderCodeTabs = ({
  tabs,
  activeTabId,
  queries,
  jsFunctions,
  onSelectTab,
  onCloseTab,
}: BuilderCodeTabsProps) => (
  <Tabs_Shadcn_ value={activeTabId} onValueChange={onSelectTab} className="w-full">
    <TabsList_Shadcn_
      className={cn(
        'rounded-none gap-0 h-9 flex items-center w-full z-[1]',
        'bg-surface-200 border-b border-foreground-muted/30 overflow-x-auto'
      )}
    >
      {tabs.map((tab, index) => {
        const { label, Icon } = getTabLabel(tab, queries, jsFunctions)
        return (
          <div
            key={tab.id}
            className="flex items-center h-9 first-of-type:border-l border-foreground-muted/30"
          >
            <TabsTrigger_Shadcn_
              value={tab.id}
              className={cn(
                'flex items-center gap-2 pl-3 pr-2.5 text-xs',
                'bg-surface-100/60 data-[state=active]:bg-surface-100',
                'border-b border-foreground-muted/30',
                'relative group h-full',
                'hover:bg-surface-200'
              )}
            >
              <Icon size={12} className="text-foreground-muted" />
              <span>{label}</span>
              {tab.type !== 'canvas' && (
                <span
                  role="button"
                  onClick={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                    onCloseTab(tab.id)
                  }}
                  onMouseDown={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                  }}
                  className="ml-1 rounded-sm p-0.5 opacity-0 transition group-hover:opacity-100 hover:bg-surface-200"
                >
                  <X size={12} className="text-foreground-muted" />
                </span>
              )}
            </TabsTrigger_Shadcn_>
            {index < tabs.length - 1 && <div role="separator" className="h-full w-px bg-border" />}
          </div>
        )
      })}
    </TabsList_Shadcn_>
  </Tabs_Shadcn_>
)
