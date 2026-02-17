import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { cn } from 'ui'

import { ChevronDown, Phone as PhoneIcon } from 'lucide-react'
import PhoneInput, {
  type FlagProps as PhoneFlagProps,
  formatPhoneNumber,
  formatPhoneNumberIntl,
  isPossiblePhoneNumber,
  type Country,
  type Value as PhoneValue,
} from 'react-phone-number-input'
import flags from 'react-phone-number-input/flags'

import { Input, Tooltip, TooltipContent, TooltipTrigger } from '../shadcn'
import { normalizeString } from '../helpers'
import { createWidgetDefinition, type WidgetRenderContext } from '../types'
import { renderWidgetIcon } from '../icon-library'

export type PhoneNumberInputIcon =
  | 'none'
  | 'star'
  | 'alert'
  | 'user'
  | 'settings'
  | 'check'
  | 'edit'
  | 'search'
  | 'arrowRight'
  | 'download'
  | 'send'
  | 'eye'
  | 'eyeOff'
  | 'mic'
  | 'calendar'
  | 'phone'
  | 'creditCard'
  | 'chevronDown'
  | 'chevronUp'
  | 'plus'
  | 'minus'
  | 'x'
  | 'copy'

export type PhoneNumberInputProps = {
  label: string
  labelCaption: string
  labelHide: boolean
  labelWrap: boolean
  labelPosition: 'left' | 'top'
  labelAlign: 'left' | 'right'
  labelWidthValue: string
  labelWidthUnit: 'px' | '%' | 'col'

  placeholder: string
  value: string
  helperText: string
  tooltipText: string

  disabled: boolean
  readOnly: boolean
  required: boolean
  loading: boolean

  defaultCountry: string
  enableCountryChange: boolean
  international: boolean
  countryCallingCodeEditable: boolean
  limitMaxLength: boolean
  focusInputOnCountrySelection: boolean

  showClearButton: boolean

  customRule: string
  validationMessage: string
  hideValidationMessage: boolean

  formDataKey: string
  maintainSpaceWhenHidden: boolean
  alwaysShowInEditMode: boolean
  showOnDesktop: boolean
  showOnMobile: boolean

  accentColor: string
  baseTextColor: string
  fontFamily: string
  hoverBackground: string
  inputBorderRadius: string
  inputBackground: string
  inputPlaceholderColor: string
  inputTextColor: string
  placeholderColor: string

  events: string
}

const parseBoolean = (value: unknown, fallback = false) => {
  if (typeof value === 'boolean') {
    return value
  }
  if (typeof value === 'number') {
    return value !== 0
  }
  if (typeof value === 'string') {
    const trimmed = value.trim().toLowerCase()
    if (['true', '1', 'yes', 'y'].includes(trimmed)) {
      return true
    }
    if (['false', '0', 'no', 'n'].includes(trimmed)) {
      return false
    }
  }
  return fallback
}

const parseNumber = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : undefined
  }
  return undefined
}

const normalizeRuleExpression = (value: string) => {
  const trimmed = value.trim()
  if (!trimmed) {
    return ''
  }
  if (trimmed.startsWith('{{') && trimmed.endsWith('}}')) {
    return trimmed.slice(2, -2).trim()
  }
  return trimmed
}

const evaluateCustomRule = (rule: string, value: string) => {
  const expression = normalizeRuleExpression(rule)
  if (!expression) {
    return undefined
  }
  try {
    // eslint-disable-next-line no-new-func
    const fn = new Function('value', `return (${expression});`)
    return fn(value)
  } catch {
    return undefined
  }
}

const resolveValidation = ({
  value,
  required,
  validationMessage,
  customRule,
}: {
  value: string
  required: boolean
  validationMessage: string
  customRule: string
}) => {
  const trimmed = value.trim()
  if (required && !trimmed) {
    return { invalid: true, message: validationMessage || 'Required' }
  }
  if (!trimmed) {
    return { invalid: false, message: '' }
  }

  // `react-phone-number-input` works best with international formatting.
  // Still, treat "possible" numbers as valid and allow custom rule override.
  const possible = isPossiblePhoneNumber(trimmed)
  if (!possible) {
    return { invalid: true, message: validationMessage || 'Enter a valid phone number.' }
  }

  const customResult = evaluateCustomRule(customRule, trimmed)
  if (typeof customResult === 'string' && customResult.trim()) {
    return { invalid: true, message: customResult }
  }
  if (customResult === false) {
    return { invalid: true, message: validationMessage || 'Invalid value' }
  }

  return { invalid: false, message: '' }
}

const resolveTypography = (value: unknown) => {
  const raw = typeof value === 'string' ? value.trim() : ''
  if (!raw || raw === 'default') {
    return { className: '', style: undefined as CSSProperties | undefined }
  }
  if (raw.startsWith('token:')) {
    const tokenId = raw.slice('token:'.length).trim()
    if (!tokenId) {
      return { className: '', style: undefined as CSSProperties | undefined }
    }
    return {
      className: '',
      style: {
        fontFamily: `var(--app-typography-${tokenId}-font-family)`,
        fontWeight: `var(--app-typography-${tokenId}-font-weight)`,
        fontSize: `var(--app-typography-${tokenId}-font-size)`,
      },
    }
  }
  if (raw === 'body' || raw === 'heading') {
    return {
      className: '',
      style: {
        fontFamily:
          'var(--font-custom, Circular, custom-font, Helvetica Neue, Helvetica, Arial, sans-serif)',
      },
    }
  }
  if (raw === 'mono') {
    return {
      className: '',
      style: {
        fontFamily:
          'var(--font-source-code-pro, Source Code Pro, Office Code Pro, Menlo, monospace)',
      },
    }
  }
  const parts = raw.split(/\s+/)
  if (parts.length >= 3) {
    const size = parts[parts.length - 1]
    const weight = parts[parts.length - 2]
    if (/^\d+px$/.test(size) && /^\d+$/.test(weight)) {
      const family = parts.slice(0, -2).join(' ')
      return {
        className: '',
        style: {
          fontFamily: family || undefined,
          fontWeight: Number(weight),
          fontSize: size,
        },
      }
    }
  }
  return { className: raw, style: undefined as CSSProperties | undefined }
}

const resolveTemplateValue = (rawValue: string, context: Record<string, unknown>) => {
  const trimmed = rawValue.trim()
  if (!trimmed) {
    return rawValue
  }

  const evaluateExpression = (expression: string) => {
    try {
      // eslint-disable-next-line no-new-func
      const fn = new Function('context', `with (context) { return (${expression}); }`)
      return fn(context)
    } catch {
      return undefined
    }
  }

  if (trimmed.startsWith('{{') && trimmed.endsWith('}}')) {
    const expression = trimmed.slice(2, -2).trim()
    const evaluated = evaluateExpression(expression)
    return typeof evaluated === 'undefined' ? rawValue : evaluated
  }

  return rawValue.replace(/\{\{\s*([\s\S]+?)\s*\}\}/g, (match, expression) => {
    const evaluated = evaluateExpression(String(expression).trim())
    if (typeof evaluated === 'undefined') {
      return match
    }
    return String(evaluated)
  })
}

const guessCountryFromLocale = (): Country | undefined => {
  if (typeof navigator === 'undefined') {
    return undefined
  }
  const lang = navigator.language || ''
  const parts = lang.split('-')
  const region = parts.length > 1 ? parts[1] : ''
  if (!region || region.length !== 2) {
    return undefined
  }
  return region.toUpperCase() as Country
}

const PhoneNumberInputRenderer = ({
  props,
  context,
}: {
  props: PhoneNumberInputProps
  context?: WidgetRenderContext
}) => {
  const [isFocused, setIsFocused] = useState(false)

  const evaluationContext = context?.evaluationContext
  const resolveTemplateProp = (propValue: unknown) =>
    evaluationContext && typeof propValue === 'string'
      ? resolveTemplateValue(propValue, evaluationContext)
      : propValue

  const label = normalizeString(resolveTemplateProp(props.label))
  const labelCaption = normalizeString(resolveTemplateProp(props.labelCaption))
  const placeholder = normalizeString(resolveTemplateProp(props.placeholder))
  const helperText = normalizeString(resolveTemplateProp(props.helperText))
  const labelTooltip = normalizeString(resolveTemplateProp(props.tooltipText))

  const rawValue = context?.state?.value ?? props.value
  const baseValue = normalizeString(
    context?.mode === 'canvas' && typeof rawValue === 'string' && evaluationContext
      ? resolveTemplateValue(rawValue, evaluationContext)
      : rawValue
  )
  const [canvasValue, setCanvasValue] = useState(baseValue)
  const value = context?.mode === 'canvas' ? canvasValue : baseValue
  const lastBaseValueRef = useRef(baseValue)

  const isPreview = context?.mode === 'preview'
  const isCanvas = context?.mode === 'canvas'
  const isDisabled = parseBoolean(resolveTemplateProp(props.disabled))
  const isReadOnly = parseBoolean(resolveTemplateProp(props.readOnly))

  const showOnDesktop = parseBoolean(resolveTemplateProp(props.showOnDesktop), true)
  const showOnMobile = parseBoolean(resolveTemplateProp(props.showOnMobile))
  const visibilityClass = isPreview
    ? !showOnDesktop && !showOnMobile
      ? 'hidden'
      : !showOnDesktop
        ? 'md:hidden'
        : !showOnMobile
          ? 'hidden md:block'
          : ''
    : ''

  const labelAlign = (resolveTemplateProp(props.labelAlign) ?? 'left') as 'left' | 'right'
  const labelPosition = (resolveTemplateProp(props.labelPosition) ?? 'top') as 'left' | 'top'
  const labelWidthValue = parseNumber(resolveTemplateProp(props.labelWidthValue))
  const labelWidthUnit = (resolveTemplateProp(props.labelWidthUnit) ?? 'col') as 'px' | '%' | 'col'
  const labelWidthStyle: CSSProperties =
    labelPosition === 'left' && typeof labelWidthValue === 'number'
      ? {
          width:
            labelWidthUnit === 'col'
              ? `${labelWidthValue * 8}px`
              : `${labelWidthValue}${labelWidthUnit}`,
        }
      : {}
  const labelAlignmentClass = labelAlign === 'right' ? 'text-right' : 'text-left'
  const labelWrapClass = parseBoolean(resolveTemplateProp(props.labelWrap)) ? '' : 'whitespace-nowrap'
  const hideLabel = parseBoolean(resolveTemplateProp(props.labelHide))
  const labelHiddenClass = hideLabel ? 'sr-only' : ''

  const textTypography = resolveTypography(resolveTemplateProp(props.fontFamily))
  const baseFontStyle =
    textTypography.style?.fontFamily ? { fontFamily: textTypography.style.fontFamily } : undefined

  useEffect(() => {
    if (context?.mode !== 'canvas') {
      return
    }
    if (lastBaseValueRef.current === baseValue) {
      return
    }
    lastBaseValueRef.current = baseValue
    if (isFocused) {
      return
    }
    setCanvasValue(baseValue)
  }, [baseValue, context?.mode, isFocused])

  const required = parseBoolean(resolveTemplateProp(props.required))
  const validation = useMemo(
    () =>
      resolveValidation({
        value,
        required,
        validationMessage: normalizeString(resolveTemplateProp(props.validationMessage)),
        customRule: normalizeString(resolveTemplateProp(props.customRule)),
      }),
    [required, props.customRule, props.validationMessage, resolveTemplateProp, value]
  )

  useEffect(() => {
    if (!context?.setState) {
      return
    }
    const currentInvalid = parseBoolean(context?.state?.invalid)
    const currentMessage = normalizeString(context?.state?.validationMessage)
    if (currentInvalid === validation.invalid && currentMessage === validation.message) {
      return
    }
    context.setState({
      invalid: validation.invalid,
      validationMessage: validation.message,
    })
  }, [context, validation.invalid, validation.message])

  const showValidationMessage =
    validation.invalid &&
    !parseBoolean(resolveTemplateProp(props.hideValidationMessage)) &&
    !isFocused

  const helperMessage = helperText && isFocused ? helperText : ''

  const enableCountryChange = parseBoolean(resolveTemplateProp(props.enableCountryChange), true)
  const countryCallingCodeEditable = parseBoolean(
    resolveTemplateProp(props.countryCallingCodeEditable)
  )
  const international = parseBoolean(resolveTemplateProp(props.international), true)
  const limitMaxLength = parseBoolean(resolveTemplateProp(props.limitMaxLength))
  const focusInputOnCountrySelection = parseBoolean(
    resolveTemplateProp(props.focusInputOnCountrySelection),
    true
  )

  const rawDefaultCountry = normalizeString(resolveTemplateProp(props.defaultCountry))
  const normalizedDefaultCountry = rawDefaultCountry === 'auto' ? '' : rawDefaultCountry
  const defaultCountry = (normalizedDefaultCountry || guessCountryFromLocale()) as Country | undefined

  const showClearButton = parseBoolean(resolveTemplateProp(props.showClearButton))
  const loadingVisible = parseBoolean(resolveTemplateProp(props.loading))

  const containerStyle: CSSProperties = {
    backgroundColor: props.inputBackground || undefined,
    borderRadius: props.inputBorderRadius || undefined,
    ...(isFocused && props.accentColor ? { borderColor: props.accentColor } : null),
    ...(props.hoverBackground ? { '--phone-input-hover-bg': props.hoverBackground } : null),
  }

  const inputStyle: CSSProperties = {
    color: props.inputTextColor || undefined,
    ...(props.inputPlaceholderColor ? { '--phone-input-placeholder': props.inputPlaceholderColor } : null),
    ...(textTypography.style ?? null),
  }

  const labelStyle: CSSProperties = {
    color: props.baseTextColor || undefined,
  }

  const captionStyle: CSSProperties = {
    color: props.baseTextColor || undefined,
  }

  const phoneInputValue = value ? (value as PhoneValue | string) : undefined

  const FlagComponent = ({ country, countryName }: PhoneFlagProps) => {
    const Flag = country ? (flags as any)[country] : undefined
    return (
      <span className="w-5 overflow-hidden rounded-sm">
        {Flag ? <Flag title={countryName} /> : <PhoneIcon aria-hidden="true" size={16} />}
      </span>
    )
  }

  type CountrySelectProps = {
    disabled?: boolean
    value?: Country
    onChange: (value?: Country) => void
    options: Array<{ label: string; value?: Country }>
  }

  const CountrySelect = ({ disabled, value, onChange, options }: CountrySelectProps) => {
    // Some versions of `react-phone-number-input` don't consistently forward
    // `countrySelectProps.disabled` into the custom `countrySelectComponent`.
    const selectDisabled = !enableCountryChange || isDisabled || isReadOnly || Boolean(disabled)
    const selected = value ?? (defaultCountry as Country | undefined)

    return (
      <div
        className={cn(
          // Matches https://ui.shadcn.com "Phone number input" pattern (comp-46).
          'relative inline-flex items-center self-stretch border-r border-input bg-transparent py-2 ps-3 pe-2 text-muted-foreground outline-none',
          'transition-[color,box-shadow]',
          'hover:bg-accent hover:text-foreground',
          selectDisabled ? 'pointer-events-none opacity-50' : null
        )}
      >
        <div aria-hidden="true" className="inline-flex items-center gap-1">
          <FlagComponent aria-hidden="true" country={selected as any} countryName={selected as any} />
          <span className="text-muted-foreground/80">
            <ChevronDown aria-hidden="true" size={16} />
          </span>
        </div>
        <select
          aria-label="Select country"
          className="absolute inset-0 text-sm opacity-0"
          disabled={selectDisabled}
          onChange={(event) => onChange((event.target.value || undefined) as Country | undefined)}
          value={selected ?? ''}
        >
          <option key="default" value="">
            Select a country
          </option>
          {options
            .filter((x) => x.value)
            .map((option, i) => (
              <option key={option.value ?? `empty-${i}`} value={option.value}>
                {option.label}
              </option>
            ))}
        </select>
      </div>
    )
  }

  const HiddenCountrySelect = () => null

  const clearNode =
    showClearButton && value && !isDisabled && !isReadOnly ? (
      <button
        type="button"
        className="rounded-sm p-1 text-muted-foreground hover:bg-muted-foreground/10"
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => {
          context?.setState?.({ value: '', formattedValue: '' })
          if (context?.mode === 'canvas') {
            setCanvasValue('')
          }
          context?.runActions?.('change', { value: '' })
        }}
      >
        {renderWidgetIcon('x', { library: context?.iconLibrary, size: 14 })}
      </button>
    ) : null

  const loadingNode = loadingVisible ? (
    <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
  ) : null

  const showActions = Boolean(clearNode || loadingNode)

  const inputComponent = (inputProps: any) => {
    const { disabled, readOnly, ...rest } = inputProps ?? {}
    return (
      <Input
        {...(rest as any)}
        disabled={Boolean(disabled)}
        readOnly={Boolean(readOnly)}
        className={cn(
          // Input group: outer wrapper draws border/radius/ring, so keep input "flat".
          'h-9 flex-1 rounded-none border-0 bg-transparent pl-3 pr-3 py-1 shadow-none',
          'focus-visible:z-10 focus-visible:ring-0 focus-visible:ring-transparent focus-visible:outline-none',
          'placeholder:text-muted-foreground',
          showActions ? 'pr-12' : null,
          props.inputPlaceholderColor ? 'placeholder:text-[--phone-input-placeholder]' : null,
          textTypography.className
        )}
        style={inputStyle}
      />
    )
  }

  const inputContainer = (
    <div
      className={cn(
        'relative flex items-stretch overflow-hidden rounded-md border border-input bg-background shadow-xs transition-[color,box-shadow]',
        isDisabled ? 'cursor-not-allowed opacity-60' : 'cursor-text',
        'focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50'
      )}
      style={{ ...containerStyle, ...baseFontStyle }}
    >
      <PhoneInput
        value={phoneInputValue}
        onChange={(next) => {
          const nextValue = next ? String(next) : ''
          const formatted = next
            ? international
              ? formatPhoneNumberIntl(next)
              : formatPhoneNumber(next)
            : ''
          context?.setState?.({ value: nextValue, formattedValue: formatted })
          if (context?.mode === 'canvas') {
            setCanvasValue(nextValue)
          }
          if (context?.mode !== 'canvas') {
            context?.runActions?.('change', { value: nextValue, formattedValue: formatted })
          }
        }}
        onFocus={() => {
          setIsFocused(true)
          context?.runActions?.('focus', { value })
        }}
        onBlur={() => {
          setIsFocused(false)
          context?.runActions?.('blur', { value })
        }}
        placeholder={placeholder || undefined}
        disabled={isDisabled}
        readOnly={isReadOnly}
        defaultCountry={defaultCountry}
        international={international}
        countryCallingCodeEditable={countryCallingCodeEditable}
        limitMaxLength={limitMaxLength}
        focusInputOnCountrySelection={focusInputOnCountrySelection}
        inputComponent={inputComponent as never}
        // Enable country select: when false, hide the country selector completely.
        countrySelectComponent={(enableCountryChange ? CountrySelect : HiddenCountrySelect) as never}
        flagComponent={FlagComponent as never}
        countrySelectProps={{ disabled: isDisabled || isReadOnly }}
        numberInputProps={{ name: props.formDataKey || undefined }}
        className={cn(
          'flex min-w-0 flex-1 items-center',
          !isDisabled && props.hoverBackground ? 'hover:bg-[--phone-input-hover-bg]' : null
        )}
      />

      {showActions && (
        <div
          className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1"
        >
          {clearNode}
          {loadingNode}
        </div>
      )}
    </div>
  )

  const inputWithHelper =
    helperMessage ? (
      <Tooltip open>
        <TooltipTrigger asChild>
          <div className="min-w-0 flex-1">{inputContainer}</div>
        </TooltipTrigger>
        <TooltipContent side="bottom" align="start">
          {helperMessage}
        </TooltipContent>
      </Tooltip>
    ) : (
      inputContainer
    )

  const handleLabelInspectorOpen = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isCanvas || !context?.openInspectorPanel) {
      return
    }
    event.stopPropagation()
    context.openInspectorPanel({ key: 'label', label: 'Label' })
  }

  const labelElement = label ? (
    <label
      className={cn(
        'text-xs font-medium text-foreground',
        labelWrapClass,
        labelTooltip ? 'underline decoration-dotted underline-offset-2' : null
      )}
      style={labelStyle}
    >
      {label}
      {required && <span className="ml-1">*</span>}
    </label>
  ) : null

  const labelNode =
    labelElement && labelTooltip ? (
      <Tooltip>
        <TooltipTrigger asChild>{labelElement}</TooltipTrigger>
        <TooltipContent>{labelTooltip}</TooltipContent>
      </Tooltip>
    ) : (
      labelElement
    )

  const labelBlock =
    label || labelCaption ? (
      <div
        className={cn(
          'flex flex-col gap-0.5',
          labelAlignmentClass,
          labelHiddenClass,
          isCanvas && context?.openInspectorPanel ? 'cursor-pointer' : null
        )}
        style={labelWidthStyle}
        onClick={isCanvas && context?.openInspectorPanel ? handleLabelInspectorOpen : undefined}
        data-no-drag={isCanvas ? 'true' : undefined}
      >
        {labelNode}
        {labelCaption && (
          <div className={cn('text-[11px] text-muted-foreground', labelWrapClass)} style={captionStyle}>
            {labelCaption}
          </div>
        )}
      </div>
    ) : null

  const inputBlock = (
    <div className="space-y-1">
      {inputWithHelper}
      {showValidationMessage && (
        <div className="text-xs text-destructive-500">{validation.message}</div>
      )}
    </div>
  )

  const content =
    labelPosition === 'left' && labelBlock ? (
      <div className={cn('flex items-start gap-3', visibilityClass)} style={baseFontStyle}>
        {labelBlock}
        <div className="min-w-0 flex-1">{inputBlock}</div>
      </div>
    ) : (
      <div className={cn('space-y-1', visibilityClass)} style={baseFontStyle}>
        {labelBlock}
        {inputBlock}
      </div>
    )

  if ((labelNode && !hideLabel) || !labelTooltip) {
    return content
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{content}</TooltipTrigger>
      <TooltipContent>{labelTooltip}</TooltipContent>
    </Tooltip>
  )
}

export const PhoneNumberInputDefinition = createWidgetDefinition<PhoneNumberInputProps>({
  type: 'PhoneNumberInput',
  label: 'Phone Number',
  category: 'inputs',
  description: 'Phone number input',
  defaultProps: {
    label: 'Label',
    labelCaption: '',
    labelHide: false,
    labelWrap: false,
    labelPosition: 'top',
    labelAlign: 'left',
    labelWidthValue: '',
    labelWidthUnit: 'col',
    placeholder: '+1 (555) 000-0000',
    value: '',
    helperText: '',
    tooltipText: '',
    disabled: false,
    readOnly: false,
    required: false,
    loading: false,
    defaultCountry: '',
    enableCountryChange: true,
    international: true,
    countryCallingCodeEditable: false,
    limitMaxLength: false,
    focusInputOnCountrySelection: true,
    showClearButton: false,
    customRule: '',
    validationMessage: '',
    hideValidationMessage: false,
    formDataKey: '{{self.id}}',
    maintainSpaceWhenHidden: false,
    alwaysShowInEditMode: false,
    showOnDesktop: true,
    showOnMobile: false,
    accentColor: '',
    baseTextColor: '',
    fontFamily: '',
    hoverBackground: '',
    inputBorderRadius: '',
    inputBackground: '',
    inputPlaceholderColor: '',
    inputTextColor: '',
    placeholderColor: '',
    events: '[]',
  },
  events: ['change', 'focus', 'blur'],
  builder: {
    resizeHandles: ['e', 'w'],
    eventOptions: [
      { value: 'change', label: 'Change' },
      { value: 'focus', label: 'Focus' },
      { value: 'blur', label: 'Blur' },
    ],
  },
  render: (props, context) => <PhoneNumberInputRenderer props={props} context={context} />,
})
