import { normalizeString } from '../helpers'
import { createWidgetDefinition } from '../types'

export type LookerProps = {
  embedUrl: string
}

export const LookerDefinition = createWidgetDefinition<LookerProps>({
  type: 'Looker',
  label: 'Looker Embed',
  category: 'data',
  description: 'Embedded Looker dashboard',
  defaultProps: {
    embedUrl: 'https://foo.looker.com/embed/dashboards/1',
  },
  render: (props) => {
    const src = normalizeString(props.embedUrl, '')

    return (
      <div className="aspect-video w-full overflow-hidden rounded border border-border/40 bg-card">
        {src ? (
          <iframe src={src} title="Looker" className="h-full w-full" />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">No embed URL</div>
        )}
      </div>
    )
  },
})
