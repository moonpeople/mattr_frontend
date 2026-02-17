import { normalizeArray, parseMaybeJson } from '../helpers'
import { createWidgetDefinition } from '../types'

export type TimelineItem = {
  title: string
  timestamp?: string
  description?: string
}

export type TimelineProps = {
  items: string
  showTimestamp: boolean
}

const normalizeItems = (raw: unknown): TimelineItem[] => {
  const parsed = normalizeArray<TimelineItem | string>(parseMaybeJson(raw), [])
  if (parsed.length === 0) {
    return []
  }
  if (typeof parsed[0] === 'string') {
    return (parsed as string[]).map((item) => ({ title: item }))
  }
  return (parsed as TimelineItem[]).map((item) => ({
    title: String(item.title ?? ''),
    timestamp: item.timestamp,
    description: item.description,
  }))
}

export const TimelineDefinition = createWidgetDefinition<TimelineProps>({
  type: 'Timeline',
  label: 'Timeline',
  category: 'presentation',
  description: 'Timeline of events',
  defaultProps: {
    items: JSON.stringify(
      [
        { title: 'Account created', timestamp: '2020-06-29' },
        { title: 'Password updated', timestamp: '2020-06-29' },
        { title: 'Billing details added', timestamp: '2020-06-28' },
      ],
      null,
      2
    ),
    showTimestamp: true,
  },
  render: (props) => {
    const items = normalizeItems(props.items)
    const timeline =
      items.length > 0
        ? items
        : [
            { title: 'Account created', timestamp: '2020-06-29' },
            { title: 'Password updated', timestamp: '2020-06-29' },
            { title: 'Billing details added', timestamp: '2020-06-28' },
          ]

    return (
      <div className="space-y-4">
        {timeline.map((item, index) => (
          <div key={`${item.title}-${index}`} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className="h-2.5 w-2.5 rounded-full bg-muted-foreground" />
              {index < timeline.length - 1 && <div className="mt-1 w-px flex-1 bg-border" />}
            </div>
            <div className="space-y-1">
              <div className="text-sm font-medium text-foreground">{item.title}</div>
              {props.showTimestamp && item.timestamp && (
                <div className="text-xs text-muted-foreground">{item.timestamp}</div>
              )}
              {item.description && (
                <div className="text-xs text-muted-foreground">{item.description}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    )
  },
})
