/**
 * Runtime-context hook BuilderShell: assistant/inspector/canvas контексты и event-списки.
 */
import { useMemo } from 'react'

import type { BuilderApp } from 'data/builder/builder-apps'
import type { BuilderJsFunction } from 'data/builder/builder-js'
import type { BuilderQuery } from 'data/builder/builder-queries'
import { getWidgetDefinition } from 'widgets/runtime'

import type {
  BuilderPage,
  BuilderQueryRunResult,
  BuilderWidgetInstance,
} from '../../types'
import { flattenWidgets } from '../layout-ops'
import {
  parseBoolean,
  parseHashParams,
  parseLocalStorageValues,
  parseUrlParams,
} from '../selectors'

export interface UseBuilderShellRuntimeContextsParams {
  activeAppId?: string | null
  activeAppName?: string | null
  activeAppOrgSlug?: string | null
  appName: string
  appUrl?: string | null
  organizationSlug?: string | null
  activePage?: BuilderPage
  pages: BuilderPage[]
  apps: BuilderApp[]
  queries: BuilderQuery[]
  queryRuns: Record<string, BuilderQueryRunResult>
  jsFunctions: BuilderJsFunction[]
  appFrameWidgets: BuilderWidgetInstance[]
  activePageFrameWidgets: BuilderWidgetInstance[]
  activePageWidgets: BuilderWidgetInstance[]
  user: unknown
  viewport: { width: number; height: number }
  normalizedThemeMode: string
  routerAsPath: string
}

export const useBuilderShellRuntimeContexts = ({
  activeAppId,
  activeAppName,
  activeAppOrgSlug,
  appName,
  appUrl,
  organizationSlug,
  activePage,
  pages,
  apps,
  queries,
  queryRuns,
  jsFunctions,
  appFrameWidgets,
  activePageFrameWidgets,
  activePageWidgets,
  user,
  viewport,
  normalizedThemeMode,
  routerAsPath,
}: UseBuilderShellRuntimeContextsParams) => {
  const allWidgets = useMemo(
    () => [
      ...flattenWidgets(appFrameWidgets),
      ...flattenWidgets(activePageFrameWidgets),
      ...flattenWidgets(activePageWidgets),
    ],
    [activePageFrameWidgets, activePageWidgets, appFrameWidgets]
  )

  const builderWidgetSummary = useMemo(() => {
    if (allWidgets.length === 0) {
      return undefined
    }
    const counts: Record<string, number> = {}
    allWidgets.forEach((widget) => {
      counts[widget.type] = (counts[widget.type] ?? 0) + 1
    })
    return { total: allWidgets.length, byType: counts }
  }, [allWidgets])

  const builderAssistantContext = useMemo(() => {
    if (!activeAppId) {
      return null
    }
    return {
      appId: activeAppId,
      appName: activeAppName ?? appName,
      appUrl: appUrl ?? undefined,
      orgSlug: activeAppOrgSlug ?? organizationSlug ?? undefined,
      activePage: activePage
        ? {
            id: activePage.id,
            name: activePage.name,
            url: activePage.pageMeta?.url,
          }
        : undefined,
      pages: pages.map((page) => ({
        id: page.id,
        name: page.name,
        url: page.pageMeta?.url,
      })),
      widgetSummary: builderWidgetSummary,
    }
  }, [
    activeAppId,
    activeAppName,
    appName,
    appUrl,
    activeAppOrgSlug,
    organizationSlug,
    activePage,
    pages,
    builderWidgetSummary,
  ])

  const eventTargets = useMemo(
    () =>
      allWidgets.map((widget) => {
        const widgetDefinition = getWidgetDefinition(widget.type)
        return {
          id: widget.id,
          label: `${widget.id} (${widgetDefinition?.label ?? widget.type})`,
          type: widget.type,
        }
      }),
    [allWidgets]
  )

  const eventQueries = useMemo(
    () =>
      queries
        .filter((query) => query.type !== 'variable')
        .map((query) => ({
          id: query.id,
          label: query.name || query.id,
        })),
    [queries]
  )

  const eventVariables = useMemo(
    () =>
      queries
        .filter((query) => query.type === 'variable')
        .map((query) => ({
          id: query.name || query.id,
          label: query.name || query.id,
        })),
    [queries]
  )

  const eventScripts = useMemo(
    () =>
      jsFunctions.map((func) => ({
        id: func.id,
        label: func.name || func.id,
      })),
    [jsFunctions]
  )

  const eventPages = useMemo(
    () =>
      pages.map((page) => ({
        id: page.id,
        label: page.name || page.pageMeta?.title || page.id,
      })),
    [pages]
  )

  const eventApps = useMemo(
    () =>
      apps.map((app) => ({
        id: app.id,
        label: app.name || app.id,
      })),
    [apps]
  )

  const runningQueries = useMemo(
    () =>
      queries
        .filter((query) => queryRuns[query.id]?.status === 'running')
        .map((query) => query.name || query.id),
    [queries, queryRuns]
  )

  const queryResults = useMemo(() => {
    const results: Record<string, { data?: unknown; isFetching?: boolean }> = {}
    queries.forEach((query) => {
      const run = queryRuns[query.id]
      const entry = { data: run?.data ?? null, isFetching: run?.status === 'running' }
      results[query.id] = entry
      if (query.name) {
        results[query.name] = entry
      }
    })
    return results
  }, [queries, queryRuns])

  const localStorageValues = useMemo(() => parseLocalStorageValues(), [])

  const locationState = useMemo(() => {
    void routerAsPath
    if (typeof window === 'undefined') {
      return { href: '', searchParams: {}, hashParams: {} }
    }
    return {
      href: window.location.href,
      searchParams: parseUrlParams(new URLSearchParams(window.location.search)),
      hashParams: parseHashParams(window.location.hash),
    }
  }, [routerAsPath])

  const themeState = useMemo(() => {
    const mode = normalizedThemeMode
    if (typeof window === 'undefined') {
      return { mode, primary: '', surfacePrimary: '' }
    }
    const styles = getComputedStyle(document.documentElement)
    return {
      mode,
      primary: styles.getPropertyValue('--colors-brand-500')?.trim() ?? '',
      surfacePrimary: styles.getPropertyValue('--colors-surface-100')?.trim() ?? '',
    }
  }, [normalizedThemeMode])

  const currentUser = useMemo(() => {
    if (!user || typeof user !== 'object') {
      return null
    }
    return { ...(user as Record<string, unknown>) }
  }, [user])

  const widgetValues = useMemo(() => {
    const values: Record<string, Record<string, unknown>> = {}
    allWidgets.forEach((widget) => {
      const definition = getWidgetDefinition(widget.type)
      const defaultProps = definition?.defaultProps ?? {}
      values[widget.id] = {
        id: widget.id,
        type: widget.type,
        ...defaultProps,
        ...(widget.props ?? {}),
        hidden: parseBoolean(widget.hidden, false),
        visibleWhen: widget.visibleWhen ?? '',
        disabledWhen: widget.disabledWhen ?? '',
      }
    })
    return values
  }, [allWidgets])

  const inspectorFxContextInfo = useMemo(
    () => ({
      appName: activeAppName ?? '',
      currentPage: activePage?.name ?? '',
      pages: pages.map((page) => page.name),
      currentUser,
      localStorage: localStorageValues,
      theme: themeState,
      location: locationState,
      viewport,
      runningQueries,
      queryResults,
      widgetValues,
    }),
    [
      activeAppName,
      activePage?.name,
      pages,
      currentUser,
      localStorageValues,
      themeState,
      locationState,
      viewport,
      runningQueries,
      queryResults,
      widgetValues,
    ]
  )

  const canvasEvaluationContext = useMemo(() => {
    const widgetContext: Record<string, Record<string, unknown>> = {}
    allWidgets.forEach((widget) => {
      const definition = getWidgetDefinition(widget.type)
      const props = { ...(widget.props ?? {}) } as Record<string, unknown>
      const supportsFormDataKey =
        Object.prototype.hasOwnProperty.call(definition?.defaultProps ?? {}, 'formDataKey')

      if (supportsFormDataKey || Object.prototype.hasOwnProperty.call(props, 'formDataKey')) {
        const rawFormDataKey = props.formDataKey
        if (typeof rawFormDataKey === 'string') {
          const trimmed = rawFormDataKey.trim()
          if (/^\{\{\s*self\.id\s*\}\}$/.test(trimmed)) {
            props.formDataKey = widget.id
          }
        } else if (typeof rawFormDataKey === 'undefined') {
          props.formDataKey = widget.id
        }
      }

      widgetContext[widget.id] = {
        id: widget.id,
        type: widget.type,
        ...props,
      }
    })

    const queryContext: Record<string, { data?: unknown; isFetching?: boolean }> = {}
    queries.forEach((query) => {
      const result = queryResults[query.id]
      const entry = { data: result?.data ?? null, isFetching: result?.isFetching ?? false }
      queryContext[query.id] = entry
      if (query.name) {
        queryContext[query.name] = entry
      }
    })

    const stateContext = Object.fromEntries(
      eventVariables.map((variable) => [variable.id, queryResults[variable.id]?.data ?? null])
    )

    const scriptContext = Object.fromEntries(
      jsFunctions.map((script) => [script.name || script.id, () => undefined])
    )

    const pageNames = pages.map((page) => page.name || page.id)
    const currentPage = activePage?.name ?? activePage?.id ?? pageNames[0] ?? ''
    const resolvedAppName = activeAppName ?? ''

    return {
      state: stateContext,
      widgets: widgetContext,
      queries: queryContext,
      auth: currentUser ? { user: currentUser } : {},
      current_user: currentUser ?? {},
      localStorage: localStorageValues,
      theme: themeState,
      location: locationState,
      viewport,
      retoolContext: {
        appName: resolvedAppName,
        currentPage,
        environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? 'local',
        inEditorMode: true,
        pages: pageNames,
        runningQueries,
        translations: {},
      },
      ...widgetContext,
      ...queryContext,
      ...scriptContext,
    }
  }, [
    activeAppName,
    activePage,
    allWidgets,
    currentUser,
    eventVariables,
    jsFunctions,
    localStorageValues,
    locationState,
    pages,
    queryResults,
    queries,
    runningQueries,
    themeState,
    viewport,
  ])

  return {
    builderAssistantContext,
    eventTargets,
    eventQueries,
    eventVariables,
    eventScripts,
    eventPages,
    eventApps,
    inspectorFxContextInfo,
    canvasEvaluationContext,
  }
}
