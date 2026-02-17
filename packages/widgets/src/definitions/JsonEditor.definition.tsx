import { useEffect, useMemo, useRef, useState } from 'react'
import Editor, { type OnChange, type OnMount } from '@monaco-editor/react'

import { normalizeString } from '../helpers'
import { createWidgetDefinition } from '../types'
import type { WidgetRenderContext } from '../types'

export type JsonEditorProps = {
  value: unknown
  disabled: boolean
  readOnly: boolean
  formDataKey: string
  events: string
}

const normalizeJsonValue = (value: unknown) => {
  if (typeof value === 'string') {
    return value
  }
  if (typeof value === 'undefined') {
    return ''
  }
  const serialized = safeJsonStringify(value, 2)
  return typeof serialized === 'string' ? serialized : normalizeString(value, '')
}

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)

const safeJsonStringify = (value: unknown, space: number) => {
  const seen = new WeakSet<object>()
  try {
    return JSON.stringify(
      value,
      (_key, current) => {
        if (typeof current === 'bigint') {
          return current.toString()
        }
        if (typeof current === 'function') {
          return '[Function]'
        }
        if (typeof current === 'object' && current !== null) {
          if (seen.has(current)) {
            return '[Circular]'
          }
          seen.add(current)
        }
        return current
      },
      space
    )
  } catch {
    return undefined
  }
}

const resolveTemplateValue = (rawValue: string, context: Record<string, unknown>) => {
  const trimmed = rawValue.trim()
  if (!trimmed) {
    return rawValue
  }

  const evaluateExpression = (expression: string): { ok: true; value: unknown } | { ok: false } => {
    try {
      // eslint-disable-next-line no-new-func
      const fn = new Function('context', `with (context) { return (${expression}); }`)
      return { ok: true, value: fn(context) }
    } catch {
      return { ok: false }
    }
  }

  if (trimmed.startsWith('{{') && trimmed.endsWith('}}')) {
    const expression = trimmed.slice(2, -2).trim()
    const result = evaluateExpression(expression)
    if (!result.ok || typeof result.value === 'undefined') {
      return rawValue
    }
    return result.value
  }

  return rawValue.replace(/\{\{\s*([\s\S]+?)\s*\}\}/g, (match, expression) => {
    const result = evaluateExpression(String(expression).trim())
    if (!result.ok || typeof result.value === 'undefined') {
      return match
    }
    return String(result.value)
  })
}

const resolveDynamicValue = (
  value: unknown,
  context: Record<string, unknown>,
  seen = new WeakSet<object>(),
  budget = 50
): unknown => {
  if (budget <= 0) {
    return value
  }
  if (typeof value === 'string') {
    const resolved = resolveTemplateValue(value, context)
    if (resolved === value) {
      return value
    }
    return resolveDynamicValue(resolved, context, seen, budget - 1)
  }

  if (typeof value === 'object' && value !== null) {
    if (seen.has(value)) {
      return value
    }
    seen.add(value)
  }

  if (Array.isArray(value)) {
    const nextContext = { ...context, self: value }
    return value.map((item) => resolveDynamicValue(item, nextContext, seen, budget))
  }

  if (isPlainObject(value)) {
    const nextContext = { ...context, self: value }
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        resolveDynamicValue(item, nextContext, seen, budget),
      ])
    )
  }

  return value
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

const isJsonValid = (value: string) => {
  const trimmed = value.trim()
  if (!trimmed) {
    return true
  }
  try {
    JSON.parse(trimmed)
    return true
  } catch {
    return false
  }
}

const JsonEditorRenderer = ({
  props,
  context,
}: {
  props: JsonEditorProps
  context?: WidgetRenderContext
}) => {
  const [isFocused, setIsFocused] = useState(false)

  const rawValue = context?.state?.value ?? props.value
  const hasTemplateSyntax =
    typeof rawValue === 'string' && rawValue.includes('{{') && rawValue.includes('}}')
  const resolvedValue = context?.evaluationContext
    ? resolveDynamicValue(rawValue, context.evaluationContext)
    : rawValue

  let baseValue = normalizeJsonValue(resolvedValue)
  if (
    hasTemplateSyntax &&
    typeof resolvedValue === 'string' &&
    resolvedValue !== rawValue &&
    resolvedValue.trim() &&
    !isJsonValid(resolvedValue)
  ) {
    // When an FX expression resolves to a string (e.g. {{ editableText1.value }}),
    // render it as a valid JSON string literal.
    baseValue = JSON.stringify(resolvedValue)
  }
  const [canvasValue, setCanvasValue] = useState(baseValue)
  const value = context?.mode === 'canvas' ? canvasValue : baseValue
  const lastBaseValueRef = useRef(baseValue)

  const isDisabled = parseBoolean(props.disabled)
  const isReadOnly = parseBoolean(props.readOnly)
  const validation = useMemo(() => isJsonValid(value), [value])

  useEffect(() => {
    if (!context?.setState) {
      return
    }
    const currentValid = typeof context?.state?.valid === 'boolean' ? context.state.valid : undefined
    if (currentValid === validation) {
      return
    }
    context.setState({ valid: validation })
  }, [context, validation])

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

  const handleChange = (next: string) => {
    const nextValid = isJsonValid(next)
    if (context?.setState) {
      context.setState({ value: next, valid: nextValid })
      if (context?.mode !== 'canvas') {
        context.runActions?.('change', { value: next, valid: nextValid })
      }
      if (context?.mode === 'canvas') {
        setCanvasValue(next)
      }
      return
    }
    if (context?.mode === 'canvas') {
      setCanvasValue(next)
      return
    }
    context?.runActions?.('change', { value: next, valid: nextValid })
  }

  const handleEditorMount: OnMount = (editor) => {
    editor.onDidFocusEditorText(() => {
      setIsFocused(true)
      context?.runActions?.('focus', { value: editor.getValue() })
    })
    editor.onDidBlurEditorText(() => {
      setIsFocused(false)
      context?.runActions?.('blur', { value: editor.getValue() })
    })
  }

  const handleEditorChange: OnChange = (nextValue) => {
    handleChange(nextValue ?? '')
  }

  return (
    <div className="h-full">
      <div
        className={`h-full overflow-hidden rounded-md border ${
          validation ? 'border-input' : 'border-destructive'
        } ${isDisabled ? 'pointer-events-none opacity-60' : ''}`}
      >
        <Editor
          className="monaco-editor"
          theme="supabase"
          language="json"
          value={value}
          height="100%"
          loading={<div className="p-3 text-xs text-muted-foreground">Loading...</div>}
          options={{
            readOnly: isReadOnly || isDisabled,
            tabSize: 2,
            fontSize: 13,
            minimap: { enabled: false },
            wordWrap: 'on',
            fixedOverflowWidgets: true,
            lineNumbersMinChars: 4,
            scrollBeyondLastLine: false,
          }}
          onMount={handleEditorMount}
          onChange={handleEditorChange}
        />
      </div>
    </div>
  )
}

export const JsonEditorDefinition = createWidgetDefinition<JsonEditorProps>({
  type: 'JsonEditor',
  label: 'JSON Editor',
  category: 'data',
  description: 'Edit JSON content',
  defaultProps: {
    value: '',
    disabled: false,
    readOnly: false,
    formDataKey: '{{self.id}}',
    events: '[]',
  },
  events: ['change', 'focus', 'blur'],
  builder: {
    eventOptions: [
      { value: 'change', label: 'Change' },
      { value: 'focus', label: 'Focus' },
      { value: 'blur', label: 'Blur' },
    ],
  },
  render: (props, context) => <JsonEditorRenderer props={props} context={context} />,
})
