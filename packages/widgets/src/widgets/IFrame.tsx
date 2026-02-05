import type { WidgetDefinition } from '../types'

type IFrameProps = {
  src: string
  title: string
  height: number
}

export const IFrameWidget: WidgetDefinition<IFrameProps> = {
  type: 'IFrame',
  label: 'IFrame',
  category: 'presentation',
  description: 'Embed external content',
  defaultProps: {
    src: 'https://www.wikipedia.org/',
    title: 'Embedded content',
    height: 256,
  },
  fields: [
    { key: 'src', label: 'Source URL', type: 'text', placeholder: 'https://example.com' },
    { key: 'title', label: 'Title', type: 'text', placeholder: 'Embedded content' },
    { key: 'height', label: 'Height', type: 'number', min: 120, step: 20 },
  ],
  render: (props) => (
    <div className="w-full overflow-hidden rounded-md border border-input">
      <iframe
        title={props.title || 'Embedded content'}
        src={props.src}
        style={{ height: `${props.height}px` }}
        className="w-full"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
      />
    </div>
  ),
}
