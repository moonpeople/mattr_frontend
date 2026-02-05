import type { WidgetDefinition } from '../types'
import { normalizeArray, normalizeString, parseMaybeJson } from '../helpers'

type ListboxOption = {
  label: string
  value: string
}

type ListboxProps = {
  label: string
  value: string
  options: string
  size: number
  helperText: string
  disabled: boolean
  events: string
}

const normalizeOptions = (raw: unknown): ListboxOption[] => {
  const parsed = normalizeArray<ListboxOption | string>(parseMaybeJson(raw), [])
  if (parsed.length === 0) {
    return []
  }
  if (typeof parsed[0] === 'string') {
    return (parsed as string[]).map((item) => ({ label: item, value: item }))
  }
  return (parsed as ListboxOption[]).map((item) => ({
    label: String(item.label ?? item.value ?? ''),
    value: String(item.value ?? item.label ?? ''),
  }))
}

export const ListboxWidget: WidgetDefinition<ListboxProps> = {
  type: 'Listbox',
  label: 'Listbox',
  category: 'inputs',
  description: 'Select from a list',
  defaultProps: {
    label: 'Label',
    value: '',
    options: JSON.stringify(
      [
        { label: 'Option 1', value: 'option_1' },
        { label: 'Option 2', value: 'option_2' },
        { label: 'Option 3', value: 'option_3' },
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
    { key: 'value', label: 'Value', type: 'text', placeholder: 'Selected value' },
    {
      key: 'options',
      label: 'Options (JSON)',
      type: 'json',
      placeholder: '[{\"label\":\"Option 1\",\"value\":\"option_1\"}]',
    },
    { key: 'size', label: 'Visible rows', type: 'number', min: 2, max: 12, step: 1 },
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
    const options = normalizeOptions(props.options)
    const safeOptions =
      options.length > 0
        ? options
        : [
            { label: 'Option 1', value: 'option_1' },
            { label: 'Option 2', value: 'option_2' },
            { label: 'Option 3', value: 'option_3' },
          ]
    const value = normalizeString(context?.state?.value ?? props.value)

    return (
      <div className="space-y-1">
        {props.label && (
          <label className="text-xs font-medium text-foreground">{props.label}</label>
        )}
        <select
          size={props.size}
          value={value}
          disabled={props.disabled}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
          onChange={(event) => {
            const next = event.target.value
            context?.setState?.({ value: next })
            context?.runActions?.('change', { value: next })
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
