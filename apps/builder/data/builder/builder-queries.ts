import { useMutation, useQueryClient } from '@tanstack/react-query'

import type { ResponseError, UseCustomMutationOptions, UseCustomQueryOptions } from 'types'
import { builderRequest } from './builder-client'
import { builderKeys } from './keys'
import { normalizeDraftSchema, useBuilderDraftQuery } from './builder-draft'
import { uuidv4 } from 'lib/helpers'

export type BuilderQuery = {
  id: string
  appId: string
  name: string
  type: string
  config: Record<string, unknown>
  trigger?: string | null
  insertedAt?: string
  updatedAt?: string
}

export type BuilderQueryCreateVariables = {
  appId: string
  name: string
  type: string
  config: Record<string, unknown>
  trigger?: string | null
}

export type BuilderQueryUpdateVariables = {
  appId: string
  queryId: string
  name?: string
  type?: string
  config?: Record<string, unknown>
  trigger?: string | null
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

const toQueryRecord = (query: Record<string, unknown>, appId: string): BuilderQuery | null => {
  const id = typeof query.id === 'string' ? query.id : null
  if (!id) {
    return null
  }
  return {
    id,
    appId,
    name: typeof query.name === 'string' ? query.name : '',
    type: typeof query.type === 'string' ? query.type : 'rest',
    config: isRecord(query.config) ? query.config : {},
    trigger: typeof query.trigger === 'string' ? query.trigger : null,
  }
}

const mapQueriesFromSchema = (schema: BuilderDraftSchema | null | undefined, appId?: string) => {
  if (!schema || !appId) {
    return []
  }
  const queries = Array.isArray(schema.queries) ? schema.queries : []
  return queries
    .map((query) => (isRecord(query) ? toQueryRecord(query, appId) : null))
    .filter((query): query is BuilderQuery => Boolean(query))
}

export async function runBuilderQuery({
  queryId,
  params,
}: {
  queryId: string
  params?: Record<string, unknown>
}) {
  return builderRequest<unknown>(`/queries/${queryId}/run`, {
    method: 'POST',
    body: params ?? {},
  })
}

export const useBuilderQueriesQuery = <TData = BuilderQuery[]>(
  { appId, projectRef }: { appId?: string; projectRef?: string },
  { enabled = true, select }: UseCustomQueryOptions<BuilderQuery[], ResponseError, TData> = {}
) => {
  const draftQuery = useBuilderDraftQuery(
    { appId, projectRef },
    { enabled: enabled && typeof appId !== 'undefined' }
  )
  const queries = mapQueriesFromSchema(draftQuery.data?.schema, appId)
  const data = select ? select(queries as BuilderQuery[]) : (queries as TData)

  return {
    ...draftQuery,
    data,
  }
}

export const useCreateBuilderQueryMutation = ({
  onSuccess,
  ...options
}: UseCustomMutationOptions<BuilderQuery, ResponseError, BuilderQueryCreateVariables> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<BuilderQuery, ResponseError, BuilderQueryCreateVariables>({
    mutationFn: ({ appId, name, type, config, trigger }) => {
      const draft = queryClient.getQueryData(builderKeys.draft(appId)) as
        | { schema?: BuilderDraftSchema; id?: string; appId?: string; updatedAt?: string; updatedBy?: string | null }
        | undefined
      const schema = normalizeDraftSchema(draft?.schema, appId)
      const queryId = uuidv4()
      const newQuery = {
        id: queryId,
        name,
        type,
        config,
        trigger: trigger ?? null,
      }
      const nextSchema = { ...schema, queries: [...schema.queries, newQuery] }
      queryClient.setQueryData(builderKeys.draft(appId), buildDraftPayload(draft ?? null, nextSchema, appId))
      const record = toQueryRecord(newQuery, appId)
      if (!record) {
        throw new Error('Failed to create query')
      }
      return record
    },
    async onSuccess(data, variables, context) {
      await onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useUpdateBuilderQueryMutation = ({
  onSuccess,
  ...options
}: UseCustomMutationOptions<BuilderQuery, ResponseError, BuilderQueryUpdateVariables> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<BuilderQuery, ResponseError, BuilderQueryUpdateVariables>({
    mutationFn: ({ appId, queryId, name, type, config, trigger }) => {
      const draft = queryClient.getQueryData(builderKeys.draft(appId)) as
        | { schema?: BuilderDraftSchema; id?: string; appId?: string; updatedAt?: string; updatedBy?: string | null }
        | undefined
      const schema = normalizeDraftSchema(draft?.schema, appId)
      let updatedQuery: BuilderQuery | null = null
      const nextQueries = schema.queries.map((query) => {
        if (!isRecord(query) || query.id !== queryId) {
          return query
        }
        const next = {
          ...query,
          name: typeof name === 'string' ? name : query.name,
          type: typeof type === 'string' ? type : query.type,
          config: isRecord(config) ? config : query.config,
          trigger: typeof trigger === 'string' || trigger === null ? trigger : query.trigger,
        }
        updatedQuery = toQueryRecord(next, appId)
        return next
      })
      const nextSchema = { ...schema, queries: nextQueries }
      queryClient.setQueryData(builderKeys.draft(appId), buildDraftPayload(draft ?? null, nextSchema, appId))
      if (!updatedQuery) {
        throw new Error('Query not found')
      }
      return updatedQuery
    },
    async onSuccess(data, variables, context) {
      await onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useDeleteBuilderQueryMutation = ({
  onSuccess,
  ...options
}: UseCustomMutationOptions<null, ResponseError, { queryId: string; appId: string }> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<null, ResponseError, { queryId: string; appId: string }>({
    mutationFn: ({ queryId, appId }) => {
      const draft = queryClient.getQueryData(builderKeys.draft(appId)) as
        | { schema?: BuilderDraftSchema; id?: string; appId?: string; updatedAt?: string; updatedBy?: string | null }
        | undefined
      const schema = normalizeDraftSchema(draft?.schema, appId)
      const nextQueries = schema.queries.filter((query) => !isRecord(query) || query.id !== queryId)
      const nextSchema = { ...schema, queries: nextQueries }
      queryClient.setQueryData(builderKeys.draft(appId), buildDraftPayload(draft ?? null, nextSchema, appId))
      return null
    },
    async onSuccess(data, variables, context) {
      await onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useRunBuilderQueryMutation = ({
  onSuccess,
  ...options
}: UseCustomMutationOptions<
  unknown,
  ResponseError,
  { queryId: string; params?: Record<string, unknown> }
> = {}) => {
  return useMutation<
    unknown,
    ResponseError,
    { queryId: string; params?: Record<string, unknown> }
  >({
    mutationFn: (vars) => runBuilderQuery(vars),
    onSuccess,
    ...options,
  })
}
