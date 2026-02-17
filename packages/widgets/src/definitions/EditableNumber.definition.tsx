import { useEffect, useMemo, useRef, useState, type CSSProperties, type MouseEvent } from 'react'
import { cn } from 'ui'
import { Input, Tooltip, TooltipContent, TooltipTrigger } from '../shadcn'

import { normalizeString } from '../helpers'
import { createWidgetDefinition, type WidgetRenderContext } from '../types'
import { renderWidgetIcon } from '../icon-library'

export type EditableNumberIcon =
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

export type EditableNumberFormat = 'decimal' | 'percent' | 'currency'

export type EditableNumberProps = {
  label: string
  labelCaption: string
  labelHide: boolean
  labelWrap: boolean
  labelPosition: 'left' | 'top'
  labelAlign: 'left' | 'right'
  labelWidthValue: string
  labelWidthUnit: 'px' | '%' | 'col'
  placeholder: string
  value: string | number | null
  helperText: string
  min?: number
  max?: number
  disabled: boolean
  readOnly: boolean
  required: boolean
  loading: boolean
  format: EditableNumberFormat
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
  iconBefore: EditableNumberIcon
  iconAfter: EditableNumberIcon
  editIcon: EditableNumberIcon
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

const resolveIcon = (
  icon: EditableNumberIcon,
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
  const maximumFractionDigits =
    typeof decimalPlaces === 'number' ? decimalPlaces : undefined
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
  if (typeof min === 'number' && typeof numericValue === 'number' && numericValue < min) {
    return { invalid: true, message: validationMessage || `Min ${min}` }
  }
  if (typeof max === 'number' && typeof numericValue === 'number' && numericValue > max) {
    return { invalid: true, message: validationMessage || `Max ${max}` }
  }
  const customResult = evaluateCustomRule(customValidation, trimmed)
  if (customResult === false) {
    return { invalid: true, message: validationMessage || 'Invalid value' }
  }
  return { invalid: false, message: '' }
}

const EditableNumberRenderer = ({
  props,
  context,
}: {
  props: EditableNumberProps
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

  const evaluationContext = context?.evaluationContext
  const resolveTemplateProp = (propValue: unknown) =>
    evaluationContext && typeof propValue === 'string'
      ? resolveTemplateValue(propValue, evaluationContext)
      : propValue

  const label = normalizeString(resolveTemplateProp(props.label))
  const labelCaption = normalizeString(resolveTemplateProp(props.labelCaption))
  const placeholder = normalizeString(resolveTemplateProp(props.placeholder))
  const helperText = normalizeString(resolveTemplateProp(props.helperText))
  const format = (resolveTemplateProp(props.format) ?? 'decimal') as EditableNumberFormat
  const allowNull = parseBoolean(resolveTemplateProp(props.allowNull))

  const prefixText =
    normalizeString(resolveTemplateProp(props.textBefore)) ||
    (format === 'currency' ? normalizeString(resolveTemplateProp(props.currency)) : '')
  const suffixText =
    normalizeString(resolveTemplateProp(props.textAfter)) || (format === 'percent' ? '%' : '')

  const iconBeforeValue = resolveTemplateProp(props.iconBefore)
  const iconAfterValue = resolveTemplateProp(props.iconAfter)
  const editIconValue = resolveTemplateProp(props.editIcon)
  const iconBefore =
    (typeof iconBeforeValue === 'string' && iconBeforeValue.trim()
      ? iconBeforeValue
      : 'none') as EditableNumberIcon
  const iconAfter =
    (typeof iconAfterValue === 'string' && iconAfterValue.trim()
      ? iconAfterValue
      : 'none') as EditableNumberIcon
  const editIconName =
    (typeof editIconValue === 'string' && editIconValue.trim()
      ? editIconValue
      : 'none') as EditableNumberIcon

  const labelTooltip = normalizeString(resolveTemplateProp(props.tooltipText))

  const isPreview = context?.mode === 'preview'
  const isCanvas = context?.mode === 'canvas'
  const isDisabled = parseBoolean(resolveTemplateProp(props.disabled))
  const isReadOnly = parseBoolean(resolveTemplateProp(props.readOnly))
  const canEdit = (isPreview || isCanvas) && !isDisabled && !isReadOnly
  const shouldShowInput = isEditing
  const isEditingActive = (isPreview || isCanvas) && isEditing
  const currentValue = isEditingActive ? draftValue : value

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

  const inputId = context?.widgetId ? `editable-number-${context.widgetId}` : undefined

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
      resolveValidation({
        value: currentValue,
        required: parseBoolean(resolveTemplateProp(props.required)),
        allowNull,
        min: props.min,
        max: props.max,
        customValidation: normalizeString(resolveTemplateProp(props.customValidation)),
        validationMessage: normalizeString(resolveTemplateProp(props.validationMessage)),
      }),
    [
      currentValue,
      props.required,
      allowNull,
      props.min,
      props.max,
      props.customValidation,
      props.validationMessage,
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
    const trimmed = nextValue.trim()
    const normalized = !allowNull && trimmed === '' ? '0' : nextValue

    if (context?.setState) {
      if (normalized === value) {
        return
      }
      context.setState({ value: normalized })
      if (context?.mode !== 'canvas') {
        context.runActions?.('change', { value: normalized })
      }
      if (context?.mode === 'canvas') {
        setCanvasValue(normalized)
      }
      return
    }

    if (context?.mode === 'canvas') {
      if (normalized === value) {
        return
      }
      setCanvasValue(normalized)
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

  const textAlignmentClass =
    props.textAlign === 'right' ? 'text-right' : 'text-left'

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
    textAlign: props.textAlign || 'left',
    ...(props.inputPlaceholderColor
      ? { '--editable-input-placeholder': props.inputPlaceholderColor }
      : null),
    ...(textTypography.style ?? null),
  }

  const labelStyle: CSSProperties = {
    color: props.baseTextColor || undefined,
  }

  const captionStyle: CSSProperties = {
    color: props.baseTextColor || undefined,
  }

  const displayStyle: CSSProperties = {
    color: props.baseTextColor || undefined,
    ...(textTypography.style ?? null),
  }

  const placeholderStyle: CSSProperties = {
    color: props.placeholderColor || undefined,
    ...(textTypography.style ?? null),
  }

  const handleStep = (direction: 1 | -1) => {
    const current = parseNumber(currentValue) ?? 0
    const next = current + direction
    const bounded =
      typeof props.min === 'number' && next < props.min
        ? props.min
        : typeof props.max === 'number' && next > props.max
          ? props.max
          : next
    handleChange(String(bounded))
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

  const editIcon =
    editIconName !== 'none' && !isDisabled && !isReadOnly
      ? resolveIcon(editIconName, 'text-muted-foreground', context?.iconLibrary)
      : null

  const stepperVisible =
    parseBoolean(resolveTemplateProp(props.showStepper)) && !isDisabled && !isReadOnly
  const clearVisible =
    parseBoolean(resolveTemplateProp(props.showClear)) && currentValue && !isDisabled && !isReadOnly
  const loadingVisible = parseBoolean(resolveTemplateProp(props.loading))

  const inputBlock = (
    <div className="space-y-1">
      {shouldShowInput ? (
        <Tooltip open={Boolean(helperText) && isEditingActive && isFocused}>
          <TooltipTrigger asChild>
            <div
              className={cn(
                'flex min-h-9 w-full items-center gap-2 rounded-md border border-input bg-background px-2 py-1 text-sm transition',
                !isDisabled && props.hoverBackground ? 'hover:bg-[--editable-hover-bg]' : null,
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
                value={currentValue}
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
                    : null,
                  textAlignmentClass
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
              {loadingVisible
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
              textAlignmentClass,
              !value ? 'text-muted-foreground' : null
            )}
            style={value ? displayStyle : placeholderStyle}
          >
            {(value ? formattedValue : placeholder) || ' '}
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

export const EditableNumberDefinition = createWidgetDefinition<EditableNumberProps>({
  type: 'EditableNumber',
  label: 'Editable Number',
  category: 'inputs',
  description: 'Inline editable number',
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
    value: '',
    helperText: 'Shift+Enter to save, Esc to cancel',
    min: undefined,
    max: undefined,
    disabled: false,
    readOnly: false,
    required: false,
    loading: false,
    format: 'decimal',
    currency: '',
    decimalPlaces: undefined,
    padDecimal: false,
    showSeparators: true,
    showStepper: true,
    allowNull: false,
    preventScroll: false,
    textAlign: 'left',
    textBefore: '',
    textAfter: '',
    iconBefore: 'none',
    iconAfter: 'none',
    editIcon: 'edit',
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
  render: (props, context) => <EditableNumberRenderer props={props} context={context} />,
})
