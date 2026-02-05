import type { WidgetDefinition } from '../types'

type GlobalFrameProps = {
  title: string
}

type GlobalOverlayFrameProps = GlobalFrameProps & {
  showHeader: boolean
  showFooter: boolean
  showOverlay: boolean
  closeOnOutsideClick: boolean
  expandToFit: boolean
  padding: 'normal' | 'none'
  width: 'small' | 'medium' | 'large'
  size: 'small' | 'medium' | 'large'
  events: unknown
}

const renderFramePlaceholder = (title: string, label: string) => (
  <div className="rounded-md border border-dashed border-foreground-muted/40 bg-surface-100 px-3 py-4 text-xs text-foreground-muted">
    {title || label} area
  </div>
)

const createGlobalFrame = (
  type: string,
  label: string,
  description: string
): WidgetDefinition<GlobalFrameProps> => ({
  type,
  label,
  category: 'globals',
  description,
  supportsChildren: true,
  defaultProps: {
    title: label,
  },
  render: (props) => renderFramePlaceholder(props.title, label),
})

const createOverlayFrame = (
  type: string,
  label: string,
  description: string
): WidgetDefinition<GlobalOverlayFrameProps> => ({
  type,
  label,
  category: 'globals',
  description,
  supportsChildren: true,
  defaultProps: {
    title: label,
    showHeader: true,
    showFooter: true,
    showOverlay: true,
    closeOnOutsideClick: true,
    expandToFit: false,
    padding: 'normal',
    width: 'medium',
    size: 'medium',
    events: [],
  },
  fields: [
    { key: 'title', label: 'Title', type: 'text', placeholder: `${label} title` },
    { key: 'showHeader', label: 'Show header', type: 'boolean' },
    { key: 'showFooter', label: 'Show footer', type: 'boolean' },
    { key: 'showOverlay', label: 'Show overlay', type: 'boolean' },
    { key: 'closeOnOutsideClick', label: 'Close on outside click', type: 'boolean' },
    { key: 'expandToFit', label: 'Expand content to fit', type: 'boolean' },
    {
      key: 'padding',
      label: 'Padding',
      type: 'select',
      options: [
        { label: 'Normal', value: 'normal' },
        { label: 'None', value: 'none' },
      ],
    },
  ],
  render: (props) => renderFramePlaceholder(props.title, label),
})

export const GlobalHeaderWidget = createGlobalFrame(
  'GlobalHeader',
  'Header',
  'Persistent header area'
)

export const GlobalSidebarWidget = createGlobalFrame(
  'GlobalSidebar',
  'Sidebar',
  'Persistent sidebar navigation'
)

export const GlobalDrawerWidget = createOverlayFrame(
  'GlobalDrawer',
  'Drawer',
  'Slide-over drawer container'
)

export const GlobalModalWidget = createOverlayFrame(
  'GlobalModal',
  'Modal',
  'Global modal container'
)

export const GlobalSplitPaneWidget = createGlobalFrame(
  'GlobalSplitPane',
  'Split pane',
  'Global split pane layout'
)
