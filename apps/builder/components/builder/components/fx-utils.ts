import type { WidgetField } from 'widgets'

const FX_BASE_CONTEXT = {
  state: {},
  widgets: {},
  queries: {},
  auth: { user: {} },
  current_user: {},
  localStorage: {},
  theme: {},
  location: {},
  viewport: { width: 0, height: 0 },
  retoolContext: {
    appName: '',
    currentPage: '',
    environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? 'local',
    inEditorMode: true,
    pages: [],
    runningQueries: [],
    translations: {},
  },
} as const

const COMPLETION_MAX_DEPTH = 3
const COMPLETION_MAX_KEYS = 200
const COMPLETION_KEYWORDS = [
  'case',
  'catch',
  'class',
  'const',
  'continue',
  'debugger',
  'default',
  'delete',
  'do',
  'else',
  'export',
  'extends',
  'finally',
  'for',
  'function',
  'if',
  'import',
  'in',
  'instanceof',
  'let',
  'new',
  'return',
  'super',
  'switch',
  'this',
  'throw',
  'try',
  'typeof',
  'var',
  'void',
  'while',
  'with',
  'yield',
  'true',
  'false',
  'null',
  'undefined',
]
const COMPLETION_FUNCTIONS = [
  'encodeURI',
  'decodeURI',
  'encodeURIComponent',
  'decodeURIComponent',
  'escape',
  'unescape',
  'parseInt',
  'parseFloat',
  'isFinite',
  'isNaN',
]
const COMPLETION_GLOBALS: Array<{
  name: string
  kind: 'function' | 'object' | 'var' | 'module'
}> = [
  { name: 'String', kind: 'var' },
  { name: 'Number', kind: 'var' },
  { name: 'Boolean', kind: 'var' },
  { name: 'Array', kind: 'var' },
  { name: 'Object', kind: 'var' },
  { name: 'Map', kind: 'var' },
  { name: 'Set', kind: 'var' },
  { name: 'Date', kind: 'var' },
  { name: 'RegExp', kind: 'var' },
  { name: 'Promise', kind: 'var' },
  { name: 'Symbol', kind: 'var' },
  { name: 'Math', kind: 'object' },
  { name: 'JSON', kind: 'object' },
  { name: 'Intl', kind: 'module' },
  { name: 'URL', kind: 'var' },
  { name: 'URLSearchParams', kind: 'var' },
]

const IDENTIFIER_RE = /^[A-Za-z_$][A-Za-z0-9_$]*$/
const isValidIdentifier = (value: string) => IDENTIFIER_RE.test(value)

const FX_VALUE_TYPE_FALLBACKS: Partial<Record<WidgetField['type'], string>> = {
  boolean: 'Boolean | Void',
  number: 'Number | Void',
  select: 'String | Void',
  text: 'String | Void',
  textarea: 'String | Void',
  json: 'Object | Void',
}

const normalizeValueTypeToken = (token: string) => {
  const normalized = token.trim().toLowerCase()
  if (!normalized) {
    return null
  }
  if (normalized === 'void' || normalized === 'undefined') {
    return 'undefined'
  }
  if (normalized === 'bool' || normalized === 'boolean') {
    return 'boolean'
  }
  if (normalized === 'str' || normalized === 'string') {
    return 'string'
  }
  if (normalized === 'int' || normalized === 'float' || normalized === 'number') {
    return 'number'
  }
  if (normalized === 'json' || normalized === 'object') {
    return 'object'
  }
  if (normalized === 'array') {
    return 'array'
  }
  if (normalized === 'null') {
    return 'null'
  }
  return normalized
}

const parseValueTypeTokens = (valueType?: string) => {
  if (!valueType) {
    return []
  }
  return valueType
    .split(/[|/]/)
    .map((token) => normalizeValueTypeToken(token))
    .filter((token): token is string => Boolean(token))
}

const inferValueKind = (value: unknown) => {
  if (typeof value === 'undefined') {
    return 'undefined'
  }
  if (value === null) {
    return 'null'
  }
  if (Array.isArray(value)) {
    return 'array'
  }
  const type = typeof value
  if (type === 'string' || type === 'number' || type === 'boolean' || type === 'function') {
    return type
  }
  if (type === 'object') {
    return 'object'
  }
  return 'unknown'
}

const formatValueKindLabel = (kind: string) => {
  if (kind === 'undefined') {
    return 'Void'
  }
  if (kind === 'null') {
    return 'Null'
  }
  return `${kind.charAt(0).toUpperCase()}${kind.slice(1)}`
}

const formatValuePreview = (value: unknown, kind: string) => {
  if (kind === 'undefined') {
    return 'undefined'
  }
  if (kind === 'null') {
    return 'null'
  }
  if (kind === 'string') {
    return JSON.stringify(value ?? '')
  }
  if (kind === 'number' || kind === 'boolean') {
    return String(value)
  }
  try {
    const json = JSON.stringify(value, null, 2)
    return json && json.length > 220 ? `${json.slice(0, 217)}...` : json
  } catch {
    return String(value)
  }
}

const buildCompletionMetadata = (
  context: Record<string, unknown>
) => {
  const entries = new Map<
    string,
    { kind?: string; detail?: string; documentation?: string; appendDot?: boolean }
  >()
  let totalKeys = 0

  const addEntry = (path: string, value: unknown) => {
    if (entries.has(path)) {
      return
    }
    const kind = inferValueKind(value)
    const detail =
      kind === 'undefined' ? 'void' : kind === 'function' ? 'function' : kind
    const preview = formatValuePreview(value, kind)
    entries.set(path, {
      kind,
      detail,
      documentation: preview,
      appendDot: kind === 'object',
    })
  }

  const walk = (value: unknown, path: string, depth: number) => {
    if (!path) {
      return
    }
    addEntry(path, value)
    if (
      !value ||
      typeof value !== 'object' ||
      Array.isArray(value) ||
      depth >= COMPLETION_MAX_DEPTH ||
      totalKeys >= COMPLETION_MAX_KEYS
    ) {
      return
    }
    const entriesList = Object.entries(value as Record<string, unknown>)
    for (const [key, child] of entriesList) {
      if (!isValidIdentifier(key)) {
        continue
      }
      const nextPath = `${path}.${key}`
      totalKeys += 1
      if (totalKeys > COMPLETION_MAX_KEYS) {
        break
      }
      walk(child, nextPath, depth + 1)
    }
  }

  Object.entries(context).forEach(([key, value]) => {
    if (!isValidIdentifier(key)) {
      return
    }
    walk(value, key, 0)
  })

  COMPLETION_KEYWORDS.forEach((keyword) => {
    entries.set(keyword, {
      kind: 'keyword',
      detail: 'keyword',
      documentation: keyword,
    })
  })
  COMPLETION_GLOBALS.forEach((item) => {
    entries.set(item.name, {
      kind: item.kind,
      detail: item.kind === 'function' ? 'function' : item.kind,
      documentation: item.name,
      appendDot:
        item.kind === 'object' || item.kind === 'module' || item.kind === 'var'
          ? false
          : undefined,
    })
  })
  COMPLETION_FUNCTIONS.forEach((fn) => {
    entries.set(fn, {
      kind: 'function',
      detail: 'function',
      documentation: `${fn}()`,
    })
  })

  return Object.fromEntries(entries)
}

const buildFxEditorLibs = ({
  widgetIds,
  queryNames,
  scriptNames,
  stateKeys,
}: {
  widgetIds: string[]
  queryNames: string[]
  scriptNames: string[]
  stateKeys: string[]
}) => {
  const stateShape =
    stateKeys.length > 0
      ? `{ ${stateKeys.map((key) => `${key}?: any`).join('; ')} }`
      : 'Record<string, any>'
  const declarations = [
    `declare const state: ${stateShape};`,
    'declare const widgets: Record<string, any>;',
    'declare const queries: Record<string, any>;',
    'declare const auth: Record<string, any>;',
    'declare const current_user: Record<string, any>;',
    'declare const self: Record<string, any>;',
    'declare const localStorage: Record<string, any>;',
    'declare const theme: Record<string, any>;',
    'declare const location: Record<string, any>;',
    'declare const viewport: { width: number; height: number; };',
    'declare const retoolContext: { appName: string; currentPage: string; environment: string; inEditorMode: boolean; pages: string[]; runningQueries: string[]; translations: Record<string, string>; };',
  ]

  widgetIds.forEach((id) => {
    declarations.push(`declare const ${id}: Record<string, any>;`)
  })
  queryNames.forEach((name) => {
    declarations.push(`declare const ${name}: { data: any; isFetching: boolean; };`)
  })
  scriptNames.forEach((name) => {
    declarations.push(`declare function ${name}(...args: any[]): any;`)
  })

  return [declarations.join('\n')]
}

const getValueTypeLabel = (field: WidgetField) =>
  field.valueType ?? FX_VALUE_TYPE_FALLBACKS[field.type]

export {
  FX_BASE_CONTEXT,
  FX_VALUE_TYPE_FALLBACKS,
  parseValueTypeTokens,
  inferValueKind,
  formatValueKindLabel,
  formatValuePreview,
  buildCompletionMetadata,
  buildFxEditorLibs,
  getValueTypeLabel,
}
