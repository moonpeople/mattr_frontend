import { Tabs_Shadcn_, TabsContent_Shadcn_, TabsList_Shadcn_, TabsTrigger_Shadcn_, cn } from 'ui'

import { normalizeArray, parseMaybeJson } from '../helpers'
import { createWidgetDefinition } from '../types'

type TabConfig = {
  label: string
  value?: string
  content?: string
}

export type TabbedContainerProps = {
  title: string
  tabs: string
  value?: string
  optionsMode?: 'static' | 'dynamic'
  optionsData?: string
  optionLabelKey?: string
  optionValueKey?: string
  optionDescriptionKey?: string
  defaultTab: string
  padding: 'sm' | 'md' | 'lg'
  bordered: boolean
  background: 'surface' | 'muted' | 'transparent'
  events: string
}

const paddingClasses: Record<TabbedContainerProps['padding'], string> = {
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
}

const backgroundClasses: Record<TabbedContainerProps['background'], string> = {
  surface: 'bg-card',
  muted: 'bg-muted',
  transparent: 'bg-transparent',
}

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const readPath = (item: unknown, pathRaw: string) => {
  if (!item || typeof item !== 'object') {
    return undefined
  }
  const path = pathRaw
    .split('.')
    .map((segment) => segment.trim())
    .filter(Boolean)
  if (path.length === 0) {
    return undefined
  }
  return path.reduce<unknown>((current, segment) => {
    if (!current || typeof current !== 'object') {
      return undefined
    }
    return (current as Record<string, unknown>)[segment]
  }, item)
}

const resolveDynamicTabs = (
  dataRaw: unknown,
  labelKeyRaw: unknown,
  valueKeyRaw: unknown,
  descriptionKeyRaw: unknown
): TabConfig[] => {
  const rows = normalizeArray<unknown>(parseMaybeJson(dataRaw), [])
  if (rows.length === 0) {
    return []
  }
  const labelKey = String(labelKeyRaw ?? 'label').trim() || 'label'
  const valueKey = String(valueKeyRaw ?? 'value').trim() || 'value'
  const descriptionKey = String(descriptionKeyRaw ?? '').trim()

  return rows
    .map((row, index) => {
      const labelRaw = readPath(row, labelKey)
      const valueRaw = readPath(row, valueKey)
      const descriptionRaw = descriptionKey ? readPath(row, descriptionKey) : undefined
      const label = String(labelRaw ?? valueRaw ?? `Tab ${index + 1}`).trim()
      const value = String(valueRaw ?? label).trim()
      const content = String(descriptionRaw ?? '').trim()
      return { label, value, content }
    })
    .filter((tab) => tab.label.length > 0)
}

export const TabbedContainerDefinition = createWidgetDefinition<TabbedContainerProps>({
  type: 'TabbedContainer',
  label: 'Tabbed Container',
  category: 'containers',
  description: 'Container with tabbed sections',
  supportsChildren: true,
    defaultProps: {
      title: 'Tabbed container',
      tabs: JSON.stringify(
      [
        { label: 'Tab 1', content: 'Tab 1 content' },
        { label: 'Tab 2', content: 'Tab 2 content' },
      ],
      null,
      2
      ),
      value: '',
      defaultTab: 'Tab 1',
    optionsMode: 'static',
    optionsData: '',
    optionLabelKey: 'label',
    optionValueKey: 'value',
    optionDescriptionKey: 'description',
    padding: 'md',
    bordered: true,
    background: 'surface',
    events: '[]',
  },
  render: (props, context) => {
    const dynamicMode = props.optionsMode === 'dynamic'
    const parsedTabs = dynamicMode
      ? resolveDynamicTabs(
          props.optionsData,
          props.optionLabelKey,
          props.optionValueKey,
          props.optionDescriptionKey
        )
      : normalizeArray<TabConfig>(parseMaybeJson(props.tabs), [])
    const fallbackTabs =
      parsedTabs.length > 0
        ? parsedTabs
        : [
            { label: 'Tab 1', content: 'Tab 1 content' },
            { label: 'Tab 2', content: 'Tab 2 content' },
          ]
    const tabs = fallbackTabs.map((tab, index) => {
      const label = tab.label || `Tab ${index + 1}`
      const rawValue = String(tab.value ?? label)
      const id = slugify(rawValue) || slugify(label) || `tab-${index + 1}`
      return { id, label, value: rawValue, content: tab.content ?? '' }
    })
    const fallbackId = tabs[0]?.id ?? 'tab-1'
    const defaultId = props.defaultTab ? slugify(props.defaultTab) || fallbackId : fallbackId
    const activeStateRaw = String(context?.state?.value ?? props.value ?? defaultId)
    const normalizedActiveStateId = slugify(activeStateRaw) || activeStateRaw
    const activeId = tabs.some((tab) => tab.id === normalizedActiveStateId)
      ? normalizedActiveStateId
      : fallbackId

    return (
      <div
        className={cn(
          'rounded-lg',
          backgroundClasses[props.background],
          props.bordered ? 'border border-border/40' : 'border border-transparent'
        )}
      >
        {props.title ? (
          <div className="border-b border-border/30 px-4 py-3 text-sm font-medium text-foreground">{props.title}</div>
        ) : null}
        <div className={paddingClasses[props.padding]}>
          <Tabs_Shadcn_
            value={activeId}
            onValueChange={(nextValue) => {
              context?.setState?.({ value: nextValue })
              if (context?.mode !== 'canvas') {
                const nextIndex = tabs.findIndex((tab) => tab.id === nextValue)
                const nextTab = nextIndex >= 0 ? tabs[nextIndex] : null
                context?.runActions?.('change', {
                  value: nextTab?.value ?? nextValue,
                  label: nextTab?.label ?? '',
                  index: nextIndex,
                })
              }
            }}
            className="w-full"
          >
            <TabsList_Shadcn_ className="w-full">
              {tabs.map((tab) => (
                <TabsTrigger_Shadcn_ key={tab.id} value={tab.id}>
                  {tab.label}
                </TabsTrigger_Shadcn_>
              ))}
            </TabsList_Shadcn_>
            {tabs.map((tab) => (
              <TabsContent_Shadcn_ key={tab.id} value={tab.id} className="mt-3">
                {(() => {
                  const hasRenderChildrenApi = typeof context?.renderChildren === 'function'
                  const slotChildren = context?.renderChildren?.({
                    slot: `tab:${tab.id}`,
                    includeUnassigned: tab.id === fallbackId,
                  })
                  const fallbackContent = hasRenderChildrenApi
                    ? tab.content || 'Tab content'
                    : context?.children ?? (tab.content || 'Tab content')
                  return (
                    <div className="rounded-md border border-border/30 bg-background p-4 text-sm text-foreground">
                      {slotChildren ?? fallbackContent}
                    </div>
                  )
                })()}
              </TabsContent_Shadcn_>
            ))}
          </Tabs_Shadcn_>
        </div>
      </div>
    )
  },
})
