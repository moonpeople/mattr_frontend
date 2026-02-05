const expressionPattern = /\{\{\s*([\s\S]+?)\s*\}\}/g

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)

const evaluateExpression = (expression: string, context: Record<string, unknown>) => {
  try {
    // eslint-disable-next-line no-new-func
    const fn = new Function('context', `with (context) { return (${expression}); }`)
    return fn(context)
  } catch {
    return undefined
  }
}

export const resolveValue = (value: unknown, context: Record<string, unknown>): unknown => {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (trimmed.startsWith('{{') && trimmed.endsWith('}}')) {
      const expression = trimmed.slice(2, -2).trim()
      const evaluated = evaluateExpression(expression, context)
      return typeof evaluated === 'undefined' ? value : evaluated
    }

    return value.replace(expressionPattern, (match, rawExpression) => {
      const evaluated = evaluateExpression(String(rawExpression).trim(), context)
      if (typeof evaluated === 'undefined') {
        return match
      }
      return String(evaluated)
    })
  }

  if (Array.isArray(value)) {
    return value.map((item) => resolveValue(item, context))
  }

  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, resolveValue(item, context)])
    )
  }

  return value
}
