/**
 * FX-модель inspector: helper-компоненты и утилиты для обработки выражений/FX-полей.
 */
import type { WidgetField } from 'widgets/runtime'
import { resolveValue } from 'lib/builder/value-resolver'
import {
  formatValueKindLabel,
  formatValuePreview,
  formatValueTypeLabel,
  getValueTypeLabel,
  inferValueKind,
  parseValueTypeTokens,
} from '../../components'

const IDENTIFIER_RE = /^[A-Za-z_$][A-Za-z0-9_$]*$/

export const isValidIdentifier = (value: string) => IDENTIFIER_RE.test(value)

export const fieldAllowsFx = (field: WidgetField) => {
  if (field.valueType) {
    const tokens = parseValueTypeTokens(field.valueType)
    if (tokens.length > 0) {
      return tokens.includes('undefined')
    }
  }
  return Boolean(field.supportsFx)
}

export const isTemplateValueField = (field: WidgetField) => {
  if (!fieldAllowsFx(field)) {
    return false
  }
  const tokens = parseValueTypeTokens(field.valueType)
  if (tokens.length > 0) {
    return tokens.includes('string')
  }
  return field.type === 'text'
}

export const isFxValue = (value: unknown) =>
  typeof value === 'string' && /\{\{[\s\S]*\}\}/.test(value)

const evaluateExpression = (expression: string, context: Record<string, unknown>) => {
  try {
    const fn = new Function('context', `with (context) { return (${expression}); }`)
    return { value: fn(context) }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Invalid expression' }
  }
}

const evaluateFxInput = (
  raw: string,
  mode: 'expression' | 'template',
  context: Record<string, unknown>,
  allowPlainString = false
) => {
  const trimmed = raw.trim()
  if (!trimmed) {
    return { value: undefined }
  }

  if (mode === 'expression') {
    if (allowPlainString && !isFxValue(trimmed)) {
      return { value: raw }
    }
    const expression = isFxValue(trimmed) ? trimmed.slice(2, -2).trim() : trimmed
    return evaluateExpression(expression, context)
  }

  if (trimmed.startsWith('{{') && trimmed.endsWith('}}')) {
    const expression = trimmed.slice(2, -2).trim()
    return evaluateExpression(expression, context)
  }

  if (trimmed.includes('{{')) {
    return { value: resolveValue(raw, context) }
  }

  return { value: raw }
}

export const toFxExpression = (field: WidgetField, value: unknown) => {
  if (typeof value === 'string' && isFxValue(value)) {
    return value
  }

  if (field.type === 'number') {
    const numeric =
      typeof value === 'number'
        ? value
        : typeof value === 'string' && value.trim()
          ? Number(value)
          : NaN
    return `{{ ${Number.isFinite(numeric) ? String(numeric) : 'null'} }}`
  }

  if (field.type === 'boolean') {
    const normalized =
      typeof value === 'boolean'
        ? value
        : typeof value === 'string'
          ? value.trim().toLowerCase() === 'true'
          : Boolean(value)
    return `{{ ${normalized ? 'true' : 'false'} }}`
  }

  if (field.type === 'select' || field.type === 'radioGroup') {
    const textValue = typeof value === 'string' ? value : ''
    return `{{ ${JSON.stringify(textValue)} }}`
  }

  const textValue =
    typeof value === 'string'
      ? value
      : value === null || typeof value === 'undefined'
        ? ''
        : String(value)
  return `{{ ${JSON.stringify(textValue)} }}`
}

export const coerceFxToStatic = (field: WidgetField, value: unknown) => {
  const resolved = typeof value === 'string' ? resolveValue(value, {}) : value

  if (field.type === 'number') {
    const numeric =
      typeof resolved === 'number'
        ? resolved
        : typeof resolved === 'string' && resolved.trim()
          ? Number(resolved)
          : NaN
    return Number.isFinite(numeric) ? numeric : ''
  }

  if (field.type === 'boolean') {
    if (typeof resolved === 'boolean') {
      return resolved
    }
    if (typeof resolved === 'string') {
      const normalized = resolved.trim().toLowerCase()
      if (normalized === 'true') {
        return true
      }
      if (normalized === 'false') {
        return false
      }
    }
    return false
  }

  if (field.type === 'select' || field.type === 'radioGroup') {
    const selected = typeof resolved === 'string' ? resolved : ''
    return field.options.some((option) => option.value === selected)
      ? selected
      : field.options[0]?.value ?? ''
  }

  const textValue =
    typeof resolved === 'string'
      ? resolved
      : resolved === null || typeof resolved === 'undefined'
        ? ''
        : String(resolved)
  return isFxValue(textValue) ? '' : textValue
}

const FxInlineHint = ({
  valueType,
  description,
  status,
  message,
  valueTypeLabel,
  valuePreview,
}: {
  valueType?: string | string[]
  description?: string
  status?: 'ok' | 'error'
  message?: string
  valueTypeLabel?: string
  valuePreview?: string
}) => {
  const valueTypeDisplay = formatValueTypeLabel(valueType)
  if (!valueTypeDisplay && !description && !status) {
    return null
  }

  return (
    <div className="rounded-md border border-foreground-muted/30 bg-background p-2 text-[11px] shadow-sm">
      {(valueTypeDisplay || description) && (
        <div className="space-y-1">
          {valueTypeDisplay && (
            <div className="text-[11px] font-semibold">{valueTypeDisplay}</div>
          )}
          {description && (
            <div className="text-[11px] text-foreground-muted">{description}</div>
          )}
        </div>
      )}
      {status && (
        <div
          className={`mt-2 rounded-md border p-2 ${
            status === 'error'
              ? 'border-red-200 bg-red-50 text-red-600'
              : 'border-emerald-200 bg-emerald-50 text-emerald-700'
          } max-h-40 overflow-y-auto`}
        >
          {status === 'error' && <div className="font-semibold">Error</div>}
          {message && <div className="text-[11px]">{message}</div>}
          {valueTypeLabel && (
            <div className="mt-1 text-[11px] font-semibold">{valueTypeLabel}</div>
          )}
          {valuePreview && (
            <div className="mt-1 whitespace-pre-wrap font-mono text-[11px]">
              {valuePreview}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export const buildFxInlineHint = (
  field: WidgetField,
  value: unknown,
  mode: 'expression' | 'template',
  context: Record<string, unknown>
) => {
  const valueType = getValueTypeLabel(field)
  const description = field.description
  if (!valueType && !description) {
    return null
  }

  const rawValue =
    typeof value === 'string'
      ? value
      : value === null || typeof value === 'undefined'
        ? ''
        : String(value)
  const trimmed = rawValue.trim()
  const allowedTypes = parseValueTypeTokens(valueType)
  const allowPlainString = allowedTypes.includes('string')
  const evaluation = evaluateFxInput(rawValue, mode, context, allowPlainString)
  const useBooleanVoidDefault =
    !trimmed &&
    !evaluation.error &&
    allowedTypes.includes('boolean') &&
    allowedTypes.includes('undefined')
  const evaluationValue = useBooleanVoidDefault ? false : evaluation.value
  const hasValue = trimmed.length > 0 || useBooleanVoidDefault
  const kind = inferValueKind(evaluationValue)
  const actualTypeLabel = formatValueKindLabel(kind)
  const valuePreview = hasValue ? formatValuePreview(evaluationValue, kind) : undefined

  let status: 'ok' | 'error' | undefined
  let message: string | undefined

  if (evaluation.error) {
    status = 'error'
    message = evaluation.error
  } else if (hasValue && allowedTypes.length > 0) {
    const isAllowed = allowedTypes.includes(kind)
    if (!isAllowed) {
      status = 'error'
      const expected = valueType?.toLowerCase() ?? ''
      const actual = kind === 'undefined' ? 'void' : kind
      message = `The value has to be of type '${expected}', you provided '${actual}'`
    } else {
      status = 'ok'
    }
  } else if (hasValue) {
    status = 'ok'
  }

  return (
    <FxInlineHint
      valueType={valueType}
      description={description}
      status={status}
      message={message}
      valueTypeLabel={status ? actualTypeLabel : undefined}
      valuePreview={status ? valuePreview : undefined}
    />
  )
}
