import { constructHeaders, fetchHandler } from 'data/fetchers'
import { API_URL } from 'lib/constants'
import { ResponseError } from 'types'

const resolveBuilderBase = () => {
  const apiBase = API_URL.replace('/platform', '')
  const normalizedBase = apiBase.endsWith('/api') ? apiBase : `${apiBase}/api`
  return `${normalizedBase}/builder`
}

const BUILDER_BASE_URL = resolveBuilderBase()

type BuilderRequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  body?: Record<string, unknown>
  signal?: AbortSignal
}

export const withProjectRef = (path: string, projectRef?: string) => {
  if (!projectRef) {
    return path
  }
  const separator = path.includes('?') ? '&' : '?'
  return `${path}${separator}projectRef=${encodeURIComponent(projectRef)}`
}

export async function builderRequest<T>(
  path: string,
  { method = 'GET', body, signal }: BuilderRequestOptions = {}
) {
  const headers = await constructHeaders({ 'Content-Type': 'application/json' })
  const response = await fetchHandler(`${BUILDER_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    signal,
  })

  if (response.status === 204) {
    return null as T
  }

  let payload: any = null
  try {
    payload = await response.json()
  } catch {
    payload = null
  }

  if (!response.ok) {
    const message = payload?.message || payload?.error || 'Builder request failed'
    throw new ResponseError(message, response.status)
  }

  return payload as T
}
