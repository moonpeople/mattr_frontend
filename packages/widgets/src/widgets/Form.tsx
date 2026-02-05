import { Input, Textarea } from 'ui'

import type { WidgetDefinition } from '../types'
import { normalizeArray, normalizeString, parseMaybeJson } from '../helpers'

type FormFieldConfig = {
  label: string
  type?: 'text' | 'email' | 'number' | 'password' | 'textarea'
  placeholder?: string
}

type FormProps = {
  title: string
  fields: string
  submitLabel: string
  events: string
}

export const FormWidget: WidgetDefinition<FormProps> = {
  type: 'Form',
  label: 'Form',
  category: 'containers',
  description: 'Simple form layout',
  defaultProps: {
    title: 'Form title',
    fields: JSON.stringify(
      [
        { label: 'Name', type: 'text', placeholder: 'Enter name' },
        { label: 'Email', type: 'email', placeholder: 'Enter email' },
      ],
      null,
      2
    ),
    submitLabel: 'Submit',
    events: '[]',
  },
  fields: [
    { key: 'title', label: 'Title', type: 'text', placeholder: 'Form title' },
    {
      key: 'fields',
      label: 'Fields (JSON)',
      type: 'json',
      placeholder: '[{\"label\":\"Name\",\"type\":\"text\"}]',
    },
    { key: 'submitLabel', label: 'Submit label', type: 'text', placeholder: 'Submit' },
    {
      key: 'events',
      label: 'Events (JSON)',
      type: 'json',
      placeholder: '[{\"event\":\"submit\",\"type\":\"query\",\"queryName\":\"saveForm\"}]',
    },
  ],
  render: (props, context) => {
    const parsedFields = normalizeArray<FormFieldConfig>(parseMaybeJson(props.fields), [])
    const safeFields =
      parsedFields.length > 0
        ? parsedFields
        : [
            { label: 'Name', type: 'text', placeholder: 'Enter name' },
            { label: 'Email', type: 'email', placeholder: 'Enter email' },
          ]

    return (
      <div className="rounded-lg border border-foreground-muted/40 bg-surface-100 p-4">
        {props.title && <div className="text-sm font-medium text-foreground">{props.title}</div>}
        <div className="mt-4 space-y-3">
          {safeFields.map((field, index) => (
            <div key={`${field.label}-${index}`} className="space-y-1">
              <label className="text-xs font-medium text-foreground">{field.label}</label>
              {field.type === 'textarea' ? (
                <Textarea placeholder={field.placeholder} />
              ) : (
                <Input
                  type={field.type ?? 'text'}
                  placeholder={field.placeholder}
                  defaultValue={normalizeString(undefined)}
                />
              )}
            </div>
          ))}
          <button
            type="button"
            className="mt-2 w-full rounded-md bg-brand-600 px-3 py-2 text-xs font-medium text-white"
            onClick={() => context?.runActions?.('submit')}
          >
            {props.submitLabel || 'Submit'}
          </button>
        </div>
      </div>
    )
  },
}
