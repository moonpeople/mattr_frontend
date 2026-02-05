import { Badge } from 'ui'

import type { WidgetDefinition } from '../types'
import { normalizeArray, normalizeString, parseMaybeJson } from '../helpers'

type TextAnnotationProps = {
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

export const TextAnnotationWidget: WidgetDefinition<TextAnnotationProps> = {
  type: 'TextAnnotation',
  label: 'Text Annotation',
  category: 'presentation',
  description: 'Annotate text with labels',
  defaultProps: {
    text: 'Annotate this text',
    labels: '["name", "city", "date"]',
  },
  fields: [
    { key: 'text', label: 'Text', type: 'textarea', placeholder: 'Text to annotate' },
    { key: 'labels', label: 'Labels (JSON)', type: 'json', placeholder: '["label1","label2"]' },
  ],
  render: (props) => {
    const labels = normalizeLabels(props.labels)

    return (
      <div className="space-y-3 rounded border border-foreground-muted/40 bg-surface-100 p-3">
        <div className="text-sm text-foreground">{normalizeString(props.text, '')}</div>
        <div className="flex flex-wrap gap-2">
          {labels.length > 0 ? (
            labels.map((label) => <Badge key={label}>{label}</Badge>)
          ) : (
            <span className="text-xs text-foreground-muted">No labels</span>
          )}
        </div>
      </div>
    )
  },
}
