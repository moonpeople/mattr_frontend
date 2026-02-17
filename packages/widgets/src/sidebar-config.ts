export type SidebarPanelSide = 'left' | 'right'
export type SidebarPanelPadding = 'sm' | 'md' | 'lg'
export type SidebarPanelBackground = 'surface' | 'muted' | 'transparent'

export type SidebarPanelConfig = {
  side: SidebarPanelSide
  width: number
  open: boolean
  collapsible: boolean
  collapsed: boolean
  panelWidth: number
  showHeader: boolean
  showFooter: boolean
  bordered: boolean
  background: SidebarPanelBackground
  padding: SidebarPanelPadding
  headerPadding: SidebarPanelPadding
  footerPadding: SidebarPanelPadding
  title: string
  description: string
}

type SidebarPanelResolveOptions = {
  open?: unknown
}

const parseBoolean = (value: unknown, fallback: boolean) => {
  if (typeof value === 'boolean') {
    return value
  }
  if (typeof value === 'number') {
    return value !== 0
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (['true', '1', 'yes', 'y'].includes(normalized)) {
      return true
    }
    if (['false', '0', 'no', 'n'].includes(normalized)) {
      return false
    }
  }
  return fallback
}

const clamp = (value: unknown, min: number, max: number, fallback: number) => {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) {
    return fallback
  }
  return Math.max(min, Math.min(max, parsed))
}

export const getSidebarPaddingClass = (padding: SidebarPanelPadding) =>
  padding === 'sm' ? 'p-3' : padding === 'lg' ? 'p-6' : 'p-4'

export const getSidebarSectionPaddingClass = (padding: SidebarPanelPadding) =>
  padding === 'sm' ? 'px-2 py-1.5' : padding === 'lg' ? 'px-4 py-3' : 'px-3 py-2'

export const getSidebarBackgroundToken = (background: SidebarPanelBackground) =>
  background === 'muted'
    ? 'var(--muted)'
    : background === 'transparent'
      ? '0 0% 0% / 0'
      : 'var(--background)'

export const buildSidebarThemeVars = (config: Pick<SidebarPanelConfig, 'background' | 'bordered'>) => ({
  '--sidebar-background': getSidebarBackgroundToken(config.background),
  '--sidebar-foreground': 'var(--foreground)',
  '--sidebar-primary': 'var(--primary)',
  '--sidebar-primary-foreground': 'var(--primary-foreground)',
  '--sidebar-accent': 'var(--accent)',
  '--sidebar-accent-foreground': 'var(--accent-foreground)',
  '--sidebar-border': config.bordered ? 'var(--border)' : '0 0% 0% / 0',
  '--sidebar-ring': 'var(--ring)',
})

export const resolveSidebarPanelConfig = (
  raw: Record<string, unknown> | undefined,
  options: SidebarPanelResolveOptions = {}
): SidebarPanelConfig => {
  const sideRaw = typeof raw?.side === 'string' ? raw.side.trim().toLowerCase() : 'left'
  const side: SidebarPanelSide = sideRaw === 'right' ? 'right' : 'left'
  const width = clamp(raw?.width, 160, 640, 280)

  const openFromProps = parseBoolean(raw?.open, true)
  const open = options.open === undefined ? openFromProps : parseBoolean(options.open, openFromProps)
  const collapsible = parseBoolean(raw?.collapsible, true)
  const collapsed = collapsible && !open
  const panelWidth = collapsed ? 56 : width

  const showHeader = parseBoolean(raw?.showHeader, true)
  const showFooter = parseBoolean(raw?.showFooter, false)
  const bordered = parseBoolean(raw?.bordered, true)

  const backgroundRaw =
    typeof raw?.background === 'string' ? raw.background.trim().toLowerCase() : 'surface'
  const background: SidebarPanelBackground =
    backgroundRaw === 'muted' || backgroundRaw === 'transparent' ? backgroundRaw : 'surface'

  const paddingRaw = typeof raw?.padding === 'string' ? raw.padding.trim().toLowerCase() : 'md'
  const padding: SidebarPanelPadding =
    paddingRaw === 'sm' || paddingRaw === 'lg' ? paddingRaw : 'md'
  const headerPaddingRaw =
    typeof raw?.headerPadding === 'string' ? raw.headerPadding.trim().toLowerCase() : 'md'
  const headerPadding: SidebarPanelPadding =
    headerPaddingRaw === 'sm' || headerPaddingRaw === 'lg' ? headerPaddingRaw : 'md'
  const footerPaddingRaw =
    typeof raw?.footerPadding === 'string' ? raw.footerPadding.trim().toLowerCase() : 'md'
  const footerPadding: SidebarPanelPadding =
    footerPaddingRaw === 'sm' || footerPaddingRaw === 'lg' ? footerPaddingRaw : 'md'

  const title =
    typeof raw?.title === 'string' && raw.title.trim().length > 0 ? raw.title.trim() : 'Sidebar'
  const description = typeof raw?.description === 'string' ? raw.description.trim() : ''

  return {
    side,
    width,
    open,
    collapsible,
    collapsed,
    panelWidth,
    showHeader,
    showFooter,
    bordered,
    background,
    padding,
    headerPadding,
    footerPadding,
    title,
    description,
  }
}
