import { Input } from 'ui'

import { normalizeString } from '../helpers'
import { createWidgetDefinition } from '../types'

export type PageInputProps = {
  value: number
  max: number
  prefix: string
  suffix: string
  disabled: boolean
  events: string
}

export const PageInputDefinition = createWidgetDefinition<PageInputProps>({
  type: 'PageInput',
  label: 'Page Input',
  category: 'navigation',
  description: 'Page input control',
  defaultProps: {
    value: 1,
    max: 10,
    prefix: 'Page',
    suffix: 'of {{ max }}',
    disabled: false,
    events: '[]',
  },
  render: (props, context) => {
    const rawValue = context?.state?.value ?? props.value
    const parsedValue =
      typeof rawValue === 'number'
        ? rawValue
        : Number.isFinite(Number(rawValue))
          ? Number(rawValue)
          : props.value
    const max = Math.max(1, props.max)
    const value = Math.min(max, Math.max(1, parsedValue))
    const suffix = props.suffix.replace('{{ max }}', String(max))

    return (
      <div className="flex items-center gap-2 text-sm text-foreground">
        <span className="text-muted-foreground">{props.prefix}</span>
        <Input
          type="number"
          value={normalizeString(value)}
          disabled={props.disabled}
          min={1}
          max={max}
          onChange={(event) => {
            const next = Number(event.target.value)
            const safeValue = Math.min(max, Math.max(1, next))
            context?.setState?.({ value: safeValue })
            context?.runActions?.('change', { value: safeValue, max })
          }}
          className="h-8 w-16 text-center"
        />
        <span className="text-muted-foreground">{suffix}</span>
      </div>
    )
  },
})
