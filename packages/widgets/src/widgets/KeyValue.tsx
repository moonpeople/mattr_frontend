import type { WidgetDefinition } from '../types'
import { normalizeString, parseMaybeJson } from '../helpers'

type KeyValueProps = {
  label: string
  data: string
}

const normalizeData = (raw: unknown): Record<string, unknown> | null => {
  const parsed = parseMaybeJson(raw)
  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
    return parsed as Record<string, unknown>
  }
  return null
}

export const KeyValueWidget: WidgetDefinition<KeyValueProps> = {
  type: 'KeyValue',
  label: 'Key Value',
  category: 'data',
  description: 'Key/value list',
  defaultProps: {
    label: 'Details',
    data: '{\n  "id": 1,\n  "name": "Chic Footitt",\n  "email": "chic.footitt@yahoo.com"\n}',
  },
  fields: [
    { key: 'label', label: 'Label', type: 'text', placeholder: 'Details' },
    {
      key: 'data',
      label: 'Data (JSON)',
      type: 'textarea',
      placeholder: '{ "key": "value" }',
    },
  ],
  render: (props) => {
    const data = normalizeData(props.data)

    return (
      <div className="space-y-2">
        {props.label && <div className="text-sm font-medium text-foreground">{props.label}</div>}
        {data ? (
          <div className="space-y-2">
            {Object.entries(data).map(([key, value]) => (
              <div key={key} className="flex items-start justify-between gap-4 text-sm">
                <span className="text-foreground-muted">{key}</span>
                <span className="text-foreground">{normalizeString(value, String(value))}</span>
              </div>
            ))}
          </div>
        ) : (
          <pre className="rounded-md border border-input bg-muted/40 p-3 text-xs font-mono text-foreground">
            {props.data}
          </pre>
        )}
      </div>
    )
  },
}
