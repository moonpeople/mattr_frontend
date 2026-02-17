import { normalizeString, parseMaybeJson } from '../helpers'
import { createWidgetDefinition } from '../types'

export type KeyValueMapProps = {
  keyTitle: string
  valueTitle: string
  data: string
}

const normalizeData = (raw: unknown): Record<string, unknown> | null => {
  const parsed = parseMaybeJson(raw)
  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
    return parsed as Record<string, unknown>
  }
  return null
}

export const KeyValueMapDefinition = createWidgetDefinition<KeyValueMapProps>({
  type: 'KeyValueMap',
  label: 'Key Value Map',
  category: 'data',
  description: 'Key/value table',
  defaultProps: {
    keyTitle: 'Key',
    valueTitle: 'Value',
    data: '{\n  "a": 1,\n  "b": 2,\n  "c": 3\n}',
  },
  render: (props) => {
    const data = normalizeData(props.data)

    return (
      <div className="space-y-2">
        <div className="grid grid-cols-[1fr_2fr] gap-2 text-xs text-muted-foreground uppercase">
          <div>{props.keyTitle}</div>
          <div>{props.valueTitle}</div>
        </div>
        {data ? (
          <div className="space-y-2">
            {Object.entries(data).map(([key, value]) => (
              <div key={key} className="grid grid-cols-[1fr_2fr] gap-2 text-sm">
                <div className="text-muted-foreground">{key}</div>
                <div className="text-foreground">{normalizeString(value, String(value))}</div>
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
})
