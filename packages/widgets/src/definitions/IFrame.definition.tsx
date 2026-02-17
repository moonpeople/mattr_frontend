import { createWidgetDefinition } from '../types'

export type IFrameProps = {
  src: string
  title: string
  height: number
}

export const IFrameDefinition = createWidgetDefinition<IFrameProps>({
  type: 'IFrame',
  label: 'IFrame',
  category: 'presentation',
  description: 'Embed external content',
  defaultProps: {
    src: 'https://www.wikipedia.org/',
    title: 'Embedded content',
    height: 256,
  },
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
})
