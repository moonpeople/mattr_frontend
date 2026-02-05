import type { WidgetDefinition } from '../types'
import { normalizeArray, normalizeString, parseMaybeJson } from '../helpers'

type StepItem = {
  label: string
}

type StepsProps = {
  items: string
  value: string
  showNumbers: boolean
  events: string
}

const normalizeItems = (raw: unknown): StepItem[] => {
  const parsed = normalizeArray<StepItem | string>(parseMaybeJson(raw), [])
  if (parsed.length === 0) {
    return []
  }
  if (typeof parsed[0] === 'string') {
    return (parsed as string[]).map((item) => ({ label: item }))
  }
  return (parsed as StepItem[]).map((item) => ({ label: String(item.label ?? '') }))
}

export const StepsWidget: WidgetDefinition<StepsProps> = {
  type: 'Steps',
  label: 'Steps',
  category: 'navigation',
  description: 'Step navigation',
  defaultProps: {
    items: JSON.stringify(['Step 1', 'Step 2', 'Step 3'], null, 2),
    value: 'Step 1',
    showNumbers: true,
    events: '[]',
  },
  fields: [
    {
      key: 'items',
      label: 'Steps (JSON)',
      type: 'json',
      placeholder: '[\"Step 1\",\"Step 2\"]',
    },
    { key: 'value', label: 'Value', type: 'text', placeholder: 'Step 1' },
    { key: 'showNumbers', label: 'Show numbers', type: 'boolean' },
    {
      key: 'events',
      label: 'Events (JSON)',
      type: 'json',
      placeholder: '[{\"event\":\"change\",\"type\":\"query\",\"queryName\":\"onStep\"}]',
    },
  ],
  render: (props, context) => {
    const items = normalizeItems(props.items)
    const steps = items.length > 0 ? items : [{ label: 'Step 1' }, { label: 'Step 2' }, { label: 'Step 3' }]
    const value = normalizeString(context?.state?.value ?? props.value)
    const activeIndex = Math.max(0, steps.findIndex((step) => step.label === value))

    return (
      <div className="flex flex-wrap items-center gap-4">
        {steps.map((step, index) => {
          const active = index === activeIndex
          return (
            <button
              key={`${step.label}-${index}`}
              type="button"
              className={`flex items-center gap-2 text-sm ${active ? 'text-foreground' : 'text-foreground-muted'}`}
              onClick={() => {
                context?.setState?.({ value: step.label })
                context?.runActions?.('change', { value: step.label, index })
              }}
            >
              {props.showNumbers && (
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full border text-xs ${
                    active ? 'border-foreground text-foreground' : 'border-muted text-foreground-muted'
                  }`}
                >
                  {index + 1}
                </span>
              )}
              <span>{step.label}</span>
            </button>
          )
        })}
      </div>
    )
  },
}
