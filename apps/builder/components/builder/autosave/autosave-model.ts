/**
 * Модель autosave: общие типы и helper-функции для сигнатур и состояния автосохранения.
 */
export const stableStringify = (value: unknown) => {
  // Deterministic JSON signature:
  // - Sort object keys (stable across JS engines and server roundtrips).
  // - Preserve array order (arrays are order-sensitive in schema).
  // - Only treat real cycles as circular (repeat references are allowed).
  const stack = new WeakSet<object>()

  const normalize = (input: unknown): unknown => {
    if (input === null) {
      return null
    }
    if (typeof input === 'bigint') {
      return input.toString()
    }
    if (typeof input === 'string' || typeof input === 'number' || typeof input === 'boolean') {
      return input
    }
    if (typeof input === 'undefined' || typeof input === 'function' || typeof input === 'symbol') {
      return undefined
    }
    if (typeof input !== 'object') {
      return input
    }

    const maybeToJson = (input as { toJSON?: () => unknown }).toJSON
    if (typeof maybeToJson === 'function') {
      return normalize(maybeToJson.call(input))
    }

    if (stack.has(input)) {
      return '[Circular]'
    }
    stack.add(input)

    try {
      if (Array.isArray(input)) {
        return input.map((item) => normalize(item))
      }

      const record = input as Record<string, unknown>
      const keys = Object.keys(record).sort()
      const output: Record<string, unknown> = {}
      keys.forEach((key) => {
        const normalizedValue = normalize(record[key])
        // Match JSON.stringify behavior: omit undefined object fields.
        if (typeof normalizedValue === 'undefined') {
          return
        }
        output[key] = normalizedValue
      })
      return output
    } finally {
      stack.delete(input)
    }
  }

  return JSON.stringify(normalize(value))
}

export const findFirstSchemaDiff = (
  a: unknown,
  b: unknown,
  path = '$',
  stack = new WeakMap<object, WeakSet<object>>()
): { path: string; a: unknown; b: unknown } | null => {
  if (Object.is(a, b)) {
    return null
  }
  if (a === null || b === null) {
    return { path, a, b }
  }
  const typeA = typeof a
  const typeB = typeof b
  if (typeA !== typeB) {
    return { path, a, b }
  }
  if (typeA !== 'object') {
    return { path, a, b }
  }

  const objA = a as object
  const objB = b as object
  const seenForA = stack.get(objA) ?? new WeakSet<object>()
  if (!stack.has(objA)) {
    stack.set(objA, seenForA)
  }
  if (seenForA.has(objB)) {
    return null
  }
  seenForA.add(objB)

  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b)) {
      return { path, a, b }
    }
    if (a.length !== b.length) {
      return { path: `${path}.length`, a: a.length, b: b.length }
    }
    for (let i = 0; i < a.length; i += 1) {
      const diff = findFirstSchemaDiff(a[i], b[i], `${path}[${i}]`, stack)
      if (diff) {
        return diff
      }
    }
    return null
  }

  const recA = a as Record<string, unknown>
  const recB = b as Record<string, unknown>
  const keysA = Object.keys(recA).sort()
  const keysB = Object.keys(recB).sort()
  if (keysA.length !== keysB.length) {
    return { path: `${path}.__keys__`, a: keysA, b: keysB }
  }
  for (let i = 0; i < keysA.length; i += 1) {
    if (keysA[i] !== keysB[i]) {
      return { path: `${path}.__keys__`, a: keysA, b: keysB }
    }
  }
  for (const key of keysA) {
    const diff = findFirstSchemaDiff(recA[key], recB[key], `${path}.${key}`, stack)
    if (diff) {
      return diff
    }
  }
  return null
}
