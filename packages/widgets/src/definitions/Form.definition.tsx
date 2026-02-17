import { Input, Textarea } from 'ui'

import { normalizeArray, normalizeString, parseMaybeJson } from '../helpers'
import { createWidgetDefinition } from '../types'

export type FormFieldConfig = {
  label: string
  type?: 'text' | 'email' | 'number' | 'password' | 'textarea'
  placeholder?: string
}

export type FormProps = {
  title: string
  fields: string
  submitLabel: string
  events: string
}

export const FormDefinition = createWidgetDefinition<FormProps>({
  type: 'Form',
  label: 'Form',
  category: 'containers',
  description: 'Simple form layout',
  supportsChildren: true,
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
  render: (props, context) => {
    const parsedFields = normalizeArray<FormFieldConfig>(parseMaybeJson(props.fields), [])
    const safeFields =
      parsedFields.length > 0
        ? parsedFields
        : [
            { label: 'Name', type: 'text', placeholder: 'Enter name' },
            { label: 'Email', type: 'email', placeholder: 'Enter email' },
          ]

    const hasChildren = Boolean(context?.children)

    return (
      <div className="rounded-lg border border-border/40 bg-card p-4">
        {props.title && <div className="text-sm font-medium text-foreground">{props.title}</div>}
        <div className="mt-4 space-y-3">
          {hasChildren
            ? context?.children
            : safeFields.map((field, index) => (
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
})
