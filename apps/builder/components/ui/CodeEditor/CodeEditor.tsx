import Editor, { EditorProps, Monaco, OnChange, OnMount, useMonaco } from '@monaco-editor/react'
import { merge, noop } from 'lodash'
import type { IDisposable, editor } from 'monaco-editor'
import { MutableRefObject, useEffect, useRef, useState } from 'react'

import { Markdown } from 'components/interfaces/Markdown'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { formatSql } from 'lib/formatSql'
import { timeout } from 'lib/helpers'
import { cn, LogoLoader } from 'ui'
import { alignEditor } from './CodeEditor.utils'

type CodeEditorActions = { enabled: boolean; callback: (value: any) => void }
const DEFAULT_ACTIONS = {
  runQuery: { enabled: false, callback: noop },
  explainCode: { enabled: false, callback: noop },
  formatDocument: { enabled: true, callback: noop },
  placeholderFill: { enabled: true },
  closeAssistant: { enabled: false, callback: noop },
}

type CompletionStore = {
  provider: IDisposable | null
  wordsByModel: Map<string, string[]>
  metadataByModel: Map<string, CompletionMetadataMap>
}

type CompletionMetadata = {
  kind?: string
  detail?: string
  documentation?: string
  appendDot?: boolean
}

type CompletionMetadataMap = Record<string, CompletionMetadata>

type CustomSuggestionItem = {
  label: string
  insertText: string
  kind?: string
  detail?: string
  documentation?: string
  fullPath: string
  appendDot?: boolean
  source?: 'context' | 'js'
  completionSource?: string
  completionData?: unknown
}

type CustomSuggestionState = {
  open: boolean
  items: CustomSuggestionItem[]
  activeIndex: number
  top: number
  left: number
  replaceRange: { startColumn: number; endColumn: number } | null
  signatureOnly?: boolean
}

const completionStores: Record<string, CompletionStore> = {}

const getCompletionStore = (language: string) => {
  if (!completionStores[language]) {
    completionStores[language] = {
      provider: null,
      wordsByModel: new Map(),
      metadataByModel: new Map(),
    }
  }
  return completionStores[language]
}

const COMPLETION_LANGUAGES = new Set(['javascript', 'typescript', 'plaintext'])
const JS_LIB_CACHE: {
  promise: Promise<void> | null
  loaded: boolean
  loadedFiles: string[]
  docs: Map<string, { detail?: string; documentation?: string }>
  varToInterface: Map<string, string>
  membersByInterface: Map<string, Set<string>>
  namespaceMemberKinds: Map<string, Map<string, string>>
} = {
  promise: null,
  loaded: false,
  loadedFiles: [],
  docs: new Map(),
  varToInterface: new Map(),
  membersByInterface: new Map(),
  namespaceMemberKinds: new Map(),
}
const JS_LIB_MANIFEST = 'monaco/manifest.json'
const ALLOW_REMOTE_JS_LIBS = process.env.NEXT_PUBLIC_ALLOW_REMOTE_JS_LIBS === 'true'
const JS_LIB_API_URL =
  'https://api.github.com/repos/microsoft/TypeScript/contents/lib?ref=v5.2.2'
const JS_LIB_RAW_BASE =
  'https://raw.githubusercontent.com/microsoft/TypeScript/v5.2.2/lib'
const JS_LIB_ALLOWLIST = [
  'lib.es5.d.ts',
  'lib.es2015.collection.d.ts',
  'lib.es2015.iterable.d.ts',
  'lib.es2015.promise.d.ts',
  'lib.es2015.symbol.d.ts',
  'lib.es2015.symbol.wellknown.d.ts',
  'lib.es2016.array.include.d.ts',
  'lib.es2018.promise.d.ts',
  'lib.dom.d.ts',
  'lib.dom.iterable.d.ts',
]

const extractDocText = (comment: string) =>
  comment
    .split('\n')
    .map((line) => line.replace(/^\s*\*\s?/, '').trim())
    .filter(Boolean)
    .join(' ')

const normalizeSignature = (signature: string) => signature.replace(/\s+/g, ' ').trim()

const parseLibDocs = (content: string) => {
  const varRegex = /declare\s+var\s+([A-Za-z_$][\w$]*)\s*:\s*([A-Za-z_$][\w$]*);/g
  let match: RegExpExecArray | null
  while ((match = varRegex.exec(content))) {
    JS_LIB_CACHE.varToInterface.set(match[1], match[2])
  }

  const interfaceRegex = /interface\s+([A-Za-z_$][\w$]*)[^{]*\{/g
  while ((match = interfaceRegex.exec(content))) {
    const name = match[1]
    const bodyStart = match.index + match[0].length
    let index = bodyStart
    let depth = 1
    while (index < content.length && depth > 0) {
      const char = content[index]
      if (char === '{') {
        depth += 1
      } else if (char === '}') {
        depth -= 1
      }
      index += 1
    }
    if (depth !== 0) {
      continue
    }
    const body = content.slice(bodyStart, index - 1)
    const memberRegex =
      /(?:\/\*\*([\s\S]*?)\*\/\s*)?([A-Za-z_$][\w$]*)\s*([^;{]*);/g
    let memberMatch: RegExpExecArray | null
    let members = JS_LIB_CACHE.membersByInterface.get(name)
    if (!members) {
      members = new Set()
      JS_LIB_CACHE.membersByInterface.set(name, members)
    }

    while ((memberMatch = memberRegex.exec(body))) {
      const [, rawDoc, member, rawSignature] = memberMatch
      if (!member) {
        continue
      }
      members.add(member)
      const signature = normalizeSignature(rawSignature ?? '')
      const detail = signature ? `${member}${signature}` : member
      const documentation = rawDoc ? extractDocText(rawDoc) : undefined
      const key = `${name}.${member}`
      const existing = JS_LIB_CACHE.docs.get(key)
      if (existing?.documentation) {
        continue
      }
      JS_LIB_CACHE.docs.set(key, {
        detail,
        documentation: documentation || existing?.documentation,
      })
    }
  }

  const namespaceRegex = /namespace\s+([A-Za-z_$][\w$]*)\s*\{/g
  while ((match = namespaceRegex.exec(content))) {
    const namespaceName = match[1]
    const bodyStart = match.index + match[0].length
    let index = bodyStart
    let depth = 1
    while (index < content.length && depth > 0) {
      const char = content[index]
      if (char === '{') {
        depth += 1
      } else if (char === '}') {
        depth -= 1
      }
      index += 1
    }
    if (depth !== 0) {
      continue
    }
    const body = content.slice(bodyStart, index - 1)
    let members = JS_LIB_CACHE.membersByInterface.get(namespaceName)
    if (!members) {
      members = new Set()
      JS_LIB_CACHE.membersByInterface.set(namespaceName, members)
    }
    let memberKinds = JS_LIB_CACHE.namespaceMemberKinds.get(namespaceName)
    if (!memberKinds) {
      memberKinds = new Map()
      JS_LIB_CACHE.namespaceMemberKinds.set(namespaceName, memberKinds)
    }
    const namespaceMemberRegex =
      /(?:\/\*\*([\s\S]*?)\*\/\s*)?(var|const|function|class)\s+([A-Za-z_$][\w$]*)\s*([^;{]*)/g
    let namespaceMatch: RegExpExecArray | null
    while ((namespaceMatch = namespaceMemberRegex.exec(body))) {
      const [, rawDoc, declarationKind, member, rawSignature] = namespaceMatch
      if (!member) {
        continue
      }
      let kind = 'object'
      if (declarationKind === 'function' || declarationKind === 'class') {
        kind = 'function'
      } else if (declarationKind === 'const') {
        kind = 'function'
      } else if (declarationKind === 'var') {
        kind = 'object'
      }
      members.add(member)
      memberKinds.set(member, kind)
      const signature = normalizeSignature(rawSignature ?? '')
      const detail = signature ? `${member}${signature}` : member
      const documentation = rawDoc ? extractDocText(rawDoc) : undefined
      const key = `${namespaceName}.${member}`
      const existing = JS_LIB_CACHE.docs.get(key)
      if (existing?.documentation) {
        continue
      }
      JS_LIB_CACHE.docs.set(key, {
        detail,
        documentation: documentation || existing?.documentation,
      })
    }
  }
}

const parseReturnType = (detail?: string) => {
  if (!detail) {
    return null
  }
  const index = detail.lastIndexOf(':')
  if (index === -1) {
    return null
  }
  return detail.slice(index + 1).trim()
}

const getLiteralInterface = (expression: string) => {
  const trimmed = expression.trim()
  if (!trimmed) {
    return null
  }
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    return 'Array'
  }
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    return 'Object'
  }
  const first = trimmed[0]
  if ((first === '"' || first === "'" || first === '`') && trimmed.endsWith(first)) {
    let backslashes = 0
    for (let i = trimmed.length - 2; i >= 0; i -= 1) {
      if (trimmed[i] === '\\') {
        backslashes += 1
      } else {
        break
      }
    }
    if (backslashes % 2 === 0) {
      return 'String'
    }
  }
  if (/^-?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(trimmed)) {
    return 'Number'
  }
  if (trimmed === 'true' || trimmed === 'false') {
    return 'Boolean'
  }
  if (trimmed === 'null') {
    return 'Object'
  }
  return null
}

const mapReturnTypeToInterfaces = (returnType: string) => {
  const parts = returnType
    .split('|')
    .map((part) => part.trim())
    .filter(Boolean)
  const names = new Set<string>()
  parts.forEach((part) => {
    const normalized = part.replace(/\s+/g, ' ').trim()
    if (!normalized) {
      return
    }
    if (normalized === 'string') {
      names.add('String')
      return
    }
    if (normalized === 'number') {
      names.add('Number')
      return
    }
    if (normalized === 'boolean') {
      names.add('Boolean')
      return
    }
    if (normalized === 'bigint') {
      names.add('BigInt')
      return
    }
    if (normalized === 'symbol') {
      names.add('Symbol')
      return
    }
    if (normalized.endsWith('[]')) {
      names.add('Array')
      return
    }
    const base = normalized.split('<')[0].trim()
    if (base.startsWith('ReadonlyArray')) {
      names.add('Array')
      return
    }
    if (base.includes('.')) {
      const last = base.split('.').pop()
      if (last) {
        names.add(last)
      }
      return
    }
    if (base) {
      names.add(base)
    }
  })
  return Array.from(names)
}

const extractCallPath = (expression: string) => {
  let index = expression.length - 1
  while (index >= 0 && expression[index] === ' ') {
    index -= 1
  }
  if (index < 0 || expression[index] !== ')') {
    return null
  }
  let depth = 0
  for (let i = index; i >= 0; i -= 1) {
    const char = expression[i]
    if (char === ')') {
      depth += 1
      continue
    }
    if (char === '(') {
      depth -= 1
      if (depth === 0) {
        const before = expression.slice(0, i)
        const match = before.match(/([A-Za-z_$][\w$.]*)\s*$/)
        return match ? match[1] : null
      }
    }
  }
  return null
}

const getEmptyCallPath = (expression: string) => {
  let depth = 0
  for (let i = expression.length - 1; i >= 0; i -= 1) {
    const char = expression[i]
    if (char === ')') {
      depth += 1
      continue
    }
    if (char === '(') {
      if (depth === 0) {
        const after = expression.slice(i + 1)
        if (after.trim().length !== 0) {
          return null
        }
        const before = expression.slice(0, i)
        const match = before.match(/([A-Za-z_$][\w$.]*)\s*$/)
        return match ? match[1] : null
      }
      depth -= 1
    }
  }
  return null
}

const getRuntimeBasePath = () => {
  if (typeof window === 'undefined') {
    return ''
  }
  const nextData = (window as { __NEXT_DATA__?: { assetPrefix?: string; basePath?: string } })
    .__NEXT_DATA__
  return nextData?.basePath ?? nextData?.assetPrefix ?? ''
}

const getSuggestionLeft = (
  rect: DOMRect,
  caretLeft: number,
  signatureOnly: boolean
) => {
  const previewWidth = 220
  const listWidth = 220
  const gap = 8
  const totalWidth = signatureOnly ? previewWidth : previewWidth + gap + listWidth
  const proposedLeft = rect.left + caretLeft - previewWidth - gap
  const maxLeft = rect.right - totalWidth
  return Math.max(8, Math.min(proposedLeft, maxLeft))
}

const getLibDoc = (fullPath: string) => {
  if (!fullPath.includes('.')) {
    return null
  }
  const parts = fullPath.split('.')
  const root = parts[0]
  const member = parts[1]
  if (!root || !member) {
    return null
  }
  const interfaceName = JS_LIB_CACHE.varToInterface.get(root) ?? root
  const primaryKey = `${interfaceName}.${member}`
  return (
    JS_LIB_CACHE.docs.get(primaryKey) ??
    JS_LIB_CACHE.docs.get(`Function.${member}`) ??
    null
  )
}

const getLibDocForInterfaces = (interfaceNames: string[], member: string) => {
  for (const name of interfaceNames) {
    const normalized = name.replace(/^typeof\s+/, '')
    const direct = JS_LIB_CACHE.docs.get(`${normalized}.${member}`)
    if (direct) {
      return direct
    }
  }
  return JS_LIB_CACHE.docs.get(`Function.${member}`) ?? null
}

const getLibMembersForInterfaces = (interfaceNames: string[]) => {
  const names = new Set<string>()
  interfaceNames.forEach((name) => {
    const normalized = name.replace(/^typeof\s+/, '')
    const members = JS_LIB_CACHE.membersByInterface.get(normalized)
    if (members) {
      members.forEach((member) => names.add(member))
    }
  })
  return names
}

const getValueForKind = (kind?: string) => {
  const normalized = kind?.toLowerCase()
  switch (normalized) {
      case 'var':
      case 'module':
        return {}
      case 'string':
        return ''
      case 'number':
        return 0
    case 'boolean':
      return false
    case 'array':
      return []
    case 'function':
      return () => undefined
    case 'object':
      return {}
    default:
      return undefined
  }
}

const addInterfacesForKind = (targets: Set<string>, kind?: string) => {
  const normalized = kind?.toLowerCase()
  if (!normalized) {
    return
  }
  if (normalized === 'string') {
    targets.add('String')
    return
  }
  if (normalized === 'number') {
    targets.add('Number')
    return
  }
  if (normalized === 'boolean') {
    targets.add('Boolean')
    return
  }
  if (normalized === 'array') {
    targets.add('Array')
    return
  }
  if (normalized === 'function') {
    targets.add('Function')
    return
  }
  if (normalized === 'object' || normalized === 'var' || normalized === 'module') {
    targets.add('Object')
    return
  }
  if (normalized === 'symbol') {
    targets.add('Symbol')
    return
  }
  if (normalized === 'bigint') {
    targets.add('BigInt')
  }
}

const loadLibManifest = async (baseCandidates: string[]) => {
  for (const candidate of baseCandidates) {
    try {
      const response = await fetch(`${candidate}/${JS_LIB_MANIFEST}`)
      if (!response.ok) {
        continue
      }
      const data = await response.json()
      const files = Array.isArray(data?.files) ? data.files : []
      if (files.length > 0) {
        return files
      }
    } catch {
      // noop
    }
  }
  return null
}

const loadLibFileListFromApi = async () => {
  if (!ALLOW_REMOTE_JS_LIBS) {
    return null
  }
  try {
    const response = await fetch(JS_LIB_API_URL)
    if (!response.ok) {
      return null
    }
    const data = await response.json()
    if (!Array.isArray(data)) {
      return null
    }
    return data
      .map((item) => item?.name)
      .filter(
        (name) => typeof name === 'string' && name.startsWith('lib.') && name.endsWith('.d.ts')
      )
  } catch {
    return null
  }
}

const ensureJsLibs = (monaco: Monaco, basePath: string) => {
  if (JS_LIB_CACHE.promise) {
    return JS_LIB_CACHE.promise
  }
  JS_LIB_CACHE.promise = (async () => {
    const jsDefaults = monaco.languages.typescript.javascriptDefaults
    const tsDefaults = monaco.languages.typescript.typescriptDefaults
    JS_LIB_CACHE.loaded = false
    JS_LIB_CACHE.loadedFiles = []
    jsDefaults.setEagerModelSync(true)
    jsDefaults.setCompilerOptions({
      allowJs: true,
      allowNonTsExtensions: true,
      checkJs: true,
      noLib: true,
      target: monaco.languages.typescript.ScriptTarget.ES2020,
      lib: [],
    })
    tsDefaults.setEagerModelSync(true)
    tsDefaults.setCompilerOptions({
      allowNonTsExtensions: true,
      noLib: true,
      target: monaco.languages.typescript.ScriptTarget.ES2020,
      lib: [],
    })
    const runtimeBasePath = getRuntimeBasePath()
    const baseCandidates = Array.from(
      new Set([basePath, runtimeBasePath].filter((value) => value && value.trim()))
    )
    if (baseCandidates.length === 0) {
      baseCandidates.push('')
    }
    const libFiles =
      (await loadLibManifest(baseCandidates)) ?? (await loadLibFileListFromApi())
    if (!libFiles || libFiles.length === 0) {
      return
    }
    const allowlist = new Set(JS_LIB_ALLOWLIST)
    const filteredFiles =
      JS_LIB_ALLOWLIST.length > 0
        ? libFiles.filter((file) => allowlist.has(file))
        : libFiles
    if (filteredFiles.length === 0) {
      return
    }
    for (const file of filteredFiles) {
      try {
        const localCandidates = baseCandidates.length > 0 ? baseCandidates : ['']
        let content: string | null = null
        for (const candidate of localCandidates) {
          const response = await fetch(`${candidate}/monaco/${file}`)
          if (!response.ok) {
            continue
          }
          content = await response.text()
          break
        }
        if (!content && ALLOW_REMOTE_JS_LIBS) {
          const fallbackResponse = await fetch(`${JS_LIB_RAW_BASE}/${file}`)
          if (!fallbackResponse.ok) {
            continue
          }
          content = await fallbackResponse.text()
        }
        jsDefaults.addExtraLib(content, `inmemory:///monaco/${file}`)
        tsDefaults.addExtraLib(content, `inmemory:///monaco/${file}`)
        JS_LIB_CACHE.loadedFiles.push(file)
        parseLibDocs(content)
      } catch {
        // noop
      }
    }
    JS_LIB_CACHE.loaded = true
  })()
  return JS_LIB_CACHE.promise
}

export type CodeEditorContentSize = {
  lineCount: number
  lineHeight: number
  contentHeight: number
  contentWidth: number
  scrollWidth: number
}

interface CodeEditorProps {
  id: string
  language:
    | 'pgsql'
    | 'json'
    | 'html'
    | 'typescript'
    | 'javascript'
    | 'plaintext'
    | undefined
  autofocus?: boolean
  defaultValue?: string
  isReadOnly?: boolean
  hideLineNumbers?: boolean
  className?: string
  loading?: boolean
  options?: EditorProps['options']
  value?: string
  placeholder?: string
  disableTopPadding?: boolean
  highlightOnlyFx?: boolean
  /* Determines what actions to add for code editor context menu */
  actions?: Partial<{
    runQuery: CodeEditorActions
    formatDocument: CodeEditorActions
    placeholderFill: Omit<CodeEditorActions, 'callback'>
    explainCode: CodeEditorActions
    closeAssistant: CodeEditorActions
  }>
  insertNewlineOnCtrlEnter?: boolean
  autoTriggerSuggestions?: boolean
  completionWords?: string[]
  completionMetadata?: CompletionMetadataMap
  customSuggestions?: {
    enabled: boolean
    context?: Record<string, unknown>
  }
  extraLibs?: string[]
  editorRef?: MutableRefObject<editor.IStandaloneCodeEditor | undefined>
  onInputChange?: (value?: string) => void
  onContentSizeChange?: (metrics: CodeEditorContentSize) => void
}

const CodeEditor = ({
  id,
  language,
  defaultValue,
  autofocus = true,
  isReadOnly = false,
  hideLineNumbers = false,
  className,
  loading,
  options,
  value,
  placeholder,
  actions = DEFAULT_ACTIONS,
  extraLibs,
  disableTopPadding = false,
  highlightOnlyFx = false,
  insertNewlineOnCtrlEnter = false,
  autoTriggerSuggestions = false,
  completionWords,
  completionMetadata,
  customSuggestions,
  editorRef: editorRefProps,
  onInputChange = noop,
  onContentSizeChange,
}: CodeEditorProps) => {
  const monaco = useMonaco()
  const { data: project } = useSelectedProjectQuery()

  const hasValue = useRef<any>()
  const ref = useRef<editor.IStandaloneCodeEditor>()
  const editorRef = editorRefProps || ref
  const monacoRef = useRef<Monaco>()
  const extraLibsRef = useRef<IDisposable[]>([])
  const onContentSizeChangeRef = useRef(onContentSizeChange)
  const autoTriggerSuggestionsRef = useRef(autoTriggerSuggestions)
  const contentSizeDisposableRef = useRef<IDisposable | null>(null)
  const layoutDisposableRef = useRef<IDisposable | null>(null)
  const typeDisposableRef = useRef<IDisposable | null>(null)
  const modelUriRef = useRef<string | null>(null)
  const customSuggestionsRef = useRef(customSuggestions)
  const [customSuggestState, setCustomSuggestState] = useState<CustomSuggestionState>({
    open: false,
    items: [],
    activeIndex: 0,
    top: 0,
    left: 0,
    replaceRange: null,
    signatureOnly: false,
  })
  const [customSuggestDetails, setCustomSuggestDetails] = useState<
    Record<string, { detail?: string; documentation?: string }>
  >({})
  const customSuggestStateRef = useRef(customSuggestState)
  const customSuggestDisposablesRef = useRef<IDisposable[]>([])
  const customSuggestListRef = useRef<HTMLDivElement | null>(null)
  const customSuggestRequestRef = useRef(0)
  const customSuggestPrefixRef = useRef('')
  const jsLibsRefreshQueuedRef = useRef(false)
  const [editorReady, setEditorReady] = useState(false)
  const fxPlainDecorationsRef = useRef<editor.IEditorDecorationsCollection | null>(null)
  const isGenericDetail = (value?: string) => {
    if (!value) {
      return true
    }
    const normalized = value.trim().toLowerCase()
    return (
      normalized === 'function' ||
      normalized === 'object' ||
      normalized === 'string' ||
      normalized === 'number' ||
      normalized === 'boolean' ||
      normalized === 'void' ||
      normalized === 'undefined' ||
      normalized === 'null' ||
      normalized === 'unknown'
    )
  }

  const { runQuery, placeholderFill, formatDocument, explainCode, closeAssistant } = {
    ...DEFAULT_ACTIONS,
    ...actions,
  }

  const showPlaceholderDefault = placeholder !== undefined && (value ?? '').trim().length === 0
  const [showPlaceholder, setShowPlaceholder] = useState(showPlaceholderDefault)

  const optionsMerged = merge(
    {
      tabSize: 2,
      fontSize: 13,
      readOnly: isReadOnly,
      minimap: { enabled: false },
      wordWrap: 'on',
      fixedOverflowWidgets: true,
      contextmenu: true,
      lineNumbers: hideLineNumbers ? 'off' : undefined,
      glyphMargin: hideLineNumbers ? false : undefined,
      lineNumbersMinChars: hideLineNumbers ? 0 : 4,
      folding: hideLineNumbers ? false : undefined,
      scrollBeyondLastLine: false,
    },
    options
  )

  const closeCustomSuggest = () => {
    setCustomSuggestState((prev) =>
      prev.open ? { ...prev, open: false } : prev
    )
  }

  const getContextValueAtPath = (
    context: Record<string, unknown> | undefined,
    path: string
  ) => {
    if (!context) {
      return undefined
    }
    return path.split('.').reduce((acc, key) => {
      if (!acc || typeof acc !== 'object') {
        return undefined
      }
      return (acc as Record<string, unknown>)[key]
    }, context as Record<string, unknown> | undefined)
  }

  const getValueAtPath = (context: Record<string, unknown> | undefined, path: string) => {
    const fromContext = getContextValueAtPath(context, path)
    if (typeof fromContext !== 'undefined') {
      return fromContext
    }
    if (typeof globalThis === 'undefined') {
      return undefined
    }
    return path.split('.').reduce((acc, key) => {
      if (!acc || (typeof acc !== 'object' && typeof acc !== 'function')) {
        return undefined
      }
      if (
        typeof acc === 'function' &&
        (key === 'caller' || key === 'callee' || key === 'arguments')
      ) {
        return undefined
      }
      return (acc as Record<string, unknown>)[key]
    }, globalThis as Record<string, unknown> | undefined)
  }

  const getGlobalByName = (name: string) => {
    if (typeof globalThis === 'undefined') {
      return undefined
    }
    return (globalThis as Record<string, unknown>)[name]
  }

  const getProtoByName = (name: string) => {
    const value = getGlobalByName(name)
    if (value && typeof value === 'function' && (value as { prototype?: unknown }).prototype) {
      return (value as { prototype?: unknown }).prototype
    }
    return undefined
  }

  const normalizeInterfaceName = (name: string) => {
    if (name.includes('.')) {
      return name.split('.').pop() ?? name
    }
    return name
  }

  const getMemberInfoForValue = (value: unknown) => {
    const names = new Set<string>()
    const interfaceNames: string[] = []

    const addNames = (target: unknown) => {
      if (!target || (typeof target !== 'object' && typeof target !== 'function')) {
        return
      }
      Object.getOwnPropertyNames(target).forEach((name) => names.add(name))
    }

    const addInterface = (name?: string) => {
      if (!name) {
        return
      }
      const normalized = normalizeInterfaceName(name)
      if (!interfaceNames.includes(normalized)) {
        interfaceNames.push(normalized)
      }
    }

    const tag = value ? Object.prototype.toString.call(value).slice(8, -1) : ''
    const normalizedTag = normalizeInterfaceName(tag)

    if (typeof value === 'string') {
      addInterface('String')
      addNames(getProtoByName('String'))
    } else if (typeof value === 'number') {
      addInterface('Number')
      addNames(getProtoByName('Number'))
    } else if (typeof value === 'boolean') {
      addInterface('Boolean')
      addNames(getProtoByName('Boolean'))
    } else if (typeof value === 'bigint') {
      addInterface('BigInt')
      addNames(getProtoByName('BigInt'))
    } else if (typeof value === 'symbol') {
      addInterface('Symbol')
      addNames(getProtoByName('Symbol'))
    } else if (Array.isArray(value)) {
      addInterface('Array')
      addNames(getProtoByName('Array'))
    } else if (normalizedTag && normalizedTag !== 'Object') {
      addInterface(normalizedTag)
      addNames(getProtoByName(normalizedTag))
    }

    if (typeof value === 'function') {
      const fnName = value.name
      addInterface(fnName || 'Function')
      if (fnName) {
        addInterface(`${fnName}Constructor`)
      }
      addInterface('Function')
      addNames(value)
      addNames(Function.prototype)
      if ((value as { prototype?: unknown }).prototype) {
        addNames((value as { prototype?: unknown }).prototype)
      }
    } else if (value && typeof value === 'object') {
      addNames(value)
      const proto = Object.getPrototypeOf(value)
      if (proto && proto !== Object.prototype) {
        addNames(proto)
        addInterface((proto as { constructor?: { name?: string } }).constructor?.name)
      }
    }

    const filtered = Array.from(names).filter((name) => {
      if (!name || name === 'constructor') {
        return false
      }
      return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(name)
    })

    return { names: filtered, interfaceNames }
  }

  const resolveFunctionDocForCall = (
    callPath: string,
    metadata: CompletionMetadataMap,
    context?: Record<string, unknown>
  ) => {
    const parts = callPath.split('.')
    const member = parts.pop()
    if (!member) {
      return null
    }
    const ownerPath = parts.join('.')
    const interfaceCandidates = new Set<string>()
    if (ownerPath) {
      const ownerMeta = metadata[ownerPath]
      addInterfacesForKind(interfaceCandidates, ownerMeta?.kind)
      let ownerValue = getContextValueAtPath(context, ownerPath)
      if (typeof ownerValue === 'undefined') {
        ownerValue = getValueAtPath(undefined, ownerPath)
      }
      if (typeof ownerValue === 'undefined' && ownerMeta?.kind) {
        ownerValue = getValueForKind(ownerMeta.kind)
      }
      const memberInfo = getMemberInfoForValue(ownerValue)
      memberInfo.interfaceNames.forEach((name) => interfaceCandidates.add(name))
      interfaceCandidates.add(ownerPath)
      interfaceCandidates.add(`${ownerPath}Constructor`)
    }
    const libDoc = interfaceCandidates.size
      ? getLibDocForInterfaces(Array.from(interfaceCandidates), member)
      : getLibDoc(callPath)
    if (libDoc) {
      return libDoc
    }
    const meta = metadata[callPath]
    if (!meta) {
      return null
    }
    return {
      detail: meta.detail,
      documentation: meta.documentation,
    }
  }

  const formatInlinePreview = (value: unknown) => {
    if (typeof value === 'undefined') {
      return 'undefined'
    }
    if (value === null) {
      return 'null'
    }
    if (typeof value === 'string') {
      return JSON.stringify(value)
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value)
    }
    if (Array.isArray(value)) {
      return `[${value.length}]`
    }
    if (typeof value === 'function') {
      return 'function'
    }
    if (typeof value === 'object') {
      return '{ }'
    }
    return String(value)
  }

  const buildCustomSuggestions = (
    prefix: string,
    words: string[],
    metadata: CompletionMetadataMap
  ) => {
    const suggestions: CustomSuggestionItem[] = []
    const seen = new Set<string>()
    const hasDot = prefix.includes('.')

    const mapKind = (rawKind?: string) => {
      const normalized = rawKind?.toLowerCase()
      if (normalized === 'keyword') {
        return 'keyword'
      }
      if (normalized === 'function') {
        return 'function'
      }
      if (normalized === 'var' || normalized === 'module') {
        return 'object'
      }
      if (normalized === 'object' || normalized === 'array') {
        return 'object'
      }
      if (
        normalized === 'string' ||
        normalized === 'number' ||
        normalized === 'boolean' ||
        normalized === 'null' ||
        normalized === 'undefined'
      ) {
        return normalized
      }
      return normalized ?? 'unknown'
    }

    if (hasDot) {
      const lastDotIndex = prefix.lastIndexOf('.')
      const base = prefix.slice(0, lastDotIndex + 1)
      const segmentPrefix = prefix.slice(lastDotIndex + 1)

      words.forEach((word) => {
        if (!word.startsWith(base)) {
          return
        }
        const remainder = word.slice(base.length)
        if (!remainder) {
          return
        }
        const nextSegment = remainder.split('.')[0]
        if (!nextSegment) {
          return
        }
        if (segmentPrefix && !nextSegment.startsWith(segmentPrefix)) {
          return
        }
        if (seen.has(nextSegment)) {
          return
        }
        seen.add(nextSegment)
        const fullPath = `${base}${nextSegment}`
        const meta = metadata[fullPath] ?? metadata[nextSegment]
        const kind = mapKind(meta?.kind)
        const appendDot = meta?.appendDot ?? kind === 'object'
        suggestions.push({
          label: nextSegment,
          insertText: appendDot ? `${nextSegment}.` : nextSegment,
          kind: meta?.kind,
          detail: meta?.detail,
          documentation: meta?.documentation,
          fullPath,
          appendDot,
          source: 'context',
        })
      })

    } else {
      words.forEach((word) => {
        const root = word.split('.')[0]
        if (!root) {
          return
        }
        if (prefix && !root.startsWith(prefix)) {
          return
        }
        if (seen.has(root)) {
          return
        }
        seen.add(root)
        const meta = metadata[root] ?? metadata[word]
        const kind = mapKind(meta?.kind)
        const appendDot = meta?.appendDot ?? kind === 'object'
        suggestions.push({
          label: root,
          insertText: appendDot ? `${root}.` : root,
          kind: meta?.kind,
          detail: meta?.detail,
          documentation: meta?.documentation,
          fullPath: root,
          appendDot,
          source: 'context',
        })
      })
      Object.entries(metadata).forEach(([key, meta]) => {
        if (key.includes('.')) {
          return
        }
        if (meta?.kind !== 'keyword' && meta?.kind !== 'function') {
          return
        }
        if (prefix && !key.startsWith(prefix)) {
          return
        }
        if (seen.has(key)) {
          return
        }
        seen.add(key)
        suggestions.push({
          label: key,
          insertText: key,
          kind: meta?.kind,
          detail: meta?.detail,
          documentation: meta?.documentation,
          fullPath: key,
          source: 'context',
        })
      })
    }

    return suggestions.sort((a, b) => a.label.localeCompare(b.label))
  }

  const requestJsLibsRefresh = (currentMonaco: Monaco) => {
    if (JS_LIB_CACHE.loaded || jsLibsRefreshQueuedRef.current) {
      return
    }
    jsLibsRefreshQueuedRef.current = true
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? ''
    void ensureJsLibs(currentMonaco, basePath).finally(() => {
      jsLibsRefreshQueuedRef.current = false
      const editor = editorRef.current
      if (editor && customSuggestionsRef.current?.enabled) {
        updateCustomSuggestions(editor, true)
      }
    })
  }

  const updateCustomSuggestions = (
    editor: editor.IStandaloneCodeEditor,
    preserveSelection = false
  ) => {
    const currentCustom = customSuggestionsRef.current
    if (!currentCustom?.enabled) {
      closeCustomSuggest()
      return
    }
    const currentMonaco = monacoRef.current
    const model = editor.getModel()
    const position = editor.getPosition()
    if (!model || !position) {
      closeCustomSuggest()
      return
    }
    const line = model.getLineContent(position.lineNumber)
    const before = line.slice(0, position.column - 1)
    const openIndex = before.lastIndexOf('{{')
    const closeIndex = before.lastIndexOf('}}')
    const insideExpression = openIndex !== -1 && openIndex > closeIndex
    if (!insideExpression) {
      closeCustomSuggest()
      return
    }

    const words = completionWords ?? []
    const metadata = completionMetadata ?? {}
    const expressionBefore = before.slice(openIndex + 2)
    const emptyCallPath = getEmptyCallPath(expressionBefore)
    if (emptyCallPath) {
      const wordUntil = model.getWordUntilPosition(position)
      const visiblePosition = editor.getScrolledVisiblePosition(position)
      const editorNode = editor.getDomNode()
      if (!visiblePosition || !editorNode) {
        closeCustomSuggest()
        return
      }
      const label = emptyCallPath.split('.').pop() ?? emptyCallPath
      const rect = editorNode.getBoundingClientRect()
      const left = getSuggestionLeft(rect, visiblePosition.left, true)
      const top = rect.top + visiblePosition.top + visiblePosition.height + 6
      const signatureItem: CustomSuggestionItem = {
        label,
        insertText: '',
        kind: 'function',
        detail: 'function',
        documentation: '',
        fullPath: emptyCallPath,
        source: 'context',
      }
      setCustomSuggestState({
        open: true,
        items: [signatureItem],
        activeIndex: 0,
        top,
        left,
        replaceRange: {
          startColumn: wordUntil.startColumn,
          endColumn: wordUntil.endColumn,
        },
        signatureOnly: true,
      })
      const applySignatureDoc = () => {
        const signatureDoc = resolveFunctionDocForCall(
          emptyCallPath,
          metadata,
          currentCustom.context
        )
        if (!signatureDoc) {
          return
        }
        setCustomSuggestDetails((prev) =>
          prev[emptyCallPath]
            ? prev
            : {
                ...prev,
                [emptyCallPath]: signatureDoc,
              }
        )
      }
      if (!JS_LIB_CACHE.loaded && currentMonaco) {
        requestJsLibsRefresh(currentMonaco)
      } else {
        applySignatureDoc()
      }
      return
    }

    const prefixMatch = before.match(/([A-Za-z_$][\w$.]*)$/)
    let prefix = prefixMatch ? prefixMatch[1] : ''
    let expressionInterfaces: string[] = []
    if (before.endsWith('.')) {
      const expr = before.slice(0, -1)
      const callPath = extractCallPath(expr)
      if (callPath) {
        prefix = `${callPath}.`
        const doc = getLibDoc(callPath)
        const returnType = parseReturnType(doc?.detail)
        if (returnType) {
          expressionInterfaces = mapReturnTypeToInterfaces(returnType)
        }
      } else {
        const exprMatch = expr.match(/([A-Za-z_$][\w$.]*)$/)
        if (exprMatch) {
          prefix = `${exprMatch[1]}.`
        } else {
          const literalInterface = getLiteralInterface(expr)
          if (literalInterface) {
            prefix = `${literalInterface}.`
            expressionInterfaces = [literalInterface]
          }
        }
      }
    }
    if (!JS_LIB_CACHE.loaded && currentMonaco) {
      requestJsLibsRefresh(currentMonaco)
    }
    const prefixHasDot = prefix.includes('.')
    const baseItems = prefixHasDot ? [] : buildCustomSuggestions(prefix, words, metadata)
    const dotItems: CustomSuggestionItem[] = []
    if (prefixHasDot) {
      const lastDotIndex = prefix.lastIndexOf('.')
      const basePath = prefix.slice(0, lastDotIndex)
      const segmentPrefix = prefix.slice(lastDotIndex + 1)
      const contextItemsMap = new Map<string, CustomSuggestionItem>()
      const contextPrefix = `${basePath}.`
      words.forEach((word) => {
        if (!word.startsWith(contextPrefix)) {
          return
        }
        const remainder = word.slice(contextPrefix.length)
        if (!remainder) {
          return
        }
        const nextSegment = remainder.split('.')[0]
        if (!nextSegment) {
          return
        }
        if (segmentPrefix && !nextSegment.startsWith(segmentPrefix)) {
          return
        }
        if (contextItemsMap.has(nextSegment)) {
          return
        }
        const fullPath = `${contextPrefix}${nextSegment}`
        const meta = metadata[fullPath] ?? metadata[nextSegment]
        contextItemsMap.set(nextSegment, {
          label: nextSegment,
          insertText: nextSegment,
          kind: meta?.kind ?? 'object',
          detail: meta?.detail,
          documentation: meta?.documentation,
          fullPath,
          appendDot: meta?.appendDot,
          source: 'context',
        })
      })
      const hasContextMembers = contextItemsMap.size > 0
      if (hasContextMembers) {
        contextItemsMap.forEach((item) => dotItems.push(item))
      }
      const contextValue = getContextValueAtPath(currentCustom.context, basePath)
      const baseMeta = metadata[basePath]
      let resolvedValue =
        typeof contextValue !== 'undefined'
          ? contextValue
          : getValueAtPath(undefined, basePath)
      if (typeof resolvedValue === 'undefined') {
        resolvedValue = getValueForKind(baseMeta?.kind)
      }
      const memberInfo = getMemberInfoForValue(resolvedValue)
      const useExpressionInterfaces = expressionInterfaces.length > 0
      const interfaceCandidates = new Set(
        useExpressionInterfaces ? expressionInterfaces : memberInfo.interfaceNames
      )
    if (!useExpressionInterfaces && baseMeta?.kind) {
      addInterfacesForKind(interfaceCandidates, baseMeta.kind)
    }
      const lastSegment = basePath.split('.').pop()
      if (!useExpressionInterfaces && lastSegment) {
        interfaceCandidates.add(lastSegment)
        interfaceCandidates.add(`${lastSegment}Constructor`)
      }
      const libMembers = getLibMembersForInterfaces(Array.from(interfaceCandidates))
      const interfaceNamesArray = Array.from(interfaceCandidates)
      const hasNonFunctionInterface = interfaceNamesArray.some(
        (name) =>
          name !== 'Function' &&
          name !== 'FunctionConstructor' &&
          !name.endsWith('Constructor')
      )
      const preferLibMembers = libMembers.size > 0 && hasNonFunctionInterface
      const baseMemberNames = hasContextMembers || preferLibMembers ? [] : memberInfo.names
      const allMembers = hasContextMembers ? new Set<string>() : new Set([...baseMemberNames, ...libMembers])
      const namespaceKinds =
        basePath && !basePath.includes('.')
          ? JS_LIB_CACHE.namespaceMemberKinds.get(basePath)
          : null
      allMembers.forEach((name) => {
        if (segmentPrefix && !name.startsWith(segmentPrefix)) {
          return
        }
        const fullPath = `${basePath}.${name}`
        const value = getValueAtPath(currentCustom.context, fullPath)
        const meta = metadata[fullPath]
        const libDoc = getLibDocForInterfaces(Array.from(interfaceCandidates), name)
        const valueType = typeof value
        const isStrictMember = name === 'caller' || name === 'arguments' || name === 'callee'
        const namespaceKind = namespaceKinds?.get(name)
        dotItems.push({
          label: name,
          insertText: name,
          kind:
            meta?.kind ??
            namespaceKind ??
            (isStrictMember ? 'object' : valueType === 'function' ? 'function' : valueType || 'object'),
          detail:
            libDoc?.detail ??
            meta?.detail ??
            namespaceKind ??
            (isStrictMember ? 'object' : valueType || 'object'),
          documentation: libDoc?.documentation ?? meta?.documentation,
          fullPath,
          source: 'context',
        })
      })
    }
    const items = (prefixHasDot ? dotItems : baseItems).sort((a, b) =>
      a.label.localeCompare(b.label)
    )

    const wordUntil = model.getWordUntilPosition(position)
    const visiblePosition = editor.getScrolledVisiblePosition(position)
    const editorNode = editor.getDomNode()
    if (!visiblePosition || !editorNode) {
      closeCustomSuggest()
      return
    }
    const rect = editorNode.getBoundingClientRect()
    const left = getSuggestionLeft(rect, visiblePosition.left, false)
    const top = rect.top + visiblePosition.top + visiblePosition.height + 6
    const previous = customSuggestStateRef.current
    const previousLabel = preserveSelection ? previous.items[previous.activeIndex]?.label : null
    const nextIndex = previousLabel
      ? Math.max(0, items.findIndex((item) => item.label === previousLabel))
      : 0

    const baseState = {
      open: true,
      items,
      activeIndex: nextIndex >= 0 ? nextIndex : 0,
      top,
      left,
      replaceRange: {
        startColumn: wordUntil.startColumn,
        endColumn: wordUntil.endColumn,
      },
      signatureOnly: false,
    }

    if (items.length > 0) {
      setCustomSuggestState(baseState)
    }

    if (!currentMonaco || !customSuggestionsRef.current?.enabled) {
      return
    }
    const currentModel = model
    const currentPosition = position
    const currentPrefix = prefix
    if (!currentPrefix.includes('.')) {
      return
    }
    if (customSuggestPrefixRef.current !== currentPrefix) {
      customSuggestPrefixRef.current = currentPrefix
    }
    customSuggestRequestRef.current += 1
    const requestId = customSuggestRequestRef.current

    void (async () => {
      try {
        const workerFactory = await currentMonaco.languages.typescript.getJavaScriptWorker()
        const worker = await workerFactory(currentModel.uri)
        const offset = currentModel.getOffsetAt(currentPosition)
        const completionInfo = await worker.getCompletionsAtPosition(
          currentModel.uri.toString(),
          offset,
          {}
        )
        const jsEntries = completionInfo?.entries ?? []
        const nextItems: CustomSuggestionItem[] = []
        const updates = new Map<string, Partial<CustomSuggestionItem>>()
        const seen = new Set(items.map((item) => item.label))
        const hasDot = currentPrefix.includes('.')
        const lastDotIndex = currentPrefix.lastIndexOf('.')
        const base = hasDot ? currentPrefix.slice(0, lastDotIndex + 1) : ''
        const segmentPrefix = hasDot ? currentPrefix.slice(lastDotIndex + 1) : currentPrefix

        jsEntries.forEach((entry) => {
          const label = entry.name
          if (!label) {
            return
          }
          if (segmentPrefix && !label.startsWith(segmentPrefix)) {
            return
          }
          if (seen.has(label)) {
            return
          }
          seen.add(label)
          nextItems.push({
            label,
            insertText: entry.insertText ?? label,
            kind: entry.kind,
            detail: entry.kind,
            documentation: entry.kind,
            fullPath: base ? `${base}${label}` : label,
            source: 'js',
          })
        })

        if (jsEntries.length > 0) {
          jsEntries.forEach((entry) => {
            const label = entry.name
            if (!label) {
              return
            }
            if (segmentPrefix && !label.startsWith(segmentPrefix)) {
              return
            }
            if (seen.has(label)) {
              const update = updates.get(label) ?? {}
              updates.set(label, {
                ...update,
                completionSource: entry.source,
                completionData: entry.data,
                source: 'js',
              })
              return
            }
            seen.add(label)
            nextItems.push({
              label,
              insertText: entry.insertText ?? label,
              kind: entry.kind,
              detail: entry.kind,
              documentation: entry.kind,
              fullPath: base ? `${base}${label}` : label,
              source: 'js',
              completionSource: entry.source,
              completionData: entry.data,
            })
          })
        }

        if (nextItems.length === 0 && updates.size === 0) {
          return
        }
        setCustomSuggestState((prev) => {
          if (customSuggestRequestRef.current !== requestId) {
            return prev
          }
          const existingItems = prev.open ? prev.items : items
          const updatedExisting = updates.size
            ? existingItems.map((item) =>
                updates.has(item.label)
                  ? { ...item, ...updates.get(item.label) }
                  : item
              )
            : existingItems
          const merged = [...updatedExisting, ...nextItems].sort((a, b) =>
            a.label.localeCompare(b.label)
          )
          const keepLabel = preserveSelection
            ? updatedExisting[prev.activeIndex]?.label
            : null
          const nextActive = keepLabel
            ? Math.max(0, merged.findIndex((item) => item.label === keepLabel))
            : Math.min(prev.activeIndex, merged.length - 1)
          const nextState = prev.open
            ? { ...prev }
            : baseState
          return {
            ...nextState,
            open: true,
            items: merged,
            activeIndex: nextActive,
          }
        })
      } catch {
        // noop
      }
    })()
  }

  const onMount: OnMount = async (editor, monaco) => {
    editorRef.current = editor
    monacoRef.current = monaco
    modelUriRef.current = editor.getModel()?.uri.toString() ?? null
    setEditorReady(true)
    if (!disableTopPadding) {
      alignEditor(editor)
    }

    hasValue.current = editor.createContextKey('hasValue', false)
    hasValue.current.set(value !== undefined && value.trim().length > 0)
    setShowPlaceholder(showPlaceholderDefault)

    if (placeholderFill.enabled) {
      editor.addCommand(
        monaco.KeyCode.Tab,
        () => {
          editor.executeEdits('source', [
            {
              // @ts-ignore
              identifier: 'add-placeholder',
              range: new monaco.Range(1, 1, 1, 1),
              text: (placeholder ?? '')
                .split('\n\n')
                .join('\n')
                .replaceAll('*', '')
                .replaceAll('&nbsp;', ' '),
            },
          ])
        },
        '!hasValue'
      )
    }

    if (runQuery.enabled) {
      editor.addAction({
        id: 'run-query',
        label: 'Run Query',
        keybindings: [monaco.KeyMod.CtrlCmd + monaco.KeyCode.Enter],
        contextMenuGroupId: 'operation',
        contextMenuOrder: 0,
        run: () => {
          const selectedValue = (editorRef?.current as any)
            .getModel()
            .getValueInRange((editorRef?.current as any)?.getSelection())
          runQuery.callback(selectedValue || (editorRef?.current as any)?.getValue())
        },
      })
    }

    if (explainCode.enabled) {
      editor.addAction({
        id: 'explain-code',
        label: 'Explain Code',
        contextMenuGroupId: 'operation',
        contextMenuOrder: 1,
        run: () => {
          const selectedValue = (editorRef?.current as any)
            .getModel()
            .getValueInRange((editorRef?.current as any)?.getSelection())
          explainCode.callback(selectedValue)
        },
      })
    }

    if (closeAssistant.enabled) {
      editor.addAction({
        id: 'close-assistant',
        label: 'Close Assistant',
        keybindings: [monaco.KeyMod.CtrlCmd + monaco.KeyCode.KeyI],
        run: () => closeAssistant.callback(),
      })
    }

    if (insertNewlineOnCtrlEnter) {
      editor.addCommand(monaco.KeyMod.CtrlCmd + monaco.KeyCode.Enter, () => {
        editor.trigger('keyboard', 'type', { text: '\n' })
      })
    }

    const model = editor.getModel()
    if (model) {
      const position = model.getPositionAt((value ?? '').length)
      editor.setPosition(position)
    }

    if (onContentSizeChangeRef.current) {
      const emitContentSize = () => {
        const callback = onContentSizeChangeRef.current
        const currentEditor = editorRef.current
        const currentMonaco = monacoRef.current
        if (!callback || !currentEditor || !currentMonaco) {
          return
        }

        const currentModel = currentEditor.getModel()
        const lineCount = currentModel?.getLineCount() ?? 1
        const lineHeight = currentEditor.getOption(
          currentMonaco.editor.EditorOption.lineHeight
        )
        callback({
          lineCount,
          lineHeight,
          contentHeight: currentEditor.getContentHeight(),
          contentWidth: currentEditor.getLayoutInfo().contentWidth,
          scrollWidth: currentEditor.getScrollWidth(),
        })
      }

      contentSizeDisposableRef.current?.dispose()
      layoutDisposableRef.current?.dispose()
      contentSizeDisposableRef.current = editor.onDidContentSizeChange(emitContentSize)
      layoutDisposableRef.current = editor.onDidLayoutChange(emitContentSize)
      emitContentSize()
    }

    await timeout(500)
    if (autofocus) editor?.focus()
  }

  const onChangeContent: OnChange = (value) => {
    hasValue.current.set((value ?? '').length > 0)
    setShowPlaceholder(!value)
    onInputChange(value)
  }

  const updateFxPlainDecorations = () => {
    const editorInstance = editorRef.current
    const monacoInstance = monacoRef.current
    const collection = fxPlainDecorationsRef.current
    if (!editorInstance || !monacoInstance || !collection || !highlightOnlyFx) {
      return
    }
    const model = editorInstance.getModel()
    if (!model) {
      return
    }
    const text = model.getValue()
    if (!text) {
      collection.clear()
      return
    }
    const ranges: editor.IRange[] = []
    let cursor = 0
    while (cursor < text.length) {
      const openIndex = text.indexOf('{{', cursor)
      if (openIndex === -1) {
        if (cursor < text.length) {
          const start = model.getPositionAt(cursor)
          const end = model.getPositionAt(text.length)
          ranges.push(
            new monacoInstance.Range(
              start.lineNumber,
              start.column,
              end.lineNumber,
              end.column
            )
          )
        }
        break
      }
      if (openIndex > cursor) {
        const start = model.getPositionAt(cursor)
        const end = model.getPositionAt(openIndex)
        ranges.push(
          new monacoInstance.Range(
            start.lineNumber,
            start.column,
            end.lineNumber,
            end.column
          )
        )
      }
      const closeIndex = text.indexOf('}}', openIndex + 2)
      if (closeIndex === -1) {
        break
      }
      cursor = closeIndex + 2
    }
    collection.set(
      ranges.map((range) => ({
        range,
        options: { inlineClassName: 'fx-plain-text' },
      }))
    )
  }

  useEffect(() => {
    onContentSizeChangeRef.current = onContentSizeChange
  }, [onContentSizeChange])

  useEffect(() => {
    customSuggestionsRef.current = customSuggestions
  }, [customSuggestions])

  useEffect(() => {
    if (!monaco || (language !== 'javascript' && language !== 'typescript')) {
      return
    }
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? ''
    void ensureJsLibs(monaco, basePath)
  }, [monaco, language])

  useEffect(() => {
    customSuggestStateRef.current = customSuggestState
  }, [customSuggestState])

  useEffect(() => {
    const editorInstance = editorRef.current
    if (!editorInstance || !editorReady) {
      return
    }
    if (highlightOnlyFx) {
      if (!fxPlainDecorationsRef.current) {
        fxPlainDecorationsRef.current = editorInstance.createDecorationsCollection()
      }
      updateFxPlainDecorations()
      return
    }
    if (fxPlainDecorationsRef.current) {
      fxPlainDecorationsRef.current.clear()
      fxPlainDecorationsRef.current = null
    }
  }, [editorReady, highlightOnlyFx, value])

  useEffect(() => {
    if (!customSuggestState.open || !customSuggestions?.enabled) {
      return
    }
    const editor = editorRef.current
    if (!editor) {
      return
    }
    const frame = requestAnimationFrame(() => updateCustomSuggestions(editor, true))
    return () => cancelAnimationFrame(frame)
  }, [customSuggestState.open, customSuggestions?.enabled, value])

  useEffect(() => {
    autoTriggerSuggestionsRef.current = autoTriggerSuggestions
  }, [autoTriggerSuggestions])

  useEffect(() => {
    if (!customSuggestState.open) {
      return
    }
    const list = customSuggestListRef.current
    if (!list) {
      return
    }
    const active = list.querySelector<HTMLButtonElement>(
      `[data-suggest-index="${customSuggestState.activeIndex}"]`
    )
    if (active) {
      active.scrollIntoView({ block: 'nearest' })
    }
  }, [customSuggestState.activeIndex, customSuggestState.open])

  useEffect(() => {
    const editor = editorRef.current
    if (!editor || !editorReady) {
      return
    }
    typeDisposableRef.current?.dispose()
    typeDisposableRef.current = editor.onDidType((text) => {
      if (!text) {
        return
      }
      const model = editor.getModel()
      const position = editor.getPosition()
      const line = model && position ? model.getLineContent(position.lineNumber) : ''
      const prefix = position ? line.slice(0, position.column - 1) : ''
      if (text === '{' && model && position && prefix.endsWith('{{')) {
        const suffix = line.slice(position.column - 1)
        if (!suffix.startsWith('}}')) {
          const currentMonaco = monacoRef.current
          if (!currentMonaco) {
            return
          }
          editor.executeEdits('auto-template', [
            {
              range: new currentMonaco.Range(
                position.lineNumber,
                position.column,
                position.lineNumber,
                position.column
              ),
              text: ' }}',
            },
          ])
          editor.setPosition({
            lineNumber: position.lineNumber,
            column: position.column,
          })
        }
      }

      if (customSuggestionsRef.current?.enabled) {
        updateCustomSuggestions(editor)
        return
      }

      if (!autoTriggerSuggestionsRef.current) {
        return
      }
      const shouldTrigger =
        text === '.' || /[A-Za-z0-9_$]/.test(text) || prefix.endsWith('{{')
      if (!shouldTrigger) {
        return
      }
      editor.trigger('keyboard', 'editor.action.triggerSuggest', {})
    })
    return () => {
      typeDisposableRef.current?.dispose()
      typeDisposableRef.current = null
    }
  }, [editorReady, completionWords, completionMetadata])

  useEffect(() => {
    const editor = editorRef.current
    const currentMonaco = monacoRef.current
    customSuggestDisposablesRef.current.forEach((disposable) => disposable.dispose())
    customSuggestDisposablesRef.current = []
    if (!editor || !editorReady || !customSuggestions?.enabled || !currentMonaco) {
      return
    }

    const handleKeyDown = (event: editor.IKeyboardEvent) => {
      const state = customSuggestStateRef.current
      if (!state.open || state.items.length === 0) {
        return
      }
      if (state.signatureOnly) {
        const isEscape =
          event.keyCode === currentMonaco.KeyCode.Escape ||
          event.browserEvent?.key === 'Escape'
        if (isEscape) {
          event.preventDefault()
          event.stopPropagation()
          closeCustomSuggest()
        }
        return
      }
      const keyCode = event.keyCode
      const browserKey = event.browserEvent?.key
      const isEscape = keyCode === currentMonaco.KeyCode.Escape || browserKey === 'Escape'
      const isDown =
        keyCode === currentMonaco.KeyCode.DownArrow || browserKey === 'ArrowDown'
      const isUp =
        keyCode === currentMonaco.KeyCode.UpArrow || browserKey === 'ArrowUp'
      const isEnter =
        keyCode === currentMonaco.KeyCode.Enter || browserKey === 'Enter'
      const isTab = keyCode === currentMonaco.KeyCode.Tab || browserKey === 'Tab'

      if (isEscape) {
        event.preventDefault()
        event.stopPropagation()
        closeCustomSuggest()
        return
      }
      if (isDown) {
        event.preventDefault()
        event.stopPropagation()
        setCustomSuggestState((prev) => ({
          ...prev,
          activeIndex: (prev.activeIndex + 1) % prev.items.length,
        }))
        return
      }
      if (isUp) {
        event.preventDefault()
        event.stopPropagation()
        setCustomSuggestState((prev) => ({
          ...prev,
          activeIndex: (prev.activeIndex - 1 + prev.items.length) % prev.items.length,
        }))
        return
      }
      if (isEnter || isTab) {
        event.preventDefault()
        event.stopPropagation()
        const item = state.items[state.activeIndex]
        if (!item) {
          return
        }
        const position = editor.getPosition()
        const startColumn = state.replaceRange?.startColumn ?? position?.column ?? 1
        const endColumn = state.replaceRange?.endColumn ?? position?.column ?? startColumn
        const lineNumber = position?.lineNumber ?? 1
        editor.setSelection({
          startLineNumber: lineNumber,
          startColumn,
          endLineNumber: lineNumber,
          endColumn,
        })
        editor.trigger('keyboard', 'type', { text: item.insertText })
        closeCustomSuggest()
        if (item.appendDot || item.insertText.endsWith('.')) {
          setTimeout(() => updateCustomSuggestions(editor), 0)
        }
      }
    }

    customSuggestDisposablesRef.current = [
      editor.onKeyDown(handleKeyDown),
      editor.onDidChangeModelContent(() => updateCustomSuggestions(editor, true)),
      editor.onDidChangeCursorSelection(() => updateCustomSuggestions(editor, true)),
      editor.onDidLayoutChange(() => updateCustomSuggestions(editor, true)),
      editor.onDidBlurEditorText(() => closeCustomSuggest()),
    ]

    return () => {
      customSuggestDisposablesRef.current.forEach((disposable) => disposable.dispose())
      customSuggestDisposablesRef.current = []
    }
  }, [editorReady, customSuggestions?.enabled, completionWords, completionMetadata])

  useEffect(() => {
    if (!customSuggestState.open) {
      return
    }
    const active = customSuggestState.items[customSuggestState.activeIndex]
    if (!active) {
      return
    }
    const existingDetails = customSuggestDetails[active.fullPath]
    if (
      existingDetails &&
      (existingDetails.documentation || !isGenericDetail(existingDetails.detail))
    ) {
      return
    }
    const currentMonaco = monacoRef.current
    if (!currentMonaco) {
      return
    }
    if (language !== 'javascript' && language !== 'typescript') {
      return
    }
    const fullPath = active.fullPath

    void (async () => {
      try {
        const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? ''
        await ensureJsLibs(currentMonaco, basePath)
        const libDoc = getLibDoc(active.fullPath)
        if (!libDoc) {
          return
        }
        setCustomSuggestDetails((prev) =>
          prev[fullPath]
            ? prev
            : {
                ...prev,
                [fullPath]: {
                  detail: libDoc.detail,
                  documentation: libDoc.documentation,
                },
              }
        )
      } catch {
        // noop
      }
    })()
  }, [
    customSuggestState.activeIndex,
    customSuggestState.items,
    customSuggestState.open,
    customSuggestDetails,
    language,
  ])

  useEffect(() => {
    setShowPlaceholder(showPlaceholderDefault)
  }, [showPlaceholderDefault])

  useEffect(() => {
    if (
      placeholderFill.enabled &&
      editorRef.current !== undefined &&
      monacoRef.current !== undefined
    ) {
      const editor = editorRef.current
      const monaco = monacoRef.current

      editor.addCommand(
        monaco.KeyCode.Tab,
        () => {
          editor.executeEdits('source', [
            {
              // @ts-ignore
              identifier: 'add-placeholder',
              range: new monaco.Range(1, 1, 1, 1),
              text: (placeholder ?? '  ')
                .split('\n\n')
                .join('\n')
                .replaceAll('*', '')
                .replaceAll('&nbsp;', ''),
            },
          ])
        },
        '!hasValue'
      )
    }
  }, [placeholder, placeholderFill.enabled])

  const activeSuggestion = customSuggestState.open
    ? customSuggestState.items[customSuggestState.activeIndex]
    : null
  const activeSuggestionDetails =
    activeSuggestion?.fullPath ? customSuggestDetails[activeSuggestion.fullPath] : undefined
  const activePreviewValue = activeSuggestion
    ? getValueAtPath(customSuggestions?.context, activeSuggestion.fullPath)
    : undefined
  const activePreviewEntries =
    activePreviewValue && typeof activePreviewValue === 'object' && !Array.isArray(activePreviewValue)
      ? Object.entries(activePreviewValue as Record<string, unknown>).slice(0, 6)
      : []

  useEffect(() => {
    extraLibsRef.current.forEach((lib) => lib.dispose())
    extraLibsRef.current = []

    if (!monaco || !extraLibs?.length) {
      return
    }

    if (language !== 'javascript' && language !== 'typescript') {
      return
    }

    const defaults = monaco.languages.typescript.javascriptDefaults
    extraLibs.forEach((content, index) => {
      const lib = defaults.addExtraLib(content, `inmemory:///${id}-extra-${index}.d.ts`)
      extraLibsRef.current.push(lib)
    })

    return () => {
      extraLibsRef.current.forEach((lib) => lib.dispose())
      extraLibsRef.current = []
    }
  }, [monaco, extraLibs, id, language])

  useEffect(() => {
    if (monaco && project && formatDocument.enabled) {
      const formatProvider = monaco.languages.registerDocumentFormattingEditProvider('pgsql', {
        async provideDocumentFormattingEdits(model: any) {
          const value = model.getValue()
          const formatted = formatSql(value)
          formatDocument.callback(formatted)
          return [{ range: model.getFullModelRange(), text: formatted }]
        },
      })
      return () => formatProvider.dispose()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monaco, project, formatDocument.enabled])

  useEffect(() => {
    if (!monaco || !language || !COMPLETION_LANGUAGES.has(language)) {
      return
    }
    if (!editorReady || !modelUriRef.current) {
      return
    }

    const store = getCompletionStore(language)
    const modelKey = modelUriRef.current
    store.wordsByModel.set(modelKey, completionWords ?? [])
    store.metadataByModel.set(modelKey, completionMetadata ?? {})

    if (!store.provider) {
      store.provider = monaco.languages.registerCompletionItemProvider(language, {
        triggerCharacters: ['.', '_'],
        provideCompletionItems: (model, position) => {
          const line = model.getLineContent(position.lineNumber)
          const prefixText = line.slice(0, position.column - 1)
          const prefixMatch = prefixText.match(/([A-Za-z_$][\w$.]*)$/)
          const prefix = prefixMatch ? prefixMatch[1] : ''
          const hasDot = prefix.includes('.')
          const wordUntilPosition = model.getWordUntilPosition(position)
          const range = new monaco.Range(
            position.lineNumber,
            wordUntilPosition.startColumn,
            position.lineNumber,
            wordUntilPosition.endColumn
          )
          const words = store.wordsByModel.get(model.uri.toString()) ?? []
          const metadata = store.metadataByModel.get(model.uri.toString()) ?? {}
          const suggestions = []
          const seen = new Set<string>()
          const mapKind = (rawKind?: string) => {
            const normalized = rawKind?.toLowerCase()
            if (normalized === 'keyword') {
              return monaco.languages.CompletionItemKind.Keyword
            }
            if (normalized === 'function') {
              return monaco.languages.CompletionItemKind.Function
            }
            if (normalized === 'object' || normalized === 'array') {
              return monaco.languages.CompletionItemKind.Module
            }
            if (
              normalized === 'string' ||
              normalized === 'number' ||
              normalized === 'boolean' ||
              normalized === 'null' ||
              normalized === 'undefined'
            ) {
              return monaco.languages.CompletionItemKind.Value
            }
            return monaco.languages.CompletionItemKind.Variable
          }

          if (hasDot) {
            const lastDotIndex = prefix.lastIndexOf('.')
            const base = prefix.slice(0, lastDotIndex + 1)
            const segmentPrefix = prefix.slice(lastDotIndex + 1)
            words.forEach((word) => {
              if (!word.startsWith(base)) {
                return
              }
              const remainder = word.slice(base.length)
              if (!remainder) {
                return
              }
              const nextSegment = remainder.split('.')[0]
              if (!nextSegment) {
                return
              }
              if (segmentPrefix && !nextSegment.startsWith(segmentPrefix)) {
                return
              }
              if (seen.has(nextSegment)) {
                return
              }
              seen.add(nextSegment)
              const fullPath = `${base}${nextSegment}`
              const meta = metadata[fullPath]
              suggestions.push({
                label: nextSegment,
                kind: mapKind(meta?.kind),
                insertText: nextSegment,
                range,
                sortText: nextSegment,
                detail: meta?.detail,
                documentation: meta?.documentation,
              })
            })
            Object.entries(metadata).forEach(([key, meta]) => {
              if (key.includes('.')) {
                return
              }
              if (meta?.kind !== 'keyword' && meta?.kind !== 'function') {
                return
              }
              if (segmentPrefix && !key.startsWith(segmentPrefix)) {
                return
              }
              if (seen.has(key)) {
                return
              }
              seen.add(key)
              suggestions.push({
                label: key,
                kind: mapKind(meta?.kind),
                insertText: key,
                range,
                sortText: key,
                detail: meta?.detail,
                documentation: meta?.documentation,
              })
            })
          } else {
            words.forEach((word) => {
              const root = word.split('.')[0]
              if (!root) {
                return
              }
              if (prefix && !root.startsWith(prefix)) {
                return
              }
              if (seen.has(root)) {
                return
              }
              seen.add(root)
              const meta = metadata[root]
              suggestions.push({
                label: root,
                kind: mapKind(meta?.kind),
                insertText: root,
                range,
                sortText: root,
                detail: meta?.detail,
                documentation: meta?.documentation,
              })
            })
          }

          return { suggestions }
        },
      })
    }

    if (
      autoTriggerSuggestionsRef.current &&
      !customSuggestionsRef.current?.enabled &&
      editorRef.current?.hasTextFocus()
    ) {
      editorRef.current.trigger('keyboard', 'editor.action.triggerSuggest', {})
    }

    return () => {
      store.wordsByModel.delete(modelKey)
      store.metadataByModel.delete(modelKey)
      if (store.wordsByModel.size === 0) {
        store.provider?.dispose()
        store.provider = null
      }
    }
  }, [monaco, language, completionWords, completionMetadata, editorReady])

  useEffect(() => {
    return () => {
      contentSizeDisposableRef.current?.dispose()
      layoutDisposableRef.current?.dispose()
      typeDisposableRef.current?.dispose()
    }
  }, [])

  return (
    <div className={cn('relative h-full w-full', className)}>
      <Editor
        path={id}
        theme="supabase"
        className="monaco-editor"
        value={value ?? undefined}
        language={language}
        defaultValue={defaultValue ?? undefined}
        loading={loading || <LogoLoader />}
        options={optionsMerged}
        onMount={onMount}
        onChange={onChangeContent}
      />
      {customSuggestState.open && customSuggestions?.enabled && (
        <div
          className="fixed z-50 flex gap-2"
          style={{ top: customSuggestState.top, left: customSuggestState.left }}
          onMouseDown={(event) => event.preventDefault()}
        >
          <div className="w-[220px] rounded-lg border border-foreground-muted/30 bg-surface-100 p-2 text-xs shadow-lg">
            {activeSuggestion && (
              <div className="space-y-2">
                <div className="text-[11px] font-semibold text-foreground">
                  {activeSuggestion.fullPath}
                </div>
                {activePreviewEntries.length > 0 ? (
                  <div className="space-y-1 font-mono">
                    {activePreviewEntries.map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between gap-2">
                        <span className="text-foreground">{key}</span>
                        <span className="text-foreground-muted">
                          {formatInlinePreview(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="font-mono text-foreground-muted">
                      {activeSuggestionDetails?.detail ??
                        activeSuggestion.detail ??
                        formatInlinePreview(activePreviewValue) ??
                        ''}
                    </div>
                    {activeSuggestionDetails?.documentation ? (
                      <div className="text-foreground-muted">
                        {activeSuggestionDetails.documentation}
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            )}
          </div>
          {!customSuggestState.signatureOnly && (
            <div
              ref={customSuggestListRef}
              className="w-[220px] max-h-64 overflow-y-auto rounded-lg border border-foreground-muted/30 bg-surface-100 py-1 text-xs shadow-lg"
            >
              {customSuggestState.items.map((item, index) => {
                const isActive = index === customSuggestState.activeIndex
                return (
                  <button
                    key={`${item.fullPath}-${index}`}
                    type="button"
                    data-suggest-index={index}
                    className={cn(
                      'flex w-full items-center justify-between gap-2 px-2 py-1 text-left font-mono',
                      isActive ? 'bg-brand-500 text-white' : 'text-foreground'
                    )}
                    onMouseEnter={() =>
                      setCustomSuggestState((prev) => ({ ...prev, activeIndex: index }))
                    }
                    onClick={() => {
                      const editor = editorRef.current
                      if (!editor) {
                        return
                      }
                      const position = editor.getPosition()
                      const startColumn =
                        customSuggestState.replaceRange?.startColumn ?? position?.column ?? 1
                      const endColumn =
                        customSuggestState.replaceRange?.endColumn ?? position?.column ?? startColumn
                      const lineNumber = position?.lineNumber ?? 1
                      editor.setSelection({
                        startLineNumber: lineNumber,
                        startColumn,
                        endLineNumber: lineNumber,
                        endColumn,
                      })
                      editor.trigger('keyboard', 'type', { text: item.insertText })
                      closeCustomSuggest()
                      if (item.appendDot || item.insertText.endsWith('.')) {
                        setTimeout(() => updateCustomSuggestions(editor), 0)
                      }
                    }}
                  >
                    <span className="truncate">{item.label}</span>
                    <span className="text-[10px] uppercase opacity-70">
                      {(item.kind ?? 'object').replace('undefined', 'void')}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}
      {placeholder !== undefined && (
        <div
          className={cn(
            'monaco-placeholder absolute top-[3px] left-[57px] text-sm pointer-events-none font-mono',
            '[&>div>p]:text-foreground-lighter [&>div>p]:!m-0 tracking-tighter',
            showPlaceholder ? 'block' : 'hidden'
          )}
        >
          <Markdown content={placeholder} />
        </div>
      )}
    </div>
  )
}

export default CodeEditor
