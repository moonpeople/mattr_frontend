import { proxy, snapshot, useSnapshot } from 'valtio'

export type ThemeColorKey =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'canvas'
  | 'surfacePrimary'
  | 'surfaceSecondary'
  | 'borderPrimary'
  | 'borderSecondary'
  | 'textDark'
  | 'textLight'
  | 'statusDanger'
  | 'statusInfo'
  | 'statusWarning'
  | 'statusSuccess'
  | 'statusHighlight'

export type ThemeMode = 'light' | 'dark' | 'system'

export type ColorTokenOption = {
  label: string
  value: string
  preview?: string
  displayValue?: string
  aliases?: string[]
  token?: string
}

export type TypographyTokenOption = {
  label: string
  value: string
  displayValue?: string
}

export type ThemeRadii = {
  sm: string
  md: string
  lg: string
  xl: string
}

export type ThemeShadows = {
  sm: string
  md: string
  lg: string
}

export type ThemeModeTokens = {
  colors: Record<ThemeColorKey, string>
  typography: TypographyTokenOption[]
  radii: ThemeRadii
  shadows: ThemeShadows
}

export type ShadcnThemeVariables = {
  light?: Record<string, string>
  dark?: Record<string, string>
}

export type ShadcnColorMappingValue =
  | string
  | string[]
  | { light?: string | string[]; dark?: string | string[]; system?: string | string[] }

export type ShadcnColorMapping = Partial<Record<ThemeColorKey, ShadcnColorMappingValue>>

export type BuilderAppTheme = {
  version: 1
  mode: ThemeMode
  componentSetId: string
  customCss?: string
  shadcn?: {
    style?: string
    baseColor?: string
    font?: string
    iconLibrary?: string
    radius?: string
    menuColor?: string
    menuAccent?: string
    variables?: ShadcnThemeVariables
    cssVariables?: Record<string, string>
  }
  modes: {
    light: ThemeModeTokens
    dark: ThemeModeTokens
  }
}

export const DEFAULT_THEME_COLORS: Record<ThemeColorKey, string> = {
  primary: '3170F9',
  secondary: '',
  tertiary: '',
  canvas: 'F6F6F6',
  surfacePrimary: 'FFFFFF',
  surfaceSecondary: 'FFFFFF',
  borderPrimary: 'Generated',
  borderSecondary: 'Generated',
  textDark: '0D0D0D',
  textLight: 'FFFFFF',
  statusDanger: 'DC2626',
  statusInfo: '3170F9',
  statusWarning: 'CD6F00',
  statusSuccess: '059669',
  statusHighlight: 'FDE68A',
}

export const DEFAULT_DARK_THEME_COLORS: Record<ThemeColorKey, string> = {
  primary: '60A5FA',
  secondary: '',
  tertiary: '',
  canvas: '0B0F14',
  surfacePrimary: '111827',
  surfaceSecondary: '0F172A',
  borderPrimary: 'Generated',
  borderSecondary: 'Generated',
  textDark: 'E5E7EB',
  textLight: 'FFFFFF',
  statusDanger: 'F87171',
  statusInfo: '60A5FA',
  statusWarning: 'FBBF24',
  statusSuccess: '34D399',
  statusHighlight: 'FDE68A',
}

export const DEFAULT_THEME_TYPOGRAPHY: TypographyTokenOption[] = [
  { label: 'Heading 1', value: 'Inter 700 36px' },
  { label: 'Heading 2', value: 'Inter 700 28px' },
  { label: 'Heading 3', value: 'Inter 700 24px' },
  { label: 'Heading 4', value: 'Inter 700 18px' },
  { label: 'Heading 5', value: 'Inter 700 16px' },
  { label: 'Heading 6', value: 'Inter 700 14px' },
  { label: 'Label', value: 'Inter 500 12px' },
  { label: 'Label emphasized', value: 'Inter 600 12px' },
  { label: 'Body', value: 'Inter 400 12px' },
]

export const DEFAULT_THEME_RADII: ThemeRadii = {
  sm: '2px',
  md: '6px',
  lg: '8px',
  xl: '12px',
}

export const DEFAULT_THEME_SHADOWS: ThemeShadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
}

const SHADCN_COLOR_TOKEN_MAP: { key: string; label: string; legacy?: ThemeColorKey }[] = [
  { key: '--background', label: 'Background', legacy: 'canvas' },
  { key: '--foreground', label: 'Foreground', legacy: 'textDark' },
  { key: '--card', label: 'Card', legacy: 'surfacePrimary' },
  { key: '--card-foreground', label: 'Card foreground' },
  { key: '--popover', label: 'Popover', legacy: 'surfacePrimary' },
  { key: '--popover-foreground', label: 'Popover foreground' },
  { key: '--primary', label: 'Primary', legacy: 'primary' },
  { key: '--primary-foreground', label: 'Primary foreground', legacy: 'textLight' },
  { key: '--secondary', label: 'Secondary', legacy: 'secondary' },
  { key: '--secondary-foreground', label: 'Secondary foreground' },
  { key: '--accent', label: 'Accent', legacy: 'tertiary' },
  { key: '--accent-foreground', label: 'Accent foreground' },
  { key: '--muted', label: 'Muted', legacy: 'surfaceSecondary' },
  { key: '--muted-foreground', label: 'Muted foreground' },
  { key: '--destructive', label: 'Destructive', legacy: 'statusDanger' },
  { key: '--destructive-foreground', label: 'Destructive foreground' },
  { key: '--border', label: 'Border', legacy: 'borderPrimary' },
  { key: '--input', label: 'Input', legacy: 'borderSecondary' },
  { key: '--ring', label: 'Ring', legacy: 'statusInfo' },
]

const isHexColor = (value: string) =>
  /^[0-9a-fA-F]{3}$/.test(value) ||
  /^[0-9a-fA-F]{4}$/.test(value) ||
  /^[0-9a-fA-F]{6}$/.test(value) ||
  /^[0-9a-fA-F]{8}$/.test(value)

const toKebabCase = (value: string) =>
  value
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/\s+/g, '-')
    .toLowerCase()

const getTypographyTokenId = (label: string) => toKebabCase(label.trim())

const parseTypographyValue = (
  value: string
): { fontFamily: string; fontWeight: string; fontSize: string } | null => {
  const raw = value.trim()
  if (!raw) {
    return null
  }
  const parts = raw.split(/\s+/)
  if (parts.length < 3) {
    return null
  }
  const size = parts[parts.length - 1]
  const weight = parts[parts.length - 2]
  if (!/^\d+px$/.test(size) || !/^\d+$/.test(weight)) {
    return null
  }
  const family = parts.slice(0, -2).join(' ')
  return { fontFamily: family, fontWeight: weight, fontSize: size }
}

const normalizeHslTriplet = (value: string) => {
  const trimmed = value.trim()
  if (!trimmed) {
    return ''
  }
  if (trimmed.startsWith('hsl(') && trimmed.endsWith(')')) {
    const inside = trimmed.slice(4, -1).trim().replace(/deg/g, '')
    const [triplet] = inside.split('/')
    return triplet.trim()
  }
  const cleaned = trimmed.replace(/deg/g, '')
  const [triplet] = cleaned.split('/')
  if (/^\d+(?:\.\d+)?\s+\d+(?:\.\d+)?%\s+\d+(?:\.\d+)?%$/.test(triplet.trim())) {
    return triplet.trim()
  }
  return ''
}

const hexToHsl = (value: string): { h: number; s: number; l: number } | null => {
  const normalized = value.trim().replace('#', '')
  if (!normalized) {
    return null
  }
  let hex = isHexColor(normalized)
    ? normalized.length === 3 || normalized.length === 4
      ? normalized
          .split('')
          .map((char) => char + char)
          .join('')
      : normalized
    : null
  if (hex && hex.length === 8) {
    hex = hex.slice(0, 6)
  }
  if (hex && hex.length !== 6) {
    hex = null
  }
  if (!hex) {
    return null
  }
  const r = parseInt(hex.slice(0, 2), 16) / 255
  const g = parseInt(hex.slice(2, 4), 16) / 255
  const b = parseInt(hex.slice(4, 6), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      default:
        h = (r - g) / d + 4
        break
    }
    h /= 6
  }

  return { h: h * 360, s: s * 100, l: l * 100 }
}

const formatHslValue = (value: number) => {
  const rounded = Math.round(value * 10) / 10
  return Number.isInteger(rounded) ? `${rounded}` : `${rounded}`
}

const formatHslTriplet = (values: { h: number; s: number; l: number }) =>
  `${formatHslValue(values.h)} ${formatHslValue(values.s)}% ${formatHslValue(values.l)}%`

const parseHslTriplet = (value: string) => {
  const normalized = normalizeHslTriplet(value)
  if (!normalized) {
    return null
  }
  const [h, s, l] = normalized.split(/\s+/)
  const hVal = Number(h)
  const sVal = Number(s.replace('%', ''))
  const lVal = Number(l.replace('%', ''))
  if ([hVal, sVal, lVal].some((num) => Number.isNaN(num))) {
    return null
  }
  return { h: hVal, s: sVal, l: lVal }
}

const parseRgbTriplet = (value: string) => {
  const match = value.match(/rgba?\((.*)\)/i)
  if (!match) {
    return null
  }
  const raw = match[1]
  const [triplet] = raw.split('/')
  const parts = triplet.trim().replace(/\s+/g, ' ').split(/[, ]+/).filter(Boolean)
  if (parts.length < 3) {
    return null
  }
  const parseChannel = (channel: string) => {
    const trimmed = channel.trim()
    if (!trimmed) {
      return null
    }
    if (trimmed.endsWith('%')) {
      const percent = Number(trimmed.replace('%', ''))
      if (Number.isNaN(percent)) {
        return null
      }
      return clampNumber(Math.round((percent / 100) * 255), 0, 255)
    }
    const num = Number(trimmed)
    if (Number.isNaN(num)) {
      return null
    }
    return clampNumber(Math.round(num), 0, 255)
  }
  const r = parseChannel(parts[0])
  const g = parseChannel(parts[1])
  const b = parseChannel(parts[2])
  if (r === null || g === null || b === null) {
    return null
  }
  return { r, g, b }
}

const rgbToHsl = (value: { r: number; g: number; b: number }) => {
  const r = value.r / 255
  const g = value.g / 255
  const b = value.b / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      default:
        h = (r - g) / d + 4
        break
    }
    h *= 60
  }
  return { h, s: s * 100, l: l * 100 }
}

const toHslTriplet = (value: string) => {
  const normalized = value.trim()
  if (!normalized) {
    return ''
  }
  if (normalized.startsWith('var(')) {
    return normalized
  }
  const hslTriplet = normalizeHslTriplet(normalized)
  if (hslTriplet) {
    return hslTriplet
  }
  const rgbTriplet = parseRgbTriplet(normalized)
  if (rgbTriplet) {
    return formatHslTriplet(rgbToHsl(rgbTriplet))
  }
  const hex = normalized.startsWith('#') ? normalized : isHexColor(normalized) ? `#${normalized}` : ''
  if (!hex) {
    return ''
  }
  const hsl = hexToHsl(hex)
  return hsl ? formatHslTriplet(hsl) : ''
}

const deriveMutedTriplet = (value: string) => {
  const hsl = parseHslTriplet(value) ?? hexToHsl(value)
  if (!hsl) {
    return ''
  }
  const next = {
    h: hsl.h,
    s: Math.max(4, hsl.s * 0.45),
    l: hsl.l < 50 ? Math.min(90, hsl.l + 28) : Math.max(12, hsl.l - 28),
  }
  return formatHslTriplet(next)
}

const clampNumber = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

const areRecordValuesEqual = (a?: Record<string, string>, b?: Record<string, string>) => {
  if (a === b) {
    return true
  }
  if (!a || !b) {
    return false
  }
  const aKeys = Object.keys(a)
  const bKeys = Object.keys(b)
  if (aKeys.length !== bKeys.length) {
    return false
  }
  return aKeys.every((key) => a[key] === b[key])
}

const areTypographyTokensEqual = (
  current: TypographyTokenOption[],
  next: TypographyTokenOption[]
) => {
  if (current === next) {
    return true
  }
  if (!Array.isArray(current) || !Array.isArray(next)) {
    return false
  }
  if (current.length !== next.length) {
    return false
  }
  return current.every((token, index) => {
    const other = next[index]
    return token.label === other?.label && token.value === other?.value
  })
}

const areShadcnVariablesEqual = (
  current: Partial<ShadcnThemeVariables>,
  next: Partial<ShadcnThemeVariables>
) => {
  if (current === next) {
    return true
  }
  const currentLight = current.light ?? {}
  const currentDark = current.dark ?? {}
  const nextLight = next.light ?? {}
  const nextDark = next.dark ?? {}
  return (
    areRecordValuesEqual(currentLight, nextLight) && areRecordValuesEqual(currentDark, nextDark)
  )
}

const areThemeTokensEqual = (current: ThemeModeTokens, next: ThemeModeTokens) => {
  if (current === next) {
    return true
  }
  return (
    areRecordValuesEqual(current.colors, next.colors) &&
    areTypographyTokensEqual(current.typography, next.typography) &&
    areRecordValuesEqual(current.radii, next.radii) &&
    areRecordValuesEqual(current.shadows, next.shadows)
  )
}

const areShadcnConfigEqual = (
  current?: BuilderAppTheme['shadcn'],
  next?: BuilderAppTheme['shadcn']
) => {
  if (current === next) {
    return true
  }
  if (!current && !next) {
    return true
  }
  const currentConfig = current ?? {}
  const nextConfig = next ?? {}
  if (
    currentConfig.style !== nextConfig.style ||
    currentConfig.baseColor !== nextConfig.baseColor ||
    currentConfig.font !== nextConfig.font ||
    currentConfig.iconLibrary !== nextConfig.iconLibrary ||
    currentConfig.radius !== nextConfig.radius ||
    currentConfig.menuColor !== nextConfig.menuColor ||
    currentConfig.menuAccent !== nextConfig.menuAccent
  ) {
    return false
  }
  const currentVars = currentConfig.variables ?? {}
  const nextVars = nextConfig.variables ?? {}
  const currentCssVars = currentConfig.cssVariables ?? {}
  const nextCssVars = nextConfig.cssVariables ?? {}
  return (
    areShadcnVariablesEqual(currentVars, nextVars) &&
    areRecordValuesEqual(currentCssVars, nextCssVars)
  )
}

const areThemesEqual = (current: BuilderAppTheme, next: BuilderAppTheme) => {
  if (current === next) {
    return true
  }
  if (
    current.version !== next.version ||
    current.mode !== next.mode ||
    current.componentSetId !== next.componentSetId
  ) {
    return false
  }
  if ((current.customCss ?? '') !== (next.customCss ?? '')) {
    return false
  }
  if (!areThemeTokensEqual(current.modes.light, next.modes.light)) {
    return false
  }
  if (!areThemeTokensEqual(current.modes.dark, next.modes.dark)) {
    return false
  }
  return areShadcnConfigEqual(current.shadcn, next.shadcn)
}

const deriveBorderTriplet = (value: string) => {
  const hsl = parseHslTriplet(value) ?? hexToHsl(value)
  if (!hsl) {
    return ''
  }
  const isLight = hsl.l >= 55
  const next = {
    h: hsl.h,
    s: clampNumber(hsl.s * 0.18, 2, 22),
    l: clampNumber(hsl.l + (isLight ? -12 : 12), 6, 94),
  }
  return formatHslTriplet(next)
}

const stripCssComments = (value: string) =>
  value.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')

const extractCssBlocks = (input: string, selector: string) => {
  const blocks: string[] = []
  const regex = new RegExp(`${selector}\\s*\\{([\\s\\S]*?)\\}`, 'gi')
  let match: RegExpExecArray | null
  while ((match = regex.exec(input)) !== null) {
    blocks.push(match[1])
  }
  return blocks
}

const parseCssVariables = (input: string) => {
  const vars: Record<string, string> = {}
  if (!input) {
    return vars
  }
  const regex = /--([A-Za-z0-9-_]+)\s*:\s*([^;]+);?/g
  let match: RegExpExecArray | null
  while ((match = regex.exec(input)) !== null) {
    const key = `--${match[1]}`
    const value = match[2].trim()
    if (value) {
      vars[key] = value
    }
  }
  return vars
}

export const parseShadcnThemeCss = (input: string): ShadcnThemeVariables => {
  const raw = stripCssComments(input ?? '')
  const rootBlocks = extractCssBlocks(raw, ':root')
  const lightBlocks = extractCssBlocks(raw, '\\.light')
  const darkBlocks = extractCssBlocks(raw, '\\.dark')

  const lightVars = parseCssVariables([...rootBlocks, ...lightBlocks].join('\n'))
  const darkVars = parseCssVariables(darkBlocks.join('\n'))

  if (Object.keys(lightVars).length === 0 && Object.keys(darkVars).length === 0) {
    const fallback = parseCssVariables(raw)
    return { light: fallback }
  }

  return {
    light: Object.keys(lightVars).length > 0 ? lightVars : undefined,
    dark: Object.keys(darkVars).length > 0 ? darkVars : undefined,
  }
}

const readShadcnVar = (vars: Record<string, string>, key: string) => {
  const direct = vars[key]
  if (direct) {
    return direct
  }
  const normalized = key.startsWith('--') ? key : `--${key}`
  return vars[normalized]
}

const normalizeShadcnColorValue = (value?: string) => {
  if (!value) {
    return ''
  }
  const trimmed = value.trim()
  if (!trimmed) {
    return ''
  }
  if (trimmed.startsWith('hsl(') || trimmed.startsWith('rgb(') || trimmed.startsWith('#')) {
    return trimmed
  }
  const triplet = normalizeHslTriplet(trimmed)
  if (triplet) {
    return `hsl(${triplet})`
  }
  return trimmed
}

export const SHADCN_COLOR_MAPPING_V1: ShadcnColorMapping = {
  primary: ['--primary'],
  secondary: ['--secondary'],
  tertiary: ['--accent'],
  canvas: ['--background'],
  surfacePrimary: ['--card', '--popover'],
  surfaceSecondary: ['--muted', '--secondary'],
  borderPrimary: ['--border'],
  borderSecondary: ['--input'],
  textDark: ['--foreground', '--card-foreground', '--popover-foreground'],
  textLight: ['--primary-foreground'],
  statusDanger: ['--destructive'],
  statusInfo: ['--ring', '--primary'],
}

export const SHADCN_COLOR_MAPPING_V2: ShadcnColorMapping = {
  ...SHADCN_COLOR_MAPPING_V1,
  textLight: { light: ['--primary-foreground'], dark: ['--foreground'] },
}

const resolveMappingCandidates = (
  value: ShadcnColorMappingValue | undefined,
  mode?: ThemeMode
): string[] => {
  if (!value) {
    return []
  }
  if (Array.isArray(value)) {
    return value
  }
  if (typeof value === 'string') {
    return [value]
  }
  const resolvedMode = mode === 'dark' ? 'dark' : mode === 'system' ? 'system' : 'light'
  const modeValue =
    value[resolvedMode] ??
    (resolvedMode !== 'light' ? value.light : undefined) ??
    (resolvedMode !== 'dark' ? value.dark : undefined) ??
    value.system
  if (Array.isArray(modeValue)) {
    return modeValue
  }
  if (typeof modeValue === 'string') {
    return [modeValue]
  }
  return []
}

const readMappedShadcnColor = (
  vars: Record<string, string>,
  mappingValue: ShadcnColorMappingValue | undefined,
  mode?: ThemeMode
) => {
  const candidates = resolveMappingCandidates(mappingValue, mode)
  for (const key of candidates) {
    const value = normalizeShadcnColorValue(readShadcnVar(vars, key))
    if (value) {
      return value
    }
  }
  return ''
}

export const mapShadcnVariablesToThemeColors = (
  vars: Record<string, string>,
  fallback: Record<ThemeColorKey, string>,
  options?: { mode?: ThemeMode; mapping?: ShadcnColorMapping }
): Record<ThemeColorKey, string> => {
  if (!vars || Object.keys(vars).length === 0) {
    return { ...fallback }
  }

  const next = { ...fallback }
  const mapping = options?.mapping ?? SHADCN_COLOR_MAPPING_V1
  const mode = options?.mode

  const apply = (key: ThemeColorKey) => {
    const value = readMappedShadcnColor(vars, mapping[key], mode)
    if (value) {
      next[key] = value
    }
  }

  apply('primary')
  apply('secondary')
  apply('tertiary')
  apply('canvas')
  apply('surfacePrimary')
  apply('surfaceSecondary')
  apply('textDark')
  apply('textLight')
  apply('borderPrimary')
  apply('borderSecondary')
  apply('statusDanger')
  apply('statusInfo')

  return next
}

export const extractShadcnRadius = (vars: Record<string, string>) => {
  const raw = readShadcnVar(vars, '--radius')
  if (!raw) {
    return ''
  }
  return raw.trim()
}

export const normalizeColorValue = (value: string) => {
  const trimmed = value.trim()
  if (!trimmed) {
    return ''
  }
  if (trimmed === 'Generated' || trimmed === 'No color') {
    return ''
  }
  if (trimmed.startsWith('#')) {
    return trimmed
  }
  if (
    trimmed.startsWith('var(') ||
    trimmed.startsWith('rgb(') ||
    trimmed.startsWith('rgba(') ||
    trimmed.startsWith('hsl(') ||
    trimmed.startsWith('hsla(')
  ) {
    return trimmed
  }
  if (isHexColor(trimmed)) {
    return `#${trimmed}`
  }
  return trimmed
}

const resolveThemeMode = (mode: ThemeMode | undefined, fallback: 'light' | 'dark' = 'light') => {
  if (mode === 'light' || mode === 'dark') {
    return mode
  }
  return fallback
}

const cloneTypography = (tokens?: TypographyTokenOption[]) =>
  Array.isArray(tokens) && tokens.length > 0
    ? tokens.map((token) => ({ ...token }))
    : DEFAULT_THEME_TYPOGRAPHY.map((token) => ({ ...token }))

const mergeModeTokens = (
  tokens?: Partial<ThemeModeTokens> | null,
  defaultColors: Record<ThemeColorKey, string> = DEFAULT_THEME_COLORS
): ThemeModeTokens => {
  return {
    colors: { ...defaultColors, ...(tokens?.colors ?? {}) },
    typography: cloneTypography(tokens?.typography),
    radii: { ...DEFAULT_THEME_RADII, ...(tokens?.radii ?? {}) },
    shadows: { ...DEFAULT_THEME_SHADOWS, ...(tokens?.shadows ?? {}) },
  }
}

export const normalizeAppTheme = (theme?: Partial<BuilderAppTheme> | null): BuilderAppTheme => {
  const version = theme?.version === 1 ? 1 : 1
  const mode: ThemeMode = theme?.mode ?? 'light'
  const componentSetId = theme?.componentSetId ?? 'shadcn/vega'
  const light = mergeModeTokens(theme?.modes?.light, DEFAULT_THEME_COLORS)
  const dark = mergeModeTokens(theme?.modes?.dark, DEFAULT_DARK_THEME_COLORS)

  return {
    version,
    mode,
    componentSetId,
    customCss: theme?.customCss ?? '',
    shadcn: theme?.shadcn ?? undefined,
    modes: {
      light,
      dark,
    },
  }
}

export const DEFAULT_APP_THEME: BuilderAppTheme = normalizeAppTheme({
  version: 1,
  mode: 'light',
  componentSetId: 'shadcn/vega',
  modes: {
    light: mergeModeTokens(null, DEFAULT_THEME_COLORS),
    dark: mergeModeTokens(null, DEFAULT_DARK_THEME_COLORS),
  },
})

export const getActiveThemeTokens = (
  theme: BuilderAppTheme,
  mode?: ThemeMode
): ThemeModeTokens => {
  const resolved = resolveThemeMode(mode ?? theme.mode)
  return theme.modes[resolved]
}

export const getAppThemeColorTokens = (
  theme: BuilderAppTheme,
  mode?: ThemeMode
): ColorTokenOption[] => {
  const resolved = resolveThemeMode(mode ?? theme.mode)
  const baseVars = theme.shadcn?.variables?.light ?? {}
  const modeVars = theme.shadcn?.variables?.[resolved] ?? {}
  const vars = { ...baseVars, ...modeVars }

  return SHADCN_COLOR_TOKEN_MAP.map((token) => {
    const raw = vars[token.key] ?? ''
    const preview = normalizeShadcnColorValue(raw)
    if (!preview) {
      return null
    }
    const cssVar = `hsl(var(${token.key}))`
    const legacy =
      token.legacy ? `var(--app-color-${toKebabCase(token.legacy)})` : undefined
    return {
      label: token.label,
      value: cssVar,
      preview,
      displayValue: preview.startsWith('#') ? preview.slice(1).toUpperCase() : preview,
      aliases: legacy ? [legacy] : undefined,
      token: token.key,
    }
  }).filter((token): token is ColorTokenOption => Boolean(token))
}

export const getAppThemeTypographyTokens = (
  typographyTokens: TypographyTokenOption[]
): TypographyTokenOption[] => {
  return typographyTokens
    .filter((token) => token.label && token.value)
    .map((token) => {
      const id = getTypographyTokenId(token.label)
      return {
        label: token.label,
        value: id ? `token:${id}` : token.value,
        displayValue: token.value,
      }
    })
}

const updateThemeModeTokens = (
  theme: BuilderAppTheme,
  mode: ThemeMode | undefined,
  updater: (tokens: ThemeModeTokens) => ThemeModeTokens
): BuilderAppTheme => {
  const resolved = resolveThemeMode(mode ?? theme.mode)
  const currentTokens = theme.modes[resolved]
  const nextTokens = updater(currentTokens)
  if (nextTokens === currentTokens) {
    return theme
  }
  return {
    ...theme,
    modes: {
      ...theme.modes,
      [resolved]: nextTokens,
    },
  }
}

export const appThemeState = proxy({
  theme: DEFAULT_APP_THEME,
  setTheme(next: BuilderAppTheme) {
    const normalized = normalizeAppTheme(next)
    if (areThemesEqual(appThemeState.theme, normalized)) {
      return
    }
    appThemeState.theme = normalized
  },
  setThemeMode(mode: ThemeMode) {
    if (appThemeState.theme.mode === mode) {
      return
    }
    appThemeState.theme = { ...appThemeState.theme, mode }
  },
  setComponentSetId(componentSetId: string) {
    if (appThemeState.theme.componentSetId === componentSetId) {
      return
    }
    appThemeState.theme = { ...appThemeState.theme, componentSetId }
  },
  setShadcnConfig(patch: BuilderAppTheme['shadcn']) {
    const nextPatch = patch ?? {}
    const current = appThemeState.theme.shadcn ?? {}
    const merged = { ...current, ...nextPatch }
    const changed = Object.keys(nextPatch).some(
      (key) => (current as Record<string, unknown>)[key] !== (merged as Record<string, unknown>)[key]
    )
    if (!changed) {
      return
    }
    appThemeState.theme = {
      ...appThemeState.theme,
      shadcn: merged,
    }
  },
  setShadcnVariables(next: Record<string, string>, mode?: ThemeMode) {
    const resolved = resolveThemeMode(mode ?? appThemeState.theme.mode)
    const previous = appThemeState.theme.shadcn?.variables ?? {}
    const current = previous[resolved] ?? {}
    if (areRecordValuesEqual(current, next)) {
      return
    }
    appThemeState.theme = {
      ...appThemeState.theme,
      shadcn: {
        ...(appThemeState.theme.shadcn ?? {}),
        variables: {
          ...previous,
          [resolved]: { ...next },
        },
      },
    }
  },
  setShadcnVariablesByMode(next: Partial<ShadcnThemeVariables>) {
    const previous = appThemeState.theme.shadcn?.variables ?? {}
    const merged = { ...previous, ...(next ?? {}) }
    if (areShadcnVariablesEqual(previous, merged)) {
      return
    }
    appThemeState.theme = {
      ...appThemeState.theme,
      shadcn: {
        ...(appThemeState.theme.shadcn ?? {}),
        variables: {
          ...merged,
        },
      },
    }
  },
  setCustomCss(next: string) {
    if ((appThemeState.theme.customCss ?? '') === next) {
      return
    }
    appThemeState.theme = { ...appThemeState.theme, customCss: next }
  },
  setThemeColor(key: ThemeColorKey, value: string, mode?: ThemeMode) {
    appThemeState.theme = updateThemeModeTokens(appThemeState.theme, mode, (tokens) => {
      if (tokens.colors[key] === value) {
        return tokens
      }
      return { ...tokens, colors: { ...tokens.colors, [key]: value } }
    })
  },
  setThemeColors(next: Record<ThemeColorKey, string>, mode?: ThemeMode) {
    appThemeState.theme = updateThemeModeTokens(appThemeState.theme, mode, (tokens) => {
      if (areRecordValuesEqual(tokens.colors, next)) {
        return tokens
      }
      return { ...tokens, colors: { ...next } }
    })
  },
  resetThemeColors(mode?: ThemeMode) {
    const resolved = resolveThemeMode(mode ?? appThemeState.theme.mode)
    const defaults =
      resolved === 'dark' ? { ...DEFAULT_DARK_THEME_COLORS } : { ...DEFAULT_THEME_COLORS }
    appThemeState.theme = updateThemeModeTokens(appThemeState.theme, mode, (tokens) => {
      if (areRecordValuesEqual(tokens.colors, defaults)) {
        return tokens
      }
      return { ...tokens, colors: defaults }
    })
  },
  setTypographyTokens(next: TypographyTokenOption[], mode?: ThemeMode) {
    appThemeState.theme = updateThemeModeTokens(appThemeState.theme, mode, (tokens) => {
      if (areTypographyTokensEqual(tokens.typography, next)) {
        return tokens
      }
      return { ...tokens, typography: cloneTypography(next) }
    })
  },
  resetTypographyTokens(mode?: ThemeMode) {
    appThemeState.theme = updateThemeModeTokens(appThemeState.theme, mode, (tokens) => {
      if (areTypographyTokensEqual(tokens.typography, DEFAULT_THEME_TYPOGRAPHY)) {
        return tokens
      }
      return { ...tokens, typography: cloneTypography(DEFAULT_THEME_TYPOGRAPHY) }
    })
  },
  setThemeRadii(next: Partial<ThemeRadii>, mode?: ThemeMode) {
    appThemeState.theme = updateThemeModeTokens(appThemeState.theme, mode, (tokens) => {
      const merged = { ...tokens.radii, ...next }
      if (areRecordValuesEqual(tokens.radii, merged)) {
        return tokens
      }
      return { ...tokens, radii: merged }
    })
  },
  setThemeShadows(next: Partial<ThemeShadows>, mode?: ThemeMode) {
    appThemeState.theme = updateThemeModeTokens(appThemeState.theme, mode, (tokens) => {
      const merged = { ...tokens.shadows, ...next }
      if (areRecordValuesEqual(tokens.shadows, merged)) {
        return tokens
      }
      return { ...tokens, shadows: merged }
    })
  },
})

export const getAppThemeSnapshot = () => snapshot(appThemeState)

export const useAppThemeSnapshot = (options?: Parameters<typeof useSnapshot>[1]) =>
  useSnapshot(appThemeState, options)

export const buildAppThemeCssVars = (
  theme: BuilderAppTheme,
  mode?: ThemeMode
): Record<string, string> => {
  const resolvedMode = resolveThemeMode(mode ?? theme.mode)
  const tokens = theme.modes[resolvedMode]
  const colors = tokens.colors
  const radii = tokens.radii
  const shadows = tokens.shadows

  const css: Record<string, string> = {}
  const setVar = (key: string, value: string | undefined) => {
    if (!value) {
      return
    }
    css[key] = value
  }

  const setHslVar = (key: string, value: string | undefined) => {
    if (!value) {
      return
    }
    css[key] = value
  }

  const toCss = (value: string) => normalizeColorValue(value)
  const toHsl = (value: string) => toHslTriplet(normalizeColorValue(value))
  const toMuted = (value: string) => {
    const triplet = toHsl(value)
    if (!triplet) {
      return ''
    }
    return deriveMutedTriplet(triplet)
  }
  const toBorder = (value: string, fallback: string) => {
    const triplet = toHsl(value)
    if (triplet) {
      return triplet
    }
    return deriveBorderTriplet(fallback)
  }

  const canvasTriplet = toHsl(colors.canvas)
  const surfacePrimaryTriplet = toHsl(colors.surfacePrimary) || canvasTriplet
  const surfaceSecondaryTriplet =
    toHsl(colors.surfaceSecondary) || surfacePrimaryTriplet || canvasTriplet
  const textDarkTriplet = toHsl(colors.textDark)
  const textLightTriplet = toHsl(colors.textLight)
  const primaryTriplet = toHsl(colors.primary)
  const borderPrimaryTriplet = toBorder(colors.borderPrimary, surfacePrimaryTriplet || canvasTriplet)
  const borderSecondaryTriplet = toBorder(
    colors.borderSecondary,
    surfaceSecondaryTriplet || surfacePrimaryTriplet || canvasTriplet
  )
  const mutedForegroundTriplet = toMuted(colors.textDark) || textDarkTriplet

  setVar('--app-color-primary', toCss(colors.primary))
  setVar('--app-color-secondary', toCss(colors.secondary))
  setVar('--app-color-tertiary', toCss(colors.tertiary))
  setVar('--app-color-canvas', toCss(colors.canvas))
  setVar('--app-color-surface-primary', toCss(colors.surfacePrimary))
  setVar('--app-color-surface-secondary', toCss(colors.surfaceSecondary))
  setVar('--app-color-border-primary', toCss(colors.borderPrimary))
  setVar('--app-color-border-secondary', toCss(colors.borderSecondary))
  setVar('--app-color-text-dark', toCss(colors.textDark))
  setVar('--app-color-text-light', toCss(colors.textLight))
  setVar('--app-color-status-danger', toCss(colors.statusDanger))
  setVar('--app-color-status-info', toCss(colors.statusInfo))
  setVar('--app-color-status-warning', toCss(colors.statusWarning))
  setVar('--app-color-status-success', toCss(colors.statusSuccess))
  setVar('--app-color-status-highlight', toCss(colors.statusHighlight))

  // Shadcn-compatible variables for scoped theming
  setHslVar('--background', canvasTriplet)
  setHslVar('--foreground', textDarkTriplet)
  setHslVar('--card', surfacePrimaryTriplet)
  setHslVar('--card-foreground', textDarkTriplet)
  setHslVar('--popover', surfacePrimaryTriplet)
  setHslVar('--popover-foreground', textDarkTriplet)
  setHslVar('--primary', primaryTriplet)
  setHslVar('--primary-foreground', textLightTriplet)
  setHslVar('--secondary', toHsl(colors.secondary) || primaryTriplet)
  setHslVar('--secondary-foreground', textDarkTriplet)
  setHslVar('--muted', surfaceSecondaryTriplet || canvasTriplet)
  setHslVar('--muted-foreground', mutedForegroundTriplet)
  setHslVar('--accent', toHsl(colors.tertiary) || primaryTriplet)
  setHslVar('--accent-foreground', textLightTriplet)
  setHslVar('--destructive', toHsl(colors.statusDanger))
  setHslVar('--destructive-foreground', textLightTriplet)
  setHslVar('--border', borderPrimaryTriplet)
  setHslVar('--input', borderSecondaryTriplet || borderPrimaryTriplet)
  setHslVar('--ring', toHsl(colors.statusInfo) || primaryTriplet)

  // Supabase theme variables used by widget classes
  setHslVar('--background-default', canvasTriplet)
  setHslVar('--background-surface-100', surfacePrimaryTriplet)
  setHslVar('--background-surface-200', surfaceSecondaryTriplet || surfacePrimaryTriplet)
  setHslVar('--background-surface-300', surfaceSecondaryTriplet || surfacePrimaryTriplet)
  setHslVar('--background-surface-400', surfaceSecondaryTriplet || surfacePrimaryTriplet)
  setHslVar('--background-muted', surfaceSecondaryTriplet || canvasTriplet)
  setHslVar('--foreground-default', textDarkTriplet)
  setHslVar('--foreground-muted', mutedForegroundTriplet)
  setHslVar('--border-default', borderPrimaryTriplet)
  setHslVar('--border-muted', borderSecondaryTriplet || borderPrimaryTriplet)

  // Brand + status shades (approximation)
  const brandTriplet = primaryTriplet
  setHslVar('--brand-default', brandTriplet)
  setHslVar('--brand-600', brandTriplet)
  setHslVar('--brand-500', brandTriplet)
  setHslVar('--brand-400', brandTriplet)
  setHslVar('--brand-300', brandTriplet)
  setHslVar('--brand-200', brandTriplet)
  setHslVar('--brand-link', brandTriplet)

  const warningTriplet = toHsl(colors.statusWarning)
  setHslVar('--warning-default', warningTriplet)
  setHslVar('--warning-600', warningTriplet)
  setHslVar('--warning-500', warningTriplet)
  setHslVar('--warning-400', warningTriplet)
  setHslVar('--warning-300', warningTriplet)
  setHslVar('--warning-200', warningTriplet)

  const destructiveTriplet = toHsl(colors.statusDanger)
  setHslVar('--destructive-default', destructiveTriplet)
  setHslVar('--destructive-600', destructiveTriplet)
  setHslVar('--destructive-500', destructiveTriplet)
  setHslVar('--destructive-400', destructiveTriplet)
  setHslVar('--destructive-300', destructiveTriplet)
  setHslVar('--destructive-200', destructiveTriplet)

  setVar('--radius', radii.md)
  setVar('--app-radius-sm', radii.sm)
  setVar('--app-radius-md', radii.md)
  setVar('--app-radius-lg', radii.lg)
  setVar('--app-radius-xl', radii.xl)

  setVar('--app-shadow-sm', shadows.sm)
  setVar('--app-shadow-xs', shadows.sm)
  setVar('--app-shadow-md', shadows.md)
  setVar('--app-shadow-lg', shadows.lg)

  tokens.typography.forEach((token) => {
    const tokenId = getTypographyTokenId(token.label)
    if (!tokenId) {
      return
    }
    const parsed = parseTypographyValue(token.value)
    if (!parsed) {
      return
    }
    setVar(`--app-typography-${tokenId}-font-family`, parsed.fontFamily)
    setVar(`--app-typography-${tokenId}-font-weight`, parsed.fontWeight)
    setVar(`--app-typography-${tokenId}-font-size`, parsed.fontSize)
  })

  const shadcnVars = {
    ...(theme.shadcn?.variables?.light ?? {}),
    ...(theme.shadcn?.variables?.[resolvedMode] ?? {}),
    ...(theme.shadcn?.cssVariables ?? {}),
  }
  const shadcnFontSans = readShadcnVar(shadcnVars, '--font-sans')
  const shadcnFontMono = readShadcnVar(shadcnVars, '--font-mono')
  if (shadcnFontSans) {
    setVar('--font-custom', shadcnFontSans)
    setVar('--font-sans', shadcnFontSans)
  }
  if (shadcnFontMono) {
    setVar('--font-source-code-pro', shadcnFontMono)
    setVar('--font-mono', shadcnFontMono)
  }

  css.fontFamily =
    'var(--font-custom, Circular, custom-font, Helvetica Neue, Helvetica, Arial, sans-serif)'

  if (shadcnVars && typeof shadcnVars === 'object') {
    Object.entries(shadcnVars).forEach(([key, value]) => {
      if (typeof value !== 'string') {
        return
      }
      const normalizedKey = key.startsWith('--') ? key : `--${key}`
      css[normalizedKey] = value
    })
  }

  return css
}
