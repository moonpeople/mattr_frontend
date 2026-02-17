import { Input } from 'ui'

import { normalizeString } from '../helpers'
import { createWidgetDefinition } from '../types'

export type ColorInputProps = {
  label: string
  placeholder: string
  value: string
  helperText: string
  disabled: boolean
  required: boolean
  events: string
}

const normalizeColor = (value: unknown) => {
  const normalized = normalizeString(value, '').trim()
  if (!normalized) {
    return '#2563eb'
  }
  if (normalized.startsWith('#')) {
    return normalized
  }
  if (/^[0-9a-fA-F]{3}$/.test(normalized) || /^[0-9a-fA-F]{6}$/.test(normalized)) {
    return `#${normalized}`
  }
  return normalized
}

export const ColorInputDefinition = createWidgetDefinition<ColorInputProps>({
  type: 'ColorInput',
  label: 'Color Input',
  category: 'inputs',
  description: 'Pick a color value',
  defaultProps: {
    label: 'Label',
    placeholder: 'Enter a color',
    value: '#2563eb',
    helperText: '',
    disabled: false,
    required: false,
    events: '[]',
  },
  render: (props, context) => {
    const value = normalizeColor(context?.state?.value ?? props.value)

    const updateValue = (next: string) => {
      context?.setState?.({ value: next })
      context?.runActions?.('change', { value: next })
    }

    return (
      <div className="space-y-1">
        {props.label && <label className="text-xs font-medium text-foreground">{props.label}</label>}
        <div className="flex items-center gap-3">
          <Input
            type="color"
            value={value}
            disabled={props.disabled}
            required={props.required}
            className="h-10 w-12 p-1"
            onChange={(event) => updateValue(event.target.value)}
          />
          <Input
            value={value}
            placeholder={props.placeholder}
            disabled={props.disabled}
            required={props.required}
            onChange={(event) => updateValue(event.target.value)}
          />
        </div>
        {props.helperText && <div className="text-xs text-muted-foreground">{props.helperText}</div>}
      </div>
    )
  },
})
