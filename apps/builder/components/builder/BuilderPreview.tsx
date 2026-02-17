import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { toast } from 'sonner'

import {
  buildSidebarThemeVars,
  getWidgetDefinition,
  resolveSidebarPanelConfig,
} from 'widgets/runtime'
import {
  Badge,
  Button,
  ScrollArea,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  Select_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  ToggleGroup,
  ToggleGroupItem,
  cn,
} from 'ui'

import { useBuilderPoliciesQuery } from 'data/builder/builder-policies'
import type { BuilderQuery } from 'data/builder/builder-queries'
import type { BuilderJsFunction } from 'data/builder/builder-js'
import { getKeys, useAPIKeysQuery } from 'data/api-keys/api-keys-query'
import { useSessionAccessTokenQuery } from 'data/auth/session-access-token-query'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { IS_PLATFORM } from 'lib/constants'
import { evaluateCondition } from 'lib/builder/expressions'
import { resolveValue } from 'lib/builder/value-resolver'
import { runBuilderQuery } from 'lib/builder/query-runner'
import type {
  BuilderAppMeta,
  BuilderWidgetSpacing,
  BuilderMenuItem,
  BuilderPage,
  BuilderQueryRunResult,
  BuilderWidgetInstance,
} from './types'
import {
  getPageFrameWidgets,
  resolvePagePaddingValue,
  resolveSpacingPadding,
  resolveWidgetSpacingModes,
} from './types'
import { isPlainObject, stripTransformerMeta } from './BuilderCodeUtils'
import { resolveWidgetStyleScopeVars } from './widgetStyleOverrides'
import { renderWidgetTree } from './runtime/renderWidgetTree'
import { flattenWidgets, isWidgetVisible, parseBoolean } from './runtime/utils'

// Предпросмотр: рендер страниц с политиками, данными и запуском запросов.

const toKebabCase = (value: string) =>
  value.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`)

const serializeThemeStyle = (style?: CSSProperties) => {
  if (!style) {
    return ''
  }
  return Object.entries(style)
    .map(([key, value]) => {
      if (value === undefined || value === null || value === '') {
        return ''
      }
      const cssKey = key.startsWith('--') ? key : toKebabCase(key)
      return `${cssKey}: ${String(value)};`
    })
    .filter(Boolean)
    .join(' ')
}

type GlobalFramePadding = 'sm' | 'md' | 'lg'
type GlobalFrameBackground = 'surface' | 'muted' | 'transparent'

const resolveGlobalFrameVisualConfig = (
  raw: Record<string, unknown> | undefined
): { padding: GlobalFramePadding; bordered: boolean; background: GlobalFrameBackground } => {
  const paddingRaw = typeof raw?.padding === 'string' ? raw.padding.trim().toLowerCase() : 'md'
  const padding: GlobalFramePadding =
    paddingRaw === 'sm' || paddingRaw === 'lg' ? paddingRaw : 'md'
  const backgroundRaw =
    typeof raw?.background === 'string' ? raw.background.trim().toLowerCase() : 'surface'
  const background: GlobalFrameBackground =
    backgroundRaw === 'muted' || backgroundRaw === 'transparent' ? backgroundRaw : 'surface'
  const bordered = parseBoolean(raw?.bordered, true)
  return { padding, bordered, background }
}

const getGlobalFramePaddingClass = (padding: GlobalFramePadding) =>
  padding === 'sm' ? 'p-3' : padding === 'lg' ? 'p-6' : 'p-4'

const getGlobalFrameBackgroundClass = (background: GlobalFrameBackground) =>
  background === 'muted'
    ? 'bg-muted'
    : background === 'transparent'
      ? 'bg-transparent'
      : 'bg-background'

interface BuilderPreviewProps {
  pages: BuilderPage[]
  activePageId: string | null
  onSelectPage: (pageId: string) => void
  appMeta?: BuilderAppMeta
  themeStyle?: CSSProperties
  themeCustomCss?: string
  appFrameWidgets?: BuilderWidgetInstance[]
  policies?: Record<string, boolean>
  queryRun?: BuilderQueryRunResult
  onClearQueryRun?: () => void
  onQueryRun?: (result: BuilderQueryRunResult) => void
  queries?: BuilderQuery[]
  jsFunctions?: BuilderJsFunction[]
  projectRef?: string
  projectRestUrl?: string | null
  gridRowHeight: number
  gridMargin: number
  iconLibrary?: string
  variant?: 'debug' | 'app'
}

export const BuilderPreview = ({
  pages,
  activePageId,
  onSelectPage,
  appMeta,
  themeStyle,
  themeCustomCss,
  appFrameWidgets = [],
  policies,
  queryRun,
  onClearQueryRun,
  onQueryRun,
  queries = [],
  jsFunctions = [],
  projectRef,
  projectRestUrl,
  gridRowHeight,
  gridMargin,
  iconLibrary,
  variant = 'debug',
}: BuilderPreviewProps) => {
  const isAppVariant = variant === 'app'
  const themeCssText = useMemo(() => serializeThemeStyle(themeStyle), [themeStyle])
  const hasExternalPolicies = typeof policies !== 'undefined'
  const { data: policyKeys = [] } = useBuilderPoliciesQuery({
    enabled: !hasExternalPolicies,
  })
  const [previewPolicies, setPreviewPolicies] = useState<Record<string, boolean>>({})
  const [queryView, setQueryView] = useState<'table' | 'json'>('table')
  const [widgetState, setWidgetState] = useState<Record<string, Record<string, unknown>>>({})
  const [appState, setAppState] = useState<Record<string, unknown>>({})
  const [queryResults, setQueryResults] = useState<Record<string, unknown>>({})
  const actionDebounceRef = useRef<Map<string, number>>(new Map())
  const actionThrottleRef = useRef<Map<string, number>>(new Map())

  const { data: accessToken } = useSessionAccessTokenQuery({ enabled: IS_PLATFORM })
  const { can: canReadApiKeys } = useAsyncCheckPermissions(PermissionAction.SECRETS_READ, '*')
  const { data: apiKeys } = useAPIKeysQuery(
    { projectRef, reveal: true },
    { enabled: canReadApiKeys && Boolean(projectRef) }
  )
  const { anonKey, publishableKey } = getKeys(apiKeys ?? [])
  // Контекст авторизации для запросов в превью.
  const authContext = useMemo(
    () => ({
      anonKey: anonKey?.api_key ?? publishableKey?.api_key,
      accessToken: accessToken ?? undefined,
    }),
    [anonKey?.api_key, publishableKey?.api_key, accessToken]
  )

  useEffect(() => {
    if (policyKeys.length === 0) {
      return
    }

    setPreviewPolicies((prev) => {
      const next: Record<string, boolean> = { ...prev }
      policyKeys.forEach((key) => {
        if (!(key in next)) {
          next[key] = false
        }
      })
      Object.keys(next).forEach((key) => {
        if (!policyKeys.includes(key)) {
          delete next[key]
        }
      })
      return next
    })
  }, [policyKeys])

  const activePolicies = hasExternalPolicies ? policies ?? {} : previewPolicies

  const activePage = useMemo(
    () => pages.find((page) => page.id === activePageId) ?? pages[0] ?? null,
    [pages, activePageId]
  )

  // Фильтруем видимость по политикам доступа.
  const menuItems = useMemo(() => {
    if (!activePage?.menu?.items) {
      return []
    }
    return filterMenuItems(activePage.menu.items, activePolicies)
  }, [activePage?.menu?.items, activePolicies])

  const pageFrameWidgets = useMemo(
    () => (activePage ? getPageFrameWidgets(activePage.pageLayout.frames) : []),
    [activePage]
  )
  const activePageWidgets = useMemo(
    () => activePage?.pageLayout.widgets ?? [],
    [activePage]
  )
  const activePageMain = useMemo(
    () => activePage?.pageLayout.main,
    [activePage]
  )
  const flattenedGlobalWidgets = useMemo(
    () => flattenWidgets([...appFrameWidgets, ...pageFrameWidgets]),
    [appFrameWidgets, pageFrameWidgets]
  )
  const flattenedActiveWidgets = useMemo(
    () => flattenWidgets(activePageWidgets),
    [activePageWidgets]
  )
  const widgetLookup = useMemo(() => {
    const map = new Map<string, BuilderWidgetInstance>()
    flattenedGlobalWidgets.forEach((widget) => {
      map.set(widget.id, widget)
    })
    pages.forEach((page) => {
      const pageWidgets = page.pageLayout.widgets
      flattenWidgets(pageWidgets).forEach((widget) => {
        map.set(widget.id, widget)
      })
    })
    return map
  }, [flattenedGlobalWidgets, pages])

  const widgetValueMap = useMemo(() => {
    const map: Record<string, Record<string, unknown>> = {}
    flattenedGlobalWidgets.forEach((widget) => {
      const definition = getWidgetDefinition(widget.type)
      const defaultProps = definition?.defaultProps ?? {}
      const entry: Record<string, unknown> = {
        id: widget.id,
        type: widget.type,
        ...defaultProps,
        ...(widget.props ?? {}),
        ...(widgetState[widget.id] ?? {}),
      }
      const supportsFormDataKey =
        Object.prototype.hasOwnProperty.call(defaultProps, 'formDataKey') ||
        Object.prototype.hasOwnProperty.call(entry, 'formDataKey')
      if (supportsFormDataKey) {
        const rawFormDataKey = entry.formDataKey
        if (typeof rawFormDataKey === 'string') {
          if (/^\\{\\{\\s*self\\.id\\s*\\}\\}$/.test(rawFormDataKey.trim())) {
            entry.formDataKey = widget.id
          }
        } else if (typeof rawFormDataKey === 'undefined') {
          entry.formDataKey = widget.id
        }
      }
      map[widget.id] = entry
    })
    pages.forEach((page) => {
      const pageWidgets = page.pageLayout.widgets
      flattenWidgets(pageWidgets).forEach((widget) => {
        const definition = getWidgetDefinition(widget.type)
        const defaultProps = definition?.defaultProps ?? {}
        const entry: Record<string, unknown> = {
          id: widget.id,
          type: widget.type,
          ...defaultProps,
          ...(widget.props ?? {}),
          ...(widgetState[widget.id] ?? {}),
        }
        const supportsFormDataKey =
          Object.prototype.hasOwnProperty.call(defaultProps, 'formDataKey') ||
          Object.prototype.hasOwnProperty.call(entry, 'formDataKey')
        if (supportsFormDataKey) {
          const rawFormDataKey = entry.formDataKey
          if (typeof rawFormDataKey === 'string') {
            if (/^\\{\\{\\s*self\\.id\\s*\\}\\}$/.test(rawFormDataKey.trim())) {
              entry.formDataKey = widget.id
            }
          } else if (typeof rawFormDataKey === 'undefined') {
            entry.formDataKey = widget.id
          }
        }
        map[widget.id] = entry
      })
    })
    return map
  }, [flattenedGlobalWidgets, pages, widgetState])

  const runtimeContext = useMemo(() => {
    const pageNames = pages.map((page) => page.name || page.id)
    const currentPage = activePage?.name ?? activePage?.id ?? pageNames[0] ?? ''
    const appName = appMeta?.browserTitle ?? ''

    return {
      widgets: widgetValueMap,
      state: appState,
      queries: queryResults,
      auth: authContext,
      retoolContext: {
        appName,
        currentPage,
        environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? 'local',
        inEditorMode: !isAppVariant,
        pages: pageNames,
        runningQueries: [],
        translations: {},
      },
      ...widgetValueMap,
      ...queryResults,
    }
  }, [
    widgetValueMap,
    appState,
    queryResults,
    authContext,
    pages,
    activePage?.name,
    activePage?.id,
    appMeta?.browserTitle,
  ])

  const visibleGlobalWidgets = useMemo(
    () =>
      appFrameWidgets.filter((widget) =>
        isWidgetVisible(widget, activePolicies, runtimeContext, widgetState, {
          includeHidden: parseBoolean(widget.props?.maintainSpaceWhenHidden),
        })
      ),
    [appFrameWidgets, activePolicies, runtimeContext, widgetState]
  )
  const visiblePageFrameWidgets = useMemo(
    () =>
      pageFrameWidgets.filter((widget) =>
        isWidgetVisible(widget, activePolicies, runtimeContext, widgetState, {
          includeHidden: parseBoolean(widget.props?.maintainSpaceWhenHidden),
        })
      ),
    [pageFrameWidgets, activePolicies, runtimeContext, widgetState]
  )

  const visibleTopLevelWidgets = useMemo(() => {
    if (!activePageWidgets.length) {
      return []
    }
    return activePageWidgets.filter((widget) =>
      isWidgetVisible(widget, activePolicies, runtimeContext, widgetState, {
        includeHidden: parseBoolean(widget.props?.maintainSpaceWhenHidden),
      })
    )
  }, [activePageWidgets, activePolicies, runtimeContext, widgetState])

  const queryLookup = useMemo(() => {
    const map = new Map<string, BuilderQuery>()
    queries.forEach((query) => {
      map.set(query.id, query)
      map.set(query.name, query)
    })
    return map
  }, [queries])

  const jsLookup = useMemo(() => {
    const map = new Map<string, BuilderJsFunction>()
    jsFunctions.forEach((func) => {
      map.set(func.id, func)
      map.set(func.name, func)
    })
    return map
  }, [jsFunctions])

  const updateWidgetState = (widgetId: string, patch: Record<string, unknown>) => {
    setWidgetState((prev) => ({
      ...prev,
      [widgetId]: {
        ...(prev[widgetId] ?? {}),
        ...patch,
      },
    }))
  }

  const handleRunQuery = async (
    query: BuilderQuery,
    eventContext?: Record<string, unknown>
  ) => {
    onQueryRun?.({
      queryId: query.id,
      name: query.name,
      status: 'running',
      receivedAt: new Date().toISOString(),
    })

    try {
      const resolvedConfig = resolveValue(query.config, {
        ...runtimeContext,
        ...(eventContext ? { event: eventContext } : {}),
      })

      const data = await runBuilderQuery({
        config: isPlainObject(resolvedConfig) ? resolvedConfig : query.config,
        queryType: query.type,
        projectRef,
        projectRestUrl,
        accessToken,
        apiKeys: apiKeys ?? [],
      })

      setQueryResults((prev) => ({
        ...prev,
        [query.name]: data,
        [query.id]: data,
      }))
      onQueryRun?.({
        queryId: query.id,
        name: query.name,
        status: 'success',
        data,
        receivedAt: new Date().toISOString(),
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Query execution failed'
      onQueryRun?.({
        queryId: query.id,
        name: query.name,
        status: 'error',
        error: message,
        receivedAt: new Date().toISOString(),
      })
      toast(message)
    }
  }

  const runWidgetActions = async (
    widget: BuilderWidgetInstance,
    eventName: string,
    payload?: Record<string, unknown>
  ) => {
    const events = normalizeEvents(widget.props?.events)
    if (events.length === 0) {
      return
    }

    const eventContext = {
      widgetId: widget.id,
      event: eventName,
      payload,
    }

    const executeAction = async (resolvedAction: Record<string, unknown>) => {
      const actionType = resolvedAction.type

      if (actionType === 'query') {
        const queryName = resolvedAction.queryName ?? resolvedAction.queryId
        if (!queryName) {
          toast('Missing queryName for action')
          return
        }
        const query = queryLookup.get(String(queryName))
        if (!query) {
          toast(`Query "${queryName}" not found`)
          return
        }
        const method =
          typeof resolvedAction.method === 'string' ? resolvedAction.method : 'trigger'
        if (method === 'reset' || method === 'clearCache') {
          setQueryResults((prev) => {
            const next = { ...prev }
            delete next[query.name]
            delete next[query.id]
            return next
          })
          return
        }
        await handleRunQuery(query, eventContext)
        return
      }

      if (actionType === 'js') {
        const jsName = resolvedAction.jsName ?? resolvedAction.jsId
        if (jsName) {
          const func = jsLookup.get(String(jsName))
          if (!func) {
            toast(`JS function "${jsName}" not found`)
            return
          }
          try {
            runJsFunction(func.code, {
              ...runtimeContext,
              event: eventContext,
            })
          } catch (error) {
            const message = error instanceof Error ? error.message : 'JS execution failed'
            toast(message)
          }
          return
        }
        if (typeof resolvedAction.script === 'string' && resolvedAction.script.trim()) {
          try {
            runInlineScript(resolvedAction.script, {
              ...runtimeContext,
              event: eventContext,
            })
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Script execution failed'
            toast(message)
          }
        }
        return
      }

      if (actionType === 'setValue') {
        updateWidgetState(widget.id, { value: resolvedAction.value })
        return
      }

      if (actionType === 'setState') {
        const stateKey = resolvedAction.key ?? resolvedAction.stateKey
        if (typeof stateKey === 'string' && stateKey) {
          const method =
            typeof resolvedAction.method === 'string' ? resolvedAction.method : 'setValue'
          if (method === 'setIn') {
            const path = parseKeyPath(resolvedAction.keyPath)
            if (path.length === 0) {
              setAppState((prev) => ({ ...prev, [stateKey]: resolvedAction.value }))
              return
            }
            setAppState((prev) => {
              const currentValue = prev[stateKey]
              const base =
                Array.isArray(currentValue) || isPlainObject(currentValue) ? currentValue : {}
              const updated = setValueAtPath(base, path, resolvedAction.value)
              return { ...prev, [stateKey]: updated }
            })
            return
          }
          setAppState((prev) => ({ ...prev, [stateKey]: resolvedAction.value }))
        }
        return
      }

      if (actionType === 'notification') {
        const title =
          typeof resolvedAction.title === 'string' && resolvedAction.title.length > 0
            ? resolvedAction.title
            : typeof resolvedAction.message === 'string'
              ? resolvedAction.message
              : typeof resolvedAction.text === 'string'
                ? resolvedAction.text
                : ''
        const description =
          typeof resolvedAction.description === 'string' && resolvedAction.description.length > 0
            ? resolvedAction.description
            : undefined
        const notificationType =
          typeof resolvedAction.notificationType === 'string'
            ? resolvedAction.notificationType
            : ''
        const durationSeconds = parseNumber(resolvedAction.duration, 0)
        const duration = durationSeconds > 0 ? durationSeconds * 1000 : undefined
        const message = title || description || 'Notification'
        const options = description ? { description, duration } : { duration }
        if (notificationType === 'success') {
          toast.success(message, options)
        } else if (notificationType === 'error') {
          toast.error(message, options)
        } else if (notificationType === 'warning') {
          toast.warning(message, options)
        } else if (notificationType === 'info') {
          toast.info(message, options)
        } else {
          toast(message, options)
        }
        return
      }

      if (actionType === 'setUrlParams') {
        if (typeof window !== 'undefined') {
          const url = new URL(window.location.href)
          const queryParams = buildParamObject(
            resolvedAction.queryParams ?? resolvedAction.params ?? null
          )
          const hashParams = buildParamObject(resolvedAction.hashParams ?? null)
          const key =
            typeof resolvedAction.paramKey === 'string'
              ? resolvedAction.paramKey
              : typeof resolvedAction.key === 'string'
                ? resolvedAction.key
                : null
          if (key) {
            const value = resolvedAction.paramValue ?? resolvedAction.value ?? ''
            queryParams[key] = String(value)
          }
          Object.entries(queryParams).forEach(([paramKey, value]) => {
            url.searchParams.set(paramKey, value)
          })
          if (Object.keys(hashParams).length > 0) {
            const nextHash = new URLSearchParams(url.hash.replace(/^#/, ''))
            Object.entries(hashParams).forEach(([hashKey, value]) => {
              nextHash.set(hashKey, value)
            })
            url.hash = nextHash.toString()
          }
          window.history.replaceState({}, '', url.toString())
        }
        return
      }

      if (actionType === 'setLocalStorage') {
        if (typeof window !== 'undefined' && window.localStorage) {
          const key = resolvedAction.key
          if (typeof key === 'string' && key.length > 0) {
            const method =
              typeof resolvedAction.method === 'string' ? resolvedAction.method : 'setValue'
            if (method === 'clear') {
              window.localStorage.removeItem(key)
              return
            }
            if (method === 'getValue') {
              const value = window.localStorage.getItem(key)
              setAppState((prev) => ({ ...prev, [key]: value }))
              return
            }
            window.localStorage.setItem(key, String(resolvedAction.value ?? ''))
          } else if (
            typeof resolvedAction.method === 'string' &&
            resolvedAction.method === 'clear'
          ) {
            window.localStorage.clear()
          }
        }
        return
      }

      if (actionType === 'copyToClipboard') {
        const text = resolvedAction.text ?? resolvedAction.value ?? ''
        if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
          if (navigator.clipboard?.writeText) {
            navigator.clipboard.writeText(String(text)).catch(() => null)
          } else {
            window.prompt('Copy to clipboard', String(text))
          }
        }
        return
      }

      if (actionType === 'exportData') {
        if (typeof window !== 'undefined') {
          const filename =
            typeof resolvedAction.filename === 'string' && resolvedAction.filename.length > 0
              ? resolvedAction.filename
              : 'data.json'
          let rawData = resolvedAction.data
          const dataSourceId =
            typeof resolvedAction.dataSourceId === 'string' ? resolvedAction.dataSourceId : null
          if (!rawData && dataSourceId) {
            const dataSource = widgetValueMap[dataSourceId]
            if (dataSource && 'data' in dataSource) {
              rawData = resolveValue(
                (dataSource as Record<string, unknown>).data ?? null,
                runtimeContext
              )
            }
          }
          const fileType =
            typeof resolvedAction.fileType === 'string' ? resolvedAction.fileType : 'json'
          const serialized = serializeExportData(rawData, fileType)
          const mimeType = resolveExportMimeType(fileType)
          const blob = new Blob([serialized], { type: mimeType })
          const link = document.createElement('a')
          link.href = URL.createObjectURL(blob)
          link.download = filename
          link.click()
          URL.revokeObjectURL(link.href)
        }
        return
      }

      if (actionType === 'goToPage') {
        const pageId = resolvedAction.pageId ?? resolvedAction.pageName ?? resolvedAction.page
        if (typeof pageId === 'string') {
          const passDataWith =
            typeof resolvedAction.passDataWith === 'string'
              ? resolvedAction.passDataWith
              : 'params'
          if (passDataWith === 'variable') {
            const stateKey = resolvedAction.stateKey ?? resolvedAction.key
            if (typeof stateKey === 'string' && stateKey) {
              const method =
                typeof resolvedAction.method === 'string' ? resolvedAction.method : 'setValue'
              if (method === 'setIn') {
                const path = parseKeyPath(resolvedAction.keyPath)
                if (path.length > 0) {
                  setAppState((prev) => {
                    const currentValue = prev[stateKey]
                    const base =
                      Array.isArray(currentValue) || isPlainObject(currentValue)
                        ? currentValue
                        : {}
                    const updated = setValueAtPath(base, path, resolvedAction.value)
                    return { ...prev, [stateKey]: updated }
                  })
                } else {
                  setAppState((prev) => ({ ...prev, [stateKey]: resolvedAction.value }))
                }
              } else {
                setAppState((prev) => ({ ...prev, [stateKey]: resolvedAction.value }))
              }
            }
          } else if (typeof window !== 'undefined') {
            const persistParams = parseBoolean(resolvedAction.persistParams)
            const url = new URL(window.location.href)
            const queryParams = buildParamObject(resolvedAction.queryParams ?? null)
            const hashParams = buildParamObject(resolvedAction.hashParams ?? null)
            const nextSearch = new URLSearchParams(persistParams ? url.search : '')
            Object.entries(queryParams).forEach(([paramKey, value]) => {
              nextSearch.set(paramKey, value)
            })
            url.search = nextSearch.toString()
            if (Object.keys(hashParams).length > 0) {
              const nextHash = new URLSearchParams(persistParams ? url.hash.replace(/^#/, '') : '')
              Object.entries(hashParams).forEach(([paramKey, value]) => {
                nextHash.set(paramKey, value)
              })
              url.hash = nextHash.toString()
            }
            if (parseBoolean(resolvedAction.openInNewTab)) {
              window.open(url.toString(), '_blank', 'noopener,noreferrer')
              return
            }
            window.history.replaceState({}, '', url.toString())
          }
          if (parseBoolean(resolvedAction.openInNewTab) && typeof window !== 'undefined') {
            window.open(window.location.href, '_blank', 'noopener,noreferrer')
            return
          }
          onSelectPage(pageId)
        }
        return
      }

      if (actionType === 'goToApp') {
        if (typeof window !== 'undefined') {
          const appUrl =
            typeof resolvedAction.appUrl === 'string' && resolvedAction.appUrl.length > 0
              ? resolvedAction.appUrl
              : null
          const appId =
            typeof resolvedAction.appId === 'string' && resolvedAction.appId.length > 0
              ? resolvedAction.appId
              : null
          let urlString = appUrl
          if (!urlString && appId && projectRef) {
            const pageId =
              typeof resolvedAction.pageId === 'string' && resolvedAction.pageId.length > 0
                ? resolvedAction.pageId
                : null
            const base = `/builder?ref=${projectRef}&appId=${appId}`
            urlString = pageId ? `${base}&pageId=${pageId}` : base
          }
          if (urlString) {
            const url = new URL(urlString, window.location.origin)
            const queryParams = buildParamObject(resolvedAction.queryParams ?? null)
            const hashParams = buildParamObject(resolvedAction.hashParams ?? null)
            Object.entries(queryParams).forEach(([paramKey, value]) => {
              url.searchParams.set(paramKey, value)
            })
            if (Object.keys(hashParams).length > 0) {
              const nextHash = new URLSearchParams(url.hash.replace(/^#/, ''))
              Object.entries(hashParams).forEach(([paramKey, value]) => {
                nextHash.set(paramKey, value)
              })
              url.hash = nextHash.toString()
            }
            if (parseBoolean(resolvedAction.openInNewTab)) {
              window.open(url.toString(), '_blank', 'noopener,noreferrer')
            } else {
              window.location.assign(url.toString())
            }
          }
        }
        return
      }

      if (actionType === 'openUrl') {
        if (typeof resolvedAction.url === 'string' && typeof window !== 'undefined') {
          if (parseBoolean(resolvedAction.openInNewTab)) {
            window.open(resolvedAction.url, '_blank', 'noopener,noreferrer')
          } else if (parseBoolean(resolvedAction.disableClientSideRouting)) {
            window.location.assign(resolvedAction.url)
          } else {
            window.location.assign(resolvedAction.url)
          }
        }
        return
      }

      if (actionType === 'confetti') {
        toast.success('Confetti!')
        return
      }

      if (
        actionType === 'setHidden' ||
        actionType === 'controlComponent' ||
        actionType === 'widget'
      ) {
        const method =
          actionType === 'controlComponent' || actionType === 'widget'
            ? String(resolvedAction.method ?? 'setHidden')
            : 'setHidden'
        const targetIdRaw =
          resolvedAction.componentId ??
          resolvedAction.widgetId ??
          resolvedAction.targetId ??
          resolvedAction.pluginId
        if (typeof targetIdRaw !== 'string' || !targetIdRaw) {
          return
        }
        const params = isPlainObject(resolvedAction.params)
          ? (resolvedAction.params as Record<string, unknown>)
          : {}
        if (method === 'setHidden') {
          const hiddenRaw = resolvedAction.hidden ?? params.hidden
          const hidden =
            typeof hiddenRaw === 'boolean'
              ? hiddenRaw
              : typeof hiddenRaw === 'string'
                ? hiddenRaw.toLowerCase() === 'true'
                : true
          updateWidgetState(targetIdRaw, { hidden })
          return
        }
        if (method === 'setDisabled') {
          const disabledRaw = resolvedAction.disabled ?? params.disabled
          const disabled =
            typeof disabledRaw === 'boolean'
              ? disabledRaw
              : typeof disabledRaw === 'string'
                ? disabledRaw.toLowerCase() === 'true'
                : true
          updateWidgetState(targetIdRaw, { disabled })
          return
        }
        if (method === 'setValue') {
          const value = resolvedAction.value ?? params.value
          updateWidgetState(targetIdRaw, { value })
          return
        }
        if (method === 'clearValue') {
          updateWidgetState(targetIdRaw, { value: '' })
          return
        }
        if (method === 'resetValue') {
          const targetWidget = widgetLookup.get(targetIdRaw)
          const defaultValue =
            targetWidget?.props?.value ??
            (targetWidget?.props as Record<string, unknown> | undefined)?.defaultValue ??
            null
          updateWidgetState(targetIdRaw, { value: defaultValue })
          return
        }
        if (method === 'scrollIntoView') {
          const alignment = resolveScrollAlignment(params.alignment)
          const smooth = parseBoolean(
            typeof params.smooth !== 'undefined' ? params.smooth : params.smoothScroll
          )
          const targetEl = getWidgetElement(targetIdRaw)
          targetEl?.scrollIntoView({
            behavior: smooth ? 'smooth' : 'auto',
            block: alignment,
            inline: 'nearest',
          })
          return
        }
        if (method === 'focus' || method === 'blur' || method === 'select') {
          const targetEl = getWidgetElement(targetIdRaw)
          const focusable = findFocusableElement(targetEl)
          if (!focusable) {
            return
          }
          if (method === 'focus') {
            focusable.focus()
            return
          }
          if (method === 'blur') {
            focusable.blur()
            return
          }
          if ('select' in focusable) {
            ;(focusable as HTMLInputElement | HTMLTextAreaElement).select?.()
          } else {
            focusable.focus()
          }
          return
        }
      }
    }

    const matchingEvents = events
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => item.event === eventName)
    for (const { item, index } of matchingEvents) {
      const resolvedAction = resolveValue(item, {
        ...runtimeContext,
        event: eventContext,
      })
      if (!isPlainObject(resolvedAction) || typeof resolvedAction.type !== 'string') {
        continue
      }
      if (!shouldRunOnlyWhen(resolvedAction.onlyRunWhen)) {
        continue
      }
      const waitMs = parseNumber(resolvedAction.waitMs, 0)
      const waitType = resolvedAction.waitType === 'throttle' ? 'throttle' : 'debounce'
      const actionKey = `${widget.id}:${eventName}:${index}`
      if (waitMs <= 0 || typeof window === 'undefined') {
        await executeAction(resolvedAction)
        continue
      }
      if (waitType === 'debounce') {
        const current = actionDebounceRef.current.get(actionKey)
        if (current) {
          window.clearTimeout(current)
        }
        const timeoutId = window.setTimeout(() => {
          actionDebounceRef.current.delete(actionKey)
          void executeAction(resolvedAction)
        }, waitMs)
        actionDebounceRef.current.set(actionKey, timeoutId)
        continue
      }
      const lastCall = actionThrottleRef.current.get(actionKey) ?? 0
      const now = Date.now()
      if (now - lastCall >= waitMs) {
        actionThrottleRef.current.set(actionKey, now)
        void executeAction(resolvedAction)
      }
    }
  }

  useEffect(() => {
    if (!queryRun || queryRun.status !== 'success') {
      return
    }

    setQueryResults((prev) => ({
      ...prev,
      [queryRun.name]: queryRun.data,
      [queryRun.queryId]: queryRun.data,
    }))
  }, [queryRun])

  const renderTree = (widgets: BuilderWidgetInstance[], depth = 0) =>
    renderWidgetTree({
      widgets,
      depth,
      gridRowHeight,
      gridMargin,
      activePolicies,
      runtimeContext,
      widgetState,
      onUpdateState: updateWidgetState,
      onRunActions: runWidgetActions,
      chrome: !isAppVariant,
      iconLibrary,
    })

  const renderGlobalWidget = (
    widget: BuilderWidgetInstance,
    variant: 'header' | 'sidebar' | 'drawer' | 'modal' | 'split' | 'other'
  ): ReactNode => {
    const definition = getWidgetDefinition(widget.type)
    const hasChildren = Boolean(widget.children && widget.children.length > 0)
    const childGrid = hasChildren ? renderTree(widget.children ?? [], 1) : null
    const fallbackMessage = hasChildren
      ? 'No components visible for the current policies.'
      : 'No components in this area yet.'
    const resolvedFrameProps = resolveValue(widget.props ?? {}, runtimeContext)
    const frameRawProps = (resolvedFrameProps && typeof resolvedFrameProps === 'object'
      ? (resolvedFrameProps as Record<string, unknown>)
      : undefined) as Record<string, unknown> | undefined
    const frameVisual = resolveGlobalFrameVisualConfig(frameRawProps)
    const frameStyleScopeVars = resolveWidgetStyleScopeVars(frameRawProps)
    const frameSpacing = resolveWidgetSpacingModes(
      widget.type,
      widget.spacing as BuilderWidgetSpacing | null | undefined,
      (expression) => resolveValue(expression, runtimeContext)
    )
    const frameMargin = resolveSpacingPadding(frameSpacing, (expression) =>
      resolveValue(expression, runtimeContext)
    )
    const framePadding = resolveSpacingPadding(
      frameSpacing,
      (expression) => resolveValue(expression, runtimeContext),
      'padding'
    )
    const frameHeaderPadding = resolveSpacingPadding(
      frameSpacing,
      (expression) => resolveValue(expression, runtimeContext),
      'headerPadding'
    )
    const frameFooterPadding = resolveSpacingPadding(
      frameSpacing,
      (expression) => resolveValue(expression, runtimeContext),
      'footerPadding'
    )
    const frameMarginStyle = { margin: frameMargin } as CSSProperties
    const frameContentPadding = resolvePagePaddingValue(
      {
        paddingMode: frameSpacing.marginMode === 'none' ? 'none' : 'normal',
        paddingFxEnabled: frameSpacing.marginFxEnabled,
        paddingFx: frameSpacing.marginFx,
      },
      (expression) => resolveValue(expression, runtimeContext)
    )
    const frameContentInsetStyle = { padding: frameContentPadding } as CSSProperties
    const sidebarContentInsetStyle = { padding: framePadding } as CSSProperties
    const frameBorderClass = frameVisual.bordered ? 'border border-border' : 'border border-transparent'
    const frameBackgroundClass = getGlobalFrameBackgroundClass(frameVisual.background)
    const framePaddingClass = getGlobalFramePaddingClass(frameVisual.padding)
    const sidebarConfig = resolveSidebarPanelConfig(frameRawProps)
    const sidebarEdgeBorderClass = sidebarConfig.bordered
      ? sidebarConfig.side === 'right'
        ? 'border-l border-sidebar-border'
        : 'border-r border-sidebar-border'
      : 'border-none'
    const sidebarChildren = widget.children ?? []
    const selectSidebarChildren = (slot: 'header' | 'body' | 'footer', includeUnassigned = false) =>
      sidebarChildren.filter((child) => {
        const childSlot = (
          typeof child.props?.containerSlot === 'string' ? child.props.containerSlot : ''
        )
          .trim()
          .toLowerCase()
        if (slot === 'body') {
          if (childSlot === 'body') {
            return true
          }
          return includeUnassigned ? childSlot.length === 0 : false
        }
        return childSlot === slot
      })
    const headerChildren = selectSidebarChildren('header')
    const bodyChildren = selectSidebarChildren('body', true)
    const footerChildren = selectSidebarChildren('footer')
    const slotMinHeightPx = 5 * gridRowHeight + 4 * gridMargin

    if (variant === 'sidebar') {
      return (
        <div
          key={widget.id}
          className={cn('flex h-full min-h-0 shrink-0 flex-col', isAppVariant ? 'w-full' : 'w-auto')}
          style={{
            width: `${sidebarConfig.panelWidth}px`,
            minWidth: `${sidebarConfig.panelWidth}px`,
            maxWidth: `${sidebarConfig.panelWidth}px`,
          }}
        >
          <div
            data-builder-preview-widget-id={widget.id}
            className={cn(
              'flex h-full min-h-0 flex-col bg-sidebar text-sidebar-foreground',
              sidebarEdgeBorderClass
            )}
            style={
              {
                ...(frameStyleScopeVars ?? {}),
                ...buildSidebarThemeVars(sidebarConfig),
              } as CSSProperties
            }
          >
            {sidebarConfig.showHeader ? (
              <div
                className="border-b border-sidebar-border"
                style={{ padding: frameHeaderPadding, minHeight: `${slotMinHeightPx}px` }}
              >
                {headerChildren.length > 0 ? (
                  renderTree(headerChildren, 1)
                ) : (
                  <div className="rounded-md border border-dashed border-sidebar-border px-3 py-4 text-xs text-sidebar-foreground/70">
                    Drop components here
                  </div>
                )}
              </div>
            ) : null}
            <div className="min-h-0 flex-1" style={sidebarContentInsetStyle}>
              <div className="h-full min-h-0">
                {(bodyChildren.length > 0 ? renderTree(bodyChildren, 1) : null) ?? (
                  <div className="rounded-md border border-dashed border-sidebar-border px-3 py-4 text-xs text-sidebar-foreground/70">
                    {fallbackMessage}
                  </div>
                )}
              </div>
            </div>
            {sidebarConfig.showFooter ? (
              <div
                className="border-t border-sidebar-border text-xs text-sidebar-foreground/70"
                style={{ padding: frameFooterPadding, minHeight: `${slotMinHeightPx}px` }}
              >
                {footerChildren.length > 0 ? (
                  renderTree(footerChildren, 1)
                ) : (
                  <div className="rounded-md border border-dashed border-sidebar-border px-3 py-4 text-xs text-sidebar-foreground/70">
                    Drop components here
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )
    }

    if (isAppVariant) {
      if (!childGrid) {
        return null
      }

      if (variant === 'header') {
        const headerStyle = { '--radius': '0px', ...(frameStyleScopeVars ?? {}) } as CSSProperties
        const headerBorderClass = frameVisual.bordered
          ? 'border-b border-border'
          : 'border-b border-transparent'
        return (
          <div
            key={widget.id}
            data-builder-preview-widget-id={widget.id}
            className={cn(
              'flex w-full min-h-0 flex-col rounded-[var(--radius)]',
              headerBorderClass,
              frameBackgroundClass
            )}
            style={headerStyle}
          >
            <div style={frameContentInsetStyle}>
              {childGrid}
            </div>
          </div>
        )
      }

      if (variant === 'split') {
        return (
          <div
            key={widget.id}
            data-builder-preview-widget-id={widget.id}
            className={cn(
              'w-full',
              'min-h-0 rounded-lg',
              frameBackgroundClass,
              frameBorderClass
            )}
            style={{ ...frameMarginStyle, ...(frameStyleScopeVars ?? {}) }}
          >
            <div className={framePaddingClass}>{childGrid}</div>
          </div>
        )
      }

      return (
        <div
          key={widget.id}
          data-builder-preview-widget-id={widget.id}
        >
          {childGrid}
        </div>
      )
    }

    if (variant === 'header') {
      const headerStyle = { '--radius': '0px', ...(frameStyleScopeVars ?? {}) } as CSSProperties
      const headerBorderClass = frameVisual.bordered
        ? 'border-b border-border'
        : 'border-b border-transparent'
      return (
        <div
          key={widget.id}
          className={cn(
            'flex flex-col rounded-[var(--radius)]',
            headerBorderClass,
            frameBackgroundClass
          )}
          data-builder-preview-widget-id={widget.id}
          style={headerStyle}
        >
          <div style={frameContentInsetStyle}>
            {childGrid ?? (
              <div className="rounded-md border border-dashed border-foreground-muted/40 px-3 py-4 text-xs text-foreground-muted">
                {fallbackMessage}
              </div>
            )}
          </div>
        </div>
      )
    }

    if (variant === 'split') {
      return (
        <div
          key={widget.id}
          className={cn('rounded-md', frameBackgroundClass, frameBorderClass)}
          data-builder-preview-widget-id={widget.id}
          style={{ ...frameMarginStyle, ...(frameStyleScopeVars ?? {}) }}
        >
          <div className={framePaddingClass}>
            {childGrid ?? (
              <div className="rounded-md border border-dashed border-foreground-muted/40 px-3 py-4 text-xs text-foreground-muted">
                {fallbackMessage}
              </div>
            )}
          </div>
        </div>
      )
    }

    const layoutClass =
      variant === 'drawer' || variant === 'modal'
          ? 'rounded-md border border-foreground-muted/30 bg-surface-200/80 px-4 py-3'
          : 'rounded-md border border-foreground-muted/30 bg-surface-100 px-4 py-3'

    return (
      <div
        key={widget.id}
        className={layoutClass}
        data-builder-preview-widget-id={widget.id}
      >
        <div className="flex items-center justify-between text-xs uppercase text-foreground-muted">
          <span>{definition?.label ?? widget.type}</span>
          <span>{widget.id}</span>
        </div>
        <div className="mt-3">
          {childGrid ?? (
            <div className="rounded-md border border-dashed border-foreground-muted/40 px-3 py-4 text-xs text-foreground-muted">
              {fallbackMessage}
            </div>
          )}
        </div>
      </div>
    )
  }

  const queryPayload = useMemo(() => {
    if (!queryRun) {
      return null
    }

    const value = queryRun.data
    if (value && typeof value === 'object' && !Array.isArray(value) && 'data' in value) {
      return (value as { data?: unknown }).data ?? value
    }
    return value
  }, [queryRun])

  const jsonPayload = queryRun?.data ?? null

  const tableData = useMemo(() => {
    if (!queryPayload || !Array.isArray(queryPayload)) {
      return null
    }

    const rows = queryPayload.filter((row) => row && typeof row === 'object') as Record<
      string,
      unknown
    >[]
    if (rows.length === 0) {
      return null
    }

    const columns = Object.keys(rows[0])
    if (columns.length === 0) {
      return null
    }

    return {
      columns,
      rows: rows.slice(0, 20),
      total: rows.length,
    }
  }, [queryPayload])

  const previewGrid = renderTree(visibleTopLevelWidgets, 0)
  const globalSections = useMemo(() => {
    const sections: Record<
      'header' | 'sidebar' | 'drawer' | 'modal' | 'split' | 'other',
      BuilderWidgetInstance[]
    > = {
      header: [],
      sidebar: [],
      drawer: [],
      modal: [],
      split: [],
      other: [],
    }

    visibleGlobalWidgets.forEach((widget) => {
      if (widget.type === 'GlobalHeader') {
        sections.header.push(widget)
      } else if (widget.type === 'GlobalSidebar') {
        sections.sidebar.push(widget)
      } else if (widget.type === 'GlobalDrawer') {
        sections.drawer.push(widget)
      } else if (widget.type === 'GlobalModal') {
        sections.modal.push(widget)
      } else if (widget.type === 'GlobalSplitPane') {
        sections.split.push(widget)
      } else {
        sections.other.push(widget)
      }
    })

    return sections
  }, [visibleGlobalWidgets])
  const pageFrameSections = useMemo(() => {
    const sections: Record<
      'header' | 'sidebar' | 'drawer' | 'modal' | 'split' | 'other',
      BuilderWidgetInstance[]
    > = {
      header: [],
      sidebar: [],
      drawer: [],
      modal: [],
      split: [],
      other: [],
    }
    visiblePageFrameWidgets.forEach((widget) => {
      if (widget.type === 'GlobalDrawer') {
        sections.drawer.push(widget)
      } else if (widget.type === 'GlobalModal') {
        sections.modal.push(widget)
      } else if (widget.type === 'GlobalSplitPane') {
        sections.split.push(widget)
      } else {
        sections.other.push(widget)
      }
    })
    return sections
  }, [visiblePageFrameWidgets])
  const activeHeaderWidgets = globalSections.header
  const [activeLeftSidebarWidgets, activeRightSidebarWidgets] = useMemo(() => {
    const splitBySide = (widgets: BuilderWidgetInstance[]) => {
      const left: BuilderWidgetInstance[] = []
      const right: BuilderWidgetInstance[] = []
      widgets.forEach((widget) => {
        const resolved = resolveValue(widget.props ?? {}, runtimeContext)
        const props = (resolved && typeof resolved === 'object'
          ? (resolved as Record<string, unknown>)
          : undefined) as Record<string, unknown> | undefined
        const config = resolveSidebarPanelConfig(props)
        if (config.side === 'right') {
          right.push(widget)
        } else {
          left.push(widget)
        }
      })
      return { left, right }
    }

    const global = splitBySide(globalSections.sidebar)

    return [global.left, global.right]
  }, [globalSections.sidebar, runtimeContext])
  const activeSplitWidgets = pageFrameSections.split
  const activeOverlayDrawers = pageFrameSections.drawer
  const activeOverlayModals = pageFrameSections.modal
  const activeOtherOverlayWidgets = pageFrameSections.other
  const hasVisibleContent =
    visibleTopLevelWidgets.length > 0 ||
    visibleGlobalWidgets.length > 0 ||
    visiblePageFrameWidgets.length > 0 ||
    menuItems.length > 0
  const hasAnyWidgets =
    flattenedActiveWidgets.length > 0 || flattenedGlobalWidgets.length > 0

  return (
    <div className={isAppVariant ? 'flex h-full min-h-0 flex-col' : 'flex h-full min-h-0 flex-col p-4'}>
      {!isAppVariant && (
        <div className="flex items-center justify-between rounded-lg border border-foreground-muted/30 bg-surface-100 px-4 py-3">
          <div className="space-y-1">
            <div className="text-xs uppercase text-foreground-muted">Preview</div>
            <div className="text-sm font-medium text-foreground">
              {activePage?.name ?? 'No pages yet'}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {activePage?.access && <Badge>{activePage.access}</Badge>}
            <Select_Shadcn_
              value={activePage?.id ?? ''}
              onValueChange={onSelectPage}
              disabled={pages.length === 0}
            >
              <SelectTrigger_Shadcn_ className="h-9 w-44">
                <SelectValue_Shadcn_ placeholder="Choose page" />
              </SelectTrigger_Shadcn_>
              <SelectContent_Shadcn_>
                {pages.map((page) => (
                  <SelectItem_Shadcn_ key={page.id} value={page.id}>
                    {page.name}
                  </SelectItem_Shadcn_>
                ))}
              </SelectContent_Shadcn_>
            </Select_Shadcn_>
          </div>
        </div>
      )}
      {!isAppVariant && !hasExternalPolicies && policyKeys.length > 0 && (
        <div className="mt-3 rounded-lg border border-foreground-muted/30 bg-surface-100 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="text-xs uppercase text-foreground-muted">Policy preview</div>
            <Badge>{Object.values(previewPolicies).filter(Boolean).length} enabled</Badge>
          </div>
          <ScrollArea className="mt-3 max-h-28">
            <div className="flex flex-col gap-2 pb-2">
              {policyKeys.map((key) => (
                <label key={key} className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-foreground">{key}</span>
                  <Switch
                    checked={previewPolicies[key] ?? false}
                    onCheckedChange={(checked) =>
                      setPreviewPolicies((prev) => ({ ...prev, [key]: checked }))
                    }
                    size="small"
                  />
                </label>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
      {!isAppVariant && queryRun && (
        <div className="mt-3 rounded-lg border border-foreground-muted/30 bg-surface-100 px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs uppercase text-foreground-muted">Query result</div>
              <div className="text-sm font-medium text-foreground">{queryRun.name}</div>
              {queryRun.receivedAt && (
                <div className="text-xs text-foreground-muted">
                  {new Date(queryRun.receivedAt).toLocaleString()}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge>{queryRun.status}</Badge>
              {onClearQueryRun && (
                <Button type="text" size="tiny" onClick={onClearQueryRun}>
                  Clear
                </Button>
              )}
              <ToggleGroup
                type="single"
                size="small"
                value={queryView}
                onValueChange={(value) =>
                  value && setQueryView(value as 'table' | 'json')
                }
              >
                <ToggleGroupItem value="table" size="small" className="h-[26px] px-2">
                  Table
                </ToggleGroupItem>
                <ToggleGroupItem value="json" size="small" className="h-[26px] px-2">
                  JSON
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>
          <div className="mt-3">
            {queryRun.status === 'running' ? (
              <div className="text-sm text-foreground-muted">Running...</div>
            ) : queryRun.status === 'error' ? (
              <div className="text-sm text-destructive">{queryRun.error}</div>
            ) : queryView === 'table' && tableData ? (
              <div className="rounded-md border border-foreground-muted/30 bg-surface-100">
                <ScrollArea className="max-h-64">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {tableData.columns.map((column) => (
                          <TableHead key={column}>{column}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tableData.rows.map((row, index) => (
                        <TableRow key={index}>
                          {tableData.columns.map((column) => (
                            <TableCell key={`${index}-${column}`}>
                              {formatCell(row[column])}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
                {tableData.total > tableData.rows.length && (
                  <div className="border-t border-foreground-muted/30 px-3 py-2 text-xs text-foreground-muted">
                    Showing {tableData.rows.length} of {tableData.total} rows
                  </div>
                )}
              </div>
            ) : (
              <pre className="max-h-64 overflow-auto rounded-md border border-foreground-muted/30 bg-surface-200 px-3 py-2 text-xs text-foreground">
                {jsonPayload ? JSON.stringify(jsonPayload, null, 2) : 'No data'}
              </pre>
            )}
          </div>
        </div>
      )}
      {themeCssText ? (
        <style data-builder-theme-vars>
          {`.builder-app-theme-scope { ${themeCssText} }`}
        </style>
      ) : null}
      {themeCustomCss ? <style data-builder-custom-css>{themeCustomCss}</style> : null}
      <div
        className={cn(
          'builder-app-theme-scope flex min-h-0 flex-1 flex-col',
          isAppVariant
            ? 'bg-background text-foreground'
            : 'mt-4 rounded-lg border border-foreground-muted/30 bg-surface-100/80 p-6'
        )}
      >
        {!activePage ? (
          <div className="flex h-full items-center justify-center text-sm text-foreground-muted">
            Create a page to see the preview.
          </div>
        ) : !hasVisibleContent ? (
          <div className="flex h-full items-center justify-center text-sm text-foreground-muted">
            {hasAnyWidgets
              ? 'No widgets visible for the current policies.'
              : 'Add widgets to preview the layout.'}
          </div>
        ) : (
          <div className={isAppVariant ? 'flex h-full flex-col' : 'flex h-full flex-col gap-4'}>
            {activeHeaderWidgets.length > 0 && (
              <div className={isAppVariant ? 'shrink-0' : 'space-y-3'}>
                {!isAppVariant && (
                  <div className="text-xs uppercase text-foreground-muted">Header</div>
                )}
                {activeHeaderWidgets.map((widget) => renderGlobalWidget(widget, 'header'))}
              </div>
            )}
            {!isAppVariant && menuItems.length > 0 && (
              <div className="rounded-md border border-foreground-muted/30 bg-surface-100 px-4 py-3">
                <div className="text-xs uppercase text-foreground-muted">Menu</div>
                <div className="mt-2 space-y-2">
                  {menuItems.map((item, index) => (
                    <MenuItemPreview key={`${item.label}-${index}`} item={item} depth={0} />
                  ))}
                </div>
              </div>
            )}
            <div className={isAppVariant ? 'flex min-h-0 flex-1' : 'flex min-h-0 flex-1 gap-4'}>
              {activeLeftSidebarWidgets.length > 0 && (
                <div
                  className={
                    isAppVariant
                      ? 'flex h-full min-h-0 w-auto flex-col self-stretch'
                      : 'flex w-auto flex-col gap-3'
                  }
                >
                  {activeLeftSidebarWidgets.map((widget) => renderGlobalWidget(widget, 'sidebar'))}
                </div>
              )}
              <div className="min-h-0 flex-1 overflow-auto">
                <div
                  className={cn(
                    isAppVariant
                      ? 'min-h-full'
                      : 'rounded-md border border-foreground-muted/30 bg-surface-100 shadow-sm',
                    activePageMain?.expandToFit ? 'min-h-0' : 'min-h-full'
                  )}
                  style={{
                    backgroundColor: activePageMain?.background || undefined,
                    padding: resolvePagePadding(activePageMain, runtimeContext),
                    maxWidth: resolveAppMaxWidth(appMeta),
                  }}
                >
                  {previewGrid ?? (
                    <div className="flex h-full items-center justify-center text-sm text-foreground-muted">
                      {flattenedActiveWidgets.length === 0
                        ? 'Add widgets to preview the layout.'
                        : 'No page widgets visible for the current policies.'}
                    </div>
                  )}
                </div>
              </div>
              {activeRightSidebarWidgets.length > 0 && (
                <div
                  className={
                    isAppVariant
                      ? 'flex h-full min-h-0 w-auto flex-col self-stretch'
                      : 'flex w-auto flex-col gap-3'
                  }
                >
                  {activeRightSidebarWidgets.map((widget) => renderGlobalWidget(widget, 'sidebar'))}
                </div>
              )}
            </div>
            {!isAppVariant && activeSplitWidgets.length > 0 && (
              <div className="space-y-3">
                <div className="text-xs uppercase text-foreground-muted">Split pane</div>
                {activeSplitWidgets.map((widget) => renderGlobalWidget(widget, 'split'))}
              </div>
            )}
            {!isAppVariant &&
              (activeOverlayDrawers.length > 0 ||
                activeOverlayModals.length > 0 ||
                activeOtherOverlayWidgets.length > 0) && (
                <div className="space-y-3">
                  <div className="text-xs uppercase text-foreground-muted">Overlays</div>
                  <div className="grid gap-3 md:grid-cols-2">
                    {activeOverlayDrawers.map((widget) => renderGlobalWidget(widget, 'drawer'))}
                    {activeOverlayModals.map((widget) => renderGlobalWidget(widget, 'modal'))}
                    {activeOtherOverlayWidgets.map((widget) => renderGlobalWidget(widget, 'other'))}
                  </div>
                </div>
              )}
          </div>
        )}
      </div>
    </div>
  )
}

type WidgetEvent = {
  event: string
  type: string
  [key: string]: unknown
}

const normalizeEvents = (value: unknown): WidgetEvent[] => {
  if (Array.isArray(value)) {
    return value as WidgetEvent[]
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) {
      return []
    }
    try {
      const parsed = JSON.parse(trimmed)
      if (Array.isArray(parsed)) {
        return parsed as WidgetEvent[]
      }
    } catch {
      return []
    }
  }

  return []
}

type KeyValueItem = { key: string; value: string }

const normalizeKeyValueItems = (value: unknown): KeyValueItem[] => {
  if (!value) {
    return []
  }
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (item && typeof item === 'object') {
          const record = item as Record<string, unknown>
          return {
            key: typeof record.key === 'string' ? record.key : '',
            value: typeof record.value === 'string' ? record.value : '',
          }
        }
        return { key: '', value: '' }
      })
      .filter((item) => item.key || item.value)
  }
  if (typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).map(([key, rawValue]) => ({
      key,
      value: rawValue == null ? '' : String(rawValue),
    }))
  }
  return []
}

const buildKeyValueObject = (items: KeyValueItem[]) =>
  items.reduce<Record<string, string>>((acc, item) => {
    if (!item.key.trim()) {
      return acc
    }
    acc[item.key.trim()] = item.value
    return acc
  }, {})

const buildParamObject = (value: unknown) => {
  if (!value) {
    return {}
  }
  if (Array.isArray(value)) {
    return buildKeyValueObject(normalizeKeyValueItems(value))
  }
  if (typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).reduce<Record<string, string>>(
      (acc, [key, rawValue]) => {
        acc[key] = rawValue == null ? '' : String(rawValue)
        return acc
      },
      {}
    )
  }
  return {}
}

const parseKeyPath = (value: unknown): Array<string | number> => {
  if (Array.isArray(value)) {
    return value.filter((entry) => typeof entry === 'string' || typeof entry === 'number')
  }
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) {
      return []
    }
    try {
      const parsed = JSON.parse(trimmed)
      if (Array.isArray(parsed)) {
        return parsed.filter(
          (entry) => typeof entry === 'string' || typeof entry === 'number'
        )
      }
    } catch {
      // fall back to dot notation
    }
    return trimmed.split('.').filter(Boolean).map((segment) => {
      const numeric = Number(segment)
      return Number.isFinite(numeric) && String(numeric) === segment ? numeric : segment
    })
  }
  return []
}

const setValueAtPath = (
  source: unknown,
  path: Array<string | number>,
  value: unknown
): unknown => {
  if (path.length === 0) {
    return value
  }
  const [head, ...rest] = path
  const clone = Array.isArray(source)
    ? [...source]
    : isPlainObject(source)
      ? { ...source }
      : typeof head === 'number'
        ? []
        : {}
  if (rest.length === 0) {
    ;(clone as Record<string | number, unknown>)[head] = value
    return clone
  }
  const current = (clone as Record<string | number, unknown>)[head]
  ;(clone as Record<string | number, unknown>)[head] = setValueAtPath(
    current,
    rest,
    value
  )
  return clone
}

const parseNumber = (value: unknown, fallback = 0) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : fallback
  }
  return fallback
}

const shouldRunOnlyWhen = (value: unknown) => {
  if (value === undefined || value === null || value === '') {
    return true
  }
  if (typeof value === 'boolean') {
    return value
  }
  if (typeof value === 'number') {
    return value !== 0
  }
  if (typeof value === 'string') {
    const trimmed = value.trim().toLowerCase()
    if (!trimmed) {
      return true
    }
    if (['false', '0', 'null', 'undefined'].includes(trimmed)) {
      return false
    }
    return true
  }
  return Boolean(value)
}

const resolveScrollAlignment = (value: unknown): ScrollLogicalPosition => {
  if (value === 'nearest' || value === 'start' || value === 'center' || value === 'end') {
    return value
  }
  return 'center'
}

const getWidgetElement = (widgetId: string) => {
  if (typeof document === 'undefined') {
    return null
  }
  return document.querySelector(`[data-builder-preview-widget-id="${widgetId}"]`)
}

const focusableSelector =
  'input, textarea, select, button, [tabindex]:not([tabindex="-1"]), [contenteditable="true"]'

const findFocusableElement = (element: Element | null): HTMLElement | null => {
  if (!element) {
    return null
  }
  if (element instanceof HTMLElement && element.matches(focusableSelector)) {
    return element
  }
  return element.querySelector(focusableSelector) as HTMLElement | null
}

const serializeExportData = (rawData: unknown, fileType: string) => {
  let normalized: unknown = rawData
  if (typeof rawData === 'string') {
    try {
      normalized = JSON.parse(rawData)
    } catch {
      normalized = rawData
    }
  }
  if (fileType === 'json') {
    return typeof normalized === 'string'
      ? normalized
      : JSON.stringify(normalized ?? null, null, 2)
  }
  if (fileType === 'csv' || fileType === 'tsv' || fileType === 'excel') {
    const delimiter = fileType === 'tsv' ? '\t' : ','
    if (Array.isArray(normalized)) {
      const rows = normalized.filter((row) => row && typeof row === 'object') as Record<
        string,
        unknown
      >[]
      if (rows.length === 0) {
        return ''
      }
      const columns = Object.keys(rows[0])
      const escapeValue = (value: unknown) => {
        const text = value == null ? '' : String(value)
        const escaped = text.replace(/\"/g, '""')
        if (escaped.includes(delimiter) || escaped.includes('\n')) {
          return `"${escaped}"`
        }
        return escaped
      }
      const lines = [
        columns.join(delimiter),
        ...rows.map((row) => columns.map((column) => escapeValue(row[column])).join(delimiter)),
      ]
      return lines.join('\n')
    }
    return typeof normalized === 'string'
      ? normalized
      : JSON.stringify(normalized ?? null, null, 2)
  }
  return typeof normalized === 'string'
    ? normalized
    : JSON.stringify(normalized ?? null, null, 2)
}

const resolveExportMimeType = (fileType: string) => {
  if (fileType === 'csv') {
    return 'text/csv'
  }
  if (fileType === 'tsv') {
    return 'text/tab-separated-values'
  }
  if (fileType === 'excel') {
    return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  }
  return 'application/json'
}

const runJsFunction = (code: string, context: Record<string, unknown>) => {
  const sanitized = stripTransformerMeta(code).replace(/export\s+(default\s+)?/g, '')
  // eslint-disable-next-line no-new-func
  const fn = new Function('context', `${sanitized}\nreturn typeof main === 'function' ? main(context) : undefined;`)
  return fn(context)
}

const runInlineScript = (code: string, context: Record<string, unknown>) => {
  // eslint-disable-next-line no-new-func
  const fn = new Function('context', `${code}`)
  return fn(context)
}

const formatCell = (value: unknown) => {
  if (value === null || typeof value === 'undefined') {
    return '—'
  }
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

const resolvePagePadding = (
  pageMain: BuilderPage['pageLayout']['main'] | undefined,
  runtimeContext: Record<string, unknown>
) => {
  const value = resolvePagePaddingValue(pageMain, (expression) =>
    resolveValue(expression, runtimeContext)
  )
  return value ? value : 0
}

const resolveAppMaxWidth = (appMeta: BuilderAppMeta | undefined) => {
  if (!appMeta?.maxWidth) {
    return undefined
  }
  const value = appMeta.maxWidth.trim()
  return value.length > 0 ? value : undefined
}

const filterMenuItems = (
  items: BuilderMenuItem[],
  policies: Record<string, boolean>
): BuilderMenuItem[] => {
  const hasPolicies = Object.keys(policies).length > 0
  return items
    .map((item) => {
      const childItems = item.items ? filterMenuItems(item.items, policies) : []
      return { ...item, items: childItems }
    })
    .filter((item) => {
      if (hasPolicies && !isMenuItemAllowed(item, policies)) {
        return false
      }
      if (evaluateCondition(item.visibleWhen, policies) === false) {
        return false
      }
      const hasChildren = Boolean(item.items && item.items.length > 0)
      return Boolean(item.to) || hasChildren || item.label
    })
}

const isMenuItemAllowed = (item: BuilderMenuItem, policies: Record<string, boolean>) => {
  const required = item.policy ?? []
  if (required.length === 0) {
    return true
  }
  return required.every((policy) => Boolean(policies[policy]))
}

const MenuItemPreview = ({ item, depth }: { item: BuilderMenuItem; depth: number }) => {
  return (
    <div className={depth > 0 ? 'ml-4 space-y-1' : 'space-y-1'}>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="font-medium text-foreground">{item.label}</span>
        {item.to && <span className="text-xs text-foreground-muted">{item.to}</span>}
        {item.icon && <span className="text-xs text-foreground-muted">{item.icon}</span>}
        {item.badge && <Badge>{item.badge}</Badge>}
      </div>
      {item.items && item.items.length > 0 && (
        <div className="space-y-2">
          {item.items.map((child, index) => (
            <MenuItemPreview key={`${child.label}-${index}`} item={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}
