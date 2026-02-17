import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { cn } from 'ui'

import { Input, Label, SelectNative, Tooltip, TooltipContent, TooltipTrigger } from '../shadcn'
import { normalizeString, parseMaybeJson } from '../helpers'
import { createWidgetDefinition } from '../types'
import type { WidgetRenderContext } from '../types'
import { renderWidgetIcon } from '../icon-library'

export type TextInputIcon =
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

export type TextInputAddonType = 'none' | 'text' | 'select' | 'button'

export type TextInputActionType = 'none' | 'icon' | 'text'

export type TextInputProps = {
  label: string
  labelCaption: string
  labelHide: boolean
  labelWrap: boolean
  labelPosition: 'left' | 'top'
  labelAlign: 'left' | 'right'
  labelWidthValue: string
  labelWidthUnit: 'px' | '%' | 'col'
  labelCaptionColor: string
  labelTextColor: string
  labelFont: string
  labelRequiredIndicatorColor: string
  placeholder: string
  value: string
  helperText: string
  disabled: boolean
  events: string
  prefix: string
  suffix: string
  prefixIcon: TextInputIcon
  suffixIcon: TextInputIcon
  tooltip: string
  tooltipText: string
  spellCheck: boolean
  enableBrowserAutofill: boolean
  autoFill: string
  autoCapitalize: 'none' | 'sentences' | 'words' | 'characters'
  readOnly: boolean
  loading: boolean
  formDataKey: string
  pattern: 'none' | 'email' | 'regex' | 'url'
  regex: string
  minLength?: number
  maxLength?: number
  enforceMaxLength: boolean
  min?: number
  max?: number
  step?: number
  required: boolean
  customRule: string
  showClearButton: boolean
  showPasswordToggle: boolean
  hideValidationMessage: boolean
  showCharacterCount: boolean
  characterCountPosition: 'inline' | 'below'
  preventScroll?: boolean
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
  type: 'text' | 'email' | 'password' | 'number' | 'search' | 'url' | 'tel' | 'file'
  addonBeforeType: TextInputAddonType
  addonBeforeText: string
  addonBeforeOptions: string
  addonBeforeValue: string
  addonBeforeButtonLabel: string
  addonAfterType: TextInputAddonType
  addonAfterText: string
  addonAfterOptions: string
  addonAfterValue: string
  addonAfterButtonLabel: string
  actionType: TextInputActionType
  actionLabel: string
  actionIcon: TextInputIcon
  actionTooltip: string
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

const resolveAutoComplete = (enabled: boolean, autoFill: string) => {
  if (!enabled) {
    return 'off'
  }
  const trimmed = autoFill.trim()
  if (!trimmed) {
    return 'on'
  }
  return trimmed
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

const resolveIcon = (
  icon: TextInputIcon,
  className: string | undefined,
  iconLibrary?: string
) => {
  if (icon === 'none') {
    return null
  }
  return renderWidgetIcon(icon, { className, library: iconLibrary, size: 16 })
}

const resolveTemplateValue = (
  rawValue: string,
  context: Record<string, unknown>
) => {
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

const isValidEmail = (value: string) => /\S+@\S+\.\S+/.test(value)

const isValidUrl = (value: string) => {
  try {
    const parsed = new URL(value)
    return Boolean(parsed.protocol && parsed.host)
  } catch {
    return false
  }
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

const validateValue = (
  value: string,
  {
    type,
    pattern,
    regex,
    minLength,
    maxLength,
    min,
    max,
    required,
    customRule,
  }: {
    type?: TextInputProps['type']
    pattern: TextInputProps['pattern']
    regex: string
    minLength?: number
    maxLength?: number
    min?: number
    max?: number
    required: boolean
    customRule: string
  }
) => {
  const normalized = value ?? ''
  const trimmed = normalized.trim()
  const requiredEnabled = parseBoolean(required)

  if (requiredEnabled && !trimmed) {
    return { invalid: true, message: 'This field is required.' }
  }

  if (!trimmed) {
    return { invalid: false, message: '' }
  }

  if (type === 'number') {
    const parsed = Number(trimmed)
    if (!Number.isFinite(parsed)) {
      return { invalid: true, message: 'Enter a valid number.' }
    }
    if (typeof min === 'number' && parsed < min) {
      return { invalid: true, message: `Minimum value is ${min}.` }
    }
    if (typeof max === 'number' && parsed > max) {
      return { invalid: true, message: `Maximum value is ${max}.` }
    }
  }

  if (typeof minLength === 'number' && trimmed.length < minLength) {
    return {
      invalid: true,
      message: `Minimum length is ${minLength}.`,
    }
  }

  if (typeof maxLength === 'number' && trimmed.length > maxLength) {
    return {
      invalid: true,
      message: `Maximum length is ${maxLength}.`,
    }
  }

  if (pattern === 'email' && !isValidEmail(trimmed)) {
    return { invalid: true, message: 'Enter a valid email address.' }
  }

  if (pattern === 'url' && !isValidUrl(trimmed)) {
    return { invalid: true, message: 'Enter a valid URL.' }
  }

  if (pattern === 'regex') {
    if (!regex.trim()) {
      return { invalid: false, message: '' }
    }
    try {
      const matcher = new RegExp(regex)
      if (!matcher.test(trimmed)) {
        return { invalid: true, message: 'Value does not match the pattern.' }
      }
    } catch {
      return { invalid: true, message: 'Invalid regex pattern.' }
    }
  }

  const customResult = evaluateCustomRule(customRule, trimmed)
  if (typeof customResult === 'string' && customResult.trim()) {
    return { invalid: true, message: customResult }
  }
  if (customResult === false) {
    return { invalid: true, message: 'Custom validation failed.' }
  }

  return { invalid: false, message: '' }
}

const parseOptions = (raw: unknown) => {
  if (Array.isArray(raw)) {
    return raw as Array<{ label: string; value: string }>
  }
  const parsed = parseMaybeJson(raw)
  if (Array.isArray(parsed)) {
    return parsed as Array<{ label: string; value: string }>
  }
  return []
}

const TextInputRenderer = ({
  props,
  context,
}: {
  props: TextInputProps
  context?: WidgetRenderContext
}) => {
  const [isFocused, setIsFocused] = useState(false)
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)

  const rawValue = context?.state?.value ?? props.value
  const baseValue = normalizeString(rawValue)
  const [canvasValue, setCanvasValue] = useState(baseValue)
  const value = context?.mode === 'canvas' ? canvasValue : baseValue
  const lastBaseValueRef = useRef(baseValue)

  const resolveTemplateProp = (value: unknown) =>
    context?.evaluationContext && typeof value === 'string'
      ? resolveTemplateValue(value, context.evaluationContext)
      : value
  const label = normalizeString(resolveTemplateProp(props.label))
  const labelCaption = normalizeString(resolveTemplateProp(props.labelCaption))
  const placeholder = normalizeString(resolveTemplateProp(props.placeholder))
  const helperText = normalizeString(resolveTemplateProp(props.helperText))
  const prefixText = normalizeString(resolveTemplateProp(props.prefix))
  const suffixText = normalizeString(resolveTemplateProp(props.suffix))
  const labelTooltip = normalizeString(
    resolveTemplateProp(props.tooltipText || props.tooltip)
  )
  const autoFillValue = normalizeString(resolveTemplateProp(props.autoFill))
  const regexValue = normalizeString(props.regex)
  const customRuleValue = normalizeString(props.customRule)

  const isPreview = context?.mode === 'preview'
  const isDisabled = parseBoolean(props.disabled)
  const isReadOnly = parseBoolean(props.readOnly)
  const autoCompleteValue = resolveAutoComplete(
    parseBoolean(props.enableBrowserAutofill, false),
    autoFillValue
  )
  const showClearButton = parseBoolean(props.showClearButton)
  const showLoading = parseBoolean(props.loading)
  const showPasswordToggle = parseBoolean(props.showPasswordToggle)
  const showCharacterCount = parseBoolean(props.showCharacterCount)
  const characterCountPosition = props.characterCountPosition ?? 'inline'
  const hideLabel = parseBoolean(props.labelHide)
  const allowLabelWrap = parseBoolean(props.labelWrap)
  const labelPosition = props.labelPosition ?? 'top'
  const labelAlign = props.labelAlign ?? 'left'

  const showOnDesktop = parseBoolean(props.showOnDesktop, true)
  const showOnMobile = parseBoolean(props.showOnMobile, true)

  const minLength = parseNumber(props.minLength)
  const maxLength = parseNumber(props.maxLength)
  const enforceMaxLength = parseBoolean(props.enforceMaxLength)
  const minValue = parseNumber(props.min)
  const maxValue = parseNumber(props.max)
  const stepValue = parseNumber(props.step)
  const preventScroll = parseBoolean(props.preventScroll)

  const validation = useMemo(
    () =>
      validateValue(value, {
        type: props.type,
        pattern: props.pattern,
        regex: regexValue,
        minLength,
        maxLength,
        required: props.required,
        customRule: customRuleValue,
        min: props.type === 'number' ? minValue : undefined,
        max: props.type === 'number' ? maxValue : undefined,
      }),
    [
      value,
      props.type,
      props.pattern,
      regexValue,
      minLength,
      maxLength,
      props.required,
      customRuleValue,
      minValue,
      maxValue,
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

  const handleChange = (nextValue: string) => {
    if (context?.setState) {
      context.setState({ value: nextValue })
      if (context?.mode !== 'canvas') {
        context.runActions?.('change', { value: nextValue })
      }
      if (context?.mode === 'canvas') {
        setCanvasValue(nextValue)
      }
      return
    }
    if (context?.mode === 'canvas') {
      setCanvasValue(nextValue)
      return
    }
    context?.runActions?.('change', { value: nextValue })
  }

  const handleBlur = () => {
    setIsFocused(false)
    context?.runActions?.('blur', { value })
  }

  const handleFocus = () => {
    setIsFocused(true)
    context?.runActions?.('focus', { value })
  }

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

  const helperMessage = helperText && isFocused ? helperText : ''
  const showValidationMessage = validation.invalid && !parseBoolean(props.hideValidationMessage)

  const visibilityClass = isPreview
    ? !showOnDesktop && !showOnMobile
      ? 'hidden'
      : !showOnDesktop
        ? 'md:hidden'
        : !showOnMobile
          ? 'hidden md:block'
          : ''
    : ''

  const textTypography = resolveTypography(props.fontFamily)
  const baseFontStyle =
    textTypography.style?.fontFamily ? { fontFamily: textTypography.style.fontFamily } : undefined

  const inputId = context?.widgetId ? `text-input-${context.widgetId}` : undefined

  const containerStyle: CSSProperties = {
    backgroundColor: props.inputBackground || undefined,
    borderRadius: props.inputBorderRadius || undefined,
    ...(isFocused && props.accentColor ? { borderColor: props.accentColor } : null),
    ...(props.hoverBackground ? { '--input-hover-bg': props.hoverBackground } : null),
  }

  const inputStyle: CSSProperties = {
    color: props.inputTextColor || undefined,
    ...(props.inputPlaceholderColor ? { '--input-placeholder': props.inputPlaceholderColor } : null),
    ...(textTypography.style ?? null),
  }

  const labelStyle: CSSProperties = {
    color: props.labelTextColor || props.baseTextColor || undefined,
  }


  const captionStyle: CSSProperties = {
    color: props.labelCaptionColor || undefined,
  }

  const requiredIndicatorStyle: CSSProperties = {
    color: props.labelRequiredIndicatorColor || undefined,
  }

  const labelTypography = resolveTypography(props.labelFont)
  const labelAlignmentClass = labelAlign === 'right' ? 'text-right' : 'text-left'
  const labelWrapClass = allowLabelWrap ? '' : 'whitespace-nowrap'
  const labelHiddenClass = hideLabel ? 'sr-only' : ''
  const showRequiredIndicator = parseBoolean(props.required)

  const labelWidthValue = parseNumber(props.labelWidthValue)
  const labelWidthUnit = props.labelWidthUnit ?? 'col'
  const labelWidthStyle: CSSProperties =
    labelPosition === 'left' && typeof labelWidthValue === 'number'
      ? {
          width:
            labelWidthUnit === 'col'
              ? `${labelWidthValue * 8}px`
              : `${labelWidthValue}${labelWidthUnit}`,
        }
      : {}

  const prefixIconValue = resolveTemplateProp(props.prefixIcon)
  const suffixIconValue = resolveTemplateProp(props.suffixIcon)
  const prefixIcon =
    (typeof prefixIconValue === 'string' && prefixIconValue.trim()
      ? prefixIconValue
      : 'none') as TextInputIcon
  const suffixIcon =
    (typeof suffixIconValue === 'string' && suffixIconValue.trim()
      ? suffixIconValue
      : 'none') as TextInputIcon

  const prefixNode =
    prefixIcon !== 'none' || prefixText ? (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {resolveIcon(prefixIcon, 'text-muted-foreground', context?.iconLibrary)}
        {prefixText && <span>{prefixText}</span>}
      </div>
    ) : null

  const suffixNode =
    suffixIcon !== 'none' || suffixText ? (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {suffixText && <span>{suffixText}</span>}
        {resolveIcon(suffixIcon, 'text-muted-foreground', context?.iconLibrary)}
      </div>
    ) : null

  const actionLabel = normalizeString(props.actionLabel)
  const actionIcon = props.actionIcon ?? 'none'
  const actionNode =
    props.actionType !== 'none' &&
    (props.actionType === 'text' ? actionLabel : actionIcon !== 'none') ? (
      <button
        type="button"
        aria-label={normalizeString(props.actionTooltip) || actionLabel || 'Action'}
        className="inline-flex h-7 items-center justify-center rounded-sm px-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
        onClick={() => context?.runActions?.('action', { value })}
      >
        {props.actionType === 'text'
          ? actionLabel || 'Action'
          : resolveIcon(actionIcon, 'text-muted-foreground', context?.iconLibrary)}
      </button>
    ) : null

  const passwordToggleNode =
    props.type === 'password' && showPasswordToggle ? (
      <button
        type="button"
        className="inline-flex h-7 items-center justify-center rounded-sm px-2 text-muted-foreground transition-colors hover:text-foreground"
        onClick={() => setIsPasswordVisible((prev) => !prev)}
      >
        {isPasswordVisible
          ? renderWidgetIcon('eyeOff', { library: context?.iconLibrary, size: 16 })
          : renderWidgetIcon('eye', { library: context?.iconLibrary, size: 16 })}
      </button>
    ) : null

  const clearNode =
    showClearButton && value && !isDisabled && !isReadOnly ? (
      <button
        type="button"
        className="inline-flex h-7 items-center justify-center rounded-sm px-2 text-muted-foreground transition-colors hover:text-foreground"
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => handleChange('')}
      >
        {renderWidgetIcon('x', { library: context?.iconLibrary, size: 16 })}
      </button>
    ) : null

  const loadingNode = showLoading ? (
    renderWidgetIcon('loader', {
      library: context?.iconLibrary,
      className: 'h-4 w-4 animate-spin text-muted-foreground',
    })
  ) : null

  const characterCount = value.length
  const inlineCountNode =
    showCharacterCount && characterCountPosition === 'inline' ? (
      <span className="text-[11px] text-muted-foreground tabular-nums">
        {typeof maxLength === 'number' ? `${characterCount}/${maxLength}` : characterCount}
      </span>
    ) : null

  const addonBeforeOptions = parseOptions(props.addonBeforeOptions)
  const addonAfterOptions = parseOptions(props.addonAfterOptions)

  const renderAddon = (side: 'before' | 'after') => {
    const isBefore = side === 'before'
    const type = isBefore ? props.addonBeforeType : props.addonAfterType
    if (type === 'none') {
      return null
    }

    const text = normalizeString(isBefore ? props.addonBeforeText : props.addonAfterText)
    const buttonLabel = normalizeString(
      isBefore ? props.addonBeforeButtonLabel : props.addonAfterButtonLabel
    )
    const options = isBefore ? addonBeforeOptions : addonAfterOptions
    const selectedValue = normalizeString(isBefore ? props.addonBeforeValue : props.addonAfterValue)

    const baseClass = cn(
      'inline-flex h-9 items-center border border-input bg-background px-3 text-sm text-muted-foreground',
      isBefore ? 'rounded-s-md' : 'rounded-e-md'
    )

    if (type === 'text') {
      return <span className={baseClass}>{text || (isBefore ? 'Add-on' : 'Add-on')}</span>
    }

    if (type === 'button') {
      return (
        <button
          type="button"
          className={cn(
            'inline-flex h-9 items-center border border-input bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-accent',
            isBefore ? 'rounded-s-md' : 'rounded-e-md'
          )}
          onClick={() => context?.runActions?.('action', { value })}
        >
          {buttonLabel || 'Action'}
        </button>
      )
    }

    return (
      <SelectNative
        className={cn(
          'w-fit text-muted-foreground shadow-none hover:text-foreground',
          isBefore ? 'rounded-e-none' : 'rounded-s-none'
        )}
        defaultValue={selectedValue || undefined}
      >
        {options.length === 0 ? (
          <option value="">Select</option>
        ) : (
          options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))
        )}
      </SelectNative>
    )
  }

  const beforeAddonNode = renderAddon('before')
  const afterAddonNode = renderAddon('after')

  const hasBeforeAddon = Boolean(beforeAddonNode)
  const hasAfterAddon = Boolean(afterAddonNode)

  const inputRadiusClass = hasBeforeAddon && hasAfterAddon
    ? 'rounded-none'
    : hasBeforeAddon
      ? 'rounded-e-md rounded-s-none'
      : hasAfterAddon
        ? 'rounded-s-md rounded-e-none'
        : 'rounded-md'

  const inputContainerClass = cn(
    'flex min-h-9 w-full items-center gap-2 border border-input bg-background px-2 py-1 text-sm shadow-xs transition-[color,box-shadow]',
    inputRadiusClass,
    hasBeforeAddon ? '-ms-px' : null,
    hasAfterAddon ? '-me-px' : null,
    !isDisabled && props.hoverBackground ? 'hover:bg-[--input-hover-bg]' : null,
    isDisabled ? 'cursor-not-allowed opacity-60' : 'cursor-text',
    'focus-within:border-ring focus-within:ring-1 focus-within:ring-ring/50',
    'has-[input[aria-invalid=true]]:border-destructive has-[input[aria-invalid=true]]:ring-destructive/20 dark:has-[input[aria-invalid=true]]:ring-destructive/40'
  )

  const inputElement = (
    <Input
      id={inputId}
      type={props.type === 'password' && showPasswordToggle && isPasswordVisible ? 'text' : props.type}
      inputMode={props.type === 'number' ? 'decimal' : undefined}
      placeholder={placeholder}
      value={value}
      name={props.formDataKey || undefined}
      spellCheck={parseBoolean(props.spellCheck, false)}
      autoCapitalize={props.autoCapitalize}
      autoComplete={autoCompleteValue}
      readOnly={isReadOnly}
      disabled={isDisabled}
      min={props.type === 'number' ? minValue : undefined}
      max={props.type === 'number' ? maxValue : undefined}
      step={props.type === 'number' ? stepValue : undefined}
      minLength={minLength}
      maxLength={enforceMaxLength ? maxLength : undefined}
      required={parseBoolean(props.required)}
      aria-invalid={validation.invalid}
      onChange={(event) => handleChange(event.target.value)}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onWheel={
        props.type === 'number' && preventScroll
          ? (event) => {
              event.preventDefault()
              ;(event.currentTarget as HTMLInputElement).blur()
            }
          : undefined
      }
      onKeyDown={(event) => {
        if (event.key !== 'Enter' || context?.mode !== 'preview' || isDisabled || isReadOnly) {
          return
        }
        context?.runActions?.('submit', { value: event.currentTarget.value })
      }}
      className={cn(
        'h-auto flex-1 border-0 bg-transparent px-0 py-0 shadow-none focus-visible:ring-0 focus-visible:ring-transparent',
        props.inputPlaceholderColor ? 'placeholder:text-[--input-placeholder]' : null,
        textTypography.className
      )}
      style={inputStyle}
    />
  )

  const isFileInput = props.type === 'file'
  const canUsePlainInput =
    isFileInput &&
    !hasBeforeAddon &&
    !hasAfterAddon &&
    !prefixNode &&
    !suffixNode &&
    !inlineCountNode &&
    !actionNode &&
    !passwordToggleNode &&
    !clearNode &&
    !loadingNode

  const mainInputNode = canUsePlainInput ? (
    <Input
      id={inputId}
      type="file"
      placeholder={placeholder}
      name={props.formDataKey || undefined}
      spellCheck={parseBoolean(props.spellCheck, false)}
      autoCapitalize={props.autoCapitalize}
      autoComplete={autoCompleteValue}
      readOnly={isReadOnly}
      disabled={isDisabled}
      minLength={minLength}
      maxLength={enforceMaxLength ? maxLength : undefined}
      required={parseBoolean(props.required)}
      aria-invalid={validation.invalid}
      onChange={(event) => handleChange(event.target.value)}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={(event) => {
        if (event.key !== 'Enter' || context?.mode !== 'preview' || isDisabled || isReadOnly) {
          return
        }
        context?.runActions?.('submit', { value: event.currentTarget.value })
      }}
      className={cn(
        props.inputPlaceholderColor ? 'placeholder:text-[--input-placeholder]' : null,
        textTypography.className
      )}
      style={inputStyle}
    />
  ) : (
    <div className={inputContainerClass} style={containerStyle}>
      {prefixNode}
      {inputElement}
      {suffixNode}
      {inlineCountNode}
      {actionNode}
      {passwordToggleNode}
      {clearNode}
      {loadingNode}
    </div>
  )

  const inputWithHelper =
    helperMessage ? (
      <Tooltip open>
        <TooltipTrigger asChild>
          <div className="min-w-0 flex-1">{mainInputNode}</div>
        </TooltipTrigger>
        <TooltipContent side="bottom" align="start">
          {helperMessage}
        </TooltipContent>
      </Tooltip>
    ) : (
      <div className="min-w-0 flex-1">{mainInputNode}</div>
    )

  const inputBlock = (
    <div className="space-y-1">
      <div className="flex w-full items-stretch">
        {beforeAddonNode}
        {inputWithHelper}
        {afterAddonNode}
      </div>
      {showCharacterCount && characterCountPosition === 'below' && (
        <div className="text-xs text-muted-foreground tabular-nums">
          {typeof maxLength === 'number' ? `${characterCount}/${maxLength}` : characterCount}
        </div>
      )}
      {showValidationMessage && (
        <div className="text-xs text-destructive-500">{validation.message}</div>
      )}
    </div>
  )

  const labelElement = label ? (
    <Label
      htmlFor={inputId}
      className={cn(
        'text-xs font-medium text-foreground',
        labelTypography.className,
        labelWrapClass,
        labelTooltip ? 'underline decoration-dashed decoration-1  underline-offset-2' : null
      )}
      style={{ ...labelStyle, ...labelTypography.style }}
    >
      {label}
      {showRequiredIndicator && (
        <span className="ml-1" style={requiredIndicatorStyle}>
          *
        </span>
      )}
    </Label>
  ) : null

  const labelNode =
    labelElement && labelTooltip ? (
      <Tooltip>
        <TooltipTrigger asChild>{labelElement}</TooltipTrigger>
        <TooltipContent side="top" align="start">
          {labelTooltip}
        </TooltipContent>
      </Tooltip>
    ) : (
      labelElement
    )

  const labelBlock =
    label || labelCaption ? (
      <div
        className={cn('flex flex-col gap-0.5', labelAlignmentClass, labelHiddenClass)}
        style={labelWidthStyle}
      >
        {labelNode}
        {labelCaption && (
          <div className={cn('text-[11px] text-muted-foreground', labelWrapClass)} style={captionStyle}>
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

export const TextInputDefinition = createWidgetDefinition<TextInputProps>({
  type: 'TextInput',
  label: 'Input',
  category: 'inputs',
  description: 'Single-line input with add-ons',
  defaultProps: {
    label: 'Label',
    labelCaption: '',
    labelHide: false,
    labelWrap: false,
    labelPosition: 'top',
    labelAlign: 'left',
    labelWidthValue: '',
    labelWidthUnit: 'col',
    labelCaptionColor: '',
    labelTextColor: '',
    labelFont: 'default',
    labelRequiredIndicatorColor: '',
    placeholder: 'Enter a value',
    value: '',
    helperText: '',
    disabled: false,
    events: '[]',
    prefix: '',
    suffix: '',
    prefixIcon: 'none',
    suffixIcon: 'none',
    tooltip: '',
    tooltipText: '',
    spellCheck: false,
    enableBrowserAutofill: false,
    autoFill: 'off',
    autoCapitalize: 'none',
    readOnly: false,
    loading: false,
    formDataKey: '{{self.id}}',
    pattern: 'none',
    regex: '',
    minLength: undefined,
    maxLength: undefined,
    enforceMaxLength: false,
    min: undefined,
    max: undefined,
    step: undefined,
    required: false,
    customRule: '',
    showClearButton: false,
    showPasswordToggle: false,
    hideValidationMessage: false,
    showCharacterCount: false,
    characterCountPosition: 'inline',
    preventScroll: false,
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
    type: 'text',
    addonBeforeType: 'none',
    addonBeforeText: '',
    addonBeforeOptions: '',
    addonBeforeValue: '',
    addonBeforeButtonLabel: '',
    addonAfterType: 'none',
    addonAfterText: '',
    addonAfterOptions: '',
    addonAfterValue: '',
    addonAfterButtonLabel: '',
    actionType: 'none',
    actionLabel: '',
    actionIcon: 'none',
    actionTooltip: '',
  },
  events: ['change', 'focus', 'blur', 'submit', 'action'],
  builder: {
    resizeHandles: ['e', 'w'],
    eventOptions: [
      { value: 'change', label: 'Change' },
      { value: 'focus', label: 'Focus' },
      { value: 'blur', label: 'Blur' },
      { value: 'submit', label: 'Submit' },
      { value: 'action', label: 'Action' },
    ],
  },
  render: (props, context) => <TextInputRenderer props={props} context={context} />,
})
