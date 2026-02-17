import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { cn } from 'ui'

import { Label, Textarea, Tooltip, TooltipContent, TooltipTrigger } from '../shadcn'
import { normalizeString } from '../helpers'
import { createWidgetDefinition } from '../types'
import type { WidgetRenderContext } from '../types'

export type TextAreaProps = {
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
  rows: number
  autoResize: boolean
  minLines?: number
  maxLines?: number
  helperText: string
  disabled: boolean
  events: string
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
  required: boolean
  customRule: string
  hideValidationMessage: boolean
  showCharacterCount: boolean
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
    pattern,
    regex,
    minLength,
    maxLength,
    required,
    customRule,
  }: {
    pattern: TextAreaProps['pattern']
    regex: string
    minLength?: number
    maxLength?: number
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

const TextAreaRenderer = ({
  props,
  context,
}: {
  props: TextAreaProps
  context?: WidgetRenderContext
}) => {
  const [isFocused, setIsFocused] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

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
  const labelTooltip = normalizeString(resolveTemplateProp(props.tooltipText || props.tooltip))
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
  const showCharacterCount = parseBoolean(props.showCharacterCount)
  const hideLabel = parseBoolean(props.labelHide)
  const allowLabelWrap = parseBoolean(props.labelWrap)
  const labelPosition = props.labelPosition ?? 'top'
  const labelAlign = props.labelAlign ?? 'left'
  const autoResize = parseBoolean(props.autoResize, true)

  const showOnDesktop = parseBoolean(props.showOnDesktop, true)
  const showOnMobile = parseBoolean(props.showOnMobile, true)

  const minLength = parseNumber(props.minLength)
  const maxLength = parseNumber(props.maxLength)
  const enforceMaxLength = parseBoolean(props.enforceMaxLength)

  const rowsValue = parseNumber(props.rows) ?? 4
  const minLinesRaw = parseNumber(props.minLines)
  const maxLinesRaw = parseNumber(props.maxLines)
  const minLines = Math.max(1, typeof minLinesRaw === 'number' ? minLinesRaw : rowsValue)
  const maxLines = typeof maxLinesRaw === 'number' && maxLinesRaw >= minLines ? maxLinesRaw : undefined

  const validation = useMemo(
    () =>
      validateValue(value, {
        pattern: props.pattern,
        regex: regexValue,
        minLength,
        maxLength,
        required: props.required,
        customRule: customRuleValue,
      }),
    [
      value,
      props.pattern,
      regexValue,
      minLength,
      maxLength,
      props.required,
      customRuleValue,
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

  useEffect(() => {
    const element = textareaRef.current
    if (!element) {
      return
    }
    if (!autoResize) {
      element.style.height = ''
      element.style.overflowY = ''
      return
    }
    const computed = window.getComputedStyle(element)
    const lineHeight = Number.parseFloat(computed.lineHeight || '') || 20
    const borderSize = element.offsetHeight - element.clientHeight
    const minHeight = minLines * lineHeight + borderSize
    const maxHeight = typeof maxLines === 'number' ? maxLines * lineHeight + borderSize : undefined
    element.style.height = 'auto'
    let nextHeight = element.scrollHeight
    if (nextHeight < minHeight) {
      nextHeight = minHeight
    }
    if (maxHeight && nextHeight > maxHeight) {
      nextHeight = maxHeight
    }
    element.style.height = `${nextHeight}px`
    element.style.overflowY = maxHeight && element.scrollHeight > maxHeight ? 'auto' : 'hidden'
  }, [value, autoResize, minLines, maxLines])

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

  const inputId = context?.widgetId ? `text-area-${context.widgetId}` : undefined

  const inputStyle: CSSProperties = {
    backgroundColor: props.inputBackground || undefined,
    borderRadius: props.inputBorderRadius || undefined,
    ...(isFocused && props.accentColor ? { borderColor: props.accentColor } : null),
    ...(props.hoverBackground ? { '--input-hover-bg': props.hoverBackground } : null),
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

  const labelElement = label ? (
    <Label
      htmlFor={inputId}
      className={cn(
        'text-xs font-medium text-foreground',
        labelTypography.className,
        labelWrapClass,
        labelTooltip ? 'underline decoration-dashed decoration-1 underline-offset-2' : null
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
      <div className={cn('flex flex-col gap-0.5', labelAlignmentClass, labelHiddenClass)} style={labelWidthStyle}>
        {labelNode}
        {labelCaption && (
          <div className={cn('text-[11px] text-muted-foreground', labelWrapClass)} style={captionStyle}>
            {labelCaption}
          </div>
        )}
      </div>
    ) : null

  const inputElement = (
    <Textarea
      textareaRef={textareaRef}
      id={inputId}
      rows={autoResize ? minLines : rowsValue}
      placeholder={placeholder}
      value={value}
      name={props.formDataKey || undefined}
      disabled={isDisabled}
      readOnly={isReadOnly}
      spellCheck={parseBoolean(props.spellCheck, false)}
      autoComplete={autoCompleteValue}
      autoCapitalize={props.autoCapitalize}
      minLength={minLength}
      maxLength={enforceMaxLength ? maxLength : undefined}
      required={parseBoolean(props.required)}
      aria-invalid={validation.invalid}
      onChange={(event) => handleChange(event.target.value)}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={(event) => {
        if (event.key === 'Enter' && event.shiftKey) {
          // Keep Enter as "new line", but allow Shift+Enter to "save" by blurring without inserting a newline.
          event.preventDefault()
          textareaRef.current?.blur()
        }
      }}
      className={cn(
        !isDisabled && props.hoverBackground ? 'hover:bg-[--input-hover-bg]' : null,
        props.inputPlaceholderColor ? 'placeholder:text-[--input-placeholder]' : null,
        textTypography.className
      )}
      style={inputStyle}
    />
  )

  const inputWithHelper =
    helperMessage ? (
      <Tooltip open>
        <TooltipTrigger asChild>
          <div className="min-w-0 flex-1 border-input bg-background">{inputElement}</div>
        </TooltipTrigger>
        <TooltipContent side="bottom" align="start">
          {helperMessage}
        </TooltipContent>
      </Tooltip>
    ) : (
      <div className="min-w-0 flex-1">{inputElement}</div>
    )

  const characterCount = value.length
  const inputBlock = (
    <div className="space-y-1">
      {inputWithHelper}
      {showCharacterCount && (
        <div className="text-xs text-muted-foreground tabular-nums text-right">
          {typeof maxLength === 'number' ? `${characterCount}/${maxLength}` : characterCount}
        </div>
      )}
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

export const TextAreaDefinition = createWidgetDefinition<TextAreaProps>({
  type: 'TextArea',
  label: 'Text Area',
  category: 'inputs',
  description: 'Multi-line text input',
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
    rows: 4,
    autoResize: true,
    minLines: undefined,
    maxLines: undefined,
    helperText: '',
    disabled: false,
    events: '[]',
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
    required: false,
    customRule: '',
    hideValidationMessage: false,
    showCharacterCount: false,
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
  },
  events: ['change', 'focus', 'blur'],
  builder: {
    eventOptions: [
      { value: 'change', label: 'Change' },
      { value: 'focus', label: 'Focus' },
      { value: 'blur', label: 'Blur' },
    ],
  },
  render: (props, context) => <TextAreaRenderer props={props} context={context} />,
})
