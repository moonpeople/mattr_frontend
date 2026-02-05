import {
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
} from 'ui'

import type { WidgetDefinition } from '../types'
import { normalizeArray, normalizeString, parseMaybeJson } from '../helpers'

type SelectOption = {
  label: string
  value: string
}

type SelectProps = {
  label: string
  placeholder: string
  value: string
  options: string
  helperText: string
  disabled: boolean
  events: string
}

export const SelectWidget: WidgetDefinition<SelectProps> = {
  type: 'Select',
  label: 'Select',
  category: 'inputs',
  description: 'Dropdown select input',
  defaultProps: {
    label: 'Label',
    placeholder: 'Select option',
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
    { key: 'placeholder', label: 'Placeholder', type: 'text', placeholder: 'Select option' },
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
    const parsedOptions = normalizeArray<SelectOption>(parseMaybeJson(props.options), [])
    const safeOptions =
      parsedOptions.length > 0
        ? parsedOptions
        : [
            { label: 'Option 1', value: 'option_1' },
            { label: 'Option 2', value: 'option_2' },
          ]

    return (
      <div className="space-y-1">
        {props.label && (
          <label className="text-xs font-medium text-foreground">{props.label}</label>
        )}
        <Select_Shadcn_
          value={normalizeString(context?.state?.value ?? props.value)}
          disabled={props.disabled}
          onValueChange={(next) => {
            context?.setState?.({ value: next })
            context?.runActions?.('change', { value: next })
          }}
        >
          <SelectTrigger_Shadcn_ className="h-9">
            <SelectValue_Shadcn_ placeholder={props.placeholder} />
          </SelectTrigger_Shadcn_>
          <SelectContent_Shadcn_>
            {safeOptions.map((option) => (
              <SelectItem_Shadcn_ key={option.value} value={option.value}>
                {option.label}
              </SelectItem_Shadcn_>
            ))}
          </SelectContent_Shadcn_>
        </Select_Shadcn_>
        {props.helperText && <div className="text-xs text-foreground-muted">{props.helperText}</div>}
      </div>
    )
  },
}
