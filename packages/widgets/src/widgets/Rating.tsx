import type { MouseEvent } from 'react'
import { Star } from 'lucide-react'

import type { WidgetDefinition } from '../types'

type RatingProps = {
  label: string
  value: number
  max: number
  allowHalf: boolean
  helperText: string
  disabled: boolean
  events: string
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

const getStarSize = (max: number) => {
  if (max >= 10) {
    return 'h-4 w-4'
  }
  return 'h-5 w-5'
}

export const RatingWidget: WidgetDefinition<RatingProps> = {
  type: 'Rating',
  label: 'Rating',
  category: 'inputs',
  description: 'Star rating input',
  defaultProps: {
    label: 'Label',
    value: 3.5,
    max: 5,
    allowHalf: true,
    helperText: '',
    disabled: false,
    events: '[]',
  },
  fields: [
    { key: 'label', label: 'Label', type: 'text', placeholder: 'Label' },
    { key: 'value', label: 'Value', type: 'number', min: 0, step: 0.5 },
    { key: 'max', label: 'Max', type: 'number', min: 1, step: 1 },
    { key: 'allowHalf', label: 'Allow half', type: 'boolean' },
    { key: 'helperText', label: 'Helper text', type: 'text', placeholder: 'Help text' },
    { key: 'disabled', label: 'Disabled', type: 'boolean' },
    {
      key: 'events',
      label: 'Events (JSON)',
      type: 'json',
      placeholder: '[{"event":"change","type":"query","queryName":"onRate"}]',
    },
  ],
  render: (props, context) => {
    const rawValue = context?.state?.value ?? props.value
    const parsed = typeof rawValue === 'number' ? rawValue : Number(rawValue)
    const max = Math.max(1, Math.floor(props.max))
    const value = clamp(Number.isFinite(parsed) ? parsed : props.value, 0, max)
    const starSize = getStarSize(max)

    const handleSelect = (event: MouseEvent<HTMLButtonElement>, index: number) => {
      if (props.disabled) {
        return
      }
      let nextValue = index + 1
      if (props.allowHalf) {
        const rect = event.currentTarget.getBoundingClientRect()
        const ratio = (event.clientX - rect.left) / rect.width
        nextValue = ratio <= 0.5 ? index + 0.5 : index + 1
      }
      const clamped = clamp(nextValue, 0, max)
      context?.setState?.({ value: clamped })
      context?.runActions?.('change', { value: clamped })
    }

    return (
      <div className="space-y-1">
        {props.label && (
          <label className="text-xs font-medium text-foreground">{props.label}</label>
        )}
        <div className="flex items-center gap-1">
          {Array.from({ length: max }, (_, index) => {
            const fill = clamp(value - index, 0, 1)
            const fillWidth = `${Math.round(fill * 100)}%`
            return (
              <button
                key={`rating-${index}`}
                type="button"
                className="relative"
                disabled={props.disabled}
                onClick={(event) => handleSelect(event, index)}
              >
                <Star className={`${starSize} text-foreground-muted`} />
                {fill > 0 && (
                  <span className="absolute inset-0 overflow-hidden" style={{ width: fillWidth }}>
                    <Star className={`${starSize} text-amber-500 fill-amber-500`} />
                  </span>
                )}
              </button>
            )
          })}
        </div>
        {props.helperText && <div className="text-xs text-foreground-muted">{props.helperText}</div>}
      </div>
    )
  },
}
