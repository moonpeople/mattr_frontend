import { Button, Input, TextArea_Shadcn_ } from 'ui'

import { normalizeString, parseMaybeJson } from '../helpers'
import { createWidgetDefinition } from '../types'

export type JsonSchemaFormProps = {
  schema: string
  data: string
  uiSchema: string
  submitText: string
  hideSubmit: boolean
}

export const JsonSchemaFormDefinition = createWidgetDefinition<JsonSchemaFormProps>({
  type: 'JsonSchemaForm',
  label: 'JSON Schema Form',
  category: 'containers',
  description: 'Render a JSON schema form',
  defaultProps: {
    schema: '{\n  "title": "Form"\n}',
    data: '{}',
    uiSchema: '{}',
    submitText: 'Submit',
    hideSubmit: false,
  },
  render: (props, context) => {
    const schema = parseMaybeJson(props.schema) as Record<string, unknown> | null
    const properties =
      (schema?.properties as Record<
        string,
        { type?: string; title?: string; format?: string }
      > | undefined) ?? {}
    const initialData = (parseMaybeJson(props.data) as Record<string, unknown> | null) ?? {}
    const formData = (context?.state?.formData as Record<string, unknown> | undefined) ?? initialData

    const handleChange = (key: string, value: unknown) => {
      const next = { ...formData, [key]: value }
      context?.setState?.({ formData: next })
    }

    return (
      <div className="space-y-3 rounded border border-border/40 bg-card p-3">
        <div className="text-xs font-medium text-foreground">Form</div>
        {Object.keys(properties).length > 0 ? (
          <div className="space-y-3">
            {Object.entries(properties).map(([key, definition]) => {
              const label = definition.title ?? key
              const type = definition.type ?? 'string'
              const value = formData[key]
              const stringValue = value === undefined || value === null ? '' : String(value)
              if (type === 'boolean') {
                return (
                  <label key={key} className="flex items-center justify-between text-sm text-foreground">
                    <span>{label}</span>
                    <input
                      type="checkbox"
                      checked={Boolean(value)}
                      onChange={(event) => handleChange(key, event.target.checked)}
                    />
                  </label>
                )
              }
              if (type === 'number' || type === 'integer') {
                return (
                  <div key={key} className="space-y-1">
                    <label className="text-xs font-medium text-foreground">{label}</label>
                    <Input
                      type="number"
                      value={stringValue}
                      onChange={(event) => handleChange(key, event.target.value)}
                    />
                  </div>
                )
              }
              const inputType =
                definition.format === 'date'
                  ? 'date'
                  : definition.format === 'date-time'
                    ? 'datetime-local'
                    : 'text'
              return (
                <div key={key} className="space-y-1">
                  <label className="text-xs font-medium text-foreground">{label}</label>
                  <Input
                    type={inputType}
                    value={stringValue}
                    onChange={(event) => handleChange(key, event.target.value)}
                  />
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-xs text-muted-foreground">No schema fields</div>
        )}
        {!props.hideSubmit && (
          <Button
            type="primary"
            size="small"
            htmlType="button"
            onClick={() => context?.runActions?.('submit', { data: formData })}
          >
            {props.submitText}
          </Button>
        )}
        <div className="pt-2">
          <div className="text-xs font-medium text-foreground">Schema</div>
          <TextArea_Shadcn_
            rows={4}
            value={normalizeString(props.schema, '')}
            readOnly
            className="text-xs font-mono"
          />
        </div>
      </div>
    )
  },
})
