import { useMutation, useQueryClient } from '@tanstack/react-query'

import type { ResponseError, UseCustomMutationOptions, UseCustomQueryOptions } from 'types'
import { builderKeys } from './keys'
import { normalizeDraftSchema, useBuilderDraftQuery } from './builder-draft'
import { uuidv4 } from 'lib/helpers'

export type BuilderJsFunction = {
  id: string
  appId: string
  name: string
  code: string
  hash?: string | null
  insertedAt?: string
  updatedAt?: string
}

export type BuilderJsCreateVariables = {
  appId: string
  name: string
  code: string
}

export type BuilderJsUpdateVariables = {
  appId: string
  jsId: string
  name?: string
  code?: string
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

const toJsRecord = (func: Record<string, unknown>, appId: string): BuilderJsFunction | null => {
  const id = typeof func.id === 'string' ? func.id : null
  if (!id) {
    return null
  }
  return {
    id,
    appId,
    name: typeof func.name === 'string' ? func.name : '',
    code: typeof func.code === 'string' ? func.code : '',
    hash: typeof func.hash === 'string' ? func.hash : null,
  }
}

const mapJsFromSchema = (schema: BuilderDraftSchema | null | undefined, appId?: string) => {
  if (!schema || !appId) {
    return []
  }
  const js = Array.isArray(schema.js) ? schema.js : []
  return js
    .map((func) => (isRecord(func) ? toJsRecord(func, appId) : null))
    .filter((func): func is BuilderJsFunction => Boolean(func))
}

export const useBuilderJsQuery = <TData = BuilderJsFunction[]>(
  { appId, projectRef }: { appId?: string; projectRef?: string },
  { enabled = true, select }: UseCustomQueryOptions<BuilderJsFunction[], ResponseError, TData> = {}
) => {
  const draftQuery = useBuilderDraftQuery(
    { appId, projectRef },
    { enabled: enabled && typeof appId !== 'undefined' }
  )
  const jsFunctions = mapJsFromSchema(draftQuery.data?.schema, appId)
  const data = select ? select(jsFunctions as BuilderJsFunction[]) : (jsFunctions as TData)

  return {
    ...draftQuery,
    data,
  }
}

export const useCreateBuilderJsMutation = ({
  onSuccess,
  ...options
}: UseCustomMutationOptions<BuilderJsFunction, ResponseError, BuilderJsCreateVariables> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<BuilderJsFunction, ResponseError, BuilderJsCreateVariables>({
    mutationFn: ({ appId, name, code }) => {
      const draft = queryClient.getQueryData(builderKeys.draft(appId)) as
        | { schema?: BuilderDraftSchema; id?: string; appId?: string; updatedAt?: string; updatedBy?: string | null }
        | undefined
      const schema = normalizeDraftSchema(draft?.schema, appId)
      const jsId = uuidv4()
      const newJs = {
        id: jsId,
        name,
        code,
        hash: null,
      }
      const nextSchema = { ...schema, js: [...schema.js, newJs] }
      queryClient.setQueryData(builderKeys.draft(appId), buildDraftPayload(draft ?? null, nextSchema, appId))
      const record = toJsRecord(newJs, appId)
      if (!record) {
        throw new Error('Failed to create JS function')
      }
      return record
    },
    async onSuccess(data, variables, context) {
      await onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useUpdateBuilderJsMutation = ({
  onSuccess,
  ...options
}: UseCustomMutationOptions<BuilderJsFunction, ResponseError, BuilderJsUpdateVariables> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<BuilderJsFunction, ResponseError, BuilderJsUpdateVariables>({
    mutationFn: ({ appId, jsId, name, code }) => {
      const draft = queryClient.getQueryData(builderKeys.draft(appId)) as
        | { schema?: BuilderDraftSchema; id?: string; appId?: string; updatedAt?: string; updatedBy?: string | null }
        | undefined
      const schema = normalizeDraftSchema(draft?.schema, appId)
      let updatedJs: BuilderJsFunction | null = null
      const nextJs = schema.js.map((func) => {
        if (!isRecord(func) || func.id !== jsId) {
          return func
        }
        const next = {
          ...func,
          name: typeof name === 'string' ? name : func.name,
          code: typeof code === 'string' ? code : func.code,
        }
        updatedJs = toJsRecord(next, appId)
        return next
      })
      const nextSchema = { ...schema, js: nextJs }
      queryClient.setQueryData(builderKeys.draft(appId), buildDraftPayload(draft ?? null, nextSchema, appId))
      if (!updatedJs) {
        throw new Error('JS function not found')
      }
      return updatedJs
    },
    async onSuccess(data, variables, context) {
      await onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useDeleteBuilderJsMutation = ({
  onSuccess,
  ...options
}: UseCustomMutationOptions<null, ResponseError, { jsId: string; appId: string }> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<null, ResponseError, { jsId: string; appId: string }>({
    mutationFn: ({ jsId, appId }) => {
      const draft = queryClient.getQueryData(builderKeys.draft(appId)) as
        | { schema?: BuilderDraftSchema; id?: string; appId?: string; updatedAt?: string; updatedBy?: string | null }
        | undefined
      const schema = normalizeDraftSchema(draft?.schema, appId)
      const nextJs = schema.js.filter((func) => !isRecord(func) || func.id !== jsId)
      const nextSchema = { ...schema, js: nextJs }
      queryClient.setQueryData(builderKeys.draft(appId), buildDraftPayload(draft ?? null, nextSchema, appId))
      return null
    },
    async onSuccess(data, variables, context) {
      await onSuccess?.(data, variables, context)
    },
    ...options,
  })
}
