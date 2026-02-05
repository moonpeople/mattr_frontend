import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { ResponseError, UseCustomMutationOptions, UseCustomQueryOptions } from 'types'
import { builderRequest, withProjectRef } from './builder-client'
import { builderKeys } from './keys'
import type { BuilderRuntimePayload } from './builder-runtime'

export type BuilderVersion = {
  id: string
  appId: string
  version: number
  schema: BuilderRuntimePayload
  publishedAt?: string | null
  publishedBy?: string | null
  comment?: string | null
}

type BuilderVersionsResponse = {
  versions: BuilderVersion[]
}

export type BuilderVersionsVariables = {
  appId: string
  projectRef?: string
}

export type BuilderRollbackVariables = {
  appId: string
  versionId: string
  projectRef?: string
}

export async function listBuilderVersions(
  { appId, projectRef }: BuilderVersionsVariables,
  signal?: AbortSignal
) {
  const payload = await builderRequest<BuilderVersionsResponse>(
    withProjectRef(`/apps/${appId}/versions`, projectRef),
    { signal }
  )
  return payload.versions
}

export async function rollbackBuilderVersion({
  appId,
  versionId,
  projectRef,
}: BuilderRollbackVariables) {
  return builderRequest<unknown>(withProjectRef(`/apps/${appId}/rollback`, projectRef), {
    method: 'POST',
    body: { versionId },
  })
}

type BuilderVersionsData = Awaited<ReturnType<typeof listBuilderVersions>>

export const useBuilderVersionsQuery = <TData = BuilderVersionsData>(
  { appId, projectRef }: { appId?: string; projectRef?: string },
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<BuilderVersionsData, ResponseError, TData> = {}
) => {
  return useQuery<BuilderVersionsData, ResponseError, TData>({
    queryKey: builderKeys.versions(appId),
    queryFn: ({ signal }) =>
      listBuilderVersions({ appId: appId as string, projectRef }, signal),
    enabled: enabled && typeof appId !== 'undefined',
    ...options,
  })
}

export const useRollbackBuilderVersionMutation = ({
  onSuccess,
  ...options
}: UseCustomMutationOptions<unknown, ResponseError, BuilderRollbackVariables> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<unknown, ResponseError, BuilderRollbackVariables>({
    mutationFn: (vars) => rollbackBuilderVersion(vars),
    async onSuccess(data, variables, context) {
      await queryClient.invalidateQueries({ queryKey: builderKeys.versions(variables.appId) })
      await queryClient.invalidateQueries({ queryKey: builderKeys.runtime(variables.appId) })
      await onSuccess?.(data, variables, context)
    },
    ...options,
  })
}
