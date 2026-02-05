import type { ReactNode } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Globe, List, Menu, Monitor, Palette, RefreshCw, Search, User, X } from 'lucide-react'
import { useTheme } from 'next-themes'
import { JSONTree } from 'react-json-tree'

import { useUser } from 'common'
import type { WidgetDefinition, WidgetField } from 'widgets'
import {
  Button,
  Input,
  Input_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
  ScrollArea,
  Separator,
  cn,
} from 'ui'

import type { BuilderQuery } from 'data/builder/builder-queries'
import type { BuilderJsFunction } from 'data/builder/builder-js'
import { stripTransformerMeta } from './BuilderCodeUtils'
import type { BuilderPage, BuilderQueryRunResult, BuilderWidgetInstance } from './types'
import { resolveWidgetSpacingModes } from './types'
import { isPlainObject } from './BuilderCodeUtils'
import { resolveValue } from 'lib/builder/value-resolver'
import { inferValueKind, parseValueTypeTokens } from './components'

// Panel sostoyaniya: pokazyvaet state vidzhetov, app i environment.

type IconComponent = (props: { size?: number; className?: string }) => JSX.Element

type StateTarget = {
  id: string
  label: string
  description?: string
  group: string
  icon: IconComponent
  state: Record<string, unknown>
}

type BuilderStatePanelProps = {
  title: string
  icon: ReactNode
  onClose?: () => void
  activePage: BuilderPage | null
  pages: BuilderPage[]
  globalWidgets: BuilderWidgetInstance[]
  pageGlobals: BuilderWidgetInstance[]
  widgets: WidgetDefinition[]
  queries: BuilderQuery[]
  jsFunctions: BuilderJsFunction[]
  queryRuns: Record<string, BuilderQueryRunResult>
  selectedWidgetId?: string | null
  selectedGlobalWidgetId?: string | null
  selectedPageComponent?: boolean
}

const categoryLabels: Record<string, string> = {
  inputs: 'Inputs',
  buttons: 'UI',
  data: 'Data',
  charts: 'Charts',
  presentation: 'Presentation',
  navigation: 'Navigation',
  containers: 'Containers_Forms',
  custom: 'Special_Inputs',
  globals: 'Frame',
}

const parseBoolean = (value: unknown, fallback = false) => {
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

const STATE_VALUE_TYPE_FALLBACKS: Partial<Record<WidgetField['type'], string>> = {
  boolean: 'Boolean',
  number: 'Number',
  select: 'String',
  text: 'String',
  textarea: 'String',
  json: 'Object',
}

const getFieldValueType = (field: WidgetField) =>
  field.valueType ?? STATE_VALUE_TYPE_FALLBACKS[field.type]

const isValueValidForField = (field: WidgetField, value: unknown) => {
  const allowed = parseValueTypeTokens(getFieldValueType(field))
  if (allowed.length === 0) {
    return true
  }
  const kind = inferValueKind(value)
  return allowed.includes(kind)
}

const coerceBooleanVoidValue = (field: WidgetField, value: unknown) => {
  if (value !== '') {
    return value
  }
  const allowed = parseValueTypeTokens(getFieldValueType(field))
  if (allowed.includes('boolean') && allowed.includes('undefined')) {
    return false
  }
  return value
}

const normalizeSearchValue = (value: string) => value.trim().toLowerCase()

const matchesSearchValue = (value: unknown, query: string) => {
  if (!query) {
    return true
  }
  if (value === null) {
    return 'null'.includes(query)
  }
  if (value === undefined) {
    return 'undefined'.includes(query)
  }
  if (typeof value === 'string') {
    return value.toLowerCase().includes(query)
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value).toLowerCase().includes(query)
  }
  return false
}

const filterStateBySearch = (value: unknown, query: string): unknown | undefined => {
  if (!query) {
    return value
  }
  if (Array.isArray(value)) {
    const result: Record<string, unknown> = {}
    value.forEach((entry, index) => {
      const filtered = filterStateBySearch(entry, query)
      if (filtered !== undefined) {
        result[index] = filtered
      }
    })
    return Object.keys(result).length > 0 ? result : undefined
  }
  if (value && typeof value === 'object') {
    const result: Record<string, unknown> = {}
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      if (key.toLowerCase().includes(query)) {
        result[key] = entry
        continue
      }
      const filtered = filterStateBySearch(entry, query)
      if (filtered !== undefined) {
        result[key] = filtered
      }
    }
    return Object.keys(result).length > 0 ? result : undefined
  }
  return matchesSearchValue(value, query) ? value : undefined
}

const isEmptyTreeValue = (value: unknown) => {
  if (value === undefined) {
    return true
  }
  if (Array.isArray(value)) {
    return value.length === 0
  }
  if (value && typeof value === 'object') {
    return Object.keys(value as Record<string, unknown>).length === 0
  }
  return false
}

const toNumber = (value: unknown, fallback = 0) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : fallback
  }
  return fallback
}

const buildQueryState = (query: BuilderQuery, run?: BuilderQueryRunResult) => {
  const config = isPlainObject(query.config) ? query.config : {}
  const meta = isPlainObject(config._builder) ? (config._builder as Record<string, unknown>) : {}
  const response = isPlainObject(meta.response) ? (meta.response as Record<string, unknown>) : {}
  const advanced = isPlainObject(meta.advanced) ? (meta.advanced as Record<string, unknown>) : {}
  const receivedAt = run?.receivedAt ? Date.parse(run.receivedAt) : null
  const status = run?.status ?? 'idle'
  const dataStatus =
    run && isPlainObject(run.data) && typeof run.data.statusCode === 'number'
      ? run.data.statusCode
      : null
  const dataState = {
    data: run?.data ?? null,
    error: run?.error ?? null,
    message: run?.error ?? null,
    statusCode: dataStatus,
  }

  const resolvedEditorMode =
    typeof config.editorMode === 'string'
      ? config.editorMode
      : query.type === 'sql'
        ? 'sql'
        : query.type === 'graphql'
          ? 'graphql'
          : query.type === 'mattr_database'
            ? 'sql'
            : 'rest'

  return {
    data: dataState,
    error: run?.error ?? '',
    actionType: typeof config.actionType === 'string' ? config.actionType : '',
    bulkUpdatePrimaryKey: '',
    cacheKeyTtl: '',
    changeset: config.changeset ?? '',
    changesetIsObject: Boolean(config.changesetIsObject),
    changesetObject: typeof config.changesetObject === 'string' ? config.changesetObject : '',
    confirmationMessage: null,
    databaseHostOverride: '',
    databaseNameOverride: '',
    databasePasswordOverride: '',
    databaseRoleOverride: '',
    databaseUsernameOverride: '',
    databaseWarehouseOverride: '',
    doNotThrowOnNoOp: false,
    editorMode: resolvedEditorMode,
    enableBulkUpdates: false,
    enableCaching: Boolean(advanced.cacheResults),
    enableErrorTransformer: Boolean(config.errorTransformer),
    enableTransformer: Boolean(config.transformer),
    errorTransformer: typeof config.errorTransformer === 'string' ? config.errorTransformer : '',
    filterBy: config.filterBy ?? '',
    finished: receivedAt,
    functionDescription: null,
    functionParameters: null,
    id: query.name,
    isFetching: status === 'running',
    isFunction: false,
    isImported: Boolean(config.isImported),
    lastReceivedFromResourceAt: receivedAt,
    metadata: null,
    notificationDuration: toNumber(response.notificationDuration, 4.5),
    offlineOptimisticResponse: null,
    offlineQueryType: 'None',
    offlineUserQueryInputs: '',
    overrideOrgCacheForUserCache: false,
    playgroundQueryId: null,
    playgroundQuerySaveId: config.playgroundQuerySaveId ?? null,
    playgroundQueryUuid: config.playgroundQueryUuid ?? '',
    query: typeof config.query === 'string' ? config.query : '',
    queryDisabled: typeof advanced.disableCondition === 'string' ? advanced.disableCondition : '',
    queryDisabledMessage: '',
    queryFailureConditions:
      typeof response.failureCondition === 'string' ? response.failureCondition : '',
    queryRefreshTime: '',
    queryRunOnSelectorUpdate: false,
    queryRunTime: 0,
    queryThrottleTime: toNumber(advanced.pageLoadDelayMs, 0),
    queryTimeout: toNumber(advanced.timeoutMs, 0),
    queryTriggerDelay: toNumber(advanced.runAfterMs, 0),
    rawData: null,
    recordId: '',
    records: '',
    requestSentTimestamp: receivedAt,
    requireConfirmation: Boolean(advanced.confirmBeforeRun),
    resourceNameOverride: '',
    resourceTypeOverride: null,
    runWhenModelUpdates: false,
    runWhenPageLoads: Boolean(advanced.runOnPageLoad),
    runWhenPageLoadsDelay: advanced.pageLoadDelayMs ?? '',
    servedFromCache: false,
    shouldEnableBatchQuerying: false,
    shouldUseLegacySql: false,
    showFailureToaster: Boolean(response.notifyOnFailure),
    showLatestVersionUpdatedWarning: false,
    showSuccessToaster: Boolean(response.notifyOnSuccess),
    showUpdateSetValueDynamicallyToggle: true,
    streamResponse: false,
    successMessage: '',
    tableName: typeof config.tableName === 'string' ? config.tableName : '',
    timestamp: 0,
    transformer: typeof config.transformer === 'string' ? config.transformer : '',
    updateSetValueDynamically: false,
    workflowId: null,
    workflowParams: null,
    workflowRunBodyType: 'raw',
    workflowRunExecutionType: 'sync',
    pluginType:
      query.type === 'sql' || query.type === 'mattr_database'
        ? 'SqlQueryUnified'
        : query.type === 'graphql'
          ? 'GraphQLQuery'
          : query.type === 'rest'
            ? 'RestQuery'
            : query.type === 'mattr_storage'
              ? 'RetoolStorageQuery'
              : query.type === 'variable'
                ? 'StateQuery'
                : 'JavascriptQuery',
  }
}

const jsonTreeTheme = {
  scheme: 'supabase',
  author: 'supabase',
  base00: 'transparent',
  base01: 'hsl(var(--background-surface-200))',
  base02: 'hsl(var(--border-default))',
  base03: 'hsl(var(--foreground-muted))',
  base04: 'hsl(var(--foreground-light))',
  base05: 'hsl(var(--foreground-default))',
  base06: 'hsl(var(--foreground-default))',
  base07: 'hsl(var(--foreground-contrast))',
  base08: 'hsl(var(--destructive-default))',
  base09: 'hsl(var(--warning-default))',
  base0A: 'hsl(var(--warning-600))',
  base0B: 'hsl(var(--brand-500))',
  base0C: 'hsl(var(--brand-400))',
  base0D: 'hsl(var(--foreground-default))',
  base0E: 'hsl(var(--foreground-default))',
  base0F: 'hsl(var(--foreground-muted))',
}

// Razvorachivaet derevo widgetov v ploskii spisok.
const flattenWidgets = (widgets: BuilderWidgetInstance[]) => {
  const result: BuilderWidgetInstance[] = []
  const stack = [...widgets]
  while (stack.length > 0) {
    const current = stack.shift()
    if (!current) {
      continue
    }
    result.push(current)
    if (current.children?.length) {
      stack.unshift(...current.children)
    }
  }
  return result
}

// Sobiraet state widgeta s propami i spacing.
const buildWidgetState = (
  widget: BuilderWidgetInstance,
  definition?: WidgetDefinition,
  resolvedProps?: Record<string, unknown>,
  context?: Record<string, unknown>
) => {
  const spacing = resolveWidgetSpacingModes(widget.type, widget.spacing)
  const margin = spacing.marginMode === 'none' ? '0px' : '4px 8px'
  const defaultProps = definition?.defaultProps ?? {}
  const resolvedHidden = resolveValue(widget.hidden, context ?? {})
  return {
    id: widget.id,
    type: widget.type,
    ...defaultProps,
    ...widget.props,
    ...(resolvedProps ?? {}),
    hidden: parseBoolean(resolvedHidden, false),
    visibleWhen: widget.visibleWhen ?? '',
    disabledWhen: widget.disabledWhen ?? '',
    heightType: spacing.heightMode,
    margin,
  }
}

const resolveWidgetPropsForState = (
  widget: BuilderWidgetInstance,
  definition: WidgetDefinition | undefined,
  context: Record<string, unknown>
) => {
  const fields = definition?.fields ?? []
  if (fields.length === 0) {
    return {}
  }
  const props = widget.props ?? {}
  const resolvedProps: Record<string, unknown> = {}
  fields.forEach((field) => {
    if (!field?.key) {
      return
    }
    if (!(field.key in props)) {
      return
    }
    const rawValue = props[field.key]
    const resolvedValue = resolveValue(rawValue, context)
    const coercedValue = coerceBooleanVoidValue(field, resolvedValue)
    if (isValueValidForField(field, coercedValue)) {
      resolvedProps[field.key] = coercedValue
    }
  })
  return resolvedProps
}

// Bezopasno chitaet localStorage v obekt.
const parseLocalStorage = () => {
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

const parseUrlParams = (params: URLSearchParams) => {
  const result: Record<string, string> = {}
  params.forEach((value, key) => {
    result[key] = value
  })
  return result
}

const parseHashParams = (hash: string) => {
  const cleaned = hash.startsWith('#') ? hash.slice(1) : hash
  if (!cleaned) {
    return {}
  }
  return parseUrlParams(new URLSearchParams(cleaned))
}

const getWidgetIcon = (type: string) => {
  if (type === 'GlobalHeader' || type === 'GlobalSplitPane') {
    return Monitor
  }
  if (type === 'GlobalSidebar') {
    return List
  }
  if (type === 'GlobalDrawer') {
    return List
  }
  return List
}

export const BuilderStatePanel = ({
  title,
  icon,
  onClose,
  activePage,
  pages,
  globalWidgets,
  pageGlobals,
  widgets,
  queries,
  jsFunctions,
  queryRuns,
  selectedWidgetId,
  selectedGlobalWidgetId,
  selectedPageComponent,
}: BuilderStatePanelProps) => {
  const user = useUser()
  const { resolvedTheme } = useTheme()
  const [activeTargetId, setActiveTargetId] = useState<string | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [menuSearch, setMenuSearch] = useState('')
  const [refreshToken, setRefreshToken] = useState(0)
  const [viewport, setViewport] = useState({ width: 0, height: 0 })
  const lastSelectionRef = useRef<{
    widgetId: string | null
    globalWidgetId: string | null
    pageComponent: boolean
    pageId: string | null
  }>({
    widgetId: null,
    globalWidgetId: null,
    pageComponent: false,
    pageId: null,
  })

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    const updateViewport = () => {
      setViewport({ width: window.innerWidth, height: window.innerHeight })
    }
    updateViewport()
    window.addEventListener('resize', updateViewport)
    return () => window.removeEventListener('resize', updateViewport)
  }, [])

  const widgetDefinitionMap = useMemo(
    () => new Map(widgets.map((definition) => [definition.type, definition])),
    [widgets]
  )

  const allWidgets = useMemo(() => {
    const seen = new Set<string>()
    const merged: BuilderWidgetInstance[] = []
    const addWidgets = (items: BuilderWidgetInstance[]) => {
      for (const widget of items) {
        if (seen.has(widget.id)) {
          continue
        }
        seen.add(widget.id)
        merged.push(widget)
      }
    }

    addWidgets(flattenWidgets(globalWidgets))
    addWidgets(flattenWidgets(pageGlobals))
    addWidgets(pages.flatMap((page) => flattenWidgets(page.pageGlobals ?? [])))
    addWidgets(pages.flatMap((page) => flattenWidgets(page.widgets ?? [])))
    addWidgets(flattenWidgets(activePage?.widgets ?? []))

    return merged
  }, [activePage?.widgets, globalWidgets, pageGlobals, pages])

  const globalTargets = useMemo<StateTarget[]>(() => {
    const runningQueries = queries
      .filter((query) => queryRuns[query.id]?.status === 'running')
      .map((query) => query.name)
    const localStorageValues = parseLocalStorage()
    const location =
      typeof window !== 'undefined'
        ? {
            href: window.location.href,
            searchParams: parseUrlParams(new URLSearchParams(window.location.search)),
            hashParams: parseHashParams(window.location.hash),
          }
        : { href: '', searchParams: {}, hashParams: {} }
    const themeState =
      typeof window !== 'undefined'
        ? {
            mode: resolvedTheme ?? '',
            primary:
              getComputedStyle(document.documentElement)
                .getPropertyValue('--colors-brand-500')
                ?.trim() ?? '',
            surfacePrimary:
              getComputedStyle(document.documentElement)
                .getPropertyValue('--colors-surface-100')
                ?.trim() ?? '',
          }
        : { mode: resolvedTheme ?? '', primary: '', surfacePrimary: '' }
    const contextState = {
      appName: activePage?.name ?? '',
      currentPage: activePage?.name ?? '',
      environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? 'local',
      inEditorMode: true,
      pages: pages.map((page) => page.name),
      runningQueries,
      translations: {},
    }

    return [
      {
        id: 'global.current_user',
        label: 'current_user',
        group: 'Global',
        icon: User,
        state: user ? { ...user } : {},
      },
      {
        id: 'global.localStorage',
        label: 'localStorage',
        group: 'Global',
        icon: List,
        state: { values: localStorageValues },
      },
      {
        id: 'global.retoolContext',
        label: 'retoolContext',
        group: 'Global',
        icon: List,
        state: contextState,
      },
      {
        id: 'global.theme',
        label: 'theme',
        group: 'Global',
        icon: Palette,
        state: themeState,
      },
      {
        id: 'global.url',
        label: 'url',
        group: 'Global',
        icon: Globe,
        state: location,
      },
      {
        id: 'global.viewport',
        label: 'viewport',
        group: 'Global',
        icon: Monitor,
        state: viewport,
      },
    ]
  }, [activePage?.name, pages, queries, queryRuns, refreshToken, resolvedTheme, user, viewport])

  const queryResults = useMemo(() => {
    const result: Record<string, unknown> = {}
    queries.forEach((query) => {
      const run = queryRuns[query.id]
      const entry = {
        data: run?.data ?? null,
        error: run?.error ?? null,
        isFetching: run?.status === 'running',
      }
      result[query.name] = entry
      result[query.id] = entry
    })
    return result
  }, [queries, queryRuns])

  const widgetValueMap = useMemo(() => {
    const map: Record<string, Record<string, unknown>> = {}
    allWidgets.forEach((widget) => {
      const definition = widgetDefinitionMap.get(widget.type)
      const defaultProps = definition?.defaultProps ?? {}
      map[widget.id] = {
        ...defaultProps,
        ...(widget.props ?? {}),
      }
    })
    return map
  }, [allWidgets, widgetDefinitionMap])

  const fxEvalContext = useMemo(() => {
    const runningQueries = queries
      .filter((query) => queryRuns[query.id]?.status === 'running')
      .map((query) => query.name)
    const localStorageValues = parseLocalStorage()
    const location =
      typeof window !== 'undefined'
        ? {
            href: window.location.href,
            searchParams: parseUrlParams(new URLSearchParams(window.location.search)),
            hashParams: parseHashParams(window.location.hash),
          }
        : { href: '', searchParams: {}, hashParams: {} }
    const themeState =
      typeof window !== 'undefined'
        ? {
            mode: resolvedTheme ?? '',
            primary:
              getComputedStyle(document.documentElement)
                .getPropertyValue('--colors-brand-500')
                ?.trim() ?? '',
            surfacePrimary:
              getComputedStyle(document.documentElement)
                .getPropertyValue('--colors-surface-100')
                ?.trim() ?? '',
          }
        : { mode: resolvedTheme ?? '', primary: '', surfacePrimary: '' }
    const contextState = {
      appName: activePage?.name ?? '',
      currentPage: activePage?.name ?? '',
      environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? 'local',
      inEditorMode: true,
      pages: pages.map((page) => page.name),
      runningQueries,
      translations: {},
    }

    return {
      widgets: widgetValueMap,
      queries: queryResults,
      auth: user ? { user } : {},
      current_user: user ?? {},
      localStorage: localStorageValues,
      theme: themeState,
      location,
      viewport,
      retoolContext: contextState,
      ...widgetValueMap,
      ...queryResults,
    }
  }, [
    activePage?.name,
    pages,
    queryResults,
    queries,
    queryRuns,
    resolvedTheme,
    user,
    viewport,
    widgetValueMap,
  ])

  const queryTargets = useMemo<StateTarget[]>(
    () =>
      queries.map((query) => {
        const run = queryRuns[query.id]
        const queryState = buildQueryState(query, run)
        return {
          id: `query.${query.id}`,
          label: query.name,
          description: query.type,
          group: 'Queries',
          icon: RefreshCw,
          state: queryState,
        }
      }),
    [queries, queryRuns]
  )

  const transformerTargets = useMemo<StateTarget[]>(
    () =>
      jsFunctions.map((func) => {
        const label = func.name || func.id
        const body = stripTransformerMeta(func.code ?? '')
        return {
          id: `transformer.${func.id}`,
          label,
          description: 'transformer',
          group: 'Transformers',
          icon: RefreshCw,
          state: {
            value: null,
            funcBody: body,
            id: label,
            renderedFunction: body,
            runBehavior: 'throttled',
          },
        }
      }),
    [jsFunctions]
  )

  const pageTargets = useMemo<StateTarget[]>(
    () =>
      pages.map((page) => ({
        id: `page.${page.id}`,
        label: `${page.name} (Screen)`,
        group: 'Pages',
        icon: List,
        state: {
          id: page.name,
          title: page.pageMeta?.title ?? '',
          browserTitle: page.pageMeta?.browserTitle ?? '',
          urlSlug: page.pageMeta?.url ?? '',
        },
      })),
    [pages]
  )

  const componentTargets = useMemo<StateTarget[]>(() => {
    return allWidgets.map((widget) => {
      const definition = widgetDefinitionMap.get(widget.type)
      const resolvedProps = resolveWidgetPropsForState(widget, definition, fxEvalContext)
      const category = definition?.category ?? 'inputs'
      return {
        id: `component.${widget.id}`,
        label: widget.id,
        description: definition?.label ?? widget.type,
        group: categoryLabels[category] ?? 'Components',
        icon: getWidgetIcon(widget.type),
        state: buildWidgetState(widget, definition, resolvedProps, fxEvalContext),
      }
    })
  }, [allWidgets, fxEvalContext, widgetDefinitionMap])

  const allTargets = useMemo(() => {
    return [
      ...globalTargets,
      ...queryTargets,
      ...transformerTargets,
      ...pageTargets,
      ...componentTargets,
    ]
  }, [componentTargets, globalTargets, pageTargets, queryTargets, transformerTargets])

  useEffect(() => {
    const nextSelection = {
      widgetId: selectedWidgetId ?? null,
      globalWidgetId: selectedGlobalWidgetId ?? null,
      pageComponent: Boolean(selectedPageComponent),
      pageId: activePage?.id ?? null,
    }
    const prevSelection = lastSelectionRef.current
    const selectionChanged =
      prevSelection.widgetId !== nextSelection.widgetId ||
      prevSelection.globalWidgetId !== nextSelection.globalWidgetId ||
      prevSelection.pageComponent !== nextSelection.pageComponent ||
      prevSelection.pageId !== nextSelection.pageId

    if (selectionChanged) {
      if (nextSelection.globalWidgetId) {
        setActiveTargetId(`component.${nextSelection.globalWidgetId}`)
      } else if (nextSelection.widgetId) {
        setActiveTargetId(`component.${nextSelection.widgetId}`)
      } else if (nextSelection.pageComponent && nextSelection.pageId) {
        setActiveTargetId(`page.${nextSelection.pageId}`)
      }
    } else if (!activeTargetId && allTargets.length > 0) {
      setActiveTargetId(allTargets[0].id)
    }

    lastSelectionRef.current = nextSelection
  }, [
    selectedGlobalWidgetId,
    selectedWidgetId,
    selectedPageComponent,
    activePage?.id,
    activeTargetId,
    allTargets,
  ])

  const activeTarget = allTargets.find((target) => target.id === activeTargetId) ?? null
  const normalizedSearch = useMemo(() => normalizeSearchValue(searchValue), [searchValue])

  const filteredState = useMemo(() => {
    if (!activeTarget) {
      return null
    }
    if (!normalizedSearch) {
      return activeTarget.state
    }
    const filtered = filterStateBySearch(activeTarget.state, normalizedSearch)
    return filtered ?? {}
  }, [activeTarget, normalizedSearch])

  const hasSearchResults = normalizedSearch
    ? Boolean(filteredState) && !isEmptyTreeValue(filteredState)
    : true

  const groupedTargets = useMemo(() => {
    const groups = new Map<string, StateTarget[]>()
    for (const target of allTargets) {
      if (menuSearch && !target.label.toLowerCase().includes(menuSearch.toLowerCase())) {
        continue
      }
      if (!groups.has(target.group)) {
        groups.set(target.group, [])
      }
      groups.get(target.group)?.push(target)
    }
    return Array.from(groups.entries())
  }, [allTargets, menuSearch])

  const CurrentIcon = activeTarget?.icon ?? List

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between pl-3 pr-2">
        <div className="flex h-9 items-center gap-2">
          <div className="text-xs font-medium">{title}</div>
        </div>
        <Button className='px-1' type="text" size="tiny" icon={<X size={14} />} onClick={() => onClose?.()} />
      </div>
      <div className="flex items-center justify-between border-b border-foreground-muted/30 px-1 py-1.5">
        <div className="flex items-center gap-2">
          <Popover_Shadcn_>
            <PopoverTrigger_Shadcn_ asChild>
              <Button className='px-1' type="text" size="tiny" icon={<Menu size={14} />} />
            </PopoverTrigger_Shadcn_>
            <PopoverContent_Shadcn_ className="w-72 p-0" align="start">
              <div className="border-b border-foreground-muted/30 bg-surface-200 px-3 py-1.5">
                <Input_Shadcn_
                  value={menuSearch}
                  onChange={(event) => setMenuSearch(event.target.value)}
                  placeholder="Search plugins"
                  className="h-7"
                />
              </div>
              <ScrollArea className="h-80">
                <div className="space-y-2 px-2 py-2">
                  {groupedTargets.map(([groupLabel, targets]) => (
                    <div key={groupLabel} className="space-y-1">
                      <div className="px-2 py-1 text-[11px] font-semibold uppercase text-foreground-muted">
                        {groupLabel}
                      </div>
                      <div className="space-y-1">
                        {targets.map((target) => (
                          <button
                            key={target.id}
                            type="button"
                            className={cn(
                              'flex w-full items-center gap-2 rounded-md px-2 py-1 text-xs',
                              activeTarget?.id === target.id
                                ? 'bg-surface-200 text-foreground'
                                : 'text-foreground-muted hover:bg-surface-200 hover:text-foreground'
                            )}
                            onClick={() => setActiveTargetId(target.id)}
                          >
                            <target.icon size={14} className="text-foreground-muted" />
                            <span>{target.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </PopoverContent_Shadcn_>
          </Popover_Shadcn_>
          {activeTarget && (
            <div className="flex items-center gap-2">
              <CurrentIcon size={14} className="text-foreground-muted" />
              <div className="text-xs font-medium text-foreground">
                {activeTarget.label}
                {activeTarget.description ? (
                  <span className="text-foreground-muted"> ({activeTarget.description})</span>
                ) : null}
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 px-1">
          <Button
            className='px-1'
            type="text"
            size="tiny"
            icon={<Search size={14} />}
            onClick={() => setSearchOpen((prev) => !prev)}
          />
          <Button
            className='px-1'
            type="text"
            size="tiny"
            icon={<RefreshCw size={14} />}
            onClick={() => setRefreshToken((prev) => prev + 1)}
          />
        </div>
      </div>
      {searchOpen && (
        <div className="border-b border-foreground-muted/30 px-3 py-2">
          <Input
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="Search state"
            className="h-7"
          />
        </div>
      )}
      <ScrollArea className="min-h-0 flex-1 px-2 py-3">
        {activeTarget ? (
          normalizedSearch && !hasSearchResults ? (
            <div className="px-3 py-4 text-xs text-foreground-muted">
              No matches.
            </div>
          ) : (
            <div className="px-2 font-mono text-[11px] leading-5">
              <JSONTree
                key={`${activeTarget.id}-${normalizedSearch}`}
                data={filteredState ?? {}}
                theme={jsonTreeTheme}
                hideRoot
                shouldExpandNodeInitially={(_keyPath, _data, level) =>
                  normalizedSearch ? true : level < 3
                }
                getItemString={(type, _data, itemType, itemString) => (
                  <span className="text-foreground-muted">
                    {itemType} {itemString}
                  </span>
                )}
                sortObjectKeys
                collectionLimit={200}
              />
            </div>
          )
        ) : (
          <div className="px-3 py-4 text-xs text-foreground-muted">
            Select a component or global state.
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
