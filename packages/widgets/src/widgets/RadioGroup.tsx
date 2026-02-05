import { RadioGroupItem_Shadcn_, RadioGroup_Shadcn_ } from 'ui'

import type { WidgetDefinition } from '../types'
import { normalizeArray, normalizeString, parseMaybeJson } from '../helpers'

type RadioOption = {
  label: string
  value: string
}

type RadioGroupProps = {
  label: string
  value: string
  options: string
  helperText: string
  disabled: boolean
  events: string
}

export const RadioGroupWidget: WidgetDefinition<RadioGroupProps> = {
  type: 'RadioGroup',
  label: 'Radio Group',
  category: 'inputs',
  description: 'Single choice radio group',
  defaultProps: {
    label: 'Label',
    value: '',
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
    { key: 'value', label: 'Value', type: 'text', placeholder: 'Selected value' },
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
      placeholder: '[{\"event\":\"change\",\"type\":\"query\",\"queryName\":\"onSelect\"}]',
    },
  ],
  render: (props, context) => {
    const parsedOptions = normalizeArray<RadioOption>(parseMaybeJson(props.options), [])
    const safeOptions =
      parsedOptions.length > 0
        ? parsedOptions
        : [
            { label: 'Option 1', value: 'option_1' },
            { label: 'Option 2', value: 'option_2' },
          ]

    return (
      <div className="space-y-2">
        {props.label && (
          <label className="text-xs font-medium text-foreground">{props.label}</label>
        )}
        <RadioGroup_Shadcn_
          value={normalizeString(context?.state?.value ?? props.value)}
          disabled={props.disabled}
          onValueChange={(next) => {
            context?.setState?.({ value: next })
            context?.runActions?.('change', { value: next })
          }}
        >
          {safeOptions.map((option) => (
            <label key={option.value} className="flex items-center gap-2 text-sm text-foreground">
              <RadioGroupItem_Shadcn_ value={option.value} disabled={props.disabled} />
              <span>{option.label}</span>
            </label>
          ))}
        </RadioGroup_Shadcn_>
        {props.helperText && <div className="text-xs text-foreground-muted">{props.helperText}</div>}
      </div>
    )
  },
}
