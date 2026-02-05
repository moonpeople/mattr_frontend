import { useMutation, useQuery } from '@tanstack/react-query'

import type { ResponseError, UseCustomMutationOptions, UseCustomQueryOptions } from 'types'
import { builderRequest, withProjectRef } from './builder-client'
import { builderKeys } from './keys'
import type { BuilderApp } from './builder-apps'
import type { BuilderQuery } from './builder-queries'
import type { BuilderJsFunction } from './builder-js'
import type { BuilderPage } from 'components/builder/types'

export type BuilderRuntimePage = {
  id: string
  name: string
  layout: Record<string, unknown>
  access: string
  menu?: Record<string, unknown> | null
}

export type BuilderRuntimePayload = {
  appId?: string
  name?: string
  projectRef?: string
  orgSlug?: string
  rootScreen?: string | null
  pages: BuilderRuntimePage[]
  queries: Record<string, unknown>[]
  js: Record<string, unknown>[]
  viewer: {
    policies: Record<string, boolean>
  }
}

export type BuilderPublishVariables = {
  appId: string
  payload: BuilderRuntimePayload
  message?: string
  projectRef?: string
}

export async function getBuilderRuntime(
  { appId, projectRef }: { appId: string; projectRef?: string },
  signal?: AbortSignal
) {
  return builderRequest<BuilderRuntimePayload>(withProjectRef(`/apps/${appId}/runtime`, projectRef), {
    signal,
  })
}

export async function publishBuilderRuntime({
  appId,
  payload,
  message,
  projectRef,
}: BuilderPublishVariables & { projectRef?: string }) {
  return builderRequest<unknown>(withProjectRef(`/apps/${appId}/publish`, projectRef), {
    method: 'POST',
    body: { payload, message },
  })
}

export const useBuilderRuntimeQuery = <TData = BuilderRuntimePayload>(
  { appId, projectRef }: { appId?: string; projectRef?: string },
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<BuilderRuntimePayload, ResponseError, TData> = {}
) => {
  return useQuery<BuilderRuntimePayload, ResponseError, TData>({
    queryKey: builderKeys.runtime(appId),
    queryFn: ({ signal }) =>
      getBuilderRuntime({ appId: appId as string, projectRef }, signal),
    enabled: enabled && typeof appId !== 'undefined',
    ...options,
  })
}

export const usePublishBuilderRuntimeMutation = ({
  onSuccess,
  ...options
}: UseCustomMutationOptions<unknown, ResponseError, BuilderPublishVariables> = {}) => {
  return useMutation<unknown, ResponseError, BuilderPublishVariables>({
    mutationFn: (vars) => publishBuilderRuntime(vars),
    onSuccess,
    ...options,
  })
}

export const buildRuntimePayload = (
  app: BuilderApp,
  pages: BuilderPage[],
  queries: BuilderQuery[],
  jsFunctions: BuilderJsFunction[],
  globalWidgets: BuilderPage['widgets'] = []
): BuilderRuntimePayload => {
  const rootCandidate =
    (pages.find((page) => {
      const layout = page.layout as { rootScreen?: unknown } | undefined
      return typeof layout?.rootScreen === 'string'
    })?.layout as { rootScreen?: string } | undefined)?.rootScreen ?? null
  const rootScreen =
    rootCandidate && pages.some((page) => page.id === rootCandidate)
      ? rootCandidate
      : pages[0]?.id ?? null

  return {
    appId: app.id,
    name: app.name,
    projectRef: app.projectRef,
    orgSlug: app.orgSlug,
    rootScreen,
    pages: pages.map((page) => ({
      id: page.id,
      name: page.name,
      access: page.access ?? 'auth',
      menu: page.menu ?? null,
      layout: {
        ...(page.layout ?? {}),
        widgets: page.widgets,
        globals: globalWidgets,
        pageGlobals: page.pageGlobals ?? [],
        pageMeta: page.pageMeta ?? null,
        pageComponent: page.pageComponent ?? null,
      },
    })),
    queries: queries.map((query) => ({
      id: query.id,
      name: query.name,
      type: query.type,
      config: query.config,
      trigger: query.trigger ?? null,
    })),
    js: jsFunctions.map((func) => ({
      id: func.id,
      name: func.name,
      code: func.code,
      hash: func.hash ?? null,
    })),
    viewer: { policies: {} },
  }
}
