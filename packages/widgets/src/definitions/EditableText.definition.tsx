import { useEffect, useMemo, useRef, useState, type CSSProperties, type MouseEvent } from 'react'
import { cn } from 'ui'
import { Input, Tooltip, TooltipContent, TooltipTrigger } from '../shadcn'

import { createWidgetDefinition } from '../types'
import type { WidgetRenderContext } from '../types'
import { normalizeString } from '../helpers'
import { renderWidgetIcon } from '../icon-library'

export type EditableTextIcon =
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

export type EditableTextProps = {
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
  tooltipText: string
  addons?: string[]
  styles?: string[]
  validationRules?: string[]
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
  icon: EditableTextIcon,
  className: string | undefined,
  iconLibrary?: string
) => {
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
  const rawValue = context?.state?.value ?? props.value
  const resolvedValue =
    context?.mode === 'canvas' && typeof rawValue === 'string' && context?.evaluationContext
      ? resolveTemplateValue(rawValue, context.evaluationContext)
      : rawValue
  const baseValue = normalizeString(resolvedValue)
  const [isEditing, setIsEditing] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [canvasValue, setCanvasValue] = useState(baseValue)
  const value = context?.mode === 'canvas' ? canvasValue : baseValue
  const [draftValue, setDraftValue] = useState(value)
  const lastBaseValueRef = useRef(baseValue)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const initialValueRef = useRef('')
  const cancelRef = useRef(false)

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
  const isCanvas = context?.mode === 'canvas'
  const isDisabled = parseBoolean(props.disabled)
  const isReadOnly = parseBoolean(props.readOnly)
  const autoCompleteValue = resolveAutoComplete(
    parseBoolean(props.enableBrowserAutofill, false),
    autoFillValue
  )
  const showClearButton = parseBoolean(props.showClearButton)
  const showLoading = parseBoolean(props.loading)
  const hideLabel = parseBoolean(props.labelHide)
  const allowLabelWrap = parseBoolean(props.labelWrap)
  const labelPosition = props.labelPosition ?? 'top'
  const labelAlign = props.labelAlign ?? 'left'

  const showOnDesktop = parseBoolean(props.showOnDesktop, true)
  const showOnMobile = parseBoolean(props.showOnMobile, true)

  const minLength = parseNumber(props.minLength)
  const maxLength = parseNumber(props.maxLength)
  const enforceMaxLength = parseBoolean(props.enforceMaxLength)

  const canEdit = (isPreview || isCanvas) && !isDisabled && !isReadOnly
  const shouldShowInput = isEditing
  const isEditingActive = (isPreview || isCanvas) && isEditing
  const currentValue = isEditingActive ? draftValue : value

  useEffect(() => {
    if (isEditing) {
      initialValueRef.current = value
    }
    setDraftValue(value)
  }, [isEditing, value])

  useEffect(() => {
    if (context?.mode !== 'canvas') {
      return
    }
    if (lastBaseValueRef.current === baseValue) {
      return
    }
    lastBaseValueRef.current = baseValue
    if (isEditing) {
      return
    }
    setCanvasValue(baseValue)
  }, [baseValue, context?.mode, isEditing])

  useEffect(() => {
    if (!context?.setState) {
      return
    }
    const currentInputValue = normalizeString(context?.state?.inputValue)
    if (currentInputValue === currentValue) {
      return
    }
    context.setState({ inputValue: currentValue })
  }, [context, currentValue])

  useEffect(() => {
    if (!isEditing || !inputRef.current) {
      return
    }
    inputRef.current.focus()
    inputRef.current.select()
  }, [isEditing])

  const validation = useMemo(
    () =>
      validateValue(currentValue, {
        pattern: props.pattern,
        regex: regexValue,
        minLength,
        maxLength,
        required: props.required,
        customRule: customRuleValue,
      }),
    [
      currentValue,
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

  const commitDraft = (nextValue: string) => {
    if (context?.setState) {
      if (nextValue === value) {
        return
      }
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
      if (nextValue === value) {
        return
      }
      setCanvasValue(nextValue)
      return
    }
  }

  const handleChange = (nextValue: string) => {
    if (isEditingActive) {
      setDraftValue(nextValue)
      return
    }
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
    }
  }

  const handleBlur = () => {
    const isCancel = cancelRef.current
    setIsFocused(false)
    if (isEditingActive) {
      if (!isCancel) {
        commitDraft(draftValue)
      }
      setIsEditing(false)
    }
    cancelRef.current = false
    context?.runActions?.('blur', {
      value: isCancel ? initialValueRef.current : isEditingActive ? draftValue : value,
    })
  }

  const handleFocus = () => {
    setIsFocused(true)
    context?.runActions?.('focus', { value: currentValue })
  }

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

  const textTypography = resolveTypography(props.fontFamily)
  const baseFontStyle =
    textTypography.style?.fontFamily ? { fontFamily: textTypography.style.fontFamily } : undefined

  const inputId = context?.widgetId ? `editable-text-${context.widgetId}` : undefined

  const containerStyle: CSSProperties = {
    backgroundColor: props.inputBackground || undefined,
    borderRadius: props.inputBorderRadius || undefined,
    ...(isFocused && props.accentColor ? { borderColor: props.accentColor } : null),
    ...(props.hoverBackground ? { '--editable-hover-bg': props.hoverBackground } : null),
  }
  const displayContainerStyle: CSSProperties = {
    borderRadius: props.inputBorderRadius || undefined,
    ...(props.hoverBackground ? { '--editable-hover-bg': props.hoverBackground } : null),
  }

  const inputStyle: CSSProperties = {
    color: props.inputTextColor || undefined,
    ...(props.inputPlaceholderColor
      ? { '--editable-input-placeholder': props.inputPlaceholderColor }
      : null),
    ...(textTypography.style ?? null),
  }

  const labelStyle: CSSProperties = {
    color: props.labelTextColor || props.baseTextColor || undefined,
  }

  const displayStyle: CSSProperties = {
    color: props.baseTextColor || undefined,
    ...(textTypography.style ?? null),
  }

  const placeholderStyle: CSSProperties = {
    color: props.placeholderColor || undefined,
    ...(textTypography.style ?? null),
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
  const editIconValue = resolveTemplateProp(props.editIcon)
  const prefixIcon =
    (typeof prefixIconValue === 'string' && prefixIconValue.trim()
      ? prefixIconValue
      : 'none') as EditableTextIcon
  const suffixIcon =
    (typeof suffixIconValue === 'string' && suffixIconValue.trim()
      ? suffixIconValue
      : 'none') as EditableTextIcon
  const editIconName =
    (typeof editIconValue === 'string' && editIconValue.trim()
      ? editIconValue
      : 'none') as EditableTextIcon

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

  const editIcon =
    editIconName !== 'none' && !isDisabled && !isReadOnly
      ? resolveIcon(editIconName, 'text-muted-foreground', context?.iconLibrary)
      : null

  const labelElement = label ? (
    <label
      htmlFor={inputId}
      className={cn(
        'text-xs font-medium text-foreground',
        labelTypography.className,
        labelWrapClass,
        labelTooltip ? 'underline decoration-dotted underline-offset-2' : null
      )}
      style={{ ...labelStyle, ...labelTypography.style }}
    >
      {label}
      {showRequiredIndicator && (
        <span className="ml-1" style={requiredIndicatorStyle}>
          *
        </span>
      )}
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
      {shouldShowInput ? (
        <Tooltip open={Boolean(helperText) && isEditingActive && isFocused}>
          <TooltipTrigger asChild>
            <div
              className={cn(
                'flex min-h-9 w-full items-center gap-2 rounded-md border border-input bg-background px-2 py-1 text-sm transition',
                !isDisabled && props.hoverBackground ? 'hover:bg-[--editable-hover-bg]' : null,
                isDisabled ? 'cursor-not-allowed opacity-60' : 'cursor-text'
              )}
              style={containerStyle}
            >
              {prefixNode}
              <Input
                inputRef={inputRef}
                type="text"
                id={inputId}
                value={currentValue}
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
                  if (!isEditingActive) {
                    return
                  }
                  if (event.key === 'Escape') {
                    event.preventDefault()
                    cancelRef.current = true
                    setDraftValue(initialValueRef.current)
                    setIsEditing(false)
                    setIsFocused(false)
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
                  props.inputPlaceholderColor
                    ? 'placeholder:text-[--editable-input-placeholder]'
                    : null
                )}
                style={inputStyle}
              />
              {suffixNode}
              {showClearButton && currentValue && !isDisabled && !isReadOnly && (
                <button
                  type="button"
                  className="rounded-sm p-1 text-muted-foreground hover:bg-muted-foreground/10"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => handleChange('')}
                >
                  {renderWidgetIcon('x', { library: context?.iconLibrary, size: 14 })}
                </button>
              )}
              {showLoading
                ? renderWidgetIcon('loader', {
                    library: context?.iconLibrary,
                    className: 'h-4 w-4 animate-spin text-muted-foreground',
                  })
                : null}
            </div>
          </TooltipTrigger>
          {helperText ? (
            <TooltipContent side="bottom" align="start">
              {helperText}
            </TooltipContent>
          ) : null}
        </Tooltip>
      ) : (
        <button
          type="button"
          className={cn(
            'flex min-h-9 w-full items-center gap-2 rounded-md bg-muted px-2 py-1 text-left text-sm transition',
            !isDisabled && props.hoverBackground ? 'hover:bg-[--editable-hover-bg]' : null,
            isDisabled ? 'cursor-not-allowed opacity-60' : 'cursor-text'
          )}
          style={displayContainerStyle}
          data-no-drag={isCanvas ? 'true' : undefined}
          onMouseDown={(event) => {
            if (!canEdit) {
              return
            }
            event.preventDefault()
            setIsEditing(true)
          }}
          onKeyDown={(event) => {
            if (!canEdit) {
              return
            }
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              setIsEditing(true)
            }
          }}
        >
          {prefixNode}
          <span
            className={cn(
              'flex-1 truncate',
              textTypography.className,
              !value ? 'text-muted-foreground' : null
            )}
            style={value ? displayStyle : placeholderStyle}
          >
            {value || placeholder || ' '}
          </span>
          {suffixNode}
          {editIcon}
        </button>
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

export const EditableTextDefinition = createWidgetDefinition<EditableTextProps>({
  type: 'EditableText',
  label: 'Editable Text',
  category: 'inputs',
  description: 'Inline editable text',
  defaultProps: {
    label: 'Label',
    labelCaption: '',
    labelHide: false,
    labelWrap: false,
    labelPosition: 'left',
    labelAlign: 'left',
    labelWidthValue: '',
    labelWidthUnit: 'col',
    labelCaptionColor: '',
    labelTextColor: '',
    labelFont: 'default',
    labelRequiredIndicatorColor: '',
    placeholder: 'Enter a value',
    value: '',
    helperText: 'Shift+Enter to save, Esc to cancel',
    disabled: false,
    events: '[]',
    prefix: '',
    suffix: '',
    prefixIcon: 'none',
    suffixIcon: 'none',
    editIcon: 'edit',
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
    showClearButton: false,
    hideValidationMessage: false,
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
  builder: {
    resizeHandles: ['e', 'w'],
    eventOptions: [
      { value: 'change', label: 'Change' },
      { value: 'focus', label: 'Focus' },
      { value: 'blur', label: 'Blur' },
    ],
  },
  render: (props, context) => <EditableTextRenderer props={props} context={context} />,
})
