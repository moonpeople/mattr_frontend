/**
 * Fallback-стили inspector: значения по умолчанию для style-полей при отсутствии явных данных.
 */
import type { WidgetField } from 'widgets/runtime'
import { resolveWidgetStyleFallbackToken } from 'widgets/inspector/widgetStyleFields'
import type {
  ColorTokenOption,
  ThemeColorKey,
  ThemeModeTokens,
} from 'state/app-theme-state'

export type StyleFieldFallback = {
  kind: 'color' | 'typography' | 'value'
  label: string
  swatch?: string
}

const THEME_COLOR_LABELS: Record<ThemeColorKey, string> = {
  primary: 'Primary',
  secondary: 'Secondary',
  tertiary: 'Accent',
  canvas: 'Background',
  surfacePrimary: 'Card',
  surfaceSecondary: 'Muted',
  borderPrimary: 'Border',
  borderSecondary: 'Input',
  textDark: 'Foreground',
  textLight: 'Primary foreground',
  statusDanger: 'Destructive',
  statusInfo: 'Ring',
  statusWarning: 'Warning',
  statusSuccess: 'Success',
  statusHighlight: 'Highlight',
}

type StyleColorFallbackValue =
  | ThemeColorKey
  | 'generated'
  | 'contrast'
  | `--${string}`

const STYLE_COLOR_FALLBACKS: Record<string, StyleColorFallbackValue> = {
  accentColor: '--primary',
  baseTextColor: '--foreground',
  hoverBackground: '--muted',
  activeBackground: '--primary',
  inputBackground: '--background',
  inputPlaceholderColor: '--muted',
  inputTextColor: '--foreground',
  textColor: '--foreground',
  activeTextColor: '--foreground',
  iconColor: '--muted-foreground',
  activeIconColor: '--primary',
  color: '--foreground',
  placeholderColor: '--muted',
  inputBorderRadius: '--radius',
  itemBorderRadius: '--radius',
  labelTextColor: '--foreground',
  labelCaptionColor: '--muted-foreground',
  labelRequiredIndicatorColor: '--destructive',
  styleBackground: '--background',
  styleForeground: '--foreground',
  styleCard: '--card',
  styleCardForeground: '--card-foreground',
  stylePopover: '--popover',
  stylePopoverForeground: '--popover-foreground',
  stylePrimary: '--primary',
  stylePrimaryForeground: '--primary-foreground',
  styleSecondary: '--secondary',
  styleSecondaryForeground: '--secondary-foreground',
  styleMuted: '--muted',
  styleMutedForeground: '--muted-foreground',
  styleAccent: '--accent',
  styleAccentForeground: '--accent-foreground',
  styleDestructive: '--destructive',
  styleDestructiveForeground: '--destructive-foreground',
  styleBorder: '--border',
  styleInput: '--input',
  styleRing: '--ring',
}

const isThemeColorKey = (value: string): value is ThemeColorKey =>
  Object.prototype.hasOwnProperty.call(THEME_COLOR_LABELS, value)

const resolveTypographyFallback = (tokens: ThemeModeTokens, field: WidgetField) => {
  const prefersLabel = field.key.toLowerCase().includes('label')
  const desired = prefersLabel ? 'Label' : 'Body'
  const match =
    tokens.typography.find(
      (token) => token.label.toLowerCase() === desired.toLowerCase()
    ) ??
    tokens.typography.find((token) =>
      token.label.toLowerCase().includes(desired.toLowerCase())
    ) ??
    tokens.typography.find((token) =>
      token.label.toLowerCase().includes('body')
    ) ??
    tokens.typography[0]
  return match?.label ?? desired
}

export const resolveStyleFallback = (
  tokens: ThemeModeTokens,
  themeMode: string | undefined,
  widgetType: string,
  field: WidgetField,
  colorTokenOptions?: ColorTokenOption[]
): StyleFieldFallback | null => {
  if (field.control === 'typography') {
    const label = resolveTypographyFallback(tokens, field)
    return { kind: 'typography', label }
  }

  const mapping =
    resolveWidgetStyleFallbackToken(widgetType, field.key) ??
    STYLE_COLOR_FALLBACKS[field.key]

  if (mapping && mapping.startsWith('--')) {
    const token = colorTokenOptions?.find((option) => option.token === mapping)
    const label = token
      ? token.label
      : mapping.replace(/^--/, '').replace(/-/g, ' ')
    if (field.type === 'color') {
      return {
        kind: 'color',
        label,
        swatch: token?.preview,
      }
    }
    return {
      kind: 'value',
      label,
    }
  }

  if (field.type === 'color') {
    if (mapping === 'generated' || (!mapping && field.key.toLowerCase().includes('border'))) {
      return { kind: 'color', label: 'Generated' }
    }

    if (mapping === 'contrast') {
      const foregroundToken = colorTokenOptions?.find(
        (option) => option.token === '--foreground'
      )
      if (foregroundToken) {
        return {
          kind: 'color',
          label: foregroundToken.label,
          swatch: foregroundToken.preview,
        }
      }
      const contrastKey: ThemeColorKey =
        themeMode === 'dark' ? 'textLight' : 'textDark'
      const raw = tokens.colors[contrastKey] ?? ''
      const swatch =
        raw && raw !== 'Generated' && raw !== 'No color' ? raw : undefined
      return {
        kind: 'color',
        label: 'Contrast text',
        swatch,
      }
    }

    if (mapping && isThemeColorKey(mapping)) {
      const raw = tokens.colors[mapping] ?? ''
      const swatch = raw && raw !== 'Generated' && raw !== 'No color' ? raw : undefined
      return {
        kind: 'color',
        label: THEME_COLOR_LABELS[mapping] ?? 'Generated',
        swatch,
      }
    }

    return { kind: 'color', label: 'Generated' }
  }

  if (field.type === 'text' && mapping === 'generated') {
    return { kind: 'value', label: 'Generated' }
  }

  return null
}
