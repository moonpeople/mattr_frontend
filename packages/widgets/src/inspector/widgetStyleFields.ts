import type { WidgetField } from '../types'

export const GLOBAL_WIDGET_STYLE_FIELD_KEYS = [
  'styleBackground',
  'styleForeground',
  'styleCard',
  'styleCardForeground',
  'stylePopover',
  'stylePopoverForeground',
  'stylePrimary',
  'stylePrimaryForeground',
  'styleSecondary',
  'styleSecondaryForeground',
  'styleMuted',
  'styleMutedForeground',
  'styleAccent',
  'styleAccentForeground',
  'styleDestructive',
  'styleDestructiveForeground',
  'styleBorder',
  'styleInput',
  'styleRing',
  'styleRadius',
  'styleFontSans',
  'styleFontMono',
] as const

export const GLOBAL_WIDGET_STYLE_VAR_MAP: Record<string, string> = {
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
  styleRadius: '--radius',
  styleFontSans: '--font-sans',
  styleFontMono: '--font-mono',
}

export const GLOBAL_WIDGET_STYLE_COLOR_KEYS = new Set<string>([
  'styleBackground',
  'styleForeground',
  'styleCard',
  'styleCardForeground',
  'stylePopover',
  'stylePopoverForeground',
  'stylePrimary',
  'stylePrimaryForeground',
  'styleSecondary',
  'styleSecondaryForeground',
  'styleMuted',
  'styleMutedForeground',
  'styleAccent',
  'styleAccentForeground',
  'styleDestructive',
  'styleDestructiveForeground',
  'styleBorder',
  'styleInput',
  'styleRing',
])

export type GlobalWidgetStyleFieldKey = (typeof GLOBAL_WIDGET_STYLE_FIELD_KEYS)[number]
type WidgetStyleProfile = 'text' | 'button' | 'selection' | 'surface' | 'overlay'
type WidgetStyleFamily = 'input' | 'button' | 'selection' | 'surface' | 'overlay' | 'text'

export type WidgetStyleFallbackToken = `--${string}` | 'generated' | 'contrast'

const STYLE_PROFILES: Record<WidgetStyleProfile, readonly GlobalWidgetStyleFieldKey[]> = {
  text: [
    'styleBackground',
    'styleForeground',
    'styleBorder',
    'styleInput',
    'styleRing',
    'styleRadius',
    'styleFontSans',
    'styleFontMono',
  ],
  button: [
    'stylePrimary',
    'stylePrimaryForeground',
    'styleSecondary',
    'styleSecondaryForeground',
    'styleAccent',
    'styleAccentForeground',
    'styleDestructive',
    'styleDestructiveForeground',
    'styleBorder',
    'styleRing',
    'styleRadius',
    'styleFontSans',
  ],
  selection: [
    'styleBackground',
    'styleForeground',
    'stylePrimary',
    'stylePrimaryForeground',
    'styleMuted',
    'styleMutedForeground',
    'styleBorder',
    'styleInput',
    'styleRing',
    'styleRadius',
    'styleFontSans',
  ],
  surface: [
    'styleBackground',
    'styleForeground',
    'styleCard',
    'styleCardForeground',
    'styleBorder',
    'styleRadius',
    'styleFontSans',
  ],
  overlay: [
    'styleBackground',
    'styleForeground',
    'styleCard',
    'styleCardForeground',
    'stylePopover',
    'stylePopoverForeground',
    'styleBorder',
    'styleRing',
    'styleRadius',
    'styleFontSans',
  ],
}

const PROFILE_LABEL_OVERRIDES: Record<
  WidgetStyleProfile,
  Partial<Record<GlobalWidgetStyleFieldKey, string>>
> = {
  text: {
    styleBackground: 'Input background',
    styleForeground: 'Input text',
    styleBorder: 'Input border',
    styleInput: 'Input border',
    styleRing: 'Accent',
    styleRadius: 'Input border radius',
    styleFontSans: 'Font',
    styleFontMono: 'Monospace font',
  },
  button: {
    stylePrimary: 'Primary background',
    stylePrimaryForeground: 'Primary text',
    styleSecondary: 'Secondary background',
    styleSecondaryForeground: 'Secondary text',
    styleAccent: 'Hover background',
    styleAccentForeground: 'Hover text',
    styleDestructive: 'Destructive background',
    styleDestructiveForeground: 'Destructive text',
    styleBorder: 'Border',
    styleRing: 'Focus ring',
    styleRadius: 'Button border radius',
    styleFontSans: 'Font',
  },
  selection: {
    styleBackground: 'Input background',
    styleForeground: 'Input text',
    stylePrimary: 'Accent',
    stylePrimaryForeground: 'Accent text',
    styleMuted: 'Hover background',
    styleMutedForeground: 'Placeholder',
    styleBorder: 'Input border',
    styleInput: 'Input border',
    styleRing: 'Focus ring',
    styleRadius: 'Input border radius',
    styleFontSans: 'Font',
  },
  surface: {
    styleBackground: 'Background',
    styleForeground: 'Text',
    styleCard: 'Surface',
    styleCardForeground: 'Surface text',
    styleBorder: 'Border',
    styleRadius: 'Border radius',
    styleFontSans: 'Font',
  },
  overlay: {
    styleBackground: 'Background',
    styleForeground: 'Text',
    styleCard: 'Surface',
    styleCardForeground: 'Surface text',
    stylePopover: 'Popover',
    stylePopoverForeground: 'Popover text',
    styleBorder: 'Border',
    styleRing: 'Focus ring',
    styleRadius: 'Border radius',
    styleFontSans: 'Font',
  },
}

const normalizeWidgetType = (widgetType: string) => widgetType.trim().toLowerCase()

const BUTTON_WIDGET_TYPES = new Set([
  'button',
  'outlinebutton',
  'closebutton',
  'dropdownbutton',
  'splitbutton',
  'togglebutton',
  'togglelink',
  'link',
  'linklist',
  'buttongroup',
])

const SELECTION_WIDGET_TYPES = new Set([
  'select',
  'multiselect',
  'cascader',
  'listbox',
  'multiselectlistbox',
  'radiogroup',
  'segmentedcontrol',
  'switch',
  'switchgroup',
  'checkbox',
  'checkboxgroup',
  'checkboxtree',
  'slider',
  'rangeslider',
  'rating',
  'pagination',
  'tabs',
])

const CALENDAR_WIDGET_TYPES = new Set([
  'calendar',
  'calendarinput',
  'datepicker',
  'daterangepicker',
  'datetimepicker',
  'datetimeinput',
  'date',
  'daterange',
  'datetime',
  'day',
  'month',
  'time',
  'timepicker',
  'year',
])

const TEXT_WIDGET_TYPES = new Set([
  'text',
  'header',
  'status',
  'statistic',
  'texteditor',
  'jsoneditor',
  'jsonexplorer',
  'html',
])

const INPUT_WIDGET_TYPES = new Set([
  'textinput',
  'textarea',
  'editabletext',
  'editabletextarea',
  'editablenumber',
  'numberinput',
  'currency',
  'percent',
  'email',
  'url',
  'passwordinput',
  'phonenumberinput',
  'otpinput',
])

const NAVIGATION_WIDGET_TYPES = new Set(['navigation'])

const resolveWidgetStyleProfile = (widgetType: string): WidgetStyleProfile => {
  const normalized = normalizeWidgetType(widgetType)
  if (BUTTON_WIDGET_TYPES.has(normalized)) {
    return 'button'
  }
  if (SELECTION_WIDGET_TYPES.has(normalized)) {
    return 'selection'
  }
  if (CALENDAR_WIDGET_TYPES.has(normalized)) {
    return 'overlay'
  }
  if (TEXT_WIDGET_TYPES.has(normalized)) {
    return 'text'
  }
  return 'surface'
}

const resolveWidgetStyleFamily = (widgetType: string): WidgetStyleFamily => {
  const normalized = normalizeWidgetType(widgetType)
  if (INPUT_WIDGET_TYPES.has(normalized)) {
    return 'input'
  }
  if (BUTTON_WIDGET_TYPES.has(normalized)) {
    return 'button'
  }
  if (SELECTION_WIDGET_TYPES.has(normalized)) {
    return 'selection'
  }
  if (CALENDAR_WIDGET_TYPES.has(normalized)) {
    return 'overlay'
  }
  if (TEXT_WIDGET_TYPES.has(normalized)) {
    return 'text'
  }
  if (NAVIGATION_WIDGET_TYPES.has(normalized)) {
    return 'selection'
  }
  return 'surface'
}

const BASE_STYLE_FALLBACKS: Record<string, WidgetStyleFallbackToken> = {
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
  styleRadius: '--radius',
  styleFontSans: '--font-sans',
  styleFontMono: '--font-mono',
}

const INPUT_STYLE_FALLBACKS: Record<string, WidgetStyleFallbackToken> = {
  accentColor: '--primary',
  baseTextColor: '--foreground',
  fontFamily: '--font-sans',
  hoverBackground: '--muted',
  inputBorderRadius: '--radius',
  inputBackground: '--background',
  inputPlaceholderColor: '--muted',
  inputTextColor: '--foreground',
  placeholderColor: '--muted',
  labelTextColor: '--foreground',
  labelCaptionColor: '--muted-foreground',
  labelRequiredIndicatorColor: '--destructive',
}

const SELECTION_STYLE_FALLBACKS: Record<string, WidgetStyleFallbackToken> = {
  textColor: '--foreground',
  activeTextColor: '--foreground',
  activeBackground: '--primary',
  hoverBackground: '--muted',
  iconColor: '--muted-foreground',
  activeIconColor: '--primary',
  itemBorderRadius: '--radius',
}

const BUTTON_STYLE_FALLBACKS: Record<string, WidgetStyleFallbackToken> = {
  color: '--foreground',
  textColor: '--foreground',
  accentColor: '--primary',
}

const inferFallbackTokenByFieldKey = (
  fieldKeyRaw: string
): WidgetStyleFallbackToken | undefined => {
  const key = fieldKeyRaw.trim().toLowerCase()
  if (!key) {
    return undefined
  }
  if (key.includes('font')) {
    return '--font-sans'
  }
  if (key.includes('radius')) {
    return '--radius'
  }
  if (key.includes('placeholder')) {
    return '--muted'
  }
  if (key.includes('activebackground')) {
    return '--primary'
  }
  if (key.includes('activetext')) {
    return '--foreground'
  }
  if (key.includes('activeicon')) {
    return '--primary'
  }
  if (key.includes('hover') && key.includes('background')) {
    return '--muted'
  }
  if (key.includes('icon') && key.includes('color')) {
    return '--muted-foreground'
  }
  if (key.includes('accent')) {
    return '--primary'
  }
  if (key.includes('border')) {
    return '--border'
  }
  if (key.includes('background')) {
    return '--background'
  }
  if (key.includes('text') || key === 'color') {
    return '--foreground'
  }
  return undefined
}

export const resolveGlobalWidgetStyleFieldKeys = (
  widgetType: string,
  hasDedicatedStyles: boolean
): readonly GlobalWidgetStyleFieldKey[] => {
  if (hasDedicatedStyles) {
    return []
  }
  const profile = resolveWidgetStyleProfile(widgetType)
  return STYLE_PROFILES[profile]
}

export const resolveGlobalWidgetStyleFieldOverrides = (
  widgetType: string,
  hasDedicatedStyles: boolean
): Record<string, Partial<WidgetField>> => {
  const keys = resolveGlobalWidgetStyleFieldKeys(widgetType, hasDedicatedStyles)
  if (keys.length === 0) {
    return {}
  }
  const profile = resolveWidgetStyleProfile(widgetType)
  const labelOverrides = PROFILE_LABEL_OVERRIDES[profile]
  return keys.reduce<Record<string, Partial<WidgetField>>>((acc, key) => {
    const label = labelOverrides[key]
    if (!label) {
      return acc
    }
    acc[key] = { label }
    return acc
  }, {})
}

export const resolveWidgetStyleFallbackToken = (
  widgetType: string,
  fieldKey: string
): WidgetStyleFallbackToken | undefined => {
  const family = resolveWidgetStyleFamily(widgetType)
  const inferred = inferFallbackTokenByFieldKey(fieldKey)
  if (family === 'input') {
    return INPUT_STYLE_FALLBACKS[fieldKey] ?? BASE_STYLE_FALLBACKS[fieldKey] ?? inferred
  }
  if (family === 'selection') {
    return SELECTION_STYLE_FALLBACKS[fieldKey] ?? BASE_STYLE_FALLBACKS[fieldKey] ?? inferred
  }
  if (family === 'button') {
    return BUTTON_STYLE_FALLBACKS[fieldKey] ?? BASE_STYLE_FALLBACKS[fieldKey] ?? inferred
  }
  return BASE_STYLE_FALLBACKS[fieldKey] ?? inferred
}
