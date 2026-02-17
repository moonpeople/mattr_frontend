import { createWidgetDefinition } from '../types'

export type GlobalFrameProps = {
  title: string
  padding: 'sm' | 'md' | 'lg'
  bordered: boolean
  background: 'surface' | 'muted' | 'transparent'
  events: unknown[]
}

export type GlobalSidebarFrameProps = GlobalFrameProps & {
  description: string
  side: 'left' | 'right'
  width: number
  open: boolean
  collapsible: boolean
  showHeader: boolean
  showFooter: boolean
  headerPadding: 'sm' | 'md' | 'lg'
  footerPadding: 'sm' | 'md' | 'lg'
}

export type GlobalOverlayFrameProps = GlobalFrameProps & {
  showHeader: boolean
  showFooter: boolean
  showOverlay: boolean
  closeOnOutsideClick: boolean
  expandToFit: boolean
  width: 'small' | 'medium' | 'large'
  size: 'small' | 'medium' | 'large'
}

const renderFramePlaceholder = (title: string, label: string) => (
  <div className="rounded-md border border-dashed border-border/40 bg-card px-3 py-4 text-xs text-muted-foreground">
    {title || label} area
  </div>
)

const createGlobalFrame = (type: string, label: string, description: string) =>
  createWidgetDefinition<GlobalFrameProps>({
    type,
    label,
    category: 'globals',
    description,
    supportsChildren: true,
    defaultProps: {
      title: label,
      padding: 'md',
      bordered: true,
      background: 'surface',
      events: [],
    },
    render: (props) => renderFramePlaceholder(props.title, label),
  })

const createOverlayFrame = (type: string, label: string, description: string) =>
  createWidgetDefinition<GlobalOverlayFrameProps>({
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
      padding: 'md',
      bordered: true,
      background: 'surface',
      width: 'medium',
      size: 'medium',
      events: [],
    },
    render: (props) => renderFramePlaceholder(props.title, label),
  })

export const GlobalHeaderDefinition = createGlobalFrame(
  'GlobalHeader',
  'Header',
  'Persistent header area'
)

export const GlobalSidebarDefinition = createWidgetDefinition<GlobalSidebarFrameProps>({
  type: 'GlobalSidebar',
  label: 'Sidebar',
  category: 'globals',
  description: 'Persistent sidebar navigation',
  supportsChildren: true,
  defaultProps: {
    title: 'Sidebar',
    description: '',
    side: 'left',
    width: 280,
    open: true,
    collapsible: true,
    showHeader: true,
    showFooter: false,
    headerPadding: 'md',
    footerPadding: 'md',
    padding: 'md',
    bordered: true,
    background: 'surface',
    events: [],
  },
  render: (props) => renderFramePlaceholder(props.title, 'Sidebar'),
})

export const GlobalDrawerDefinition = createOverlayFrame(
  'GlobalDrawer',
  'Drawer',
  'Slide-over drawer container'
)

export const GlobalModalDefinition = createOverlayFrame(
  'GlobalModal',
  'Modal',
  'Global modal container'
)

export const GlobalSplitPaneDefinition = createGlobalFrame(
  'GlobalSplitPane',
  'Split pane',
  'Global split pane layout'
)
