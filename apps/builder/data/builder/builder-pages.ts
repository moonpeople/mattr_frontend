import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'

import type { ResponseError, UseCustomMutationOptions, UseCustomQueryOptions } from 'types'
import { builderKeys } from './keys'
import { getBuilderDraftOrRuntime, normalizeDraftSchema, useBuilderDraftQuery } from './builder-draft'
import { uuidv4 } from 'lib/helpers'

export type BuilderPageRecord = {
  id: string
  appId: string
  name: string
  layout: Record<string, unknown>
  access: string
  menu?: Record<string, unknown> | null
  insertedAt?: string
  updatedAt?: string
}

export type BuilderPagesVariables = {
  appId: string
  projectRef?: string
}

export type BuilderPageCreateVariables = {
  appId: string
  name: string
  access?: string
}

export type BuilderPageUpdateVariables = {
  appId: string
  pageId: string
  name?: string
  access?: string
}

export type BuilderPageLayoutUpdateVariables = {
  appId: string
  pageId: string
  layout?: Record<string, unknown>
  widgets?: unknown[]
}

export type BuilderPageMenuUpdateVariables = {
  appId: string
  pageId: string
  items: Record<string, unknown>
}

type BuilderDraftSchema = ReturnType<typeof normalizeDraftSchema>

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)

const buildDraftPayload = (
  draft: { id?: string; appId?: string; updatedAt?: string; updatedBy?: string | null } | null,
  schema: BuilderDraftSchema,
  appId: string
) => {
  const normalized = normalizeDraftSchema(schema, appId)
  return {
    id: draft?.id ?? 'draft',
    appId: draft?.appId ?? appId,
    schema: normalized,
    updatedAt: draft?.updatedAt,
    updatedBy: draft?.updatedBy ?? null,
  }
}

const extractGlobals = (pages: BuilderDraftSchema['pages']) => {
  if (!Array.isArray(pages)) {
    return []
  }
  for (const page of pages) {
    if (!isRecord(page)) {
      continue
    }
    const layout = isRecord(page.layout) ? page.layout : {}
    const globals = layout.globals
    if (Array.isArray(globals) && globals.length > 0) {
      return globals
    }
  }
  return []
}

const toPageRecord = (page: Record<string, unknown>, appId: string): BuilderPageRecord | null => {
  const id = typeof page.id === 'string' ? page.id : null
  if (!id) {
    return null
  }
  return {
    id,
    appId,
    name: typeof page.name === 'string' ? page.name : 'Page',
    access: typeof page.access === 'string' ? page.access : 'auth',
    menu: page.menu ?? null,
    layout: isRecord(page.layout) ? page.layout : {},
  }
}

const mapPagesFromSchema = (schema: BuilderDraftSchema | null | undefined, appId?: string) => {
  if (!schema || !appId) {
    return []
  }
  const pages = Array.isArray(schema.pages) ? schema.pages : []
  return pages
    .map((page) => (isRecord(page) ? toPageRecord(page, appId) : null))
    .filter((page): page is BuilderPageRecord => Boolean(page))
}

export async function listBuilderPages(
  { appId, projectRef }: BuilderPagesVariables,
  signal?: AbortSignal
) {
  const payload = await getBuilderDraftOrRuntime({ appId, projectRef }, signal)
  return mapPagesFromSchema(payload.schema, appId)
}

type BuilderPagesData = Awaited<ReturnType<typeof listBuilderPages>>

type BuilderPagesError = ResponseError

export const useBuilderPagesQuery = <TData = BuilderPagesData>(
  { appId, projectRef }: { appId?: string; projectRef?: string },
  { enabled = true, select }: UseCustomQueryOptions<
    BuilderPagesData,
    BuilderPagesError,
    TData
  > = {}
) => {
  const draftQuery = useBuilderDraftQuery(
    { appId, projectRef },
    { enabled: enabled && typeof appId !== 'undefined' }
  )
  const pages = useMemo(
    () => mapPagesFromSchema(draftQuery.data?.schema, appId),
    [draftQuery.data?.schema, appId]
  )
  const data = select ? select(pages as BuilderPagesData) : (pages as TData)

  return {
    ...draftQuery,
    data,
  }
}

export const useCreateBuilderPageMutation = ({
  onSuccess,
  ...options
}: UseCustomMutationOptions<BuilderPageRecord, BuilderPagesError, BuilderPageCreateVariables> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<BuilderPageRecord, BuilderPagesError, BuilderPageCreateVariables>({
    mutationFn: ({ appId, name, access }) => {
      const draft = queryClient.getQueryData(builderKeys.draft(appId)) as
        | { schema?: BuilderDraftSchema; id?: string; appId?: string; updatedAt?: string; updatedBy?: string | null }
        | undefined
      const schema = normalizeDraftSchema(draft?.schema, appId)
      const globals = extractGlobals(schema.pages)
      const pageId = uuidv4()
      const newPage = {
        id: pageId,
        name,
        access: access ?? 'auth',
        menu: null,
        layout: {
          widgets: [],
          globals,
          pageGlobals: [],
          pageMeta: null,
          pageComponent: null,
        },
      }
      const nextSchema = {
        ...schema,
        pages: [...schema.pages, newPage],
      }
      queryClient.setQueryData(builderKeys.draft(appId), buildDraftPayload(draft ?? null, nextSchema, appId))
      const record = toPageRecord(newPage, appId)
      if (!record) {
        throw new Error('Failed to create page')
      }
      return record
    },
    async onSuccess(data, variables, context) {
      await onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useUpdateBuilderPageMutation = ({
  onSuccess,
  ...options
}: UseCustomMutationOptions<BuilderPageRecord, BuilderPagesError, BuilderPageUpdateVariables> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<BuilderPageRecord, BuilderPagesError, BuilderPageUpdateVariables>({
    mutationFn: ({ appId, pageId, name, access }) => {
      const draft = queryClient.getQueryData(builderKeys.draft(appId)) as
        | { schema?: BuilderDraftSchema; id?: string; appId?: string; updatedAt?: string; updatedBy?: string | null }
        | undefined
      const schema = normalizeDraftSchema(draft?.schema, appId)
      let updatedPage: BuilderPageRecord | null = null
      const nextPages = schema.pages.map((page) => {
        if (!isRecord(page) || page.id !== pageId) {
          return page
        }
        const next = {
          ...page,
          name: typeof name === 'string' ? name : page.name,
          access: typeof access === 'string' ? access : page.access,
        }
        updatedPage = toPageRecord(next, appId)
        return next
      })
      const nextSchema = { ...schema, pages: nextPages }
      queryClient.setQueryData(builderKeys.draft(appId), buildDraftPayload(draft ?? null, nextSchema, appId))
      if (!updatedPage) {
        throw new Error('Page not found')
      }
      return updatedPage
    },
    async onSuccess(data, variables, context) {
      await onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useUpdateBuilderPageLayoutMutation = ({
  onSuccess,
  ...options
}: UseCustomMutationOptions<BuilderPageRecord, BuilderPagesError, BuilderPageLayoutUpdateVariables> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<BuilderPageRecord, BuilderPagesError, BuilderPageLayoutUpdateVariables>({
    mutationFn: ({ appId, pageId, layout, widgets }) => {
      const draft = queryClient.getQueryData(builderKeys.draft(appId)) as
        | { schema?: BuilderDraftSchema; id?: string; appId?: string; updatedAt?: string; updatedBy?: string | null }
        | undefined
      const schema = normalizeDraftSchema(draft?.schema, appId)
      let updatedPage: BuilderPageRecord | null = null
      const nextPages = schema.pages.map((page) => {
        if (!isRecord(page) || page.id !== pageId) {
          return page
        }
        const nextLayout = {
          ...(isRecord(page.layout) ? page.layout : {}),
          ...(isRecord(layout) ? layout : {}),
        }
        if (Array.isArray(widgets)) {
          nextLayout.widgets = widgets
        }
        const next = {
          ...page,
          layout: nextLayout,
        }
        updatedPage = toPageRecord(next, appId)
        return next
      })
      const nextSchema = { ...schema, pages: nextPages }
      queryClient.setQueryData(builderKeys.draft(appId), buildDraftPayload(draft ?? null, nextSchema, appId))
      if (!updatedPage) {
        throw new Error('Page not found')
      }
      return updatedPage
    },
    async onSuccess(data, variables, context) {
      await onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useUpdateBuilderPageMenuMutation = ({
  onSuccess,
  ...options
}: UseCustomMutationOptions<
  { pageId: string; items: Record<string, unknown> },
  BuilderPagesError,
  BuilderPageMenuUpdateVariables
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<
    { pageId: string; items: Record<string, unknown> },
    BuilderPagesError,
    BuilderPageMenuUpdateVariables
  >({
    mutationFn: ({ appId, pageId, items }) => {
      const draft = queryClient.getQueryData(builderKeys.draft(appId)) as
        | { schema?: BuilderDraftSchema; id?: string; appId?: string; updatedAt?: string; updatedBy?: string | null }
        | undefined
      const schema = normalizeDraftSchema(draft?.schema, appId)
      const nextPages = schema.pages.map((page) => {
        if (!isRecord(page) || page.id !== pageId) {
          return page
        }
        return {
          ...page,
          menu: items,
        }
      })
      const nextSchema = { ...schema, pages: nextPages }
      queryClient.setQueryData(builderKeys.draft(appId), buildDraftPayload(draft ?? null, nextSchema, appId))
      return { pageId, items }
    },
    onSuccess,
    ...options,
  })
}

export const useDeleteBuilderPageMutation = ({
  onSuccess,
  ...options
}: UseCustomMutationOptions<
  null,
  BuilderPagesError,
  { pageId: string; appId: string }
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<null, BuilderPagesError, { pageId: string; appId: string }>({
    mutationFn: ({ pageId, appId }) => {
      const draft = queryClient.getQueryData(builderKeys.draft(appId)) as
        | { schema?: BuilderDraftSchema; id?: string; appId?: string; updatedAt?: string; updatedBy?: string | null }
        | undefined
      const schema = normalizeDraftSchema(draft?.schema, appId)
      const nextPages = schema.pages.filter((page) => !isRecord(page) || page.id !== pageId)
      const nextSchema = { ...schema, pages: nextPages }
      queryClient.setQueryData(builderKeys.draft(appId), buildDraftPayload(draft ?? null, nextSchema, appId))
      return null
    },
    async onSuccess(data, variables, context) {
      await onSuccess?.(data, variables, context)
    },
    ...options,
  })
}
