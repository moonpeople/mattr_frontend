import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { ResponseError, UseCustomMutationOptions, UseCustomQueryOptions } from 'types'
import { builderRequest, withProjectRef } from './builder-client'
import { builderKeys } from './keys'
import type { BuilderRuntimePayload } from './builder-runtime'
import { getBuilderRuntime } from './builder-runtime'

type BuilderDraftSchema = BuilderRuntimePayload

export type BuilderDraft = {
  id: string
  appId: string
  schema: BuilderDraftSchema
  updatedAt?: string
  updatedBy?: string | null
}

export type BuilderDraftUpsertVariables = {
  appId: string
  schema: BuilderDraftSchema
  projectRef?: string
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

export const normalizeDraftSchema = (
  schema: Partial<BuilderDraftSchema> | null | undefined,
  appId?: string
): BuilderDraftSchema => {
  const rawViewer = isRecord(schema?.viewer) ? schema?.viewer : {}
  const rawPolicies = isRecord((rawViewer as Record<string, unknown>)?.policies)
    ? (rawViewer as Record<string, unknown>)?.policies
    : {}

  return {
    appId: schema?.appId ?? appId,
    name: schema?.name,
    projectRef: schema?.projectRef,
    orgSlug: schema?.orgSlug,
    rootScreen: schema?.rootScreen ?? null,
    pages: Array.isArray(schema?.pages) ? schema?.pages : [],
    queries: Array.isArray(schema?.queries) ? schema?.queries : [],
    js: Array.isArray(schema?.js) ? schema?.js : [],
    viewer: {
      ...(rawViewer ?? {}),
      policies: rawPolicies ?? {},
    },
  }
}

const buildDraftPayload = (draft: BuilderDraft | null, schema: BuilderDraftSchema): BuilderDraft => {
  const normalized = normalizeDraftSchema(schema, draft?.appId)
  return {
    id: draft?.id ?? 'draft',
    appId: draft?.appId ?? normalized.appId ?? '',
    schema: normalized,
    updatedAt: draft?.updatedAt,
    updatedBy: draft?.updatedBy ?? null,
  }
}

export async function getBuilderDraft(
  { appId, projectRef }: { appId: string; projectRef?: string },
  signal?: AbortSignal
) {
  const payload = await builderRequest<BuilderDraft>(
    withProjectRef(`/apps/${appId}/draft`, projectRef),
    { signal }
  )
  return buildDraftPayload(payload, payload.schema)
}

export async function upsertBuilderDraft({
  appId,
  schema,
  projectRef,
}: BuilderDraftUpsertVariables) {
  const payload = await builderRequest<BuilderDraft>(withProjectRef(`/apps/${appId}/draft`, projectRef), {
    method: 'PUT',
    body: { schema },
  })
  return buildDraftPayload(payload, payload.schema)
}

export async function getBuilderDraftOrRuntime(
  { appId, projectRef }: { appId: string; projectRef?: string },
  signal?: AbortSignal
) {
  try {
    return await getBuilderDraft({ appId, projectRef }, signal)
  } catch (error) {
    if (error instanceof ResponseError && error.code === 404) {
      try {
        const runtime = await getBuilderRuntime({ appId, projectRef }, signal)
        return buildDraftPayload(null, normalizeDraftSchema(runtime, appId))
      } catch (runtimeError) {
        if (runtimeError instanceof ResponseError && runtimeError.code === 404) {
          return buildDraftPayload(null, normalizeDraftSchema({}, appId))
        }
        throw runtimeError
      }
    }
    throw error
  }
}

export const useBuilderDraftQuery = <TData = BuilderDraft>(
  { appId, projectRef }: { appId?: string; projectRef?: string },
  {
    enabled = true,
    select,
    ...options
  }: UseCustomQueryOptions<BuilderDraft, ResponseError, TData> = {}
) => {
  return useQuery<BuilderDraft, ResponseError, TData>({
    queryKey: builderKeys.draft(appId),
    queryFn: ({ signal }) =>
      getBuilderDraftOrRuntime({ appId: appId as string, projectRef }, signal),
    enabled: enabled && typeof appId !== 'undefined',
    select,
    ...options,
  })
}

export const useUpsertBuilderDraftMutation = ({
  onSuccess,
  ...options
}: UseCustomMutationOptions<BuilderDraft, ResponseError, BuilderDraftUpsertVariables> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<BuilderDraft, ResponseError, BuilderDraftUpsertVariables>({
    mutationFn: (vars) => upsertBuilderDraft(vars),
    async onSuccess(data, variables, context) {
      queryClient.setQueryData(builderKeys.draft(variables.appId), data)
      await onSuccess?.(data, variables, context)
    },
    ...options,
  })
}
