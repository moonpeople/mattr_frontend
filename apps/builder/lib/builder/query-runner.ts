import { getKeys, type APIKey } from 'data/api-keys/api-keys-query'
import { getOrRefreshTemporaryApiKey } from 'data/api-keys/temp-api-keys-utils'

type QueryRunnerOptions = {
  config: Record<string, unknown>
  queryType: string
  projectRef?: string
  projectRestUrl?: string | null
  accessToken?: string | null
  apiKeys?: APIKey[]
}

const templatePattern = /\{\{\s*([\w.-]+)\s*\}\}/g

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)

const safeJsonParse = (value: string) => {
  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}

const extractTemplateKeys = (value: unknown, keys: Set<string> = new Set()) => {
  if (typeof value === 'string') {
    for (const match of value.matchAll(templatePattern)) {
      if (match[1]) {
        keys.add(match[1])
      }
    }
    return keys
  }

  if (Array.isArray(value)) {
    value.forEach((item) => extractTemplateKeys(item, keys))
    return keys
  }

  if (isPlainObject(value)) {
    Object.values(value).forEach((item) => extractTemplateKeys(item, keys))
  }

  return keys
}

const resolveTemplateValue = (
  value: unknown,
  replacements: Record<string, string | undefined>
): unknown => {
  if (typeof value === 'string') {
    return value.replace(templatePattern, (match, key) => replacements[key] ?? match)
  }

  if (Array.isArray(value)) {
    return value.map((item) => resolveTemplateValue(item, replacements))
  }

  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, resolveTemplateValue(item, replacements)])
    )
  }

  return value
}

const normalizeRestUrl = (restUrl: string) => {
  if (restUrl.endsWith('/rest/v1')) {
    return `${restUrl}/`
  }
  if (restUrl.endsWith('/rest/v1/')) {
    return restUrl
  }
  if (restUrl.endsWith('/')) {
    return `${restUrl}rest/v1/`
  }
  return `${restUrl}/rest/v1/`
}

const deriveSupabaseUrls = (projectRestUrl?: string | null, projectRef?: string) => {
  if (projectRestUrl) {
    const restUrl = normalizeRestUrl(projectRestUrl)
    const baseUrl = restUrl.replace(/\/rest\/v1\/?$/, '')
    return {
      restUrl,
      graphqlUrl: `${baseUrl}/graphql/v1`,
    }
  }

  if (projectRef) {
    return {
      restUrl: `https://${projectRef}.supabase.co/rest/v1/`,
      graphqlUrl: `https://${projectRef}.supabase.co/graphql/v1`,
    }
  }

  return {
    restUrl: 'https://PROJECT_REF.supabase.co/rest/v1/',
    graphqlUrl: 'https://PROJECT_REF.supabase.co/graphql/v1',
  }
}

const resolveQueryUrl = (rawUrl: string, queryType: string, projectRestUrl?: string | null, projectRef?: string) => {
  if (/^https?:\/\//i.test(rawUrl)) {
    return rawUrl
  }

  const supabaseUrls = deriveSupabaseUrls(projectRestUrl, projectRef)
  const baseUrl = supabaseUrls.restUrl.replace(/\/rest\/v1\/?$/, '')
  if (rawUrl.startsWith('/')) {
    return `${baseUrl}${rawUrl}`
  }
  if (/^rest\/v1\//i.test(rawUrl)) {
    return `${baseUrl}/${rawUrl}`
  }
  if (/^graphql\/v1/i.test(rawUrl)) {
    return `${baseUrl}/${rawUrl}`
  }

  if (queryType === 'graphql') {
    return supabaseUrls.graphqlUrl
  }
  return `${supabaseUrls.restUrl}${rawUrl}`
}

export const runBuilderQuery = async ({
  config,
  queryType,
  projectRef,
  projectRestUrl,
  accessToken,
  apiKeys,
}: QueryRunnerOptions) => {
  if (!isPlainObject(config)) {
    throw new Error('Query config must be an object')
  }

  const rawUrl = config.url
  if (typeof rawUrl !== 'string' || !rawUrl.trim()) {
    throw new Error('Query config must include a url')
  }

  const { anonKey, publishableKey } = getKeys(apiKeys ?? [])
  let authAnonKey = anonKey?.api_key ?? publishableKey?.api_key

  const templateKeys = extractTemplateKeys(config)
  if (templateKeys.has('auth.anonKey') && !authAnonKey && projectRef) {
    const tempKey = await getOrRefreshTemporaryApiKey(projectRef)
    authAnonKey = tempKey.apiKey
  }

  const authValues = {
    'auth.anonKey': authAnonKey,
    'auth.accessToken': accessToken ?? undefined,
  }

  const missingKeys = [...templateKeys].filter((key) => {
    if (key !== 'auth.anonKey' && key !== 'auth.accessToken') {
      return false
    }
    return !authValues[key as keyof typeof authValues]
  })
  if (missingKeys.length > 0) {
    throw new Error(`Missing values for ${missingKeys.join(', ')}`)
  }

  const resolvedConfig = resolveTemplateValue(config, authValues)
  if (!isPlainObject(resolvedConfig)) {
    throw new Error('Query config must be an object')
  }

  const resolvedUrl = resolvedConfig.url
  if (typeof resolvedUrl !== 'string' || !resolvedUrl.trim()) {
    throw new Error('Query config must include a url')
  }
  if (resolvedUrl.includes('{{')) {
    throw new Error('Resolve template values before running the query')
  }

  const method = String(resolvedConfig.method ?? 'GET').toUpperCase()
  const headers = new Headers()
  const configHeaders = resolvedConfig.headers
  if (isPlainObject(configHeaders)) {
    Object.entries(configHeaders).forEach(([key, value]) => {
      if (typeof value === 'undefined' || value === null) {
        return
      }
      headers.set(key, String(value))
    })
  }

  if (!headers.has('accept')) {
    headers.set('accept', 'application/json')
  }

  if (!headers.has('apikey')) {
    let runtimeApiKey = authAnonKey
    if (!runtimeApiKey && projectRef) {
      const tempKey = await getOrRefreshTemporaryApiKey(projectRef)
      runtimeApiKey = tempKey.apiKey
    }
    if (runtimeApiKey) {
      headers.set('apikey', runtimeApiKey)
    }
  }

  if (!headers.has('authorization')) {
    const token = accessToken ?? headers.get('apikey')?.replace(/^Bearer\s+/i, '')
    if (token) {
      headers.set('authorization', `Bearer ${token}`)
    }
  }

  let body: BodyInit | undefined
  if (method !== 'GET' && method !== 'HEAD') {
    const rawBody = resolvedConfig.body
    if (typeof rawBody !== 'undefined') {
      if (typeof rawBody === 'string') {
        body = rawBody
      } else {
        body = JSON.stringify(rawBody)
        if (!headers.has('content-type')) {
          headers.set('content-type', 'application/json')
        }
      }
    }
  }

  const response = await fetch(resolveQueryUrl(resolvedUrl, queryType, projectRestUrl, projectRef), {
    method,
    headers,
    body,
  })

  const text = await response.text()
  const data = text ? safeJsonParse(text) : null
  if (!response.ok) {
    throw new Error(
      typeof data === 'string'
        ? data
        : data?.message ?? `Request failed with status ${response.status}`
    )
  }

  return data
}
