import type { WidgetDefinition } from '../types'
import { normalizeArray, normalizeString, parseMaybeJson } from '../helpers'

type CascaderOption = {
  label: string
  value?: string
  children?: CascaderOption[]
}

type CascaderProps = {
  label: string
  value: string
  options: string
  placeholder: string
  helperText: string
  disabled: boolean
  events: string
}

type FlatOption = {
  label: string
  value: string
}

const flattenOptions = (options: CascaderOption[], path: string[] = []): FlatOption[] => {
  const items: FlatOption[] = []
  options.forEach((option) => {
    const nextPath = [...path, String(option.label ?? option.value ?? '')].filter(Boolean)
    const value = option.value ? String(option.value) : nextPath.join(' / ')
    if (nextPath.length) {
      items.push({ label: nextPath.join(' / '), value })
    }
    if (option.children && option.children.length) {
      items.push(...flattenOptions(option.children, nextPath))
    }
  })
  return items
}

const normalizeOptions = (raw: unknown): FlatOption[] => {
  const parsed = normalizeArray<CascaderOption | string>(parseMaybeJson(raw), [])
  if (parsed.length === 0) {
    return []
  }
  if (typeof parsed[0] === 'string') {
    return (parsed as string[]).map((item) => ({ label: item, value: item }))
  }
  return flattenOptions(parsed as CascaderOption[])
}

export const CascaderWidget: WidgetDefinition<CascaderProps> = {
  type: 'Cascader',
  label: 'Cascader',
  category: 'inputs',
  description: 'Select from hierarchical options',
  defaultProps: {
    label: 'Label',
    value: '',
    options: JSON.stringify(
      [
        {
          label: 'Clothing',
          children: [
            { label: 'Pants', value: 'pants' },
            { label: 'Shoes', value: 'shoes' },
          ],
        },
        {
          label: 'Accessories',
          children: [
            { label: 'Hats', value: 'hats' },
            { label: 'Bags', value: 'bags' },
          ],
        },
      ],
      null,
      2
    ),
    placeholder: 'Select an option',
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
      placeholder: '[{\"label\":\"Parent\",\"children\":[{\"label\":\"Child\",\"value\":\"child\"}]}]',
    },
    { key: 'placeholder', label: 'Placeholder', type: 'text', placeholder: 'Select an option' },
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
            { label: 'Clothing / Pants', value: 'pants' },
            { label: 'Clothing / Shoes', value: 'shoes' },
          ]
    const value = normalizeString(context?.state?.value ?? props.value)

    return (
      <div className="space-y-1">
        {props.label && (
          <label className="text-xs font-medium text-foreground">{props.label}</label>
        )}
        <select
          value={value}
          disabled={props.disabled}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
          onChange={(event) => {
            const next = event.target.value
            context?.setState?.({ value: next })
            context?.runActions?.('change', { value: next })
          }}
        >
          {props.placeholder && <option value="">{props.placeholder}</option>}
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
