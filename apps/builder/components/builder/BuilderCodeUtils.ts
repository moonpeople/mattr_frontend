export type BuilderCodeScope = 'global' | 'page'
export type BuilderCodeItemType = 'query' | 'transformer' | 'variable'
export type BuilderCodeSelection = { type: BuilderCodeItemType; id: string } | null

export type BuilderCodeMeta = {
  scope?: BuilderCodeScope
  pageId?: string
  response?: Record<string, unknown>
  advanced?: Record<string, unknown>
  additionalScope?: string
  eventHandlers?: Record<string, unknown>[]
}

export type BuilderTransformerMeta = {
  scope?: BuilderCodeScope
  pageId?: string
}

export const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)

export const getBuilderMeta = (config: unknown): BuilderCodeMeta => {
  if (!isPlainObject(config)) {
    return { scope: 'global' }
  }
  const meta = config._builder
  if (isPlainObject(meta)) {
    const scope = meta.scope === 'page' ? 'page' : 'global'
    const pageId = typeof meta.pageId === 'string' ? meta.pageId : undefined
    return {
      scope,
      pageId,
      response: isPlainObject(meta.response) ? meta.response : undefined,
      advanced: isPlainObject(meta.advanced) ? meta.advanced : undefined,
      additionalScope: typeof meta.additionalScope === 'string' ? meta.additionalScope : undefined,
      eventHandlers: Array.isArray(meta.eventHandlers) ? meta.eventHandlers : undefined,
    }
  }
  return { scope: 'global' }
}

export const setBuilderMeta = (
  config: Record<string, unknown>,
  meta: BuilderCodeMeta
): Record<string, unknown> => ({
  ...config,
  _builder: {
    ...(isPlainObject(config._builder) ? config._builder : {}),
    ...meta,
  },
})

export const stripBuilderMeta = (config: unknown): Record<string, unknown> => {
  if (!isPlainObject(config)) {
    return {}
  }
  const { _builder, ...rest } = config
  return rest
}

export const buildIndexedName = (prefix: string, existing: Set<string>) => {
  let index = 1
  let candidate = `${prefix}${index}`
  while (existing.has(candidate)) {
    index += 1
    candidate = `${prefix}${index}`
  }
  return candidate
}

const TRANSFORMER_META_PREFIX = '// @mattr-transformer '

export const parseTransformerMeta = (code: string) => {
  if (!code) {
    return { meta: { scope: 'global' as const }, body: '' }
  }
  const lines = code.split(/\r?\n/)
  const firstLine = lines[0]?.trim() ?? ''
  if (!firstLine.startsWith(TRANSFORMER_META_PREFIX)) {
    return { meta: { scope: 'global' as const }, body: code }
  }
  const rawMeta = firstLine.slice(TRANSFORMER_META_PREFIX.length).trim()
  try {
    const parsed = JSON.parse(rawMeta) as BuilderTransformerMeta
    const scope = parsed.scope === 'page' ? 'page' : 'global'
    const pageId = typeof parsed.pageId === 'string' ? parsed.pageId : undefined
    return { meta: { scope, pageId }, body: lines.slice(1).join('\n') }
  } catch {
    return { meta: { scope: 'global' as const }, body: code }
  }
}

export const stripTransformerMeta = (code: string) => parseTransformerMeta(code).body

export const buildTransformerCode = (code: string, meta: BuilderTransformerMeta) => {
  const parsed = parseTransformerMeta(code)
  const body = parsed.body
  if (meta.scope === 'page' && meta.pageId) {
    const header = `${TRANSFORMER_META_PREFIX}${JSON.stringify({
      scope: 'page',
      pageId: meta.pageId,
    })}`
    return `${header}\n${body}`
  }
  return body
}
