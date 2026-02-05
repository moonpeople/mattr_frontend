import type { WidgetDefinition } from '../types'
import { normalizeString } from '../helpers'

type VideoProps = {
  src: string
  autoplay: boolean
  loop: boolean
  showControls: boolean
  helperText: string
}

const getYouTubeId = (url: string) => {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/)
  return match?.[1] ?? null
}

export const VideoWidget: WidgetDefinition<VideoProps> = {
  type: 'Video',
  label: 'Video',
  category: 'presentation',
  description: 'Embedded video player',
  defaultProps: {
    src: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    autoplay: false,
    loop: false,
    showControls: true,
    helperText: '',
  },
  fields: [
    { key: 'src', label: 'Source URL', type: 'text', placeholder: 'https://...' },
    { key: 'autoplay', label: 'Autoplay', type: 'boolean' },
    { key: 'loop', label: 'Loop', type: 'boolean' },
    { key: 'showControls', label: 'Show controls', type: 'boolean' },
    { key: 'helperText', label: 'Helper text', type: 'text', placeholder: 'Help text' },
  ],
  render: (props) => {
    const src = normalizeString(props.src, '')
    const youtubeId = src ? getYouTubeId(src) : null

    return (
      <div className="space-y-2">
        <div className="aspect-video w-full overflow-hidden rounded border border-foreground-muted/40 bg-surface-100">
          {youtubeId ? (
            <iframe
              src={`https://www.youtube.com/embed/${youtubeId}?autoplay=${props.autoplay ? 1 : 0}&loop=${props.loop ? 1 : 0}`}
              title="Video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="h-full w-full"
            />
          ) : src ? (
            <video
              src={src}
              autoPlay={props.autoplay}
              loop={props.loop}
              controls={props.showControls}
              muted={props.autoplay}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-foreground-muted">
              No video source
            </div>
          )}
        </div>
        {props.helperText && <div className="text-xs text-foreground-muted">{props.helperText}</div>}
      </div>
    )
  },
}
