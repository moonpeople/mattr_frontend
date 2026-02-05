import type { WidgetDefinition } from '../types'

type HtmlProps = {
  html: string
  css: string
}

const buildHtml = (html: string, css: string) => {
  if (!css) {
    return html
  }
  return `<style>${css}</style>${html}`
}

export const HtmlWidget: WidgetDefinition<HtmlProps> = {
  type: 'Html',
  label: 'HTML',
  category: 'presentation',
  description: 'Render custom HTML',
  defaultProps: {
    html: '<div>Hello World</div>',
    css: '',
  },
  fields: [
    {
      key: 'html',
      label: 'HTML',
      type: 'textarea',
      placeholder: '<div>Hello</div>',
    },
    {
      key: 'css',
      label: 'CSS',
      type: 'textarea',
      placeholder: '.myClass { color: red; }',
    },
  ],
  render: (props) => (
    <div
      className="rounded-md border border-input bg-background"
      dangerouslySetInnerHTML={{ __html: buildHtml(props.html, props.css) }}
    />
  ),
}
