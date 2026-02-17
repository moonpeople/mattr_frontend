/**
 * Набор field-контролов inspector: сопоставляет тип поля с конкретным UI-контролом.
 */
import { useState, type ReactNode } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  CreditCard,
  Download,
  Eye,
  EyeOff,
  Mic,
  Minus,
  PencilLine,
  Phone,
  Plus,
  Search,
  Send,
  Settings,
  Star,
  User,
  X,
} from 'lucide-react'

import type { WidgetField } from 'widgets/runtime'
import { resolveValue } from 'lib/builder/value-resolver'
import CodeEditor, { type CodeEditorContentSize } from 'components/ui/CodeEditor/CodeEditor'
import {
  Input_Shadcn_,
  Checkbox_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  Select_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  TabsContent_Shadcn_,
  TabsList_Shadcn_,
  TabsTrigger_Shadcn_,
  Tabs_Shadcn_,
  Switch,
  Textarea,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
} from 'ui'

import { ColorInput } from '../../../components/ColorInput'
import {
  FX_BASE_CONTEXT,
  FxInput,
} from '../../../components'
import {
  CollectionItemsFieldControl,
  shouldUseCollectionItemsEditor,
} from '../../features/collection-items'
import {
  TableColumnsFieldControl,
  shouldUseTableColumnsEditor,
} from '../../features/table-columns'
import {
  buildFxInlineHint,
  fieldAllowsFx,
  isFxValue,
  isTemplateValueField,
  toFxExpression,
} from '../../model'
import type {
  InspectorPanel,
  StyleFieldFallback,
} from '../../model'
import { SegmentedRadioGroup } from '../../shared'
import type {
  ColorTokenOption,
  TypographyTokenOption,
} from 'state/app-theme-state'

export type FxCompletionMetadata = Record<
  string,
  { kind?: string; detail?: string; documentation?: string; appendDot?: boolean }
>

export const BOOLEAN_CHECKBOX_FIELDS = new Set([
  'showClearButton',
  'labelHide',
  'labelWrap',
  'showSeparators',
  'showClear',
  'showStepper',
  'hideValidationMessage',
  'showPasswordToggle',
  'maintainSpaceWhenHidden',
  'alwaysShowInEditMode',
  'showOnDesktop',
  'showOnMobile',
  'padDecimal',
  'preventScroll',
])

export const ICON_PICKER_FIELDS = new Set([
  'prefixIcon',
  'suffixIcon',
  'iconBefore',
  'iconAfter',
  'editIcon',
])

const ICON_COMPONENTS: Record<string, typeof Search> = {
  edit: PencilLine,
  star: Star,
  alert: AlertTriangle,
  user: User,
  settings: Settings,
  check: Check,
  search: Search,
  arrowRight: ArrowRight,
  download: Download,
  send: Send,
  eye: Eye,
  eyeOff: EyeOff,
  mic: Mic,
  calendar: Calendar,
  phone: Phone,
  creditCard: CreditCard,
  chevronDown: ChevronDown,
  chevronUp: ChevronUp,
  plus: Plus,
  minus: Minus,
  x: X,
  copy: Copy,
}

const isTemplateStringField = (field: WidgetField) =>
  fieldAllowsFx(field) && field.type === 'text'

const INLINE_FX_LABEL_LIMIT = 20

const isHexColor = (value: string) =>
  /^[0-9a-fA-F]{3}$/.test(value) || /^[0-9a-fA-F]{6}$/.test(value)

const normalizeColorValue = (value: unknown) => {
  const raw = typeof value === 'string' ? value.trim() : ''
  if (!raw) {
    return ''
  }
  if (raw.startsWith('#')) {
    return raw
  }
  if (isHexColor(raw)) {
    return `#${raw}`
  }
  return raw
}

export const resolveIconComponent = (value?: string) => {
  if (!value) {
    return null
  }
  const normalized = value.trim()
  if (!normalized || normalized === 'none') {
    return null
  }
  return ICON_COMPONENTS[normalized] ?? null
}

export const resolveColorSwatch = (value: unknown) => {
  const normalized = normalizeColorValue(value)
  if (!normalized) {
    return 'transparent'
  }
  return normalized
}

export const formatColorDisplayValue = (value: unknown) => {
  const normalized = normalizeColorValue(value)
  if (!normalized) {
    return ''
  }
  return normalized.startsWith('#') ? normalized.slice(1).toUpperCase() : normalized
}

export const shouldStackField = (
  field: WidgetField,
  value: unknown,
  _fxMode?: boolean,
  _inlineOverflow?: boolean
) => {
  if (field.type === 'boolean' && field.supportsFx && isFxValue(value)) {
    return true
  }
  if (!isTemplateStringField(field)) {
    return false
  }
  if (typeof value !== 'string') {
    return false
  }
  if (value.length > INLINE_FX_LABEL_LIMIT) {
    return true
  }
  return value.includes('\n')
}

export const shouldTopAlignField = (field: WidgetField, value: unknown) =>
  field.type === 'textarea' ||
  field.type === 'json' ||
  (isTemplateStringField(field) && isFxValue(value))

const ColorFieldControl = ({
  field,
  value,
  onChange,
  tokenOptions,
  fallbackLabel,
  fallbackSwatch,
  disabled = false,
}: {
  field: WidgetField
  value: unknown
  onChange: (patch: Record<string, unknown>) => void
  tokenOptions: ColorTokenOption[]
  fallbackLabel?: string
  fallbackSwatch?: string
  disabled?: boolean
}) => {
  const normalizedValue = normalizeColorValue(value)
  const normalizedValueLower = normalizedValue.toLowerCase()
  const matchesTokenValue = (token: ColorTokenOption) => {
    if (token.value.toLowerCase() === normalizedValueLower) {
      return true
    }
    if (token.preview) {
      return normalizeColorValue(token.preview).toLowerCase() === normalizedValueLower
    }
    if (token.aliases?.length) {
      return token.aliases.some(
        (alias) => normalizeColorValue(alias).toLowerCase() === normalizedValueLower
      )
    }
    return false
  }
  const matchedToken = tokenOptions.find(matchesTokenValue)
  const displayValue = matchedToken?.label ?? formatColorDisplayValue(value)
  const swatch = matchedToken?.preview ?? resolveColorSwatch(value)
  const isTokenSelected = Boolean(matchedToken)
  const hasTokens = tokenOptions.length > 0
  const customValue = matchedToken?.preview ?? (typeof value === 'string' ? value : '')

  const hasValue = Boolean(normalizedValue)
  const effectiveLabel = hasValue ? displayValue : fallbackLabel ?? 'None'
  const effectiveSwatch = hasValue ? swatch : fallbackSwatch ?? swatch
  const labelMuted =
    !hasValue &&
    (effectiveLabel === 'None' || effectiveLabel === 'Default' || effectiveLabel === 'Generated')

  return (
    <Popover_Shadcn_>
      <PopoverTrigger_Shadcn_ asChild>
        <button
          type="button"
          className={`flex h-7 w-full items-center gap-2 rounded-md bg-background px-2 text-[11px] hover:bg-surface-200 active:bg-surface-200 ${
            disabled ? 'pointer-events-none opacity-60' : ''
          }`}
        >
          <span className="h-4 w-4 rounded" style={{ backgroundColor: effectiveSwatch }} />
          <span className={labelMuted ? 'text-foreground-muted' : 'text-foreground'}>
            {effectiveLabel}
          </span>
        </button>
      </PopoverTrigger_Shadcn_>
      <PopoverContent_Shadcn_ className="w-64 p-3" align="end">
        <Tabs_Shadcn_ defaultValue={isTokenSelected ? 'tokens' : 'custom'}>
          <TabsList_Shadcn_ className="w-full justify-start gap-4 border-b border-foreground-muted/20 bg-transparent px-0">
            <TabsTrigger_Shadcn_ value="custom" className="px-0 text-xs">
              Custom
            </TabsTrigger_Shadcn_>
            <TabsTrigger_Shadcn_ value="tokens" className="px-0 text-xs" disabled={!hasTokens}>
              Tokens
            </TabsTrigger_Shadcn_>
          </TabsList_Shadcn_>
          <TabsContent_Shadcn_ value="custom" className="mt-3 space-y-3">
            <ColorInput
              value={customValue}
              onChange={(next) => onChange({ [field.key]: next })}
              placeholder={fallbackSwatch}
              disabled={disabled}
              pickerMode="inline"
            />
          </TabsContent_Shadcn_>
          <TabsContent_Shadcn_ value="tokens" className="mt-3">
            <div className="space-y-1">
              {hasTokens ? (
                tokenOptions.map((token) => {
                  const previewValue = token.preview ?? token.value
                  const active = matchesTokenValue(token)
                  const tokenDisplayValue =
                    token.displayValue ??
                    (token.value.startsWith('#')
                      ? token.value.replace('#', '').toUpperCase()
                      : token.value)
                  return (
                    <button
                      key={token.label}
                      type="button"
                      className={`flex w-full items-center gap-2 rounded-sm px-2 py-1 text-xs ${
                        active
                          ? 'bg-surface-200 text-foreground'
                          : 'text-foreground-muted hover:bg-surface-200 hover:text-foreground'
                      }`}
                      onClick={() => onChange({ [field.key]: token.value })}
                    >
                      <span
                        className="h-4 w-4 rounded border border-foreground-muted/40"
                        style={{ backgroundColor: previewValue }}
                      />
                      <span>{token.label}</span>
                      <span className="ml-auto text-[11px] text-foreground-muted">
                        {tokenDisplayValue}
                      </span>
                    </button>
                  )
                })
              ) : (
                <div className="px-2 py-1 text-xs text-foreground-muted">No tokens</div>
              )}
            </div>
          </TabsContent_Shadcn_>
        </Tabs_Shadcn_>
      </PopoverContent_Shadcn_>
    </Popover_Shadcn_>
  )
}

export const getTypographyBadge = (label: string) => {
  const trimmed = label.trim()
  const headingMatch = trimmed.match(/heading\\s*(\\d+)/i)
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

const TYPOGRAPHY_FONT_OPTIONS = [
  { label: 'Component set default', value: 'default' },
  { label: 'Inter', value: 'inter' },
  { label: 'Open Sans', value: 'open-sans' },
  { label: 'Roboto', value: 'roboto' },
  { label: 'Noto Sans', value: 'noto-sans' },
  { label: 'Raleway', value: 'raleway' },
  { label: 'Geist', value: 'geist' },
  { label: 'Figtree', value: 'figtree' },
]

const resolveTypographyFontKey = (family: string) => {
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
  if (normalized.includes('--font-geist') || normalized.startsWith('geist')) {
    return 'geist'
  }
  if (normalized.includes('--font-figtree') || normalized.startsWith('figtree')) {
    return 'figtree'
  }
  return 'default'
}

const resolveTypographyFontLabel = (family: string) => {
  const key = resolveTypographyFontKey(family)
  const option = TYPOGRAPHY_FONT_OPTIONS.find((item) => item.value === key)
  return option?.label ?? 'Default'
}

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

const formatTypographyDetail = (value: string) => {
  const parsed = parseTypographyValue(value)
  if (!parsed) {
    return value
  }
  const label = resolveTypographyFontLabel(parsed.fontFamily)
  return `${label} ${parsed.fontWeight} ${parsed.fontSize}`
}

const TypographyFieldControl = ({
  field,
  value,
  onChange,
  tokenOptions,
  fallbackLabel,
  disabled = false,
}: {
  field: WidgetField
  value: unknown
  onChange: (patch: Record<string, unknown>) => void
  tokenOptions: TypographyTokenOption[]
  fallbackLabel?: string
  disabled?: boolean
}) => {
  const [open, setOpen] = useState(false)
  const rawValue = typeof value === 'string' ? value.trim() : ''
  const normalizedValue = rawValue || 'default'
  const selectedToken =
    tokenOptions.find((token) => token.value === rawValue) ??
    tokenOptions.find((token) => token.displayValue === rawValue)
  const displayLabel = selectedToken?.label ?? (normalizedValue !== 'default' ? normalizedValue : 'Default')
  const hasTokens = tokenOptions.length > 0
  const isDefault = normalizedValue === 'default'
  const effectiveLabel = isDefault && fallbackLabel ? fallbackLabel : displayLabel
  const labelMuted = !fallbackLabel && displayLabel === 'Default'

  return (
    <Popover_Shadcn_ open={open} onOpenChange={setOpen}>
      <PopoverTrigger_Shadcn_ asChild>
        <button
          type="button"
          className={`flex h-7 w-full items-center justify-between rounded-md border border-control bg-background px-2 text-[11px] ${
            disabled ? 'pointer-events-none opacity-60' : ''
          }`}
        >
          <span className={labelMuted ? 'text-foreground-muted' : 'text-foreground'}>
            {effectiveLabel || 'Default'}
          </span>
        </button>
      </PopoverTrigger_Shadcn_>
      <PopoverContent_Shadcn_ className="w-72 p-2" align="start">
        <div className="flex items-center justify-between px-1 pb-2 text-xs font-medium text-foreground">
          <span>Typography</span>
          <button
            type="button"
            className="rounded p-1 text-foreground-muted hover:bg-surface-200 hover:text-foreground"
            onClick={() => setOpen(false)}
          >
            <X size={12} />
          </button>
        </div>
        <div className="max-h-64 space-y-1 overflow-y-auto">
          <button
            type="button"
            className={`flex w-full items-center gap-3 rounded-sm px-2 py-1 text-xs ${
              normalizedValue === 'default'
                ? 'bg-surface-200 text-foreground'
                : 'text-foreground-muted hover:bg-surface-200 hover:text-foreground'
            }`}
            onClick={() => {
              onChange({ [field.key]: 'default' })
              setOpen(false)
            }}
          >
            <span className="w-6 text-[11px] text-foreground-muted">D</span>
            <span className="flex-1 text-left">Default</span>
          </button>
          {hasTokens ? (
            tokenOptions.map((token) => {
              const active = token.value === rawValue
              const detail = formatTypographyDetail(token.displayValue ?? token.value)
              return (
                <button
                  key={token.label}
                  type="button"
                  className={`flex w-full items-center gap-3 rounded-sm px-2 py-1 text-xs ${
                    active
                      ? 'bg-surface-200 text-foreground'
                      : 'text-foreground-muted hover:bg-surface-200 hover:text-foreground'
                  }`}
                  onClick={() => {
                    onChange({ [field.key]: token.value })
                    setOpen(false)
                  }}
                >
                  <span className="w-6 text-[11px] text-foreground-muted">
                    {getTypographyBadge(token.label)}
                  </span>
                  <span className="flex-1 text-left">{token.label}</span>
                  <span className="text-[11px] font-mono text-foreground-muted">
                    {detail}
                  </span>
                </button>
              )
            })
          ) : (
            <div className="px-2 py-1 text-xs text-foreground-muted">No typography tokens</div>
          )}
        </div>
      </PopoverContent_Shadcn_>
    </Popover_Shadcn_>
  )
}

const IconPickerFieldControl = ({
  field,
  value,
  onChange,
  disabled = false,
}: {
  field: WidgetField
  value: unknown
  onChange: (patch: Record<string, unknown>) => void
  disabled?: boolean
}) => {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const rawValue = typeof value === 'string' ? value.trim() : ''
  const options = field.type === 'select' ? field.options : []
  const filteredOptions = options.filter((option) => {
    if (!query.trim()) {
      return true
    }
    const needle = query.trim().toLowerCase()
    return option.label.toLowerCase().includes(needle) || option.value.toLowerCase().includes(needle)
  })
  const selectedOption = options.find((option) => option.value === rawValue)
  const SelectedIcon = resolveIconComponent(rawValue)
  const displayLabel = selectedOption?.label ?? (rawValue ? rawValue : 'Select an icon')
  const showClear = Boolean(rawValue)

  return (
    <div className="flex items-center gap-1">
      <Popover_Shadcn_ open={open} onOpenChange={setOpen}>
        <PopoverTrigger_Shadcn_ asChild>
          <div
            role="button"
            tabIndex={disabled ? -1 : 0}
            className={`flex h-6 w-full items-center justify-between rounded-md border border-control bg-background px-2 text-[11px] ${
              disabled ? 'pointer-events-none opacity-60' : 'cursor-pointer'
            }`}
          >
            <span
              className={`flex min-w-0 items-center gap-2 ${
                displayLabel ? 'text-foreground' : 'text-foreground-muted'
              }`}
            >
              {SelectedIcon ? (
                <SelectedIcon size={12} className="text-foreground-muted" />
              ) : (
                <span className="h-3 w-3" />
              )}
              <span className="truncate">{displayLabel || 'Select an icon'}</span>
            </span>
            {showClear && (
              <span
                role="button"
                tabIndex={0}
                className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded text-foreground-muted hover:text-foreground"
                onMouseDown={(event) => event.preventDefault()}
                onClick={(event) => {
                  event.stopPropagation()
                  onChange({ [field.key]: '' })
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    event.stopPropagation()
                    onChange({ [field.key]: '' })
                  }
                }}
                aria-label={`Clear ${field.label}`}
              >
                <X size={12} />
              </span>
            )}
          </div>
        </PopoverTrigger_Shadcn_>
        <PopoverContent_Shadcn_ className="w-80 p-2" align="start">
          <div className="flex items-center justify-between px-1 pb-2 text-xs font-medium text-foreground">
            <span>Select icon</span>
            <button
              type="button"
              className="rounded p-1 text-foreground-muted hover:bg-surface-200 hover:text-foreground"
              onClick={() => setOpen(false)}
            >
              <X size={12} />
            </button>
          </div>
          <div className="relative px-1 pb-2">
            <Search
              size={12}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted"
            />
            <Input_Shadcn_
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name"
              className="h-7 pl-7 text-xs"
            />
          </div>
          <div className="grid max-h-64 grid-cols-8 gap-2 overflow-y-auto px-1 pb-1">
            {filteredOptions.length === 0 ? (
              <div className="col-span-8 px-2 py-2 text-xs text-foreground-muted">
                No icons found
              </div>
            ) : (
              filteredOptions.map((option) => {
                const Icon = resolveIconComponent(option.value)
                const isActive = option.value === rawValue
                return (
                  <button
                    key={option.value}
                    type="button"
                    className={`flex h-8 w-8 items-center justify-center rounded-md border ${
                      isActive
                        ? 'border-brand-500 bg-brand-500/10 text-foreground'
                        : 'border-transparent text-foreground-muted hover:bg-surface-200 hover:text-foreground'
                    }`}
                    onClick={() => {
                      onChange({
                        [field.key]: option.value === 'none' ? '' : option.value,
                      })
                      setOpen(false)
                    }}
                  >
                    {Icon ? (
                      <Icon size={16} />
                    ) : (
                      <span className="text-[10px] font-semibold">
                        {option.label.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </button>
                )
              })
            )}
          </div>
        </PopoverContent_Shadcn_>
      </Popover_Shadcn_>
    </div>
  )
}

const resolveSegmentedFxControlValue = (
  raw: unknown,
  fallbackMode: string
): { mode: string; fxEnabled: boolean; fx: string } => {
  if (raw && typeof raw === 'object') {
    const value = raw as { mode?: unknown; fxEnabled?: unknown; fx?: unknown }
    return {
      mode: typeof value.mode === 'string' && value.mode ? value.mode : fallbackMode,
      fxEnabled: Boolean(value.fxEnabled),
      fx: typeof value.fx === 'string' ? value.fx : '',
    }
  }
  if (typeof raw === 'string' && raw) {
    return { mode: raw, fxEnabled: false, fx: '' }
  }
  return { mode: fallbackMode, fxEnabled: false, fx: '' }
}

const buildSegmentedFxField = (field: WidgetField) => {
  const config = field.segmentedFx
  return {
    key: config?.fxKey ?? `${field.key}Fx`,
    label: field.label,
    type: 'text',
    placeholder: config?.fxPlaceholder ?? '',
    supportsFx: true,
    valueType: field.valueType ?? ['string', 'void'],
    source: field.source,
  } as WidgetField
}

const SegmentedFxFieldControl = ({
  field,
  value,
  onChange,
}: {
  field: WidgetField
  value: unknown
  onChange: (patch: Record<string, unknown>) => void
}) => {
  const config = field.segmentedFx
  const fallbackMode = config?.defaultMode ?? ''
  const { mode, fxEnabled, fx } = resolveSegmentedFxControlValue(value, fallbackMode)
  const options = field.type === 'radioGroup' || field.type === 'select' ? field.options : []
  const fxField = buildSegmentedFxField(field)

  const handleFxToggle = () => {
    if (!config) {
      return
    }
    if (fxEnabled) {
      onChange({ [config.fxEnabledKey]: false })
      return
    }
    const nextPatch: Record<string, unknown> = { [config.fxEnabledKey]: true }
    if (config.defaultFxValue) {
      nextPatch[config.fxKey] = fx.trim().length > 0 ? fx : config.defaultFxValue
    }
    onChange(nextPatch)
  }

  const handleModeChange = (next: string) => {
    if (!next || !config) {
      return
    }
    onChange({ [config.modeKey]: next })
  }

  return (
    <div className="flex w-full items-center gap-2">
      <button
        type="button"
        className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase transition-colors ${
          fxEnabled
            ? 'bg-foreground/10 text-foreground'
            : 'text-foreground-muted hover:bg-foreground/10 hover:text-foreground'
        }`}
        onClick={handleFxToggle}
      >
        fx
      </button>
      {fxEnabled ? (
        <div className="min-w-0 flex-1">
          <Input_Shadcn_
            value={fx}
            onChange={(event) => onChange({ [fxField.key]: event.target.value })}
            placeholder={'placeholder' in fxField ? fxField.placeholder : undefined}
            className="h-6 w-full"
          />
        </div>
      ) : (
        <div className="min-w-0 flex-1">
          <SegmentedRadioGroup options={options} value={mode} onValueChange={handleModeChange} />
        </div>
      )}
    </div>
  )
}

const renderStaticControl = (
  field: WidgetField,
  value: unknown,
  onChange: (patch: Record<string, unknown>) => void,
  editorId: string,
  disabled = false,
  inputClassName?: string,
  colorTokenOptions: ColorTokenOption[] = [],
  typographyTokenOptions: TypographyTokenOption[] = [],
  styleFallback?: StyleFieldFallback | null,
  widgetProps?: Record<string, unknown>,
  evaluationContext?: Record<string, unknown>,
  activeInspectorPanel?: InspectorPanel | null,
  onActiveInspectorPanelChange?: (panel: InspectorPanel | null) => void
) => {
  const fieldValue = value ?? ''

  const resolvePrimaryKeyOptions = () => {
    if (field.key !== 'primaryKey') {
      return field.type === 'select' ? field.options : []
    }

    const rawData = widgetProps?.data
    let candidate: unknown = rawData

    if (typeof rawData === 'string') {
      const trimmed = rawData.trim()
      if (trimmed.includes('{{') && trimmed.includes('}}')) {
        candidate = resolveValue(trimmed, evaluationContext ?? FX_BASE_CONTEXT)
      } else if (trimmed) {
        try {
          candidate = JSON.parse(trimmed)
        } catch {
          candidate = []
        }
      } else {
        candidate = []
      }
    }

    const rows = Array.isArray(candidate)
      ? candidate.filter((row) => Boolean(row) && typeof row === 'object')
      : []

    if (rows.length === 0) {
      return []
    }

    const keySet = new Set<string>()
    rows.slice(0, 100).forEach((row) => {
      Object.keys(row as Record<string, unknown>).forEach((key) => keySet.add(key))
    })

    return Array.from(keySet).map((key) => ({ label: key, value: key }))
  }

  if (field.control === 'typography') {
    return (
      <TypographyFieldControl
        field={field}
        value={fieldValue}
        onChange={onChange}
        tokenOptions={typographyTokenOptions}
        fallbackLabel={styleFallback?.kind === 'typography' ? styleFallback.label : undefined}
        disabled={disabled}
      />
    )
  }

  if (field.type === 'radioGroup') {
    const selectedValue =
      typeof fieldValue === 'string' && fieldValue !== '' ? fieldValue : field.options[0]?.value ?? ''
    return (
      <SegmentedRadioGroup
        options={field.options}
        value={selectedValue}
        onValueChange={(next) => onChange({ [field.key]: next })}
        disabled={disabled}
      />
    )
  }

  if (field.type === 'select') {
    const selectOptions = resolvePrimaryKeyOptions()
    if (ICON_PICKER_FIELDS.has(field.key)) {
      return (
        <IconPickerFieldControl
          field={field}
          value={fieldValue}
          onChange={onChange}
          disabled={disabled}
        />
      )
    }
    return (
      <Select_Shadcn_
        value={String(fieldValue || '')}
        onValueChange={(next) => onChange({ [field.key]: next })}
        disabled={disabled}
      >
        <SelectTrigger_Shadcn_
          className={inputClassName ? `h-6 w-full ${inputClassName}` : 'h-6 w-full'}
        >
          <SelectValue_Shadcn_ placeholder={field.label} />
        </SelectTrigger_Shadcn_>
        <SelectContent_Shadcn_>
          {selectOptions.map((option) => (
            <SelectItem_Shadcn_ key={option.value} value={option.value}>
              {option.label}
            </SelectItem_Shadcn_>
          ))}
        </SelectContent_Shadcn_>
      </Select_Shadcn_>
    )
  }

  if (field.type === 'textarea') {
    return (
      <Textarea
        value={String(fieldValue)}
        onChange={(event) => onChange({ [field.key]: event.target.value })}
        placeholder={field.placeholder}
        className={inputClassName}
        disabled={disabled}
      />
    )
  }

  if (field.type === 'json') {
    if (shouldUseCollectionItemsEditor(field, widgetProps)) {
      return (
        <CollectionItemsFieldControl
          field={field}
          value={fieldValue}
          onChange={onChange}
          disabled={disabled}
          widgetProps={widgetProps}
          evaluationContext={evaluationContext}
        />
      )
    }
    if (shouldUseTableColumnsEditor(field, widgetProps)) {
      return (
        <TableColumnsFieldControl
          field={field}
          value={fieldValue}
          onChange={onChange}
          disabled={disabled}
          widgetProps={widgetProps}
          evaluationContext={evaluationContext}
          activePanel={activeInspectorPanel}
          onPanelChange={onActiveInspectorPanelChange}
        />
      )
    }

    const displayValue =
      typeof fieldValue === 'string' ? fieldValue : JSON.stringify(fieldValue ?? {}, null, 2)

    return (
      <CodeEditor
        id={`${editorId}-${field.key}`}
        language="json"
        value={displayValue}
        onInputChange={(nextValue) => onChange({ [field.key]: nextValue ?? '' })}
        className={inputClassName ? `min-h-[140px] ${inputClassName}` : 'min-h-[140px]'}
        isReadOnly={disabled}
        placeholder={field.placeholder}
        options={{
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          lineNumbersMinChars: 3,
        }}
      />
    )
  }

  if (field.type === 'color') {
    return (
      <ColorFieldControl
        field={field}
        value={fieldValue}
        onChange={onChange}
        tokenOptions={colorTokenOptions}
        fallbackLabel={styleFallback?.kind === 'color' ? styleFallback.label : undefined}
        fallbackSwatch={styleFallback?.kind === 'color' ? styleFallback.swatch : undefined}
        disabled={disabled}
      />
    )
  }

  if (field.type === 'number') {
    return (
      <Input_Shadcn_
        type="number"
        value={
          fieldValue === '' || fieldValue === null || typeof fieldValue === 'undefined'
            ? ''
            : Number(fieldValue)
        }
        onChange={(event) => {
          const next = event.target.value
          onChange({ [field.key]: next === '' ? '' : Number(next) })
        }}
        placeholder={field.placeholder}
        className={inputClassName ? `h-6 ${inputClassName}` : 'h-6'}
        min={field.min}
        max={field.max}
        step={field.step}
        disabled={disabled}
      />
    )
  }

  if (field.type === 'boolean') {
    if (BOOLEAN_CHECKBOX_FIELDS.has(field.key)) {
      return (
        <Checkbox_Shadcn_
          checked={Boolean(fieldValue)}
          onCheckedChange={(checked) => onChange({ [field.key]: Boolean(checked) })}
        />
      )
    }
    return (
      <Switch
        checked={Boolean(fieldValue)}
        onCheckedChange={(checked) => onChange({ [field.key]: checked })}
        size={'small'}
        disabled={disabled}
      />
    )
  }

  return (
    <Input_Shadcn_
      size={'tiny'}
      value={String(fieldValue)}
      onChange={(event) => onChange({ [field.key]: event.target.value })}
      placeholder={field.placeholder}
      className={inputClassName ? `h-6 ${inputClassName}` : 'h-6'}
      disabled={disabled}
    />
  )
}

export type InspectorControlRuntime = {
  onFxClick?: (
    field: WidgetField,
    value: unknown,
    editorId: string,
    onChange?: (value: string) => void
  ) => void
  onToggleFxMode?: (field: WidgetField, value: unknown) => void
  onInlineEditorSize?: (fieldKey: string, metrics: CodeEditorContentSize) => void
  fxEditorLibs?: string[]
  fxEvalContext?: Record<string, unknown>
  fxCompletionWords?: string[]
  fxCompletionMetadata?: FxCompletionMetadata
  colorTokenOptions?: ColorTokenOption[]
  typographyTokenOptions?: TypographyTokenOption[]
  activeInspectorPanel?: InspectorPanel | null
  onActiveInspectorPanelChange?: (panel: InspectorPanel | null) => void
}

export type RenderFieldControlArgs = {
  field: WidgetField
  value: unknown
  onChange: (patch: Record<string, unknown>) => void
  editorId: string
  forceFxMode?: boolean
  styleFallback?: StyleFieldFallback | null
  runtime?: InspectorControlRuntime
}

export type RenderFieldControl = (args: RenderFieldControlArgs) => ReactNode

export const renderFieldControl: RenderFieldControl = ({
  field,
  value,
  onChange,
  editorId,
  forceFxMode,
  styleFallback,
  runtime,
}): ReactNode => {
  const {
    onFxClick,
    onToggleFxMode,
    onInlineEditorSize,
    fxEditorLibs,
    fxEvalContext,
    fxCompletionWords,
    fxCompletionMetadata,
    colorTokenOptions = [],
    typographyTokenOptions = [],
    activeInspectorPanel,
    onActiveInspectorPanelChange,
  } = runtime ?? {}

  if (field.type === 'radioGroup' && field.segmentedFx) {
    return <SegmentedFxFieldControl field={field} value={value} onChange={onChange} />
  }
  const supportsFx = fieldAllowsFx(field)
  const isFxEnabled = supportsFx && isFxValue(value)
  const isFxDraftValue = supportsFx && typeof value === 'string' && (value.includes('{{') || value.includes('}}'))
  const isFxActive = isFxEnabled || isFxDraftValue || Boolean(forceFxMode)
  const isMultiline = field.type === 'textarea' || field.type === 'json'
  const isInlineCodeEditorField = isTemplateStringField(field)
  const useInlineFx =
    supportsFx && ['text', 'number', 'textarea', 'json', 'select', 'boolean'].includes(field.type)
  const iconOptions =
    field.type === 'select' && ICON_PICKER_FIELDS.has(field.key) ? field.options : undefined
  const renderIcon = iconOptions
    ? (iconValue: string) => {
        const Icon = resolveIconComponent(iconValue)
        return Icon ? <Icon size={16} className="text-foreground-muted" /> : null
      }
    : undefined

  const handleFxClick = () => {
    if (!supportsFx) {
      return
    }
    const allowTemplate = isTemplateValueField(field)
    const expression = allowTemplate ? String(value ?? '') : isFxEnabled ? value : toFxExpression(field, value)
    if (!isFxEnabled && !allowTemplate) {
      onChange({ [field.key]: expression })
    }
    onFxClick?.(field, expression, editorId)
  }

  const control = renderStaticControl(
    field,
    value,
    onChange,
    editorId,
    isFxActive,
    useInlineFx ? 'pr-8' : undefined,
    colorTokenOptions,
    typographyTokenOptions,
    styleFallback,
    (fxEvalContext?.self as Record<string, unknown> | undefined) ?? fxEvalContext,
    fxEvalContext,
    activeInspectorPanel,
    onActiveInspectorPanelChange
  )
  const inlineControl =
    useInlineFx && field.type === 'boolean' ? (
      <div className="flex justify-end pr-8">{control}</div>
    ) : (
      control
    )

  if (!supportsFx) {
    if (field.type === 'boolean') {
      return <div className="flex justify-end">{control}</div>
    }
    return control
  }

  const hintExpression =
    field.type === 'boolean'
      ? buildFxInlineHint(field, value, 'expression', fxEvalContext ?? FX_BASE_CONTEXT)
      : undefined
  const hintTemplate = isInlineCodeEditorField
    ? buildFxInlineHint(field, value, 'template', fxEvalContext ?? FX_BASE_CONTEXT)
    : undefined

  return (
    <FxInput
      field={field}
      value={value}
      editorId={editorId}
      control={control}
      inlineControl={inlineControl}
      isFxEnabled={isFxEnabled}
      isFxActive={isFxActive}
      isInlineCodeEditorField={isInlineCodeEditorField}
      useInlineFx={useInlineFx}
      isMultiline={isMultiline}
      onChange={onChange}
      onFxClick={handleFxClick}
      onToggleFxMode={onToggleFxMode}
      onInlineEditorSize={onInlineEditorSize}
      fxEditorLibs={fxEditorLibs}
      fxEvalContext={fxEvalContext}
      fxCompletionWords={fxCompletionWords}
      fxCompletionMetadata={fxCompletionMetadata}
      iconOptions={iconOptions}
      renderIcon={renderIcon}
      hintExpression={hintExpression}
      hintTemplate={hintTemplate}
    />
  )
}
