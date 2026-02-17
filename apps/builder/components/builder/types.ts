import type { WidgetInstance } from 'widgets/runtime'

// Tipy i utility buildera: spacing, page/menu, widget instance.

export type BuilderWidgetSpacing = {
  heightMode?: 'auto' | 'fixed'
  heightFxEnabled?: boolean
  heightFx?: string
  marginMode?: 'normal' | 'none'
  marginFxEnabled?: boolean
  marginFx?: string
  paddingMode?: 'normal' | 'none'
  paddingFxEnabled?: boolean
  paddingFx?: string
  headerPaddingMode?: 'normal' | 'none'
  headerPaddingFxEnabled?: boolean
  headerPaddingFx?: string
  footerPaddingMode?: 'normal' | 'none'
  footerPaddingFxEnabled?: boolean
  footerPaddingFx?: string
}

export type BuilderSection =
  | 'components'
  | 'pages'
  | 'tree'
  | 'code'
  | 'search'
  | 'state'
  | 'history'
  | 'settings'

export const getDefaultWidgetSpacing = (
  widgetType?: string
): Required<BuilderWidgetSpacing> => ({
  heightMode: widgetType === 'JsonEditor' ? 'fixed' : 'auto',
  heightFxEnabled: false,
  heightFx: '',
  marginMode: 'normal',
  marginFxEnabled: false,
  marginFx: '',
  paddingMode: 'normal',
  paddingFxEnabled: false,
  paddingFx: '',
  headerPaddingMode: 'normal',
  headerPaddingFxEnabled: false,
  headerPaddingFx: '',
  footerPaddingMode: 'normal',
  footerPaddingFxEnabled: false,
  footerPaddingFx: '',
})

export const resolveWidgetSpacing = (
  widgetType: string,
  spacing?: BuilderWidgetSpacing | null
): Required<BuilderWidgetSpacing> => {
  const defaults = getDefaultWidgetSpacing(widgetType)
  const merged = {
    ...defaults,
    ...(spacing ?? {}),
  }
  const resolved: Required<BuilderWidgetSpacing> = {
    heightMode: merged.heightMode ?? defaults.heightMode,
    heightFxEnabled: merged.heightFxEnabled ?? defaults.heightFxEnabled,
    heightFx: merged.heightFx ?? defaults.heightFx,
    marginMode: merged.marginMode ?? defaults.marginMode,
    marginFxEnabled: merged.marginFxEnabled ?? defaults.marginFxEnabled,
    marginFx: merged.marginFx ?? defaults.marginFx,
    paddingMode: merged.paddingMode ?? defaults.paddingMode,
    paddingFxEnabled: merged.paddingFxEnabled ?? defaults.paddingFxEnabled,
    paddingFx: merged.paddingFx ?? defaults.paddingFx,
    headerPaddingMode: merged.headerPaddingMode ?? defaults.headerPaddingMode,
    headerPaddingFxEnabled: merged.headerPaddingFxEnabled ?? defaults.headerPaddingFxEnabled,
    headerPaddingFx: merged.headerPaddingFx ?? defaults.headerPaddingFx,
    footerPaddingMode: merged.footerPaddingMode ?? defaults.footerPaddingMode,
    footerPaddingFxEnabled: merged.footerPaddingFxEnabled ?? defaults.footerPaddingFxEnabled,
    footerPaddingFx: merged.footerPaddingFx ?? defaults.footerPaddingFx,
  }

  // Retool parity: JSON editor height is controlled by RGL only.
  if (widgetType === 'JsonEditor') {
    return {
      ...resolved,
      heightMode: 'fixed',
      heightFxEnabled: false,
      heightFx: '',
    }
  }

  return resolved
}

const DEFAULT_MARGIN_PADDING = '4px 8px'
const DEFAULT_PAGE_PADDING = '8px 12px'

const normalizeMarginPadding = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return `${value}px`
  }
  if (typeof value === 'string') {
    return value.trim()
  }
  return ''
}

export const resolveSpacingPadding = (
  spacing: Required<BuilderWidgetSpacing>,
  evaluateFx?: (value: string) => unknown,
  source: 'margin' | 'padding' | 'headerPadding' | 'footerPadding' = 'margin'
) => {
  const isContentPadding = source === 'padding'
  const isHeaderPadding = source === 'headerPadding'
  const isFooterPadding = source === 'footerPadding'
  const mode = isContentPadding
    ? spacing.paddingMode
    : isHeaderPadding
      ? spacing.headerPaddingMode
      : isFooterPadding
        ? spacing.footerPaddingMode
        : spacing.marginMode
  const fxEnabled = isContentPadding
    ? spacing.paddingFxEnabled
    : isHeaderPadding
      ? spacing.headerPaddingFxEnabled
      : isFooterPadding
        ? spacing.footerPaddingFxEnabled
        : spacing.marginFxEnabled
  const fx = isContentPadding
    ? spacing.paddingFx
    : isHeaderPadding
      ? spacing.headerPaddingFx
      : isFooterPadding
        ? spacing.footerPaddingFx
        : spacing.marginFx
  const isPaddingLike = isContentPadding || isHeaderPadding || isFooterPadding
  const fallback = mode === 'none' ? '0px' : isPaddingLike ? DEFAULT_PAGE_PADDING : DEFAULT_MARGIN_PADDING
  if (!fxEnabled || !fx) {
    return fallback
  }

  const evaluated = evaluateFx ? evaluateFx(fx) : fx
  const normalized = normalizeMarginPadding(evaluated)
  if (!normalized) {
    return fallback
  }
  const unwrapped =
    normalized.startsWith('{{') && normalized.endsWith('}}')
      ? normalized.slice(2, -2).trim()
      : normalized
  const cleaned = unwrapped.replace(/^['"]|['"]$/g, '').trim()
  if (!cleaned) {
    return fallback
  }
  if (cleaned === 'none') {
    return '0px'
  }
  if (cleaned === 'normal') {
    return DEFAULT_MARGIN_PADDING
  }
  return cleaned
}

export const resolvePagePaddingValue = (
  pageMain: BuilderMainFrame | undefined,
  evaluateFx?: (value: string) => unknown
) => {
  const fallback =
    pageMain?.paddingMode === 'none' ? '' : DEFAULT_PAGE_PADDING
  if (!pageMain?.paddingFxEnabled || !pageMain?.paddingFx) {
    return fallback
  }
  const evaluated = evaluateFx ? evaluateFx(pageMain.paddingFx) : pageMain.paddingFx
  if (typeof evaluated === 'undefined' || evaluated === null) {
    return fallback
  }
  const normalized = normalizeMarginPadding(evaluated)
  if (!normalized) {
    return fallback
  }
  const unwrapped =
    normalized.startsWith('{{') && normalized.endsWith('}}')
      ? normalized.slice(2, -2).trim()
      : normalized
  const cleaned = unwrapped.replace(/^['"]|['"]$/g, '').trim()
  if (!cleaned) {
    return fallback
  }
  if (cleaned === 'none') {
    return ''
  }
  if (cleaned === 'normal') {
    return DEFAULT_PAGE_PADDING
  }
  return cleaned
}

// Obrabotka fx znachenii ({{ }}) dlya spacing mode.
const resolveFxMode = <T extends string>(
  fallback: T,
  enabled: boolean | undefined,
  expression: string | undefined,
  allowed: T[],
  evaluateFx?: (value: string) => unknown
) => {
  if (!enabled || !expression) {
    return fallback
  }

  const evaluated = evaluateFx ? evaluateFx(expression) : expression
  if (typeof evaluated === 'undefined' || evaluated === null) {
    return fallback
  }

  const normalizedValue = String(evaluated).trim()
  if (!normalizedValue) {
    return fallback
  }

  const unwrapped =
    normalizedValue.startsWith('{{') && normalizedValue.endsWith('}}')
      ? normalizedValue.slice(2, -2).trim()
      : normalizedValue
  const normalized = unwrapped.replace(/^['"]|['"]$/g, '').trim()
  return allowed.includes(normalized as T) ? (normalized as T) : fallback
}

export const resolveWidgetSpacingModes = (
  widgetType: string,
  spacing?: BuilderWidgetSpacing | null,
  evaluateFx?: (value: string) => unknown
): Required<BuilderWidgetSpacing> => {
  const resolved = resolveWidgetSpacing(widgetType, spacing)
  return {
    ...resolved,
    heightMode: resolveFxMode(
      resolved.heightMode ?? 'fixed',
      resolved.heightFxEnabled,
      resolved.heightFx,
      ['auto', 'fixed'],
      evaluateFx
    ),
    marginMode: resolveFxMode(
      resolved.marginMode ?? 'normal',
      resolved.marginFxEnabled,
      resolved.marginFx,
      ['normal', 'none'],
      evaluateFx
    ),
    paddingMode: resolveFxMode(
      resolved.paddingMode ?? 'normal',
      resolved.paddingFxEnabled,
      resolved.paddingFx,
      ['normal', 'none'],
      evaluateFx
    ),
    headerPaddingMode: resolveFxMode(
      resolved.headerPaddingMode ?? 'normal',
      resolved.headerPaddingFxEnabled,
      resolved.headerPaddingFx,
      ['normal', 'none'],
      evaluateFx
    ),
    footerPaddingMode: resolveFxMode(
      resolved.footerPaddingMode ?? 'normal',
      resolved.footerPaddingFxEnabled,
      resolved.footerPaddingFx,
      ['normal', 'none'],
      evaluateFx
    ),
  }
}

// Rasshirennyi tip widgeta dlya buildera (layout, spacing, access).
export type BuilderWidgetInstance = Omit<WidgetInstance, 'children'> & {
  children?: BuilderWidgetInstance[]
  layout?: {
    x: number
    y: number
    w: number
    h: number
    minW?: number
    minH?: number
    maxW?: number
    maxH?: number
  }
  spacing?: BuilderWidgetSpacing
  policy?: string[]
  visibleWhen?: string
  disabledWhen?: string
  hidden?: boolean | string
}

export const APP_FRAME_TYPES = ['GlobalHeader', 'GlobalSidebar'] as const
export type BuilderAppFrameType = (typeof APP_FRAME_TYPES)[number]

export const PAGE_FRAME_TYPES = ['GlobalSplitPane', 'GlobalDrawer', 'GlobalModal'] as const
export type BuilderPageFrameType = (typeof PAGE_FRAME_TYPES)[number]

export type BuilderMainFrame = {
  expandToFit?: boolean
  background?: string
  paddingMode?: 'normal' | 'none'
  paddingFxEnabled?: boolean
  paddingFx?: string
}

export type BuilderAppLayout = {
  header?: BuilderWidgetInstance
  sidebar?: BuilderWidgetInstance
}

export type BuilderPageFrames = {
  splitPane?: BuilderWidgetInstance
  drawers: BuilderWidgetInstance[]
  modals: BuilderWidgetInstance[]
}

export type BuilderPageLayout = {
  main: BuilderMainFrame
  widgets: BuilderWidgetInstance[]
  frames: BuilderPageFrames
}

export const createEmptyPageLayout = (): BuilderPageLayout => ({
  main: createDefaultMainFrame(),
  widgets: [],
  frames: createEmptyPageFrames(),
})

export const isAppFrameType = (type: string): type is BuilderAppFrameType =>
  type === 'GlobalHeader' || type === 'GlobalSidebar'

export const isPageFrameType = (type: string): type is BuilderPageFrameType =>
  type === 'GlobalSplitPane' || type === 'GlobalDrawer' || type === 'GlobalModal'

export const isFrameType = (type: string) => isAppFrameType(type) || isPageFrameType(type)

export const resolveFrameScope = (type: string): 'app' | 'page' | null => {
  if (isAppFrameType(type)) {
    return 'app'
  }
  if (isPageFrameType(type)) {
    return 'page'
  }
  return null
}

export const createDefaultMainFrame = (): BuilderMainFrame => ({
  expandToFit: false,
  background: '',
  paddingMode: 'normal',
  paddingFxEnabled: false,
  paddingFx: '',
})

export const createEmptyAppLayout = (): BuilderAppLayout => ({})

export const createEmptyPageFrames = (): BuilderPageFrames => ({
  drawers: [],
  modals: [],
})

export const getAppLayoutWidgets = (layout: BuilderAppLayout): BuilderWidgetInstance[] => {
  const widgets: BuilderWidgetInstance[] = []
  if (layout.header) {
    widgets.push(layout.header)
  }
  if (layout.sidebar) {
    widgets.push(layout.sidebar)
  }
  return widgets
}

export const getPageFrameWidgets = (frames: BuilderPageFrames): BuilderWidgetInstance[] => {
  const widgets: BuilderWidgetInstance[] = []
  if (frames.splitPane) {
    widgets.push(frames.splitPane)
  }
  widgets.push(...frames.drawers)
  widgets.push(...frames.modals)
  return widgets
}

export const createAppLayoutFromWidgets = (
  widgets: BuilderWidgetInstance[] | undefined
): BuilderAppLayout => {
  const layout = createEmptyAppLayout()
  if (!Array.isArray(widgets) || widgets.length === 0) {
    return layout
  }
  for (const widget of widgets) {
    if (widget.type === 'GlobalHeader' && !layout.header) {
      layout.header = widget
      continue
    }
    if (widget.type === 'GlobalSidebar' && !layout.sidebar) {
      layout.sidebar = widget
    }
  }
  return layout
}

export const createPageFramesFromWidgets = (
  widgets: BuilderWidgetInstance[] | undefined
): BuilderPageFrames => {
  const frames = createEmptyPageFrames()
  if (!Array.isArray(widgets) || widgets.length === 0) {
    return frames
  }
  for (const widget of widgets) {
    if (widget.type === 'GlobalSplitPane') {
      if (!frames.splitPane) {
        frames.splitPane = widget
      }
      continue
    }
    if (widget.type === 'GlobalDrawer') {
      frames.drawers.push(widget)
      continue
    }
    if (widget.type === 'GlobalModal') {
      frames.modals.push(widget)
    }
  }
  return frames
}

export const canAddAppFrame = (
  type: string,
  layout: BuilderAppLayout
): { allowed: boolean; reason?: string } => {
  if (!isAppFrameType(type)) {
    return {
      allowed: false,
      reason: 'Only Header and Sidebar can be added at app scope.',
    }
  }
  if (type === 'GlobalHeader' && layout.header) {
    return {
      allowed: false,
      reason: 'Header is singleton at app scope.',
    }
  }
  if (type === 'GlobalSidebar' && layout.sidebar) {
    return {
      allowed: false,
      reason: 'Sidebar is singleton at app scope.',
    }
  }
  return { allowed: true }
}

export const canAddPageFrame = (
  type: string,
  frames: BuilderPageFrames
): { allowed: boolean; reason?: string } => {
  if (!isPageFrameType(type)) {
    return {
      allowed: false,
      reason: 'Only Split pane, Drawer and Modal can be added at page scope.',
    }
  }
  if (type === 'GlobalSplitPane' && frames.splitPane) {
    return {
      allowed: false,
      reason: 'Only one Split pane can exist per page.',
    }
  }
  return { allowed: true }
}

export const upsertAppFrame = (
  layout: BuilderAppLayout,
  frame: BuilderWidgetInstance
): BuilderAppLayout => {
  if (frame.type === 'GlobalHeader') {
    return {
      ...layout,
      header: frame,
    }
  }
  if (frame.type === 'GlobalSidebar') {
    return {
      ...layout,
      sidebar: frame,
    }
  }
  return layout
}

export const appendPageFrame = (
  frames: BuilderPageFrames,
  frame: BuilderWidgetInstance
): BuilderPageFrames => {
  if (frame.type === 'GlobalSplitPane') {
    return {
      ...frames,
      splitPane: frame,
    }
  }
  if (frame.type === 'GlobalDrawer') {
    return {
      ...frames,
      drawers: [...frames.drawers, frame],
    }
  }
  if (frame.type === 'GlobalModal') {
    return {
      ...frames,
      modals: [...frames.modals, frame],
    }
  }
  return frames
}

export type BuilderWidgetAddOptions = {
  presetId?: string
  props?: Record<string, unknown>
}

export type BuilderMenuItem = {
  label: string
  to?: string
  icon?: string
  badge?: string
  policy?: string[]
  visibleWhen?: string
  items?: BuilderMenuItem[]
}

export type BuilderMenu = {
  items: BuilderMenuItem[]
}

export type BuilderPageParam = {
  key: string
  value: string
}

export type BuilderPageShortcut = {
  name: string
  shortcut: string
  action: string
}

export type BuilderPageMeta = {
  title?: string
  browserTitle?: string
  url?: string
  searchParams?: BuilderPageParam[]
  hashParams?: BuilderPageParam[]
  shortcuts?: BuilderPageShortcut[]
}

export type BuilderAppMeta = {
  browserTitle?: string
  url?: string
  shortcuts?: BuilderPageShortcut[]
  persistUrlParams?: boolean
  maxWidth?: string
}

export type BuilderPage = {
  id: string
  name: string
  access?: string
  layout?: Record<string, unknown>
  pageLayout: BuilderPageLayout
  menu?: BuilderMenu | null
  pageMeta?: BuilderPageMeta
}

export type BuilderSelectedNode =
  | { kind: 'app' }
  | { kind: 'page'; pageId: string }
  | { kind: 'main'; pageId: string }
  | { kind: 'frame'; pageId: string; scope: 'app' | 'page'; frameId: string }
  | { kind: 'widget'; pageId: string; scope: 'main' | 'app-frame' | 'page-frame'; widgetId: string }

export type BuilderQueryRunStatus = 'running' | 'success' | 'error'

export type BuilderQueryRunResult = {
  queryId: string
  name: string
  status: BuilderQueryRunStatus
  data?: unknown
  error?: string
  receivedAt?: string
}
