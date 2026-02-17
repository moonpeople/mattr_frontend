/**
 * Селекторы и чистые helper-функции BuilderShell: парсинг URL/localStorage и нормализация code tabs.
 */
import type { BuilderCodeTab } from '../BuilderCodeTabs'
import type { BuilderCodeSelection } from '../BuilderCodeUtils'

export const parseBoolean = (value: unknown, fallback = false) => {
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

export const buildCodeTab = (
  selection: BuilderCodeSelection,
  canvasTabId: string
): BuilderCodeTab | null => {
  if (!selection) {
    return null
  }
  if (selection.type === 'canvas') {
    return { id: canvasTabId, type: 'canvas' }
  }
  return {
    id: `${selection.type}-${selection.id}`,
    type: selection.type,
    entityId: selection.id,
  }
}

export const normalizeCodeTabs = (
  tabs: BuilderCodeTab[],
  canvasTabId: string
): BuilderCodeTab[] => {
  const withoutCanvas = tabs.filter((tab) => tab.id !== canvasTabId)
  return [{ id: canvasTabId, type: 'canvas' as const }, ...withoutCanvas]
}

export const parseLocalStorageValues = () => {
  if (typeof window === 'undefined') {
    return {}
  }
  const values: Record<string, unknown> = {}
  for (let i = 0; i < window.localStorage.length; i += 1) {
    const key = window.localStorage.key(i)
    if (!key) {
      continue
    }
    const raw = window.localStorage.getItem(key)
    if (raw === null) {
      values[key] = null
      continue
    }
    try {
      values[key] = JSON.parse(raw)
    } catch {
      values[key] = raw
    }
  }
  return values
}

export const parseUrlParams = (params: URLSearchParams) => {
  const values: Record<string, string> = {}
  params.forEach((value, key) => {
    values[key] = value
  })
  return values
}

export const parseHashParams = (hash: string) => {
  const normalizedHash = hash.startsWith('#') ? hash.slice(1) : hash
  const params = new URLSearchParams(normalizedHash)
  return parseUrlParams(params)
}
