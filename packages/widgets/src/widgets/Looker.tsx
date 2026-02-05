import type { WidgetDefinition } from '../types'
import { normalizeString } from '../helpers'

type LookerProps = {
  embedUrl: string
}

export const LookerWidget: WidgetDefinition<LookerProps> = {
  type: 'Looker',
  label: 'Looker Embed',
  category: 'data',
  description: 'Embedded Looker dashboard',
  defaultProps: {
    embedUrl: 'https://foo.looker.com/embed/dashboards/1',
  },
  fields: [
    { key: 'embedUrl', label: 'Embed URL', type: 'text', placeholder: 'https://...' },
  ],
  render: (props) => {
    const src = normalizeString(props.embedUrl, '')

    return (
      <div className="aspect-video w-full overflow-hidden rounded border border-foreground-muted/40 bg-surface-100">
        {src ? (
          <iframe src={src} title="Looker" className="h-full w-full" />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-foreground-muted">No embed URL</div>
        )}
      </div>
    )
  },
}
