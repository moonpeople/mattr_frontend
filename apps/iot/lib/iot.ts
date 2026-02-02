import { API_URL, BASE_PATH, IOT_API_URL, IS_PLATFORM } from 'lib/constants'

const hasProjectPlaceholder = (value: string) =>
  value.includes('{ref}') || value.includes('{projectRef}') || value.includes(':ref')

const applyProjectPlaceholder = (value: string, projectRef: string) => {
  return value
    .replace(/\{ref\}/g, projectRef)
    .replace(/\{projectRef\}/g, projectRef)
    .replace(/:ref\b/g, projectRef)
}

const normalizePath = (pathname: string) => {
  if (!BASE_PATH) return pathname
  if (pathname.startsWith(BASE_PATH)) {
    const trimmed = pathname.slice(BASE_PATH.length)
    return trimmed === '' ? '/' : trimmed
  }
  return pathname
}

export const getProjectRefFromPath = (pathname?: string) => {
  if (typeof pathname !== 'string') {
    if (typeof window === 'undefined') return undefined
    pathname = window.location.pathname || ''
  }

  const normalized = normalizePath(pathname)
  const parts = normalized.split('/').filter(Boolean)
  const projectIndex = parts.indexOf('project')
  if (projectIndex === -1) return undefined
  return parts[projectIndex + 1]
}

export const getIotApiUrl = (projectRef?: string) => {
  const raw = (IOT_API_URL || '').trim()
  const resolvedRef = projectRef || (IS_PLATFORM ? getProjectRefFromPath() : undefined)

  if (raw) {
    if (hasProjectPlaceholder(raw)) {
      return resolvedRef ? applyProjectPlaceholder(raw, resolvedRef) : ''
    }
    return raw
  }

  if (IS_PLATFORM && resolvedRef) {
    return `${API_URL}/projects/${resolvedRef}/iot`
  }

  return ''
}

export const getIotApiBaseUrl = (projectRef?: string) => {
  const base = getIotApiUrl(projectRef)
  return base.endsWith('/') ? base.slice(0, -1) : base
}
