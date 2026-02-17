import { Badge } from 'ui'

import { normalizeArray, normalizeString, parseMaybeJson } from '../helpers'
import { createWidgetDefinition } from '../types'

export type TextAnnotationProps = {
  text: string
  labels: string
}

const normalizeLabels = (raw: unknown): string[] => {
  const parsed = parseMaybeJson(raw)
  const normalized = normalizeArray<string>(parsed, [])
  if (normalized.length > 0) {
    return normalized.map((item) => String(item))
  }
  return []
}

export const TextAnnotationDefinition = createWidgetDefinition<TextAnnotationProps>({
  type: 'TextAnnotation',
  label: 'Text Annotation',
  category: 'presentation',
  description: 'Annotate text with labels',
  defaultProps: {
    text: 'Annotate this text',
    labels: '["name", "city", "date"]',
  },
  render: (props) => {
    const labels = normalizeLabels(props.labels)

    return (
      <div className="space-y-3 rounded border border-border/40 bg-card p-3">
        <div className="text-sm text-foreground">{normalizeString(props.text, '')}</div>
        <div className="flex flex-wrap gap-2">
          {labels.length > 0 ? (
            labels.map((label) => <Badge key={label}>{label}</Badge>)
          ) : (
            <span className="text-xs text-muted-foreground">No labels</span>
          )}
        </div>
      </div>
    )
  },
})
