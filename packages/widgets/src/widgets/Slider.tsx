import { Slider_Shadcn_ } from 'ui'

import type { WidgetDefinition } from '../types'

type SliderProps = {
  label: string
  value: number
  min: number
  max: number
  step: number
  helperText: string
  disabled: boolean
  events: string
}

export const SliderWidget: WidgetDefinition<SliderProps> = {
  type: 'Slider',
  label: 'Slider',
  category: 'inputs',
  description: 'Range slider',
  defaultProps: {
    label: 'Label',
    value: 50,
    min: 0,
    max: 100,
    step: 1,
    helperText: '',
    disabled: false,
    events: '[]',
  },
  fields: [
    { key: 'label', label: 'Label', type: 'text', placeholder: 'Label' },
    { key: 'value', label: 'Value', type: 'number', min: 0, step: 1 },
    { key: 'min', label: 'Min', type: 'number', min: 0, step: 1 },
    { key: 'max', label: 'Max', type: 'number', min: 0, step: 1 },
    { key: 'step', label: 'Step', type: 'number', min: 1, step: 1 },
    { key: 'helperText', label: 'Helper text', type: 'text', placeholder: 'Help text' },
    { key: 'disabled', label: 'Disabled', type: 'boolean' },
    {
      key: 'events',
      label: 'Events (JSON)',
      type: 'json',
      placeholder: '[{\"event\":\"change\",\"type\":\"query\",\"queryName\":\"onSlide\"}]',
    },
  ],
  render: (props, context) => {
    const rawValue = context?.state?.value ?? props.value
    const parsedValue =
      typeof rawValue === 'number' ? rawValue : Number.isFinite(Number(rawValue)) ? Number(rawValue) : props.value
    const safeValue = Number.isFinite(parsedValue) ? parsedValue : props.value

    return (
      <div className="space-y-2">
        {props.label && (
          <label className="text-xs font-medium text-foreground">{props.label}</label>
        )}
        <Slider_Shadcn_
          value={[safeValue]}
          min={props.min}
          max={props.max}
          step={props.step}
          disabled={props.disabled}
          onValueChange={(values) => {
            const next = values[0] ?? props.min
            context?.setState?.({ value: next })
            context?.runActions?.('change', { value: next })
          }}
        />
        {props.helperText && <div className="text-xs text-foreground-muted">{props.helperText}</div>}
      </div>
    )
  },
}
