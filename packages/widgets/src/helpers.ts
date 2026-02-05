export const parseMaybeJson = (value: unknown) => {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) {
      return null
    }
    if (trimmed.includes('{{') && trimmed.includes('}}')) {
      return null
    }
    try {
      return JSON.parse(trimmed)
    } catch {
      return null
    }
  }

  return value ?? null
}

export const normalizeArray = <T>(value: unknown, fallback: T[] = []) => {
  if (Array.isArray(value)) {
    return value as T[]
  }
  return fallback
}

export const normalizeString = (value: unknown, fallback = '') => {
  if (typeof value === 'string') {
    return value
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }
  return fallback
}
