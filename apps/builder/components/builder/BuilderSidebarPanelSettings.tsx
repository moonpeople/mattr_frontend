import type { ReactNode } from 'react'
import type { editor as MonacoEditor } from 'monaco-editor'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import { toast } from 'sonner'
import { X } from 'lucide-react'

import {
  Button,
  Checkbox_Shadcn_,
  Input_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
  ScrollArea,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  Select_Shadcn_,
  Separator,
  TabsContent_Shadcn_,
  TabsList_Shadcn_,
  TabsTrigger_Shadcn_,
  Tabs_Shadcn_,
  cn,
} from 'ui'
import CodeEditor from 'components/ui/CodeEditor/CodeEditor'
import { ColorInput } from './components/ColorInput'
import { TextConfirmModal } from 'components/ui/TextConfirmModalWrapper'
import type { BuilderApp } from 'data/builder/builder-apps'
import { useDeleteBuilderAppMutation, useUpdateBuilderAppMutation } from 'data/builder/builder-apps'
import {
  DEFAULT_THEME_RADII,
  type BuilderAppTheme,
  ThemeMode,
  TypographyTokenOption,
  appThemeState,
  getActiveThemeTokens,
  mapShadcnVariablesToThemeColors,
  normalizeAppTheme,
  useAppThemeSnapshot,
} from 'state/app-theme-state'
import { getThemeComponentSet, THEME_COMPONENT_SETS } from 'state/app-theme-sets'
import { getComponentSetPreset } from 'state/app-theme-presets'

type BuilderSidebarPanelSettingsProps = {
  appId?: string
  appName?: string
  apps?: BuilderApp[]
  projectRef?: string
  onAppNameChange?: (name: string) => void
  onClose?: () => void
}

type SettingsSectionId =
  | 'general'
  | 'custom-components'
  | 'custom-css'
  | 'preloaded-js'
  | 'libraries'
  | 'app-theme'
  | 'notifications'

type ThemeTabId = 'color' | 'typography' | 'metrics' | 'shadows' | 'tokens'

const SETTINGS_SECTIONS: { id: SettingsSectionId; label: string }[] = [
  { id: 'general', label: 'General' },
  { id: 'custom-components', label: 'Custom Components' },
  { id: 'custom-css', label: 'Custom CSS' },
  { id: 'preloaded-js', label: 'Preloaded JS' },
  { id: 'libraries', label: 'Libraries' },
  { id: 'app-theme', label: 'App theme' },
  { id: 'notifications', label: 'Notifications' },
]

type ShadcnColorToken = {
  key: string
  label: string
  description: string
  group: string
}

const SHADCN_COLOR_TOKENS: ShadcnColorToken[] = [
  {
    key: '--background',
    label: 'Background',
    description: 'Основной фон приложения и поверхностей.',
    group: 'Surface',
  },
  {
    key: '--foreground',
    label: 'Foreground',
    description: 'Основной цвет текста на светлом фоне.',
    group: 'Surface',
  },
  {
    key: '--card',
    label: 'Card',
    description: 'Фон карточек, панелей и контейнеров.',
    group: 'Surface',
  },
  {
    key: '--card-foreground',
    label: 'Card foreground',
    description: 'Цвет текста на карточках и панелях.',
    group: 'Surface',
  },
  {
    key: '--popover',
    label: 'Popover',
    description: 'Фон всплывающих панелей, меню и поповеров.',
    group: 'Surface',
  },
  {
    key: '--popover-foreground',
    label: 'Popover foreground',
    description: 'Цвет текста во всплывающих панелях.',
    group: 'Surface',
  },
  {
    key: '--primary',
    label: 'Primary',
    description: 'Основной акцент для кнопок и действий.',
    group: 'Brand',
  },
  {
    key: '--primary-foreground',
    label: 'Primary foreground',
    description: 'Текст/иконки на фоне primary.',
    group: 'Brand',
  },
  {
    key: '--secondary',
    label: 'Secondary',
    description: 'Вторичный акцент, вспомогательные элементы.',
    group: 'Brand',
  },
  {
    key: '--secondary-foreground',
    label: 'Secondary foreground',
    description: 'Текст на фоне secondary.',
    group: 'Brand',
  },
  {
    key: '--accent',
    label: 'Accent',
    description: 'Акцент для hover, выделений и подсветок.',
    group: 'Brand',
  },
  {
    key: '--accent-foreground',
    label: 'Accent foreground',
    description: 'Текст на фоне accent.',
    group: 'Brand',
  },
  {
    key: '--muted',
    label: 'Muted',
    description: 'Приглушённый фон для второстепенных зон.',
    group: 'Muted',
  },
  {
    key: '--muted-foreground',
    label: 'Muted foreground',
    description: 'Приглушённый текст и подсказки.',
    group: 'Muted',
  },
  {
    key: '--destructive',
    label: 'Destructive',
    description: 'Ошибки и опасные действия.',
    group: 'State',
  },
  {
    key: '--destructive-foreground',
    label: 'Destructive foreground',
    description: 'Текст на фоне destructive.',
    group: 'State',
  },
  {
    key: '--border',
    label: 'Border',
    description: 'Цвет основных границ и разделителей.',
    group: 'Borders',
  },
  {
    key: '--input',
    label: 'Input',
    description: 'Границы и фоновые линии инпутов.',
    group: 'Borders',
  },
  {
    key: '--ring',
    label: 'Ring',
    description: 'Цвет фокуса и кольца выделения.',
    group: 'State',
  },
]

const SHADCN_COLOR_GROUPS = Array.from(
  SHADCN_COLOR_TOKENS.reduce<Map<string, ShadcnColorToken[]>>((acc, token) => {
    const items = acc.get(token.group) ?? []
    items.push(token)
    acc.set(token.group, items)
    return acc
  }, new Map())
).map(([title, items]) => ({ title, items }))

type ShadcnTextToken = {
  key: string
  label: string
  description: string
}

const SHADCN_FONT_TOKENS: ShadcnTextToken[] = [
  {
    key: '--font-sans',
    label: 'Sans',
    description: 'Основной шрифт интерфейса.',
  },
  {
    key: '--font-mono',
    label: 'Mono',
    description: 'Моноширинный шрифт для кода и чисел.',
  },
]

const SHADCN_RADIUS_TOKENS: ShadcnTextToken[] = [
  {
    key: '--radius',
    label: 'Radius',
    description: 'Базовый радиус скругления для компонентов.',
  },
]

const SHADCN_SHADOW_TOKENS: Array<ShadcnTextToken & { shadowKey: 'sm' | 'md' | 'lg' }> = [
  {
    key: '--shadow-sm',
    label: 'Shadow SM',
    description: 'Низкая тень для лёгкого отделения.',
    shadowKey: 'sm',
  },
  {
    key: '--shadow-md',
    label: 'Shadow MD',
    description: 'Средняя тень для интерактивных элементов.',
    shadowKey: 'md',
  },
  {
    key: '--shadow-lg',
    label: 'Shadow LG',
    description: 'Глубокая тень для модальных и поповеров.',
    shadowKey: 'lg',
  },
]

const FONT_FAMILY_OPTIONS = [
  { label: 'Component set default', value: 'default' },
  { label: 'Inter', value: 'inter' },
  { label: 'Open Sans', value: 'open-sans' },
  { label: 'Roboto', value: 'roboto' },
  { label: 'Noto Sans', value: 'noto-sans' },
  { label: 'Raleway', value: 'raleway' },
  { label: 'Geist', value: 'geist' },
  { label: 'Figtree', value: 'figtree' },
]

const FONT_FAMILY_VARIABLES: Record<string, string> = {
  inter: 'var(--font-inter)',
  'open-sans': 'var(--font-open-sans)',
  roboto: 'var(--font-roboto)',
  'noto-sans': 'var(--font-noto-sans)',
  raleway: 'var(--font-raleway)',
  geist: 'Geist, system-ui, -apple-system, "Segoe UI", Arial, sans-serif',
  figtree: 'Figtree, system-ui, -apple-system, "Segoe UI", Arial, sans-serif',
}

const MONO_FONT_OPTIONS = [
  { label: 'Component set default', value: 'default' },
  { label: 'JetBrains Mono', value: 'jetbrains-mono' },
]

const MONO_FONT_VALUES: Record<string, string> = {
  'jetbrains-mono': '"JetBrains Mono", "Source Code Pro", "Office Code Pro", Menlo, monospace',
}

const DEFAULT_FONT_FAMILY =
  'var(--font-custom, Circular, custom-font, Helvetica Neue, Helvetica, Arial, sans-serif)'

const FONT_WEIGHT_OPTIONS = [
  { label: '100 (Thin)', value: '100' },
  { label: '200 (Extra Light)', value: '200' },
  { label: '300 (Light)', value: '300' },
  { label: '400 (Regular)', value: '400' },
  { label: '500 (Medium)', value: '500' },
  { label: '600 (Semibold)', value: '600' },
  { label: '700 (Bold)', value: '700' },
  { label: '800 (Extra Bold)', value: '800' },
  { label: '900 (Black)', value: '900' },
]

const toKebabCase = (value: string) =>
  value
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/\s+/g, '-')
    .toLowerCase()

const parseTypographyValue = (value: string) => {
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

const formatShadcnColorValue = (value: string) => {
  const trimmed = value.trim()
  if (!trimmed) {
    return ''
  }
  if (
    trimmed.startsWith('#') ||
    /^rgba?\(/i.test(trimmed) ||
    /^hsla?\(/i.test(trimmed) ||
    trimmed.startsWith('var(')
  ) {
    return trimmed
  }
  if (/^\d+(\.\d+)?\s+\d+(\.\d+)?%\s+\d+(\.\d+)?%/.test(trimmed)) {
    return `hsl(${trimmed})`
  }
  return trimmed
}

const expandHex = (value: string) => value.split('').map((char) => char + char).join('')

const parseHexToRgb = (value: string) => {
  const normalized = value.trim().replace('#', '')
  if (!/^[0-9a-fA-F]{3,8}$/.test(normalized)) {
    return null
  }
  let hex = normalized
  if (hex.length === 3 || hex.length === 4) {
    hex = expandHex(hex)
  }
  if (hex.length === 8) {
    hex = hex.slice(0, 6)
  }
  if (hex.length !== 6) {
    return null
  }
  return {
    r: parseInt(hex.slice(0, 2), 16),
    g: parseInt(hex.slice(2, 4), 16),
    b: parseInt(hex.slice(4, 6), 16),
  }
}

const parseRgbChannel = (value: string) => {
  const trimmed = value.trim()
  if (!trimmed) {
    return null
  }
  if (trimmed.endsWith('%')) {
    const percent = Number(trimmed.replace('%', ''))
    if (Number.isNaN(percent)) {
      return null
    }
    return Math.round((Math.min(Math.max(percent, 0), 100) / 100) * 255)
  }
  const num = Number(trimmed)
  if (Number.isNaN(num)) {
    return null
  }
  return Math.round(Math.min(Math.max(num, 0), 255))
}

const parseRgbToHslTriplet = (value: string) => {
  const match = value.match(/rgba?\((.*)\)/i)
  if (!match) {
    return null
  }
  const body = match[1].replace(/\s*\/\s*/g, ',').replace(/\s+/g, ' ').trim()
  const parts = body.split(/[, ]+/).filter(Boolean)
  if (parts.length < 3) {
    return null
  }
  const r = parseRgbChannel(parts[0])
  const g = parseRgbChannel(parts[1])
  const b = parseRgbChannel(parts[2])
  if (r === null || g === null || b === null) {
    return null
  }
  return rgbToHslTriplet({ r, g, b })
}

const formatHslNumber = (value: number) => {
  const rounded = Math.round(value * 10) / 10
  return Number.isInteger(rounded) ? String(rounded) : String(rounded)
}

const rgbToHslTriplet = ({ r, g, b }: { r: number; g: number; b: number }) => {
  const rNorm = r / 255
  const gNorm = g / 255
  const bNorm = b / 255
  const max = Math.max(rNorm, gNorm, bNorm)
  const min = Math.min(rNorm, gNorm, bNorm)
  const delta = max - min
  let h = 0
  if (delta !== 0) {
    if (max === rNorm) {
      h = ((gNorm - bNorm) / delta) % 6
    } else if (max === gNorm) {
      h = (bNorm - rNorm) / delta + 2
    } else {
      h = (rNorm - gNorm) / delta + 4
    }
    h *= 60
    if (h < 0) {
      h += 360
    }
  }
  const l = (max + min) / 2
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1))
  return `${formatHslNumber(h)} ${formatHslNumber(s * 100)}% ${formatHslNumber(l * 100)}%`
}

const parseHslTriplet = (value: string) => {
  const match = value.match(/hsla?\((.*)\)/i)
  const raw = match ? match[1] : value
  const [triplet] = raw.split('/')
  const parts = triplet.trim().replace(/\s+/g, ' ').split(/[, ]+/).filter(Boolean)
  if (parts.length < 3) {
    return null
  }
  const h = Number(parts[0].replace('deg', ''))
  const s = Number(parts[1].replace('%', ''))
  const l = Number(parts[2].replace('%', ''))
  if ([h, s, l].some((num) => Number.isNaN(num))) {
    return null
  }
  return `${formatHslNumber(h)} ${formatHslNumber(s)}% ${formatHslNumber(l)}%`
}

const normalizeShadcnColorInput = (value: string) => {
  const trimmed = value.trim()
  if (!trimmed) {
    return ''
  }
  const hslTriplet = parseHslTriplet(trimmed)
  if (hslTriplet) {
    return hslTriplet
  }
  const rgbTriplet = parseRgbToHslTriplet(trimmed)
  if (rgbTriplet) {
    return rgbTriplet
  }
  const hexRgb = parseHexToRgb(trimmed)
  if (hexRgb) {
    return rgbToHslTriplet(hexRgb)
  }
  return trimmed
}

const buildCustomCssSuggestions = (theme: BuilderAppTheme, mode: ThemeMode) => {
  const resolvedMode = mode === 'dark' ? 'dark' : 'light'
  const tokens = theme.modes[resolvedMode]
  const words: string[] = []
  const metadata: Record<string, { detail?: string; documentation?: string; kind?: string }> = {}
  const add = (name: string, detail?: string) => {
    if (!name) {
      return
    }
    if (!words.includes(name)) {
      words.push(name)
    }
    if (detail && !metadata[name]) {
      metadata[name] = { detail, kind: 'var' }
    }
  }

  Object.entries(tokens.colors).forEach(([key, value]) => {
    add(`--app-color-${toKebabCase(key)}`, value)
  })
  Object.entries(tokens.radii).forEach(([key, value]) => {
    add(`--app-radius-${key}`, value)
  })
  Object.entries(tokens.shadows).forEach(([key, value]) => {
    add(`--app-shadow-${key}`, value)
  })
  add('--radius', tokens.radii.md)

  tokens.typography.forEach((token) => {
    const tokenId = toKebabCase(token.label.trim())
    const parsed = parseTypographyValue(token.value)
    if (!tokenId || !parsed) {
      return
    }
    add(`--app-typography-${tokenId}-font-family`, parsed.fontFamily)
    add(`--app-typography-${tokenId}-font-weight`, parsed.fontWeight)
    add(`--app-typography-${tokenId}-font-size`, parsed.fontSize)
  })

  const shadcnVars = {
    ...(theme.shadcn?.variables?.light ?? {}),
    ...(theme.shadcn?.variables?.[resolvedMode] ?? {}),
    ...(theme.shadcn?.cssVariables ?? {}),
  }
  Object.entries(shadcnVars).forEach(([key, value]) => {
    add(key, value)
  })

  return { words: words.sort(), metadata }
}

const normalizeFontSize = (value: string, fallback: string) => {
  const trimmed = value.trim()
  if (!trimmed) {
    return fallback
  }
  if (/^\d+$/.test(trimmed)) {
    return `${trimmed}px`
  }
  return trimmed
}

const buildRadiiFromRadius = (radius?: string) => {
  const trimmed = typeof radius === 'string' ? radius.trim() : ''
  if (!trimmed) {
    return { ...DEFAULT_THEME_RADII }
  }
  if (trimmed === '0' || trimmed === '0px' || trimmed === '0rem') {
    return { sm: '0px', md: '0px', lg: '0px', xl: '0px' }
  }
  return {
    sm: `calc(${trimmed} - 4px)`,
    md: trimmed,
    lg: `calc(${trimmed} + 2px)`,
    xl: `calc(${trimmed} + 6px)`,
  }
}

const resolveFontKeyFromFamily = (family: string) => {
  const normalized = family.replace(/["']/g, '').toLowerCase()
  if (normalized.includes('--font-custom') || normalized.includes('--font-sans')) {
    return 'default'
  }
  if (normalized.includes('--font-inter') || normalized.startsWith('inter')) {
    return 'inter'
  }
  if (normalized.includes('--font-open-sans') || normalized.includes('open sans')) {
    return 'open-sans'
  }
  if (normalized.includes('--font-roboto') || normalized.startsWith('roboto')) {
    return 'roboto'
  }
  if (normalized.includes('--font-noto-sans') || normalized.includes('noto sans')) {
    return 'noto-sans'
  }
  if (normalized.includes('--font-raleway') || normalized.startsWith('raleway')) {
    return 'raleway'
  }
  if (normalized.includes('geist')) {
    return 'geist'
  }
  if (normalized.includes('figtree')) {
    return 'figtree'
  }
  if (normalized.includes('jetbrains mono')) {
    return 'jetbrains-mono'
  }
  return 'default'
}

const resolveMonoKeyFromFamily = (family: string) => {
  const normalized = family.replace(/["']/g, '').toLowerCase()
  if (normalized.includes('jetbrains mono')) {
    return 'jetbrains-mono'
  }
  return 'default'
}

const resolveFontLabelFromFamily = (family: string) => {
  const key = resolveFontKeyFromFamily(family)
  const option = FONT_FAMILY_OPTIONS.find((item) => item.value === key)
  return option?.label ?? 'Default'
}

const getFontFamilyValue = (key: string) => {
  if (key === 'default') {
    return DEFAULT_FONT_FAMILY
  }
  return FONT_FAMILY_VARIABLES[key] ?? DEFAULT_FONT_FAMILY
}

const getMonoFamilyValue = (key: string) => {
  if (key === 'default') {
    return ''
  }
  return MONO_FONT_VALUES[key] ?? ''
}

const formatTypographyValue = (value: string) => {
  const parsed = parseTypographyValue(value)
  if (!parsed) {
    return value
  }
  const label = resolveFontLabelFromFamily(parsed.fontFamily)
  return `${label} ${parsed.fontWeight} ${parsed.fontSize}`
}

const getTypographyBadge = (label: string) => {
  const trimmed = label.trim()
  const headingMatch = trimmed.match(/heading\s*(\d+)/i)
  if (headingMatch) {
    return `H${headingMatch[1]}`
  }
  if (trimmed.toLowerCase().startsWith('label')) {
    return 'L'
  }
  if (trimmed.toLowerCase().startsWith('body')) {
    return 'B'
  }
  return trimmed.slice(0, 2).toUpperCase()
}

const updateTypographyFontTokens = (
  tokens: readonly TypographyTokenOption[],
  fontFamily: string
): TypographyTokenOption[] => {
  if (!fontFamily) {
    return [...tokens]
  }
  return tokens.map((token) => {
    const parsed = parseTypographyValue(token.value)
    if (!parsed) {
      return token
    }
    return {
      ...token,
      value: `${fontFamily} ${parsed.fontWeight} ${parsed.fontSize}`,
    }
  })
}

const getMarkerSeverityLabel = (severity: number) => {
  switch (severity) {
    case 8:
      return 'Error'
    case 4:
      return 'Warning'
    case 2:
      return 'Info'
    default:
      return 'Hint'
  }
}

const getMarkerSeverityClass = (severity: number) => {
  switch (severity) {
    case 8:
      return 'text-destructive bg-destructive-200'
    case 4:
      return 'text-warning bg-warning-200'
    case 2:
      return 'text-foreground-muted bg-surface-200'
    default:
      return 'text-foreground-muted bg-surface-200'
  }
}

const SettingsRow = ({
  title,
  description,
  control,
}: {
  title: string
  description?: ReactNode
  control: ReactNode
}) => {
  return (
    <div className="flex flex-col space-y-1 border-b border-foreground-muted/20 py-3 last:border-b-0">
      <div className='flex items-center justify-between gap-4 '>
        <div className="space-y-1">
          <div className="text-[13px] font-medium text-foreground">{title}</div>
        </div>
        <div className="shrink-0 pt-0.5">{control}</div>
      </div>
      {description && (
        <div className="text-[11px] text-foreground-muted leading-4">{description}</div>
      )}
    </div>
  )
}

const EmptyPanel = ({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}) => {
  return (
    <div className="rounded-md border border-dashed border-foreground-muted/30 bg-surface-50 px-6 py-10 text-center">
      <div className="text-[13px] font-medium text-foreground">{title}</div>
      <div className="mt-1 text-[12px] text-foreground-muted">{description}</div>
      {actionLabel && (
        <Button
          type="default"
          size="tiny"
          className="mt-4"
          onClick={() => onAction?.()}
        >
          {actionLabel}
        </Button>
      )}
    </div>
  )
}

export const BuilderSidebarPanelSettings = ({
  appId,
  appName,
  apps = [],
  projectRef,
  onAppNameChange,
  onClose,
}: BuilderSidebarPanelSettingsProps) => {
  const router = useRouter()
  const [activeSection, setActiveSection] = useState<SettingsSectionId>('general')
  const [themeTab, setThemeTab] = useState<ThemeTabId>('color')
  const [showThemeBanner, setShowThemeBanner] = useState(true)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [themeEditMode, setThemeEditMode] = useState<ThemeMode>('light')
  const [typographyEditor, setTypographyEditor] = useState<{
    index: number
    label: string
    fontFamily: string
    fontKey: string
    fontWeight: string
    fontSize: string
  } | null>(null)

  const [markdownLinkBehavior, setMarkdownLinkBehavior] = useState<
    'automatic' | 'new-tab' | 'current-tab'
  >('automatic')
  const [showQueryStatus, setShowQueryStatus] = useState(false)
  const [enableMobileLayout, setEnableMobileLayout] = useState(true)
  const [showLoadingState, setShowLoadingState] = useState(true)
  const [customCssMarkers, setCustomCssMarkers] = useState<MonacoEditor.IMarker[]>([])

  const appTheme = useAppThemeSnapshot()
  const normalizedTheme = useMemo(
    () => normalizeAppTheme(appTheme.theme as Partial<BuilderAppTheme>),
    [appTheme.theme]
  )
  const activeThemeTokens = useMemo(
    () => getActiveThemeTokens(normalizedTheme, themeEditMode),
    [normalizedTheme, themeEditMode]
  )
  const componentSet = useMemo(
    () => getThemeComponentSet(appTheme.theme.componentSetId),
    [appTheme.theme.componentSetId]
  )
  const componentSetPreset = useMemo(
    () => getComponentSetPreset(appTheme.theme.componentSetId),
    [appTheme.theme.componentSetId]
  )
  const customCssSuggestions = useMemo(
    () => buildCustomCssSuggestions(normalizedTheme, themeEditMode),
    [normalizedTheme, themeEditMode]
  )
  const shadcnVariables = useMemo(() => {
    const resolvedMode = themeEditMode === 'dark' ? 'dark' : 'light'
    const baseVars = appTheme.theme.shadcn?.variables?.light ?? {}
    const modeVars = appTheme.theme.shadcn?.variables?.[resolvedMode] ?? {}
    const customVars = appTheme.theme.shadcn?.cssVariables ?? {}
    return Object.entries({ ...baseVars, ...modeVars, ...customVars })
      .filter(([key]) => key.startsWith('--'))
      .sort(([a], [b]) => a.localeCompare(b))
  }, [appTheme.theme, themeEditMode])
  const shadcnFontVariables = useMemo(() => {
    const cssVars = appTheme.theme.shadcn?.cssVariables ?? {}
    const presetVars = componentSetPreset?.cssVariables ?? {}
    return SHADCN_FONT_TOKENS.map((token) => ({
      ...token,
      value: cssVars[token.key] ?? presetVars[token.key] ?? '',
    }))
  }, [appTheme.theme, componentSetPreset])
  const shadcnRadiusVariables = useMemo(() => {
    const resolvedMode = themeEditMode === 'dark' ? 'dark' : 'light'
    const modeVars = appTheme.theme.shadcn?.variables?.[resolvedMode] ?? {}
    const lightVars = appTheme.theme.shadcn?.variables?.light ?? {}
    const presetVars =
      componentSetPreset?.shadcnVariables?.[resolvedMode] ??
      componentSetPreset?.shadcnVariables?.light ??
      {}
    return SHADCN_RADIUS_TOKENS.map((token) => ({
      ...token,
      value: modeVars[token.key] ?? lightVars[token.key] ?? presetVars[token.key] ?? '',
    }))
  }, [appTheme.theme, themeEditMode, componentSetPreset])
  const shadcnShadowVariables = useMemo(() => {
    const resolvedMode = themeEditMode === 'dark' ? 'dark' : 'light'
    const cssVars = appTheme.theme.shadcn?.cssVariables ?? {}
    const shadows = appTheme.theme.modes[resolvedMode].shadows
    return SHADCN_SHADOW_TOKENS.map((token) => ({
      ...token,
      value: cssVars[token.key] ?? shadows[token.shadowKey] ?? '',
    }))
  }, [appTheme.theme, themeEditMode])
  const selectedSansFontKey = useMemo(() => {
    const currentValue = appTheme.theme.shadcn?.cssVariables?.['--font-sans']
    if (!currentValue) {
      return 'default'
    }
    return resolveFontKeyFromFamily(currentValue)
  }, [appTheme.theme.shadcn?.cssVariables])
  const selectedMonoFontKey = useMemo(() => {
    const currentValue = appTheme.theme.shadcn?.cssVariables?.['--font-mono']
    if (!currentValue) {
      return 'default'
    }
    const resolved = resolveMonoKeyFromFamily(currentValue)
    return MONO_FONT_OPTIONS.some((option) => option.value === resolved) ? resolved : 'default'
  }, [appTheme.theme.shadcn?.cssVariables])
  const shadcnColorVariables = useMemo(() => {
    const resolvedMode = themeEditMode === 'dark' ? 'dark' : 'light'
    const baseVars = appTheme.theme.shadcn?.variables?.light ?? {}
    const modeVars = appTheme.theme.shadcn?.variables?.[resolvedMode] ?? {}
    const vars = { ...baseVars, ...modeVars }
    return SHADCN_COLOR_TOKENS.map((token) => ({
      ...token,
      value: vars[token.key] ?? '',
    }))
  }, [appTheme.theme, themeEditMode])
  const shadcnColorValueMap = useMemo(
    () => new Map(shadcnColorVariables.map((item) => [item.key, item.value])),
    [shadcnColorVariables]
  )
  const [draftName, setDraftName] = useState(appName ?? '')
  const nameBeforeEditRef = useRef(appName ?? '')

  const deleteAppMutation = useDeleteBuilderAppMutation({
    onSuccess: async () => {
      toast.success(`Deleted ${appName ?? 'app'}`)
      if (projectRef) {
        await router.push(`/builder?ref=${projectRef}`)
      } else {
        await router.push('/builder')
      }
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })
  const updateAppMutation = useUpdateBuilderAppMutation({
    onError: (error) => {
      toast.error(error.message)
    },
  })

  useEffect(() => {
    setDraftName(appName ?? '')
    nameBeforeEditRef.current = appName ?? ''
  }, [appName])

  useEffect(() => {
    if (appTheme.theme.mode === 'light' || appTheme.theme.mode === 'dark') {
      setThemeEditMode(appTheme.theme.mode)
    }
  }, [appTheme.theme.mode])

  const nameEmpty = draftName.trim().length === 0
  const nameTaken = useMemo(() => {
    const normalized = draftName.trim().toLowerCase()
    if (!normalized) {
      return false
    }
    return apps.some((app) => {
      if (appId && app.id === appId) {
        return false
      }
      return app.name.trim().toLowerCase() === normalized
    })
  }, [appId, apps, draftName])
  const nameError = nameEmpty ? 'Name is required' : nameTaken ? 'Name already exists' : ''
  const canEditName = Boolean(appId)

  const openTypographyEditor = (index: number) => {
    const token = activeThemeTokens.typography[index]
    if (!token) {
      return
    }
    const parsed = parseTypographyValue(token.value)
    const fontFamily = parsed?.fontFamily ?? DEFAULT_FONT_FAMILY
    const fontKey = resolveFontKeyFromFamily(fontFamily)
    setTypographyEditor({
      index,
      label: token.label,
      fontFamily,
      fontKey,
      fontWeight: parsed?.fontWeight ?? '400',
      fontSize: parsed?.fontSize ?? '16px',
    })
  }

  const closeTypographyEditor = () => {
    setTypographyEditor(null)
  }

  const persistTypographyEditor = (nextState: {
    index: number
    fontFamily: string
    fontWeight: string
    fontSize: string
  }) => {
    const fontSize = normalizeFontSize(nextState.fontSize, '16px')
    const fontWeight = nextState.fontWeight || '400'
    const fontFamily = nextState.fontFamily || DEFAULT_FONT_FAMILY
    const nextValue = `${fontFamily} ${fontWeight} ${fontSize}`
    const next = activeThemeTokens.typography.map((token, idx) =>
      idx === nextState.index ? { ...token, value: nextValue } : token
    )
    appThemeState.setTypographyTokens(next, themeEditMode)
  }

  const updateTypographyEditor = (
    patch: Partial<{
      fontFamily: string
      fontKey: string
      fontWeight: string
      fontSize: string
    }>
  ) => {
    setTypographyEditor((prev) => {
      if (!prev) {
        return prev
      }
      const next = { ...prev, ...patch }
      persistTypographyEditor({
        index: next.index,
        fontFamily: next.fontFamily,
        fontWeight: next.fontWeight,
        fontSize: next.fontSize,
      })
      return next
    })
  }

  const applyComponentSetPreset = (componentSetId: string) => {
    const preset = getComponentSetPreset(componentSetId)
    if (!preset) {
      return
    }

    const currentShadcn = appTheme.theme.shadcn ?? {}
    const mergedCssVariables = preset.cssVariables
      ? { ...(currentShadcn.cssVariables ?? {}), ...preset.cssVariables }
      : currentShadcn.cssVariables
    const shadcnPatch = {
      ...(preset.shadcnConfig ?? {}),
      ...(preset.cssVariables ? { cssVariables: mergedCssVariables } : null),
    }
    if (Object.keys(shadcnPatch).length > 0) {
      appThemeState.setShadcnConfig(shadcnPatch)
    }

    const lightVars = preset.shadcnVariables.light ?? {}
    const darkVars = preset.shadcnVariables.dark ?? {}

    appThemeState.setShadcnVariablesByMode({
      light: lightVars,
      dark: darkVars,
    })

    if (Object.keys(lightVars).length > 0) {
      const nextColors = mapShadcnVariablesToThemeColors(
        lightVars,
        normalizedTheme.modes.light.colors,
        {
          mode: 'light',
          mapping: preset.colorMapping,
        }
      )
      appThemeState.setThemeColors(nextColors, 'light')
      appThemeState.setThemeRadii(preset.radii, 'light')
    }

    if (Object.keys(darkVars).length > 0) {
      const nextColors = mapShadcnVariablesToThemeColors(
        darkVars,
        normalizedTheme.modes.dark.colors,
        {
          mode: 'dark',
          mapping: preset.colorMapping,
        }
      )
      appThemeState.setThemeColors(nextColors, 'dark')
      appThemeState.setThemeRadii(preset.radii, 'dark')
    }

    const presetFontVar = preset.cssVariables?.['--font-sans']
    if (presetFontVar) {
      appThemeState.setTypographyTokens(
        updateTypographyFontTokens(normalizedTheme.modes.light.typography, presetFontVar),
        'light'
      )
      appThemeState.setTypographyTokens(
        updateTypographyFontTokens(normalizedTheme.modes.dark.typography, presetFontVar),
        'dark'
      )
    }
  }

 
  const updateShadcnColorVariable = (key: string, value: string) => {
    const resolvedMode = themeEditMode === 'dark' ? 'dark' : 'light'
    const previous = appTheme.theme.shadcn?.variables ?? {}
    const normalized = normalizeShadcnColorInput(value)
    const nextModeVars = { ...(previous[resolvedMode] ?? {}) }
    if (normalized) {
      nextModeVars[key] = normalized
    } else {
      delete nextModeVars[key]
    }
    appThemeState.setShadcnVariables(nextModeVars, resolvedMode)

    const baseVars = resolvedMode === 'light' ? nextModeVars : (previous.light ?? {})
    const effectiveVars =
      resolvedMode === 'dark' ? { ...baseVars, ...nextModeVars } : baseVars
    const preset = getComponentSetPreset(appTheme.theme.componentSetId)
    const nextColors = mapShadcnVariablesToThemeColors(
      effectiveVars,
      normalizedTheme.modes[resolvedMode].colors,
      { mode: resolvedMode, mapping: preset?.colorMapping }
    )
    appThemeState.setThemeColors(nextColors, resolvedMode)
  }

  const updateShadcnCssVariable = (key: string, value: string) => {
    const trimmed = value.trim()
    const currentShadcn = appTheme.theme.shadcn ?? {}
    const merged = { ...(currentShadcn.cssVariables ?? {}) }
    if (trimmed) {
      merged[key] = trimmed
    } else {
      delete merged[key]
    }
    appThemeState.setShadcnConfig({ cssVariables: merged })
  }

  const updateShadcnFontVariable = (key: string, value: string) => {
    updateShadcnCssVariable(key, value)
    if (key !== '--font-sans') {
      return
    }
    const trimmed = value.trim()
    const fallbackFont =
      componentSetPreset?.cssVariables?.['--font-sans'] ?? DEFAULT_FONT_FAMILY
    const nextFontVar = trimmed || fallbackFont
    appThemeState.setTypographyTokens(
      updateTypographyFontTokens(normalizedTheme.modes.light.typography, nextFontVar),
      'light'
    )
    appThemeState.setTypographyTokens(
      updateTypographyFontTokens(normalizedTheme.modes.dark.typography, nextFontVar),
      'dark'
    )
  }

  const applySansFont = (fontKey: string) => {
    if (fontKey === 'default') {
      updateShadcnFontVariable('--font-sans', '')
      return
    }
    updateShadcnFontVariable('--font-sans', getFontFamilyValue(fontKey))
  }

  const applyMonoFont = (fontKey: string) => {
    if (fontKey === 'default') {
      updateShadcnCssVariable('--font-mono', '')
      return
    }
    updateShadcnCssVariable('--font-mono', getMonoFamilyValue(fontKey))
  }

  const updateShadcnRadiusVariable = (value: string) => {
    const resolvedMode = themeEditMode === 'dark' ? 'dark' : 'light'
    const previous = appTheme.theme.shadcn?.variables ?? {}
    const trimmed = value.trim()
    const nextModeVars = { ...(previous[resolvedMode] ?? {}) }
    if (trimmed) {
      nextModeVars['--radius'] = trimmed
    } else {
      delete nextModeVars['--radius']
    }
    appThemeState.setShadcnVariables(nextModeVars, resolvedMode)
    appThemeState.setThemeRadii(buildRadiiFromRadius(trimmed), resolvedMode)
  }

  const updateShadcnShadowVariable = (
    key: string,
    value: string,
    shadowKey: 'sm' | 'md' | 'lg'
  ) => {
    const trimmed = value.trim()
    updateShadcnCssVariable(key, trimmed)
    appThemeState.setThemeShadows({ [shadowKey]: trimmed }, themeEditMode)
  }

  const handleCustomCssChange = (nextValue: string) => {
    appThemeState.setCustomCss(nextValue)
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="builder-panel-header flex h-9 items-center justify-between border-b border-foreground-muted/30 bg-surface-200 px-3 text-[11px] font-semibold">
        <span>App settings</span>
        <Button type="text" size="tiny" icon={<X size={14} />} onClick={() => onClose?.()} />
      </div>
      <Separator />
      <div className="flex min-h-0 flex-1">
        <div className="w-44 border-r border-foreground-muted/20 bg-background">
          <ScrollArea className="h-full px-2 py-3">
            <div className="space-y-1">
              {SETTINGS_SECTIONS.map((section) => {
                const isActive = section.id === activeSection
                return (
                  <button
                    key={section.id}
                    type="button"
                    className={cn(
                      'flex w-full items-center rounded-md px-2 py-1.5 text-xs font-medium transition',
                      isActive
                        ? 'bg-surface-200 text-foreground'
                        : 'text-foreground-muted hover:bg-surface-200 hover:text-foreground'
                    )}
                    onClick={() => setActiveSection(section.id)}
                  >
                    {section.label}
                  </button>
                )
              })}
            </div>
          </ScrollArea>
        </div>
        <ScrollArea className="min-h-0 flex-1">
          <div className="space-y-6 px-5 py-4">
            {activeSection === 'general' && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="text-[15px] font-semibold text-foreground">General</div>
                </div>

                <SettingsRow
                  title="App name"
                  description="Used in lists and as the default app title."
                  control={
                    <div className="flex flex-col items-end">
                      <Input_Shadcn_
                        size={"tiny"}
                        value={draftName}
                        onChange={(event) => setDraftName(event.target.value)}
                        onFocus={() => {
                          nameBeforeEditRef.current = draftName
                        }}
                        onBlur={() => {
                          if (!canEditName) {
                            return
                          }
                          if (nameError) {
                            const fallback = nameBeforeEditRef.current || appName || 'App'
                            setDraftName(fallback)
                            return
                          }
                          const nextName = draftName.trim()
                          if (!appId || nextName === (appName ?? '')) {
                            return
                          }
                          updateAppMutation.mutate(
                            { appId, name: nextName },
                            {
                              onSuccess: () => {
                                nameBeforeEditRef.current = nextName
                                onAppNameChange?.(nextName)
                              },
                              onError: () => {
                                const fallback = nameBeforeEditRef.current || appName || 'App'
                                setDraftName(fallback)
                              },
                            }
                          )
                        }}
                        aria-invalid={Boolean(nameError)}
                        disabled={!canEditName}
                      />
                      {nameError && (
                        <div className="mt-1 text-[10px] text-destructive">
                          {nameError}
                        </div>
                      )}
                    </div>
                  }
                />
                <SettingsRow
                  title="Global style"
                  description={componentSet.description}
                  control={
                    <Select_Shadcn_
                      value={componentSet.id}
                      onValueChange={(next) => {
                        const set = getThemeComponentSet(next)
                        appThemeState.setComponentSetId(set.id)
                        if (set.shadcnStyle) {
                          appThemeState.setShadcnConfig({ style: set.shadcnStyle })
                        }
                        applyComponentSetPreset(set.id)
                      }}
                    >
                      <SelectTrigger_Shadcn_ size={"tiny"}>
                        <SelectValue_Shadcn_ placeholder="Style" />
                      </SelectTrigger_Shadcn_>
                      <SelectContent_Shadcn_>
                        {THEME_COMPONENT_SETS.map((set) => (
                          <SelectItem_Shadcn_ key={set.id} value={set.id}>
                            {set.label}
                          </SelectItem_Shadcn_>
                        ))}
                      </SelectContent_Shadcn_>
                    </Select_Shadcn_>
                  }
                />
                <SettingsRow
                  title="Configure Markdown link behavior"
                  description="Links outside your organization open in a new tab by default."
                  control={
                    <Select_Shadcn_
                      value={markdownLinkBehavior}
                      onValueChange={(next) =>
                        setMarkdownLinkBehavior(next as typeof markdownLinkBehavior)
                      }
                    >
                      <SelectTrigger_Shadcn_ size={"tiny"}>
                        <SelectValue_Shadcn_ placeholder="Automatic" />
                      </SelectTrigger_Shadcn_>
                      <SelectContent_Shadcn_>
                        <SelectItem_Shadcn_ value="automatic">Automatic</SelectItem_Shadcn_>
                        <SelectItem_Shadcn_ value="new-tab">New tab</SelectItem_Shadcn_>
                        <SelectItem_Shadcn_ value="current-tab">Current tab</SelectItem_Shadcn_>
                      </SelectContent_Shadcn_>
                    </Select_Shadcn_>
                  }
                />
                <SettingsRow
                  title="Show query status to viewers"
                  description="Query run status is always available to editors in the status bar."
                  control={
                    <Checkbox_Shadcn_
                      checked={showQueryStatus}
                      onCheckedChange={(checked) => setShowQueryStatus(Boolean(checked))}
                    />
                  }
                />
                <SettingsRow
                  title="Enable mobile layout"
                  description={
                    <>
                      Hide or show components when viewport is less than 600px.{' '}
                      <a className="text-brand-link hover:underline" href="#">
                        Learn more.
                      </a>
                    </>
                  }
                  control={
                    <Checkbox_Shadcn_
                      checked={enableMobileLayout}
                      onCheckedChange={(checked) => setEnableMobileLayout(Boolean(checked))}
                    />
                  }
                />
                <SettingsRow
                  title="Show loading state"
                  description="Display a loading indicator while the data is being loaded."
                  control={
                    <Checkbox_Shadcn_
                      checked={showLoadingState}
                      onCheckedChange={(checked) => setShowLoadingState(Boolean(checked))}
                    />
                  }
                />
                <div className="rounded-md border border-foreground-muted/30 bg-surface-100 px-4 py-3">
                  <div className="text-[13px] font-semibold text-foreground">Danger zone</div>
                  <div className="mt-1 text-[12px] text-foreground-muted">
                    Deleting an app removes all builder data for it. This action cannot be undone.
                  </div>
                  <div className="mt-3">
                    <Button
                      type="danger"
                      size="tiny"
                      onClick={() => setShowDeleteModal(true)}
                      disabled={!appId}
                    >
                      Delete app
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'app-theme' && (
              <div className="space-y-6">
                {showThemeBanner && (
                  <div className="flex items-start justify-between gap-4 rounded-md border border-foreground-muted/20 bg-surface-50 p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-brand-500/10 text-brand">
                        <div className="h-6 w-6 rounded-sm border border-brand-500/30 bg-brand-500/20" />
                      </div>
                      <div className="space-y-1">
                        <div className="text-[13px] font-medium text-foreground">
                          Create themes once, use them everywhere.
                        </div>
                        <div className="text-[12px] text-foreground-muted">
                          Easily save and reuse theme settings across your organization with
                          advanced typography controls, component styling, and dynamic theme
                          modes-starting in our Business plan.{' '}
                          <a className="text-brand-link hover:underline" href="#">
                            Learn more
                          </a>
                          .
                        </div>
                      </div>
                    </div>
                    <Button
                      type="text"
                      size="tiny"
                      className="text-foreground-muted"
                      icon={<X size={14} />}
                      onClick={() => setShowThemeBanner(false)}
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <div className="text-[15px] font-semibold text-foreground">App theme</div>
                  <div className="text-[11px] text-foreground-muted">
                    Create a unique theme within this app. This theme cannot be reused in other
                    apps.
                  </div>
                </div>

                <div className="rounded-md bg-background">
                  <SettingsRow
                    title="Theme mode"
                    description="Controls which mode is used in preview and runtime."
                    control={
                      <Select_Shadcn_
                        value={appTheme.theme.mode}
                        onValueChange={(next) => appThemeState.setThemeMode(next as ThemeMode)}
                      >
                        <SelectTrigger_Shadcn_ size={"tiny"}>
                          <SelectValue_Shadcn_ placeholder="Mode" />
                        </SelectTrigger_Shadcn_>
                        <SelectContent_Shadcn_>
                          <SelectItem_Shadcn_ value="light">Light</SelectItem_Shadcn_>
                          <SelectItem_Shadcn_ value="dark">Dark</SelectItem_Shadcn_>
                          <SelectItem_Shadcn_ value="system">System</SelectItem_Shadcn_>
                        </SelectContent_Shadcn_>
                      </Select_Shadcn_>
                    }
                  />
                  <SettingsRow
                    title="Edit tokens for"
                    description="Choose which mode you are editing."
                    control={
                      <Select_Shadcn_
                        value={themeEditMode}
                        onValueChange={(next) => setThemeEditMode(next as ThemeMode)}
                      >
                        <SelectTrigger_Shadcn_ size={"tiny"}>
                          <SelectValue_Shadcn_ placeholder="Mode" />
                        </SelectTrigger_Shadcn_>
                        <SelectContent_Shadcn_>
                          <SelectItem_Shadcn_ value="light">Light</SelectItem_Shadcn_>
                          <SelectItem_Shadcn_ value="dark">Dark</SelectItem_Shadcn_>
                        </SelectContent_Shadcn_>
                      </Select_Shadcn_>
                    }
                  />
                </div>

                <Tabs_Shadcn_ value={themeTab} onValueChange={(value) => setThemeTab(value as ThemeTabId)}>
                  <TabsList_Shadcn_ className="w-full justify-start gap-4 border-b border-foreground-muted/20 bg-transparent px-0">
                    <TabsTrigger_Shadcn_ value="color" className="px-0 text-xs">
                      Color
                    </TabsTrigger_Shadcn_>
                    <TabsTrigger_Shadcn_ value="typography" className="px-0 text-xs">
                      Typography
                    </TabsTrigger_Shadcn_>
                    <TabsTrigger_Shadcn_ value="metrics" className="px-0 text-xs">
                      Metrics
                    </TabsTrigger_Shadcn_>
                    <TabsTrigger_Shadcn_ value="shadows" className="px-0 text-xs">
                      Shadows
                    </TabsTrigger_Shadcn_>
                    <TabsTrigger_Shadcn_ value="tokens" className="px-0 text-xs">
                      Tokens
                    </TabsTrigger_Shadcn_>
                  </TabsList_Shadcn_>

                  <TabsContent_Shadcn_ value="color" className="mt-5 space-y-4">
                    <div className="space-y-1">
                      <div className="text-[13px] font-medium text-foreground">
                        Shadcn color tokens
                      </div>
                      <div className="text-[11px] text-foreground-muted">
                        Edit the CSS variables used by shadcn components. Values are applied per
                        mode.
                      </div>
                    </div>
                    <div className="space-y-4">
                      {SHADCN_COLOR_GROUPS.map((group) => (
                        <div key={group.title} className="space-y-2">
                          <div className="text-[12px] font-medium text-foreground">
                            {group.title}
                          </div>
                          <div className="rounded-md border border-foreground-muted/20 bg-background">
                            {group.items.map((item, index) => {
                              const value = shadcnColorValueMap.get(item.key) ?? ''
                              return (
                                <div
                                  key={item.key}
                                  className={cn(
                                    'flex items-center justify-between gap-4 px-3 py-2',
                                    index !== group.items.length - 1 &&
                                      'border-b border-foreground-muted/20'
                                  )}
                                >
                                  <div className="space-y-0.5">
                                    <div className="text-[12px] font-medium text-foreground">
                                      {item.label}
                                    </div>
                                    <div className="text-[11px] text-foreground-muted">
                                      {item.description}
                                    </div>
                                  </div>
                                  <ColorInput
                                    value={formatShadcnColorValue(value)}
                                    onChange={(nextValue) =>
                                      updateShadcnColorVariable(item.key, nextValue)
                                    }
                                    placeholder="No color"
                                  />
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent_Shadcn_>

                  <TabsContent_Shadcn_ value="typography" className="mt-5 space-y-6">
                    <div className="space-y-2">
                      <div className="text-[13px] font-medium text-foreground">
                        Shadcn font tokens
                      </div>
                      <div className="rounded-md border border-foreground-muted/20 bg-background">
                        {shadcnFontVariables.map((item, index) => {
                          const isSans = item.key === '--font-sans'
                          const selectValue = isSans ? selectedSansFontKey : selectedMonoFontKey
                          const options = isSans ? FONT_FAMILY_OPTIONS : MONO_FONT_OPTIONS
                          const onChange = isSans ? applySansFont : applyMonoFont
                          return (
                            <div
                              key={item.key}
                              className={cn(
                                'flex items-center justify-between gap-4 px-3 py-2',
                                index !== shadcnFontVariables.length - 1 &&
                                  'border-b border-foreground-muted/20'
                              )}
                            >
                              <div className="space-y-0.5">
                                <div className="text-[12px] font-medium text-foreground">
                                  {item.label}
                                </div>
                                <div className="text-[11px] text-foreground-muted">
                                  {item.description}
                                </div>
                              </div>
                              <Select_Shadcn_ value={selectValue} onValueChange={onChange}>
                                <SelectTrigger_Shadcn_ size={"tiny"} className="min-w-64">
                                  <SelectValue_Shadcn_ placeholder="Font" />
                                </SelectTrigger_Shadcn_>
                                <SelectContent_Shadcn_>
                                  {options.map((option) => (
                                    <SelectItem_Shadcn_ key={option.value} value={option.value}>
                                      {option.label}
                                    </SelectItem_Shadcn_>
                                  ))}
                                </SelectContent_Shadcn_>
                              </Select_Shadcn_>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-[13px] font-medium text-foreground">Type styles</div>
                      <div className="rounded-md border border-foreground-muted/20 bg-background">
                        {activeThemeTokens.typography.map((style, index) => (
                          <Popover_Shadcn_
                            key={style.label}
                            open={typographyEditor?.index === index}
                            onOpenChange={(open) => {
                              if (open) {
                                openTypographyEditor(index)
                              } else {
                                closeTypographyEditor()
                              }
                            }}
                          >
                            <PopoverTrigger_Shadcn_ asChild>
                              <button
                                type="button"
                                className={cn(
                                  'flex w-full items-center gap-3 px-3 py-1 text-left text-[12px] transition',
                                  'hover:bg-surface-200 hover:text-foreground',
                                  index !== activeThemeTokens.typography.length - 1 &&
                                    'border-b border-foreground-muted/20'
                                )}
                              >
                                <span className="w-6 text-[11px] text-foreground-muted">
                                  {getTypographyBadge(style.label)}
                                </span>
                                <span className="flex-1 text-left text-foreground-muted">
                                  {style.label}
                                </span>
                                <span className="ml-auto text-[11px] font-mono text-foreground-muted">
                                  {formatTypographyValue(style.value)}
                                </span>
                              </button>
                            </PopoverTrigger_Shadcn_>
                            <PopoverContent_Shadcn_ align="end" side="right" className="w-80 p-3">
                              {typographyEditor?.index === index && (
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <div className="text-[12px] font-medium text-foreground">
                                      Edit typography
                                    </div>
                                    <button
                                      type="button"
                                      className="rounded p-1 text-foreground-muted hover:bg-surface-200 hover:text-foreground"
                                      onClick={closeTypographyEditor}
                                      aria-label="Close"
                                    >
                                      <X size={12} />
                                    </button>
                                  </div>
                                  <div
                                    className="flex h-24 items-center justify-center rounded-md border border-foreground-muted/20 bg-background text-[28px] font-semibold text-foreground"
                                    style={{
                                      fontFamily: typographyEditor.fontFamily,
                                      fontWeight: Number(typographyEditor.fontWeight) || undefined,
                                      fontSize: normalizeFontSize(
                                        typographyEditor.fontSize,
                                        '28px'
                                      ),
                                    }}
                                  >
                                    Ag 123
                                  </div>
                                  <div className="space-y-2 text-xs">
                                    <div className="flex items-center gap-2">
                                      <div className="w-32 text-foreground">Size</div>
                                      <Input_Shadcn_
                                        size={"tiny"}
                                        value={typographyEditor.fontSize}
                                        onChange={(event) =>
                                          updateTypographyEditor({ fontSize: event.target.value })
                                        }
                                        onKeyDown={(event) => {
                                          if (event.key !== 'Enter') {
                                            return
                                          }
                                          event.preventDefault()
                                          const normalized = normalizeFontSize(
                                            typographyEditor.fontSize,
                                            '16px'
                                          )
                                          updateTypographyEditor({ fontSize: normalized })
                                          closeTypographyEditor()
                                        }}
                                        
                                      />
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <div className="w-32 text-foreground">Font family</div>
                                      <Select_Shadcn_
                                        value={typographyEditor.fontKey}
                                        onValueChange={(next) => {
                                          const nextFamily = getFontFamilyValue(next)
                                          updateTypographyEditor({
                                            fontKey: next,
                                            fontFamily: nextFamily,
                                          })
                                        }}
                                      >
                                        <SelectTrigger_Shadcn_ size={"tiny"}>
                                          <SelectValue_Shadcn_ placeholder="Font" />
                                        </SelectTrigger_Shadcn_>
                                        <SelectContent_Shadcn_>
                                          {FONT_FAMILY_OPTIONS.map((option) => (
                                            <SelectItem_Shadcn_
                                              key={option.value}
                                              value={option.value}
                                            >
                                              {option.label}
                                            </SelectItem_Shadcn_>
                                          ))}
                                        </SelectContent_Shadcn_>
                                      </Select_Shadcn_>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <div className="text-foreground w-32">Font weight</div>
                                      <Select_Shadcn_
                                        value={typographyEditor.fontWeight}
                                        onValueChange={(next) => updateTypographyEditor({ fontWeight: next })}
                                      >
                                        <SelectTrigger_Shadcn_ size={"tiny"}>
                                          <SelectValue_Shadcn_ placeholder="Weight" />
                                        </SelectTrigger_Shadcn_>
                                        <SelectContent_Shadcn_>
                                          {FONT_WEIGHT_OPTIONS.map((option) => (
                                            <SelectItem_Shadcn_
                                              key={option.value}
                                              value={option.value}
                                            >
                                              {option.label}
                                            </SelectItem_Shadcn_>
                                          ))}
                                        </SelectContent_Shadcn_>
                                      </Select_Shadcn_>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </PopoverContent_Shadcn_>
                          </Popover_Shadcn_>
                        ))}
                      </div>
                    </div>
                  </TabsContent_Shadcn_>

                  <TabsContent_Shadcn_ value="metrics" className="mt-5 space-y-4">
                    <div className="space-y-2">
                      <div className="text-[13px] font-medium text-foreground">
                        Shadcn radius token
                      </div>
                      <div className="rounded-md border border-foreground-muted/20 bg-background">
                        {shadcnRadiusVariables.map((item, index) => (
                          <div
                            key={item.key}
                            className={cn(
                              'flex items-center justify-between gap-4 px-3 py-2',
                              index !== shadcnRadiusVariables.length - 1 &&
                                'border-b border-foreground-muted/20'
                            )}
                          >
                            <div className="space-y-0.5">
                              <div className="text-[12px] font-medium text-foreground">
                                {item.label}
                              </div>
                              <div className="text-[11px] text-foreground-muted">
                                {item.description}
                              </div>
                            </div>
                            <Input_Shadcn_
                              size={"tiny"}
                              className="font-mono min-w-64"
                              value={item.value}
                              onChange={(event) => updateShadcnRadiusVariable(event.target.value)}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent_Shadcn_>

                  <TabsContent_Shadcn_ value="shadows" className="mt-5 space-y-4">
                    <div className="space-y-2">
                      <div className="text-[13px] font-medium text-foreground">
                        Shadcn shadow tokens
                      </div>
                      <div className="rounded-md border border-foreground-muted/20 bg-background">
                        {shadcnShadowVariables.map((item) => (
                          <div
                            key={item.key}
                            className="flex items-center justify-between gap-4 border-b border-foreground-muted/20 px-3 py-2 last:border-b-0"
                          >
                            <div className="space-y-0.5">
                              <div className="text-[12px] font-medium text-foreground">
                                {item.label}
                              </div>
                              <div className="text-[11px] text-foreground-muted">
                                {item.description}
                              </div>
                            </div>
                            <Input_Shadcn_
                              size={"tiny"}
                              className="font-mono min-w-64"
                              value={item.value}
                              onChange={(event) => {
                                updateShadcnShadowVariable(
                                  item.key,
                                  event.target.value,
                                  item.shadowKey
                                )
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent_Shadcn_>

                  <TabsContent_Shadcn_ value="tokens" className="mt-5 space-y-3">
                    <div className="space-y-1">
                      <div className="text-[13px] font-medium text-foreground">
                        Shadcn CSS variables
                      </div>
                      <div className="text-[11px] text-foreground-muted">
                        These tokens power shadcn-based widgets. Values shown for the current edit
                        mode.
                      </div>
                    </div>
                    <div className="rounded-md border border-foreground-muted/20 bg-background">
                      {shadcnVariables.length === 0 ? (
                        <div className="px-3 py-3 text-[12px] text-foreground-muted">
                          No shadcn variables are defined for this component set yet.
                        </div>
                      ) : (
                        shadcnVariables.map(([key, value], index) => (
                          <div
                            key={key}
                            className={cn(
                              'flex items-center justify-between gap-4 px-3 py-2 text-[11px] font-mono',
                              index !== shadcnVariables.length - 1 &&
                                'border-b border-foreground-muted/20'
                            )}
                          >
                            <span className="text-foreground">{key}</span>
                            <span className="text-foreground-muted">{value}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </TabsContent_Shadcn_>
                </Tabs_Shadcn_>
              </div>
            )}

            {activeSection === 'custom-components' && (
              <div className="space-y-3">
                <div>
                  <div className="text-[15px] font-semibold text-foreground">
                    Custom component libraries
                  </div>
                  <div className="text-[12px] text-foreground-muted">
                    Import your own React components.{' '}
                    <a className="text-brand-link hover:underline" href="#">
                      Learn more.
                    </a>
                  </div>
                </div>
                <EmptyPanel
                  title="No custom components added"
                  description="Add custom components to reuse them across your app."
                  actionLabel="Read the docs"
                />
              </div>
            )}

            {activeSection === 'custom-css' && (
              <div className="space-y-4">
                <div className='space-y-2'>
                  <div className="text-[15px] font-semibold text-foreground">Custom CSS</div>
                  <div className="text-[11px] leading-5 text-foreground-muted">
                    Add global CSS overrides for this app. Theme variables from the component set
                    apply automatically and can be overridden here. Styles defined in this editor
                    always override the app theme. Use `.builder-app-theme-scope` to scope styles
                    to widgets only.
                  </div>
                </div>

                <div className="monaco-no-suggest overflow-hidden rounded-md border border-foreground-muted/20 bg-background [&_.monaco-editor]:!bg-transparent [&_.monaco-editor_.margin]:!bg-surface-200/40 [&_.monaco-editor_.monaco-editor-background]:!bg-transparent [&_.line-numbers]:!text-foreground-muted/60">
                  <div className="h-64">
                    <CodeEditor
                      id="builder-custom-css"
                      language="css"
                      value={appTheme.theme.customCss ?? ''}
                      onInputChange={(value) => handleCustomCssChange(value ?? '')}
                      onMarkersChange={(markers) => setCustomCssMarkers(markers)}
                      autoTriggerSuggestions={false}
                      completionWords={customCssSuggestions.words}
                      completionMetadata={customCssSuggestions.metadata}
                      customSuggestions={{ enabled: true, triggerMode: 'css' }}
                      options={{
                        minimap: { enabled: false },
                        wordWrap: 'on',
                        lineNumbers: 'on',
                        lineNumbersMinChars: 2,
                        fontSize: 13,
                        lineHeight: 18,
                        scrollBeyondLastLine: false,
                        glyphMargin: false,
                        folding: false,
                        renderLineHighlight: 'none',
                        renderValidationDecorations: 'on',
                        overviewRulerBorder: false,
                        overviewRulerLanes: 0,
                        padding: { top: 2, bottom: 6 },
                        quickSuggestions: true,
                        suggestOnTriggerCharacters: true,
                        tabCompletion: 'on',
                      }}
                    />
                  </div>
                </div>

                {customCssMarkers.length > 0 && (
                  <div className="rounded-md border border-foreground-muted/20 bg-surface-50 px-3 py-2 text-[11px] text-foreground-muted">
                    <div className="text-[12px] font-medium text-foreground">
                      Validation issues
                    </div>
                    <div className="mt-2 space-y-2">
                      {customCssMarkers.map((marker, index) => (
                        <div key={`${marker.message}-${index}`} className="flex gap-2">
                          <span
                            className={cn(
                              'mt-0.5 inline-flex h-5 items-center rounded-full px-2 text-[10px] font-medium',
                              getMarkerSeverityClass(marker.severity)
                            )}
                          >
                            {getMarkerSeverityLabel(marker.severity)}
                          </span>
                          <div className="min-w-0">
                            <div className="truncate text-foreground">{marker.message}</div>
                            <div className="text-[10px] text-foreground-muted">
                              Line {marker.startLineNumber}:{marker.startColumn}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeSection === 'preloaded-js' && (
              <EmptyPanel
                title="Preloaded JS"
                description="Add global functions or variables by assigning them to the window scope."
              />
            )}

            {activeSection === 'libraries' && (
              <div className="space-y-3">
                <div>
                  <div className="text-[15px] font-semibold text-foreground">Libraries</div>
                  <div className="text-[12px] text-foreground-muted">
                    Add access to custom libraries in this application.{' '}
                    <a className="text-brand-link hover:underline" href="#">
                      Learn more.
                    </a>
                  </div>
                </div>
                <EmptyPanel
                  title="No libraries added"
                  description="Click Add new to add a new library."
                />
                <div className="flex justify-end">
                  <Button type="default" size="tiny">
                    Add new
                  </Button>
                </div>
              </div>
            )}

            {activeSection === 'notifications' && (
              <EmptyPanel
                title="Notifications"
                description="Control notifications that show to end users while using your app."
              />
            )}
          </div>
        </ScrollArea>
      </div>

      <TextConfirmModal
        visible={showDeleteModal}
        loading={deleteAppMutation.isPending}
        title={`Confirm deletion of ${appName ?? 'this app'}`}
        variant="destructive"
        alert={{
          title: 'This action cannot be undone.',
          description: 'All app pages, queries, and versions will be deleted.',
        }}
        text={`This will permanently delete ${appName ?? 'this app'} and all of its data.`}
        confirmPlaceholder="Type the app name in here"
        confirmString={appName ?? ''}
        confirmLabel="I understand, delete this app"
        onConfirm={() => {
          if (!appId) {
            return
          }
          deleteAppMutation.mutate({ appId, projectRef })
          setShowDeleteModal(false)
        }}
        onCancel={() => {
          if (!deleteAppMutation.isPending) {
            setShowDeleteModal(false)
          }
        }}
      />
    </div>
  )
}
