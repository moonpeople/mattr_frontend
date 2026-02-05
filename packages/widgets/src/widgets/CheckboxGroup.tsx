import { Checkbox_Shadcn_ } from 'ui'

import type { WidgetDefinition } from '../types'
import { normalizeArray, parseMaybeJson } from '../helpers'

type CheckboxOption = {
  label: string
  value: string
}

type CheckboxGroupProps = {
  label: string
  value: string
  options: string
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

const normalizeOptions = (raw: unknown): CheckboxOption[] => {
  const parsed = normalizeArray<CheckboxOption | string>(parseMaybeJson(raw), [])
  if (parsed.length === 0) {
    return []
  }
  if (typeof parsed[0] === 'string') {
    return (parsed as string[]).map((item) => ({ label: item, value: item }))
  }
  return (parsed as CheckboxOption[]).map((item) => ({
    label: String(item.label ?? item.value ?? ''),
    value: String(item.value ?? item.label ?? ''),
  }))
}

export const CheckboxGroupWidget: WidgetDefinition<CheckboxGroupProps> = {
  type: 'CheckboxGroup',
  label: 'Checkbox Group',
  category: 'inputs',
  description: 'Multiple choice checkbox group',
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
    { key: 'helperText', label: 'Helper text', type: 'text', placeholder: 'Help text' },
    { key: 'disabled', label: 'Disabled', type: 'boolean' },
    {
      key: 'events',
      label: 'Events (JSON)',
      type: 'json',
      placeholder: '[{\"event\":\"change\",\"type\":\"query\",\"queryName\":\"onChange\"}]',
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
          ]
    const selected = normalizeValues(context?.state?.value ?? props.value)

    const toggleValue = (value: string, checked: boolean) => {
      const next = checked ? Array.from(new Set([...selected, value])) : selected.filter((item) => item !== value)
      context?.setState?.({ value: next })
      context?.runActions?.('change', { value: next })
    }

    return (
      <div className="space-y-2">
        {props.label && (
          <label className="text-xs font-medium text-foreground">{props.label}</label>
        )}
        <div className="space-y-2">
          {safeOptions.map((option) => {
            const checked = selected.includes(option.value)
            return (
              <label key={option.value} className="flex items-center gap-2 text-sm text-foreground">
                <Checkbox_Shadcn_
                  checked={checked}
                  disabled={props.disabled}
                  onCheckedChange={(next) => toggleValue(option.value, next === true)}
                />
                <span>{option.label}</span>
              </label>
            )
          })}
        </div>
        {props.helperText && <div className="text-xs text-foreground-muted">{props.helperText}</div>}
      </div>
    )
  },
}
