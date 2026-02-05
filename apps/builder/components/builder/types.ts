import type { WidgetInstance } from 'widgets'

// Tipy i utility buildera: spacing, page/menu, widget instance.

export type BuilderWidgetSpacing = {
  heightMode?: 'auto' | 'fixed'
  heightFxEnabled?: boolean
  heightFx?: string
  marginMode?: 'normal' | 'none'
  marginFxEnabled?: boolean
  marginFx?: string
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

// Vidzhety s auto height po umolchaniyu.
const AUTO_HEIGHT_WIDGET_TYPES = new Set([
  'Text',
  'Button',
  'TextInput',
  'EditableText',
  'Select',
  'Switch',
  'DatePicker',
  'FileUpload',
  'Icon',
])

export const getDefaultWidgetSpacing = (widgetType?: string): BuilderWidgetSpacing => ({
  heightMode: AUTO_HEIGHT_WIDGET_TYPES.has(widgetType ?? '') ? 'auto' : 'fixed',
  heightFxEnabled: false,
  heightFx: '',
  marginMode: 'normal',
  marginFxEnabled: false,
  marginFx: '',
})

export const resolveWidgetSpacing = (
  widgetType: string,
  spacing?: BuilderWidgetSpacing | null
): Required<BuilderWidgetSpacing> => ({
  ...getDefaultWidgetSpacing(widgetType),
  ...(spacing ?? {}),
})

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
  evaluateFx?: (value: string) => unknown
) => {
  const fallback = spacing.marginMode === 'none' ? '0px' : DEFAULT_MARGIN_PADDING
  if (!spacing.marginFxEnabled || !spacing.marginFx) {
    return fallback
  }

  const evaluated = evaluateFx ? evaluateFx(spacing.marginFx) : spacing.marginFx
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
  pageComponent: BuilderPageComponent | undefined,
  evaluateFx?: (value: string) => unknown
) => {
  const fallback =
    pageComponent?.paddingMode === 'none' ? '' : DEFAULT_PAGE_PADDING
  if (!pageComponent?.paddingFxEnabled || !pageComponent?.paddingFx) {
    return fallback
  }
  const evaluated = evaluateFx ? evaluateFx(pageComponent.paddingFx) : pageComponent.paddingFx
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

export type BuilderPageComponent = {
  expandToFit?: boolean
  background?: string
  paddingMode?: 'normal' | 'none'
  paddingFxEnabled?: boolean
  paddingFx?: string
}

export type BuilderPage = {
  id: string
  name: string
  access?: string
  layout?: Record<string, unknown>
  menu?: BuilderMenu | null
  pageMeta?: BuilderPageMeta
  pageComponent?: BuilderPageComponent
  pageGlobals?: BuilderWidgetInstance[]
  widgets: BuilderWidgetInstance[]
}

export type BuilderQueryRunStatus = 'running' | 'success' | 'error'

export type BuilderQueryRunResult = {
  queryId: string
  name: string
  status: BuilderQueryRunStatus
  data?: unknown
  error?: string
  receivedAt?: string
}
