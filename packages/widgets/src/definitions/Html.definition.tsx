import { createWidgetDefinition } from '../types'

export type HtmlProps = {
  html: string
  css: string
}

const buildHtml = (html: string, css: string) => {
  if (!css) {
    return html
  }
  return `<style>${css}</style>${html}`
}

export const HtmlDefinition = createWidgetDefinition<HtmlProps>({
  type: 'Html',
  label: 'HTML',
  category: 'presentation',
  description: 'Render custom HTML',
  defaultProps: {
    html: '<div>Hello World</div>',
    css: '',
  },
  render: (props) => (
    <div
      className="rounded-md border border-input bg-background"
      dangerouslySetInnerHTML={{ __html: buildHtml(props.html, props.css) }}
    />
  ),
})
