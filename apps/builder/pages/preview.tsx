import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import { useTheme } from 'next-themes'
import { ArrowLeft } from 'lucide-react'

import { useParams } from 'common'
import { Button, LogoLoader } from 'ui'

import type { NextPageWithLayout } from 'types'

import { BuilderPreview } from 'components/builder/BuilderPreview'
import type { BuilderAppMeta, BuilderPage, BuilderWidgetInstance } from 'components/builder/types'
import { getAppLayoutWidgets } from 'components/builder/types'
import {
  resolveAppLayoutFromUnknown,
  resolvePageLayoutFromRecord,
} from 'components/builder/utils/layout-model'
import { normalizeDraftSchema, useBuilderDraftQuery } from 'data/builder/builder-draft'
import type { BuilderJsFunction } from 'data/builder/builder-js'
import type { BuilderQuery } from 'data/builder/builder-queries'
import { useProjectDetailQuery } from 'data/projects/project-detail-query'
import type { BuilderRuntimePayload } from 'data/builder/builder-runtime'
import { buildAppThemeCssVars, normalizeAppTheme } from 'state/app-theme-state'

const GRID_ROW_HEIGHT = 8
const GRID_MARGIN = 0

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)

type PreviewRouteSnapshot = {
  appId?: string
  ref?: string
  pageId?: string
}

const PreviewPage: NextPageWithLayout = () => {
  const params = useParams()
  const router = useRouter()
  const { resolvedTheme } = useTheme()
  const [isHydrated, setIsHydrated] = useState(false)
  const [browserRoute, setBrowserRoute] = useState<PreviewRouteSnapshot | null>(null)
  const [sessionRoute, setSessionRoute] = useState<PreviewRouteSnapshot | null>(null)
  const [latestSessionRuntime, setLatestSessionRuntime] = useState<BuilderRuntimePayload | null>(null)
  const appId =
    params.appId ??
    browserRoute?.appId ??
    sessionRoute?.appId ??
    latestSessionRuntime?.appId
  const projectRefParam =
    params.ref ?? browserRoute?.ref ?? sessionRoute?.ref
  const pageIdParam =
    params.pageId ??
    browserRoute?.pageId ??
    sessionRoute?.pageId

  // Preview should always render the latest draft; if it doesn't exist yet,
  // the draft query falls back to runtime via getBuilderDraftOrRuntime.
  const draftQuery = useBuilderDraftQuery({ appId, projectRef: projectRefParam })
  const [sessionRuntime, setSessionRuntime] = useState<BuilderRuntimePayload | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    setIsHydrated(true)
    const query = new URLSearchParams(window.location.search)
    setBrowserRoute({
      appId: query.get('appId') ?? undefined,
      ref: query.get('ref') ?? undefined,
      pageId: query.get('pageId') ?? undefined,
    })
    try {
      const routeRaw = window.sessionStorage.getItem('builder-preview-route')
      if (routeRaw) {
        const parsedRoute = JSON.parse(routeRaw) as PreviewRouteSnapshot
        setSessionRoute(parsedRoute)
      } else {
        setSessionRoute(null)
      }
    } catch {
      setSessionRoute(null)
    }

    try {
      const raw = window.sessionStorage.getItem('builder-preview-schema:latest')
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<BuilderRuntimePayload>
        setLatestSessionRuntime(normalizeDraftSchema(parsed, parsed.appId))
      } else {
        setLatestSessionRuntime(null)
      }
    } catch {
      setLatestSessionRuntime(null)
    }
  }, [])

  useEffect(() => {
    if (!appId || typeof window === 'undefined') {
      setSessionRuntime(null)
      return
    }
    try {
      const raw = window.sessionStorage.getItem(`builder-preview-schema:${appId}`)
      if (!raw) {
        setSessionRuntime(null)
        return
      }
      const parsed = JSON.parse(raw) as Partial<BuilderRuntimePayload>
      setSessionRuntime(normalizeDraftSchema(parsed, appId))
    } catch {
      setSessionRuntime(null)
    }
  }, [appId])

  const runtime = useMemo<BuilderRuntimePayload | null>(() => {
    const serverSchema = draftQuery.data?.schema ?? null
    const hasServerPages = Boolean(serverSchema && Array.isArray(serverSchema.pages) && serverSchema.pages.length > 0)
    const hasSessionPages = Boolean(
      sessionRuntime && Array.isArray(sessionRuntime.pages) && sessionRuntime.pages.length > 0
    )
    const hasLatestSessionPages = Boolean(
      latestSessionRuntime &&
        Array.isArray(latestSessionRuntime.pages) &&
        latestSessionRuntime.pages.length > 0
    )

    if (hasServerPages) {
      return serverSchema
    }
    if (hasSessionPages) {
      return sessionRuntime
    }
    if (hasLatestSessionPages) {
      return latestSessionRuntime
    }
    return serverSchema ?? sessionRuntime ?? latestSessionRuntime
  }, [draftQuery.data?.schema, latestSessionRuntime, sessionRuntime])

  const normalizedTheme = useMemo(() => normalizeAppTheme(runtime?.theme ?? null), [runtime?.theme])
  const activeThemeMode = useMemo(() => {
    if (normalizedTheme.mode === 'system') {
      return resolvedTheme?.includes('dark') ? 'dark' : 'light'
    }
    return normalizedTheme.mode
  }, [normalizedTheme.mode, resolvedTheme])
  const themeStyle = useMemo(
    () => buildAppThemeCssVars(normalizedTheme, activeThemeMode),
    [normalizedTheme, activeThemeMode]
  )

  const pages = useMemo<BuilderPage[]>(() => {
    if (!runtime) {
      return []
    }

    return runtime.pages.map((page) => {
      const layout = isRecord(page.layout) ? page.layout : {}
      const pageLayout = resolvePageLayoutFromRecord(layout)

      return {
        id: page.id,
        name: page.name,
        access: page.access,
        layout,
        menu: (page.menu as BuilderPage['menu']) ?? null,
        pageLayout,
        pageMeta: isRecord((layout as { pageMeta?: unknown }).pageMeta)
          ? ((layout as { pageMeta: BuilderPage['pageMeta'] }).pageMeta ?? undefined)
          : undefined,
      }
    })
  }, [runtime])

  const globalWidgets = useMemo<BuilderWidgetInstance[]>(() => {
    const appLayout = resolveAppLayoutFromUnknown(runtime?.appLayout)
    return getAppLayoutWidgets(appLayout)
  }, [runtime?.appLayout])

  const appMeta = useMemo<BuilderAppMeta | undefined>(() => {
    const firstLayout = pages[0]?.layout as { appMeta?: unknown } | undefined
    const layoutMeta = isRecord(firstLayout?.appMeta) ? (firstLayout?.appMeta as BuilderAppMeta) : undefined
    if (layoutMeta) {
      return {
        ...layoutMeta,
        maxWidth: layoutMeta.maxWidth ?? '100%',
      }
    }
    return {
      browserTitle: runtime?.name ?? 'App Preview',
      url: '',
      shortcuts: [],
      persistUrlParams: false,
      maxWidth: '100%',
    }
  }, [pages, runtime?.name])

  const queries = useMemo<BuilderQuery[]>(() => {
    const resolvedAppId = appId
    if (!runtime || !resolvedAppId) {
      return []
    }
    const raw = Array.isArray(runtime.queries) ? runtime.queries : []
    return raw.reduce<BuilderQuery[]>((acc, item) => {
      if (!isRecord(item)) {
        return acc
      }
      const id = typeof item.id === 'string' ? item.id : ''
      if (!id) {
        return acc
      }
      acc.push({
        id,
        appId: resolvedAppId,
        name: typeof item.name === 'string' ? item.name : '',
        type: typeof item.type === 'string' ? item.type : 'rest',
        config: isRecord(item.config) ? (item.config as Record<string, unknown>) : {},
        trigger: typeof item.trigger === 'string' ? item.trigger : null,
      })
      return acc
    }, [])
  }, [runtime, appId])

  const jsFunctions = useMemo<BuilderJsFunction[]>(() => {
    const resolvedAppId = appId
    if (!runtime || !resolvedAppId) {
      return []
    }
    const raw = Array.isArray(runtime.js) ? runtime.js : []
    return raw.reduce<BuilderJsFunction[]>((acc, item) => {
      if (!isRecord(item)) {
        return acc
      }
      const id = typeof item.id === 'string' ? item.id : ''
      if (!id) {
        return acc
      }
      acc.push({
        id,
        appId: resolvedAppId,
        name: typeof item.name === 'string' ? item.name : '',
        code: typeof item.code === 'string' ? item.code : '',
        hash: typeof item.hash === 'string' ? item.hash : null,
      })
      return acc
    }, [])
  }, [runtime, appId])

  const rootPageId = runtime?.rootScreen ?? pages[0]?.id ?? null
  const initialPageId = pageIdParam && pages.some((page) => page.id === pageIdParam) ? pageIdParam : rootPageId
  const [activePageId, setActivePageId] = useState<string | null>(null)

  useEffect(() => {
    if (!initialPageId) {
      setActivePageId(null)
      return
    }
    setActivePageId((prev) => {
      if (prev && pages.some((page) => page.id === prev)) {
        return prev
      }
      return initialPageId
    })
  }, [pages, initialPageId])

  const projectRef = runtime?.projectRef ?? projectRefParam
  const projectQuery = useProjectDetailQuery(
    { ref: projectRef },
    { enabled: Boolean(projectRef) }
  )

  const builderBackQuery = useMemo(() => {
    return {
      ...(projectRef ? { ref: projectRef } : {}),
      ...(appId ? { appId } : {}),
      ...(pageIdParam ? { pageId: pageIdParam } : {}),
    }
  }, [appId, pageIdParam, projectRef])

  const shell = (content: React.ReactNode) => (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-background">
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-foreground-muted/20 bg-surface-100 px-3">
        <div className="flex items-center gap-2">
          <Button
            type="default"
            size="tiny"
            icon={<ArrowLeft className="h-3.5 w-3.5" />}
            onClick={() => {
              router.push({ pathname: '/builder', query: builderBackQuery })
            }}
          >
            Edit
          </Button>
          <div className="text-sm font-medium text-foreground">Preview</div>
        </div>
        <div className="truncate text-xs text-foreground-muted">
          {runtime?.name ?? ''}
        </div>
      </div>
      <div className="min-h-0 flex-1">{content}</div>
    </div>
  )

  if (!isHydrated) {
    return shell(
      <div className="flex h-full items-center justify-center">
        <LogoLoader />
      </div>
    )
  }

  if (!appId) {
    return shell(
      <div className="mx-auto w-full max-w-3xl p-6 text-sm text-foreground-muted">
        Missing `appId` query param.
      </div>
    )
  }

  if (draftQuery.isPending) {
    return shell(
      <div className="flex h-full items-center justify-center">
        <LogoLoader />
      </div>
    )
  }

  if (draftQuery.error) {
    return shell(
      <div className="mx-auto w-full max-w-3xl p-6 text-sm text-destructive">
        Failed to load preview data.
      </div>
    )
  }

  if (!runtime) {
    return shell(
      <div className="mx-auto w-full max-w-3xl p-6 text-sm text-foreground-muted">
        Preview data is empty.
      </div>
    )
  }

  return shell(
    <BuilderPreview
      pages={pages}
      activePageId={activePageId}
      onSelectPage={setActivePageId}
      variant="app"
      appMeta={appMeta}
      themeStyle={themeStyle}
      themeCustomCss={normalizedTheme.customCss}
      iconLibrary={normalizedTheme.shadcn?.iconLibrary}
      globalWidgets={globalWidgets}
      queries={queries}
      jsFunctions={jsFunctions}
      projectRef={projectRef}
      projectRestUrl={projectQuery.data?.restUrl ?? null}
      gridRowHeight={GRID_ROW_HEIGHT}
      gridMargin={GRID_MARGIN}
    />
  )
}

export default PreviewPage
