import { useEffect, useMemo, useRef, useState, type CSSProperties, type MouseEvent } from 'react'
import { cn } from 'ui'
import { Input, Tooltip, TooltipContent, TooltipTrigger } from '../shadcn'

import { normalizeString } from '../helpers'
import { createWidgetDefinition, type WidgetRenderContext } from '../types'
import { renderWidgetIcon } from '../icon-library'

export type NumberInputIcon =
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

export type NumberInputFormat = 'decimal' | 'percent' | 'currency'

export type NumberInputProps = {
  label: string
  labelCaption: string
  labelHide: boolean
  labelWrap: boolean
  labelPosition: 'left' | 'top'
  labelAlign: 'left' | 'right'
  labelWidthValue: string
  labelWidthUnit: 'px' | '%' | 'col'
  placeholder: string
  helperText: string
  min?: number
  max?: number
  disabled: boolean
  readOnly: boolean
  required: boolean
  loading: boolean
  format: NumberInputFormat
  currency: string
  decimalPlaces?: number
  padDecimal: boolean
  showSeparators: boolean
  showStepper: boolean
  allowNull: boolean
  preventScroll: boolean
  textAlign: 'left' | 'right'
  textBefore: string
  textAfter: string
  iconBefore: NumberInputIcon
  iconAfter: NumberInputIcon
  tooltipText: string
  showClear: boolean
  customValidation: string
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
  // Value comes from runtime state, but defaultProps keeps it for initial render.
  value: string | number | null
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
  if (typeof value === 'string') {
    const cleaned = value.replace(/,/g, '').trim()
    if (!cleaned) {
      return undefined
    }
    const parsed = Number(cleaned)
    return Number.isFinite(parsed) ? parsed : undefined
  }
  return undefined
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
    if (/^\\d+px$/.test(size) && /^\\d+$/.test(weight)) {
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

  return rawValue.replace(/\\{\\{\\s*([\\s\\S]+?)\\s*\\}\\}/g, (match, expression) => {
    const evaluated = evaluateExpression(String(expression).trim())
    if (typeof evaluated === 'undefined') {
      return match
    }
    return String(evaluated)
  })
}

const resolveIcon = (icon: NumberInputIcon, className: string | undefined, iconLibrary?: string) => {
  if (icon === 'none') {
    return null
  }
  return renderWidgetIcon(icon, { className, library: iconLibrary, size: 16 })
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

const formatNumber = (
  raw: string,
  {
    decimalPlaces,
    padDecimal,
    showSeparators,
  }: {
    decimalPlaces?: number
    padDecimal: boolean
    showSeparators: boolean
  }
) => {
  const parsed = parseNumber(raw)
  if (parsed === undefined) {
    return raw
  }
  const minimumFractionDigits =
    typeof decimalPlaces === 'number' && padDecimal ? decimalPlaces : undefined
  const maximumFractionDigits = typeof decimalPlaces === 'number' ? decimalPlaces : undefined
  const formatter = new Intl.NumberFormat(undefined, {
    useGrouping: showSeparators,
    minimumFractionDigits,
    maximumFractionDigits,
  })
  return formatter.format(parsed)
}

const resolveValidation = ({
  value,
  required,
  allowNull,
  min,
  max,
  customValidation,
  validationMessage,
}: {
  value: string
  required: boolean
  allowNull: boolean
  min?: number
  max?: number
  customValidation: string
  validationMessage: string
}) => {
  const trimmed = value.trim()
  const isEmpty = trimmed.length === 0
  if (required && isEmpty) {
    return { invalid: true, message: validationMessage || 'Required' }
  }
  if (isEmpty) {
    return { invalid: false, message: '' }
  }
  const numericValue = parseNumber(trimmed)
  if (typeof numericValue !== 'number') {
    return { invalid: true, message: validationMessage || 'Enter a valid number.' }
  }
  if (typeof min === 'number' && numericValue < min) {
    return { invalid: true, message: validationMessage || `Min ${min}` }
  }
  if (typeof max === 'number' && numericValue > max) {
    return { invalid: true, message: validationMessage || `Max ${max}` }
  }
  const customResult = evaluateCustomRule(customValidation, trimmed)
  if (customResult === false) {
    return { invalid: true, message: validationMessage || 'Invalid value' }
  }
  return { invalid: false, message: '' }
}

const NumberInputRenderer = ({
  props,
  context,
}: {
  props: NumberInputProps
  context?: WidgetRenderContext
}) => {
  const rawValue = context?.state?.value ?? props.value
  const resolvedValue =
    context?.mode === 'canvas' && typeof rawValue === 'string' && context?.evaluationContext
      ? resolveTemplateValue(rawValue, context.evaluationContext)
      : rawValue

  const baseValue = normalizeString(resolvedValue)
  const [isFocused, setIsFocused] = useState(false)
  const [canvasValue, setCanvasValue] = useState(baseValue)
  const [draftValue, setDraftValue] = useState(baseValue)
  const value = context?.mode === 'canvas' ? canvasValue : baseValue
  const lastBaseValueRef = useRef(baseValue)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const evaluationContext = context?.evaluationContext
  const resolveTemplateProp = (propValue: unknown) =>
    evaluationContext && typeof propValue === 'string'
      ? resolveTemplateValue(propValue, evaluationContext)
      : propValue

  const label = normalizeString(resolveTemplateProp(props.label))
  const labelCaption = normalizeString(resolveTemplateProp(props.labelCaption))
  const placeholder = normalizeString(resolveTemplateProp(props.placeholder))
  const helperText = normalizeString(resolveTemplateProp(props.helperText))
  const format = (resolveTemplateProp(props.format) ?? 'decimal') as NumberInputFormat
  const allowNull = parseBoolean(resolveTemplateProp(props.allowNull))

  const prefixText =
    normalizeString(resolveTemplateProp(props.textBefore)) ||
    (format === 'currency' ? normalizeString(resolveTemplateProp(props.currency)) : '')
  const suffixText =
    normalizeString(resolveTemplateProp(props.textAfter)) || (format === 'percent' ? '%' : '')

  const iconBeforeValue = resolveTemplateProp(props.iconBefore)
  const iconAfterValue = resolveTemplateProp(props.iconAfter)
  const iconBefore =
    (typeof iconBeforeValue === 'string' && iconBeforeValue.trim()
      ? iconBeforeValue
      : 'none') as NumberInputIcon
  const iconAfter =
    (typeof iconAfterValue === 'string' && iconAfterValue.trim()
      ? iconAfterValue
      : 'none') as NumberInputIcon

  const labelTooltip = normalizeString(resolveTemplateProp(props.tooltipText))

  const isPreview = context?.mode === 'preview'
  const isCanvas = context?.mode === 'canvas'
  const isDisabled = parseBoolean(resolveTemplateProp(props.disabled))
  const isReadOnly = parseBoolean(resolveTemplateProp(props.readOnly))

  const labelAlign = (resolveTemplateProp(props.labelAlign) ?? 'left') as 'left' | 'right'
  const labelPosition = (resolveTemplateProp(props.labelPosition) ?? 'left') as 'left' | 'top'
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

  const inputId = context?.widgetId ? `number-input-${context.widgetId}` : undefined

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
    setDraftValue(baseValue)
  }, [baseValue, context?.mode, isFocused])

  useEffect(() => {
    if (!context?.setState) {
      return
    }
    const currentInputValue = normalizeString(context?.state?.inputValue)
    const desired = isFocused ? draftValue : value
    if (currentInputValue === desired) {
      return
    }
    context.setState({ inputValue: desired })
  }, [context, draftValue, isFocused, value])

  const validation = useMemo(
    () =>
      resolveValidation({
        value: isFocused ? draftValue : value,
        required: parseBoolean(resolveTemplateProp(props.required)),
        allowNull,
        min: props.min,
        max: props.max,
        customValidation: normalizeString(resolveTemplateProp(props.customValidation)),
        validationMessage: normalizeString(resolveTemplateProp(props.validationMessage)),
      }),
    [
      allowNull,
      draftValue,
      isFocused,
      props.customValidation,
      props.max,
      props.min,
      props.required,
      props.validationMessage,
      value,
    ]
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

  const emitValue = (raw: string) => {
    const trimmed = raw.trim()
    const isEmpty = trimmed.length === 0
    if (isEmpty) {
      const nextValue = allowNull ? null : 0
      context?.setState?.({ value: nextValue, inputValue: raw })
      if (context?.mode !== 'canvas') {
        context?.runActions?.('change', { value: nextValue })
      }
      if (context?.mode === 'canvas') {
        setCanvasValue(raw)
      }
      return
    }
    const parsed = parseNumber(trimmed)
    const nextValue = typeof parsed === 'number' ? parsed : undefined
    context?.setState?.({ value: nextValue, inputValue: raw })
    if (context?.mode !== 'canvas') {
      context?.runActions?.('change', { value: nextValue })
    }
    if (context?.mode === 'canvas') {
      setCanvasValue(raw)
    }
  }

  const handleChange = (nextRaw: string) => {
    setDraftValue(nextRaw)
    emitValue(nextRaw)
  }

  const handleBlur = () => {
    setIsFocused(false)

    // Commit raw to the persisted string value used for formatting when blurred.
    const trimmed = draftValue.trim()
    const normalized = !allowNull && trimmed === '' ? '0' : draftValue

    if (context?.mode === 'canvas') {
      setCanvasValue(normalized)
    }

    if (context?.setState) {
      context.setState({ inputValue: normalized })
    }

    context?.runActions?.('blur', { value: parseNumber(normalized) ?? (allowNull ? null : 0) })
  }

  const handleFocus = () => {
    setIsFocused(true)
    // When entering the field, switch to an unformatted raw value for editing.
    setDraftValue(value)
    context?.runActions?.('focus', { value: parseNumber(value) ?? (allowNull ? null : 0) })
  }

  const showValidationMessage =
    validation.invalid && !parseBoolean(resolveTemplateProp(props.hideValidationMessage))

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

  const textTypography = resolveTypography(resolveTemplateProp(props.fontFamily))
  const baseFontStyle =
    textTypography.style?.fontFamily ? { fontFamily: textTypography.style.fontFamily } : undefined

  const formattedValue = formatNumber(value, {
    decimalPlaces: props.decimalPlaces,
    padDecimal: parseBoolean(resolveTemplateProp(props.padDecimal)),
    showSeparators: parseBoolean(resolveTemplateProp(props.showSeparators), true),
  })

  const containerStyle: CSSProperties = {
    backgroundColor: props.inputBackground || undefined,
    borderRadius: props.inputBorderRadius || undefined,
    ...(isFocused && props.accentColor ? { borderColor: props.accentColor } : null),
    ...(props.hoverBackground ? { '--number-input-hover-bg': props.hoverBackground } : null),
  }

  const inputStyle: CSSProperties = {
    color: props.inputTextColor || undefined,
    textAlign: props.textAlign || 'left',
    ...(props.inputPlaceholderColor
      ? { '--number-input-placeholder': props.inputPlaceholderColor }
      : null),
    ...(textTypography.style ?? null),
  }

  const labelStyle: CSSProperties = {
    color: props.baseTextColor || undefined,
  }

  const captionStyle: CSSProperties = {
    color: props.baseTextColor || undefined,
  }

  const prefixIconNode = resolveIcon(iconBefore, 'text-muted-foreground', context?.iconLibrary)
  const suffixIconNode = resolveIcon(iconAfter, 'text-muted-foreground', context?.iconLibrary)
  const prefixNode =
    prefixText || prefixIconNode ? (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {prefixIconNode}
        {prefixText && <span>{prefixText}</span>}
      </div>
    ) : null

  const suffixNode =
    suffixText || suffixIconNode ? (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {suffixText && <span>{suffixText}</span>}
        {suffixIconNode}
      </div>
    ) : null

  const stepperVisible =
    parseBoolean(resolveTemplateProp(props.showStepper)) && !isDisabled && !isReadOnly
  const clearVisible =
    parseBoolean(resolveTemplateProp(props.showClear)) &&
    (isFocused ? draftValue : value) &&
    !isDisabled &&
    !isReadOnly
  const loadingVisible = parseBoolean(resolveTemplateProp(props.loading))

  const helperMessage = helperText && isFocused ? helperText : ''

  const handleStep = (direction: 1 | -1) => {
    const current = parseNumber(isFocused ? draftValue : value) ?? 0
    const next = current + direction
    const bounded =
      typeof props.min === 'number' && next < props.min
        ? props.min
        : typeof props.max === 'number' && next > props.max
          ? props.max
          : next
    const nextRaw = String(bounded)
    setDraftValue(nextRaw)
    emitValue(nextRaw)
  }

  const inputBlock = (
    <div className="space-y-1">
      <Tooltip open={Boolean(helperMessage)}>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'flex min-h-9 w-full items-center gap-2 rounded-md border border-input bg-background px-2 py-1 text-sm transition',
              !isDisabled && props.hoverBackground ? 'hover:bg-[--number-input-hover-bg]' : null,
              isDisabled ? 'cursor-not-allowed opacity-60' : 'cursor-text',
              'focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50',
              'has-[input[aria-invalid=true]]:border-destructive has-[input[aria-invalid=true]]:ring-destructive/20 dark:has-[input[aria-invalid=true]]:ring-destructive/40'
            )}
            style={containerStyle}
          >
            {prefixNode}
            <Input
              inputRef={inputRef}
              id={inputId}
              type="text"
              inputMode="decimal"
              placeholder={placeholder}
              value={isFocused ? draftValue : formattedValue}
              name={props.formDataKey || undefined}
              readOnly={isReadOnly}
              disabled={isDisabled}
              required={parseBoolean(resolveTemplateProp(props.required))}
              aria-invalid={validation.invalid}
              onChange={(event) => handleChange(event.target.value)}
              onFocus={handleFocus}
              onBlur={handleBlur}
              onWheel={
                props.preventScroll
                  ? (event) => {
                      event.preventDefault()
                      ;(event.currentTarget as HTMLInputElement).blur()
                    }
                  : undefined
              }
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  event.preventDefault()
                  inputRef.current?.blur()
                  return
                }
                if (event.key === 'Enter') {
                  event.preventDefault()
                  inputRef.current?.blur()
                }
              }}
              className={cn(
                'h-auto flex-1 border-0 bg-transparent px-0 py-0 shadow-none focus-visible:ring-0 focus-visible:ring-transparent',
                'placeholder:text-muted-foreground',
                textTypography.className,
                props.inputPlaceholderColor ? 'placeholder:text-[--number-input-placeholder]' : null
              )}
              style={inputStyle}
            />
            {suffixNode}
            {stepperVisible && (
              <div className="flex flex-col">
                <button
                  type="button"
                  className="inline-flex h-2.5 w-5 items-center justify-center rounded-sm text-muted-foreground hover:text-foreground"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => handleStep(1)}
                >
                  {renderWidgetIcon('chevronUp', { library: context?.iconLibrary, size: 12 })}
                </button>
                <button
                  type="button"
                  className="inline-flex h-2.5 w-5 items-center justify-center rounded-sm text-muted-foreground hover:text-foreground"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => handleStep(-1)}
                >
                  {renderWidgetIcon('chevronDown', { library: context?.iconLibrary, size: 12 })}
                </button>
              </div>
            )}
            {clearVisible && (
              <button
                type="button"
                className="rounded-sm p-1 text-muted-foreground hover:bg-muted-foreground/10"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => handleChange('')}
              >
                {renderWidgetIcon('x', { library: context?.iconLibrary, size: 14 })}
              </button>
            )}
            {loadingVisible && (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" align="start">
          {helperMessage}
        </TooltipContent>
      </Tooltip>
      {showValidationMessage && (
        <div className="text-xs text-destructive-500">{validation.message}</div>
      )}
    </div>
  )

  const handleLabelInspectorOpen = (event: MouseEvent<HTMLDivElement>) => {
    if (!isCanvas || !context?.openInspectorPanel) {
      return
    }
    event.stopPropagation()
    context.openInspectorPanel({ key: 'label', label: 'Label' })
  }

  const labelElement = label ? (
    <label
      htmlFor={inputId}
      className={cn(
        'text-xs font-medium text-foreground',
        labelWrapClass,
        labelTooltip ? 'underline decoration-dotted underline-offset-2' : null
      )}
      style={labelStyle}
    >
      {label}
      {parseBoolean(resolveTemplateProp(props.required)) && <span className="ml-1">*</span>}
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
          <div
            className={cn('text-[11px] text-muted-foreground', labelWrapClass)}
            style={captionStyle}
          >
            {labelCaption}
          </div>
        )}
      </div>
    ) : null

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

export const NumberInputDefinition = createWidgetDefinition<NumberInputProps>({
  type: 'NumberInput',
  label: 'Number input',
  category: 'inputs',
  description: 'Number input',
  defaultProps: {
    label: 'Label',
    labelCaption: '',
    labelHide: false,
    labelWrap: false,
    labelPosition: 'left',
    labelAlign: 'left',
    labelWidthValue: '',
    labelWidthUnit: 'col',
    placeholder: 'Enter a value',
    helperText: '',
    value: '',
    min: undefined,
    max: undefined,
    disabled: false,
    readOnly: false,
    required: false,
    loading: false,
    format: 'decimal',
    currency: 'USD',
    decimalPlaces: undefined,
    padDecimal: false,
    showSeparators: true,
    showStepper: false,
    allowNull: false,
    preventScroll: false,
    textAlign: 'left',
    textBefore: '',
    textAfter: '',
    iconBefore: 'none',
    iconAfter: 'none',
    tooltipText: '',
    showClear: false,
    customValidation: '',
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
  render: (props, context) => <NumberInputRenderer props={props} context={context} />,
})
