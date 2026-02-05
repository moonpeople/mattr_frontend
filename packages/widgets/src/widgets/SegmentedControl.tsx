import { ToggleGroup, ToggleGroupItem } from 'ui'

import type { WidgetDefinition } from '../types'
import { normalizeArray, normalizeString, parseMaybeJson } from '../helpers'

type SegmentedControlOption = {
  label: string
  value: string
}

type SegmentedControlProps = {
  label: string
  value: string
  options: string
  disabled: boolean
  events: string
}

const normalizeOptions = (raw: unknown): SegmentedControlOption[] => {
  const parsed = normalizeArray<SegmentedControlOption | string>(parseMaybeJson(raw), [])
  if (parsed.length === 0) {
    return []
  }
  if (typeof parsed[0] === 'string') {
    return (parsed as string[]).map((item) => ({ label: item, value: item }))
  }
  return (parsed as SegmentedControlOption[]).map((item) => ({
    label: String(item.label ?? ''),
    value: String(item.value ?? item.label ?? ''),
  }))
}

export const SegmentedControlWidget: WidgetDefinition<SegmentedControlProps> = {
  type: 'SegmentedControl',
  label: 'Segmented Control',
  category: 'inputs',
  description: 'Segmented control',
  defaultProps: {
    label: 'Label',
    value: '',
    options: JSON.stringify(['Left', 'Right'], null, 2),
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
      placeholder: '[\"Left\",\"Right\"]',
    },
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
            { label: 'Left', value: 'Left' },
            { label: 'Right', value: 'Right' },
          ]
    const value = normalizeString(context?.state?.value ?? props.value ?? safeOptions[0]?.value ?? '')

    return (
      <div className="space-y-2">
        {props.label && (
          <label className="text-xs font-medium text-foreground">{props.label}</label>
        )}
        <ToggleGroup
          type="single"
          value={value}
          disabled={props.disabled}
          onValueChange={(next) => {
            if (!next) {
              return
            }
            context?.setState?.({ value: next })
            context?.runActions?.('change', { value: next })
          }}
        >
          {safeOptions.map((option) => (
            <ToggleGroupItem key={option.value} value={option.value} className="px-3">
              {option.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
    )
  },
}
