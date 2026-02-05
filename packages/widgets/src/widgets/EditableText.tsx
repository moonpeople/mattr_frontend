import { useEffect, useMemo, useRef, useState, type CSSProperties, type MouseEvent } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Pencil,
  Settings,
  Star,
  User,
  X,
} from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger, cn } from 'ui'

import type { WidgetDefinition, WidgetRenderContext } from '../types'
import { normalizeString } from '../helpers'
import { EditableTextInspector } from './EditableText.inspector'

type EditableTextIcon = 'none' | 'star' | 'alert' | 'user' | 'settings' | 'check' | 'edit'

type EditableTextProps = {
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
  prefixIcon: EditableTextIcon
  suffixIcon: EditableTextIcon
  editIcon: EditableTextIcon
  tooltip: string
  addons?: string[]
  styles?: string[]
  validationRules?: string[]
  spellCheck: boolean
  enableBrowserAutofill: boolean
  autoCapitalize: 'none' | 'sentences' | 'words' | 'characters'
  readOnly: boolean
  loading: boolean
  formDataKey: string
  pattern: 'none' | 'email' | 'regex' | 'url'
  regex: string
  minLength?: number
  maxLength?: number
  required: boolean
  customRule: string
  showClearButton: boolean
  hideValidationMessage: boolean
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

const iconMap = {
  none: null,
  star: Star,
  alert: AlertCircle,
  user: User,
  settings: Settings,
  check: CheckCircle2,
  edit: Pencil,
} as const


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

const resolveIcon = (icon: EditableTextIcon, className?: string) => {
  const Icon = iconMap[icon] ?? null
  if (!Icon) {
    return null
  }
  return <Icon className={className} size={16} />
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
    pattern: EditableTextProps['pattern']
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

const EditableTextRenderer = ({
  props,
  context,
}: {
  props: EditableTextProps
  context?: WidgetRenderContext
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const rawValue = context?.state?.value ?? props.value
  const resolvedValue =
    context?.mode === 'canvas' && typeof rawValue === 'string' && context?.evaluationContext
      ? resolveTemplateValue(rawValue, context.evaluationContext)
      : rawValue
  const value = normalizeString(resolvedValue)
  const label = normalizeString(props.label)
  const labelCaption = normalizeString(props.labelCaption)
  const placeholder = normalizeString(props.placeholder)
  const helperText = normalizeString(props.helperText)
  const prefixText = normalizeString(props.prefix)
  const suffixText = normalizeString(props.suffix)
  const tooltip = normalizeString(props.tooltip)
  const regexValue = normalizeString(props.regex)
  const customRuleValue = normalizeString(props.customRule)

  const isPreview = context?.mode === 'preview'
  const isCanvas = context?.mode === 'canvas'
  const isDisabled = parseBoolean(props.disabled)
  const isReadOnly = parseBoolean(props.readOnly)
  const showClearButton = parseBoolean(props.showClearButton)
  const showLoading = parseBoolean(props.loading)
  const alwaysShowInEditMode = parseBoolean(props.alwaysShowInEditMode)
  const hideLabel = parseBoolean(props.labelHide)
  const allowLabelWrap = parseBoolean(props.labelWrap)
  const labelPosition = props.labelPosition ?? 'top'
  const labelAlign = props.labelAlign ?? 'left'

  const showOnDesktop = parseBoolean(props.showOnDesktop, true)
  const showOnMobile = parseBoolean(props.showOnMobile, true)

  const minLength = parseNumber(props.minLength)
  const maxLength = parseNumber(props.maxLength)

  const canEdit = isPreview && !isDisabled
  const shouldShowInput = isEditing || (isCanvas && alwaysShowInEditMode)

  useEffect(() => {
    if (!isEditing || !inputRef.current) {
      return
    }
    inputRef.current.focus()
    inputRef.current.select()
  }, [isEditing])

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

  const handleChange = (nextValue: string) => {
    context?.setState?.({ value: nextValue })
    context?.runActions?.('change', { value: nextValue })
  }

  const handleBlur = () => {
    setIsFocused(false)
    if (isEditing) {
      setIsEditing(false)
    }
    context?.runActions?.('blur', { value })
  }

  const handleFocus = () => {
    setIsFocused(true)
    context?.runActions?.('focus', { value })
  }

  const helperMessage = helperText && isFocused ? helperText : ''
  const showValidationMessage =
    validation.invalid && !parseBoolean(props.hideValidationMessage)

  const handleLabelInspectorOpen = (event: MouseEvent<HTMLDivElement>) => {
    if (!isCanvas || !context?.openInspectorPanel) {
      return
    }
    event.stopPropagation()
    context.openInspectorPanel({ key: 'label', label: 'Label' })
  }

  const visibilityClass = isPreview
    ? !showOnDesktop && !showOnMobile
      ? 'hidden'
      : !showOnDesktop
        ? 'md:hidden'
        : !showOnMobile
          ? 'hidden md:block'
          : ''
    : ''

  const baseFontStyle = props.fontFamily ? { fontFamily: props.fontFamily } : undefined

  const inputId = context?.widgetId ? `editable-text-${context.widgetId}` : undefined

  const containerStyle: CSSProperties = {
    backgroundColor: props.inputBackground || undefined,
    borderRadius: props.inputBorderRadius || undefined,
    ...(isFocused && props.accentColor ? { borderColor: props.accentColor } : null),
    ...(props.hoverBackground ? { '--editable-hover-bg': props.hoverBackground } : null),
  }

  const inputStyle: CSSProperties = {
    color: props.inputTextColor || undefined,
    ...(props.inputPlaceholderColor
      ? { '--editable-input-placeholder': props.inputPlaceholderColor }
      : null),
  }

  const labelStyle: CSSProperties = {
    color: props.labelTextColor || props.baseTextColor || undefined,
  }

  const displayStyle: CSSProperties = {
    color: props.baseTextColor || undefined,
  }

  const placeholderStyle: CSSProperties = {
    color: props.placeholderColor || undefined,
  }

  const captionStyle: CSSProperties = {
    color: props.labelCaptionColor || undefined,
  }

  const requiredIndicatorStyle: CSSProperties = {
    color: props.labelRequiredIndicatorColor || undefined,
  }

  const labelTypographyClass =
    props.labelFont && props.labelFont !== 'default' ? props.labelFont : ''
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

  const prefixNode =
    props.prefixIcon !== 'none' || prefixText ? (
      <div className="flex items-center gap-2 text-xs text-foreground-muted">
        {resolveIcon(props.prefixIcon, 'text-foreground-muted')}
        {prefixText && <span>{prefixText}</span>}
      </div>
    ) : null

  const suffixNode =
    props.suffixIcon !== 'none' || suffixText ? (
      <div className="flex items-center gap-2 text-xs text-foreground-muted">
        {suffixText && <span>{suffixText}</span>}
        {resolveIcon(props.suffixIcon, 'text-foreground-muted')}
      </div>
    ) : null

  const editIcon =
    props.editIcon !== 'none' && !isDisabled && !isReadOnly
      ? resolveIcon(props.editIcon, 'text-foreground-muted')
      : null

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
        {label && (
          <label
            htmlFor={inputId}
            className={cn('text-xs font-medium text-foreground', labelTypographyClass, labelWrapClass)}
            style={labelStyle}
          >
            {label}
            {showRequiredIndicator && (
              <span className="ml-1" style={requiredIndicatorStyle}>
                *
              </span>
            )}
          </label>
        )}
        {labelCaption && (
          <div className={cn('text-[11px] text-foreground-muted', labelWrapClass)} style={captionStyle}>
            {labelCaption}
          </div>
        )}
      </div>
    ) : null

  const inputBlock = (
    <div className="space-y-1">
      {shouldShowInput ? (
        <div
          className={cn(
            'flex min-h-9 w-full items-center gap-2 rounded-md border border-foreground-muted/40 bg-surface-100 px-2 py-1 text-sm transition',
            !isDisabled && props.hoverBackground ? 'hover:bg-[--editable-hover-bg]' : null,
            isDisabled ? 'cursor-not-allowed opacity-60' : 'cursor-text'
          )}
          style={containerStyle}
        >
          {prefixNode}
          <input
            ref={inputRef}
            type="text"
            id={inputId}
            value={value}
            placeholder={placeholder}
            name={props.formDataKey || undefined}
            spellCheck={parseBoolean(props.spellCheck, true)}
            autoCapitalize={props.autoCapitalize}
            autoComplete={parseBoolean(props.enableBrowserAutofill, true) ? 'on' : 'off'}
            readOnly={isReadOnly}
            disabled={isDisabled}
            minLength={minLength}
            maxLength={maxLength}
            required={parseBoolean(props.required)}
            aria-invalid={validation.invalid}
            onChange={(event) => handleChange(event.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className={cn(
              'flex-1 bg-transparent outline-none placeholder:text-foreground-muted',
              props.inputPlaceholderColor
                ? 'placeholder:text-[--editable-input-placeholder]'
                : null
            )}
            style={inputStyle}
          />
          {suffixNode}
          {showClearButton && value && !isDisabled && !isReadOnly && (
            <button
              type="button"
              className="rounded-sm p-1 text-foreground-muted hover:bg-foreground-muted/10"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => handleChange('')}
            >
              <X size={14} />
            </button>
          )}
          {showLoading && <Loader2 className="h-4 w-4 animate-spin text-foreground-muted" />}
        </div>
      ) : (
        <button
          type="button"
          className={cn(
            'flex min-h-9 w-full items-center gap-2 rounded-md border border-foreground-muted/40 bg-surface-100 px-2 py-1 text-left text-sm transition',
            !isDisabled && props.hoverBackground ? 'hover:bg-[--editable-hover-bg]' : null,
            isDisabled ? 'cursor-not-allowed opacity-60' : 'cursor-text'
          )}
          style={containerStyle}
          onClick={(event) => {
            if (!canEdit) {
              return
            }
            event.preventDefault()
            setIsEditing(true)
          }}
        >
          {prefixNode}
          <span
            className={cn('flex-1 truncate', !value ? 'text-foreground-muted' : null)}
            style={value ? displayStyle : placeholderStyle}
          >
            {value || placeholder || ' '}
          </span>
          {suffixNode}
          {editIcon}
        </button>
      )}
      {helperMessage && <div className="text-xs text-foreground-muted">{helperMessage}</div>}
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

  if (!tooltip) {
    return content
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{content}</TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  )
}

export const EditableTextWidget: WidgetDefinition<EditableTextProps> = {
  type: 'EditableText',
  label: 'Editable Text',
  category: 'inputs',
  description: 'Inline editable text',
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
    placeholder: 'Enter value',
    value: '',
    helperText: '',
    disabled: false,
    events: '[]',
    prefix: '',
    suffix: '',
    prefixIcon: 'none',
    suffixIcon: 'none',
    editIcon: 'edit',
    tooltip: '',
    spellCheck: true,
    enableBrowserAutofill: true,
    autoCapitalize: 'none',
    readOnly: false,
    loading: false,
    formDataKey: '{{self.id}}',
    pattern: 'none',
    regex: '',
    minLength: undefined,
    maxLength: undefined,
    required: false,
    customRule: '',
    showClearButton: false,
    hideValidationMessage: false,
    maintainSpaceWhenHidden: false,
    alwaysShowInEditMode: false,
    showOnDesktop: true,
    showOnMobile: true,
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
  fields: EditableTextInspector.fields,
  builder: {
    resizeHandles: ['e', 'w'],
    eventOptions: [
      { value: 'change', label: 'Change' },
      { value: 'focus', label: 'Focus' },
      { value: 'blur', label: 'Blur' },
    ],
  },
  render: (props, context) => <EditableTextRenderer props={props} context={context} />,
}
