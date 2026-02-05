import { Slider_Shadcn_ } from 'ui'

import type { WidgetDefinition } from '../types'

type RangeSliderProps = {
  label: string
  start: number
  end: number
  min: number
  max: number
  step: number
  helperText: string
  disabled: boolean
  events: string
}

const toNumber = (value: unknown, fallback: number) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }
  const parsed = Number(value)
  if (Number.isFinite(parsed)) {
    return parsed
  }
  return fallback
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

export const RangeSliderWidget: WidgetDefinition<RangeSliderProps> = {
  type: 'RangeSlider',
  label: 'Range Slider',
  category: 'inputs',
  description: 'Select a numeric range',
  defaultProps: {
    label: 'Label',
    start: 25,
    end: 75,
    min: 0,
    max: 100,
    step: 1,
    helperText: '',
    disabled: false,
    events: '[]',
  },
  fields: [
    { key: 'label', label: 'Label', type: 'text', placeholder: 'Label' },
    { key: 'start', label: 'Start', type: 'number', min: 0, step: 1 },
    { key: 'end', label: 'End', type: 'number', min: 0, step: 1 },
    { key: 'min', label: 'Min', type: 'number', min: 0, step: 1 },
    { key: 'max', label: 'Max', type: 'number', min: 1, step: 1 },
    { key: 'step', label: 'Step', type: 'number', min: 1, step: 1 },
    { key: 'helperText', label: 'Helper text', type: 'text', placeholder: 'Help text' },
    { key: 'disabled', label: 'Disabled', type: 'boolean' },
    {
      key: 'events',
      label: 'Events (JSON)',
      type: 'json',
      placeholder: '[{"event":"change","type":"query","queryName":"onRangeChange"}]',
    },
  ],
  render: (props, context) => {
    const stateValues = context?.state?.values
    const fallbackValues: [number, number] = [props.start, props.end]
    const rawValues = Array.isArray(stateValues) && stateValues.length >= 2 ? stateValues : fallbackValues
    const min = props.min
    const max = props.max
    const start = clamp(toNumber(rawValues[0], fallbackValues[0]), min, max)
    const end = clamp(toNumber(rawValues[1], fallbackValues[1]), min, max)
    const normalized: [number, number] = start <= end ? [start, end] : [end, start]

    return (
      <div className="space-y-2">
        {props.label && (
          <label className="text-xs font-medium text-foreground">{props.label}</label>
        )}
        <Slider_Shadcn_
          value={normalized}
          min={min}
          max={max}
          step={props.step}
          disabled={props.disabled}
          onValueChange={(values) => {
            const nextStart = values[0] ?? min
            const nextEnd = values[1] ?? max
            context?.setState?.({ values: [nextStart, nextEnd] })
            context?.runActions?.('change', { start: nextStart, end: nextEnd })
          }}
        />
        {props.helperText && <div className="text-xs text-foreground-muted">{props.helperText}</div>}
      </div>
    )
  },
}
