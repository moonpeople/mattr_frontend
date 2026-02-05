import type { WidgetDefinition } from '../types'

type PdfViewerProps = {
  src: string
  height: number
  showToolbar: boolean
  title: string
}

const buildPdfUrl = (src: string, showToolbar: boolean) => {
  if (!src || showToolbar) {
    return src
  }
  return src.includes('#') ? `${src}&toolbar=0` : `${src}#toolbar=0`
}

export const PdfViewerWidget: WidgetDefinition<PdfViewerProps> = {
  type: 'PdfViewer',
  label: 'PDF Viewer',
  category: 'presentation',
  description: 'Display a PDF document',
  defaultProps: {
    src: 'https://upload.wikimedia.org/wikipedia/commons/1/14/Marspathfinder.pdf',
    height: 480,
    showToolbar: true,
    title: 'PDF',
  },
  fields: [
    { key: 'src', label: 'Source URL', type: 'text', placeholder: 'https://...' },
    { key: 'height', label: 'Height', type: 'number', min: 200, step: 20 },
    { key: 'showToolbar', label: 'Show toolbar', type: 'boolean' },
    { key: 'title', label: 'Title', type: 'text', placeholder: 'PDF' },
  ],
  render: (props) => (
    <div className="w-full overflow-hidden rounded-md border border-input">
      <iframe
        title={props.title || 'PDF'}
        src={buildPdfUrl(props.src, props.showToolbar)}
        style={{ height: `${props.height}px` }}
        className="w-full"
      />
    </div>
  ),
}
