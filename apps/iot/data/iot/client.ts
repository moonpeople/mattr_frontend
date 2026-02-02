import { getAccessToken } from 'common'
import { getIotApiBaseUrl } from 'lib/iot'

type IotApiError = {
  error?:
    | {
        code?: string | number
        message?: string
        details?: Record<string, unknown>
      }
    | string
}

const normalizeUrl = (path: string) => {
  const baseUrl = getIotApiBaseUrl()
  if (!baseUrl) {
    throw new Error('IOT_API_URL is not configured')
  }
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`
}

export async function iotFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const url = normalizeUrl(path)
  const headers = new Headers(init.headers)

  if (!headers.has('Accept')) headers.set('Accept', 'application/json')
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  if (!headers.has('Authorization')) {
    const accessToken = await getAccessToken()
    if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`)
  }

  const response = await fetch(url, { ...init, headers })
  const contentType = response.headers.get('Content-Type') || ''
  const isJson = contentType.includes('application/json')

  if (!response.ok) {
    if (isJson) {
      const body = (await response.json().catch(() => null)) as
        | (IotApiError & { errors?: Record<string, unknown> })
        | null
      if (body?.errors && typeof body.errors === 'object') {
        const entries = Object.entries(body.errors)
        const [field, messages] = entries[0] || []
        const firstMessage = Array.isArray(messages) ? messages[0] : messages
        const message = field ? `${field} ${firstMessage}` : String(firstMessage || 'Error')
        const error = new Error(`IoT API error: ${message}`)
        ;(error as { details?: Record<string, unknown> }).details = body.errors
        throw error
      }
      const message =
        typeof body?.error === 'string'
          ? body.error
          : body?.error?.message || body?.error?.code || response.statusText
      const error = new Error(`IoT API error: ${message}`)
      if (body?.error?.details && typeof body.error.details === 'object') {
        ;(error as { details?: Record<string, unknown> }).details =
          body.error.details as Record<string, unknown>
      }
      throw error
    }
    throw new Error(`IoT API error: ${response.status} ${response.statusText}`)
  }

  if (!isJson) {
    return (await response.text()) as unknown as T
  }

  const body = (await response.json().catch(() => null)) as { data?: T } | null
  if (body && typeof body === 'object' && 'data' in body) {
    return body.data as T
  }

  return body as T
}
