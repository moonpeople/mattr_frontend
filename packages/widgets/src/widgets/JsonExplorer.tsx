import type { WidgetDefinition } from '../types'
import { normalizeString, parseMaybeJson } from '../helpers'

type JsonExplorerProps = {
  label: string
  value: string
  helperText: string
}

const formatJson = (value: unknown) => {
  if (typeof value === 'string') {
    const parsed = parseMaybeJson(value)
    if (parsed !== null) {
      return JSON.stringify(parsed, null, 2)
    }
    return value
  }
  try {
    return JSON.stringify(value ?? {}, null, 2)
  } catch {
    return normalizeString(value, '')
  }
}

export const JsonExplorerWidget: WidgetDefinition<JsonExplorerProps> = {
  type: 'JsonExplorer',
  label: 'JSON Explorer',
  category: 'data',
  description: 'Inspect JSON data',
  defaultProps: {
    label: 'JSON',
    value: '{\n  "key": "value"\n}',
    helperText: '',
  },
  fields: [
    { key: 'label', label: 'Label', type: 'text', placeholder: 'JSON' },
    {
      key: 'value',
      label: 'Value',
      type: 'textarea',
      placeholder: '{\n  "key": "value"\n}',
    },
    { key: 'helperText', label: 'Helper text', type: 'text', placeholder: 'Help text' },
  ],
  render: (props, context) => {
    const value = formatJson(context?.state?.value ?? props.value)

    return (
      <div className="space-y-1">
        {props.label && (
          <label className="text-xs font-medium text-foreground">{props.label}</label>
        )}
        <pre className="max-h-72 overflow-auto rounded-md border border-input bg-muted/40 p-3 text-xs font-mono text-foreground">
          {value}
        </pre>
        {props.helperText && <div className="text-xs text-foreground-muted">{props.helperText}</div>}
      </div>
    )
  },
}
