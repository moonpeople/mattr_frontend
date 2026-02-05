import type { WidgetDefinition } from '../types'
import { normalizeArray, parseMaybeJson } from '../helpers'

type MultiSelectOption = {
  label: string
  value: string
}

type MultiSelectProps = {
  label: string
  value: string
  options: string
  size: number
  helperText: string
  disabled: boolean
  events: string
}

const normalizeValues = (value: unknown): string[] => {
  const parsed = parseMaybeJson(value)
  const normalized = normalizeArray<string>(parsed, [])
  if (normalized.length > 0) {
    return normalized.map((item) => String(item))
  }
  if (typeof value === 'string' && value.trim()) {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  }
  return []
}

export const MultiSelectWidget: WidgetDefinition<MultiSelectProps> = {
  type: 'MultiSelect',
  label: 'Multi Select',
  category: 'inputs',
  description: 'Select multiple options',
  defaultProps: {
    label: 'Label',
    value: '[]',
    options: JSON.stringify(
      [
        { label: 'Option 1', value: 'option_1' },
        { label: 'Option 2', value: 'option_2' },
      ],
      null,
      2
    ),
    size: 4,
    helperText: '',
    disabled: false,
    events: '[]',
  },
  fields: [
    { key: 'label', label: 'Label', type: 'text', placeholder: 'Label' },
    {
      key: 'value',
      label: 'Value (JSON)',
      type: 'json',
      placeholder: '[\"option_1\",\"option_2\"]',
    },
    {
      key: 'options',
      label: 'Options (JSON)',
      type: 'json',
      placeholder: '[{\"label\":\"Option 1\",\"value\":\"option_1\"}]',
    },
    { key: 'size', label: 'Visible rows', type: 'number', min: 2, max: 10, step: 1 },
    { key: 'helperText', label: 'Helper text', type: 'text', placeholder: 'Help text' },
    { key: 'disabled', label: 'Disabled', type: 'boolean' },
    {
      key: 'events',
      label: 'Events (JSON)',
      type: 'json',
      placeholder: '[{\"event\":\"change\",\"type\":\"query\",\"queryName\":\"onSelect\"}]',
    },
  ],
  render: (props, context) => {
    const parsedOptions = normalizeArray<MultiSelectOption>(parseMaybeJson(props.options), [])
    const safeOptions =
      parsedOptions.length > 0
        ? parsedOptions
        : [
            { label: 'Option 1', value: 'option_1' },
            { label: 'Option 2', value: 'option_2' },
          ]

    const selectedValues = normalizeValues(context?.state?.value ?? props.value)

    return (
      <div className="space-y-1">
        {props.label && (
          <label className="text-xs font-medium text-foreground">{props.label}</label>
        )}
        <select
          multiple
          size={props.size}
          value={selectedValues}
          disabled={props.disabled}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
          onChange={(event) => {
            const values = Array.from(event.target.selectedOptions).map((option) => option.value)
            context?.setState?.({ value: values })
            context?.runActions?.('change', { value: values })
          }}
        >
          {safeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {props.helperText && <div className="text-xs text-foreground-muted">{props.helperText}</div>}
      </div>
    )
  },
}
