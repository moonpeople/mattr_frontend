import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { UseCustomMutationOptions, UseCustomQueryOptions } from 'types'
import { iotFetch } from './client'
import type { IotSavedQuery } from './types'

export type IotSavedQueryPayload = {
  name: string
  description?: string | null
  datasource?: string
  sql_text: string
  exposed_as_api?: boolean
  api_key_ids?: number[]
  params?: string[]
}

export const iotSavedQueryKeys = {
  list: () => ['iot', 'saved-queries'] as const,
}

export async function getIotSavedQueries(signal?: AbortSignal) {
  return iotFetch<IotSavedQuery[]>('/saved_queries', { signal })
}

export async function createIotSavedQuery(payload: IotSavedQueryPayload) {
  return iotFetch<IotSavedQuery>('/saved_queries', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateIotSavedQuery(
  queryId: string | number,
  payload: IotSavedQueryPayload
) {
  return iotFetch<IotSavedQuery>(`/saved_queries/${queryId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function deleteIotSavedQuery(queryId: string | number) {
  return iotFetch<void>(`/saved_queries/${queryId}`, {
    method: 'DELETE',
  })
}

export async function runIotSavedQuery(
  queryId: string | number,
  apiKey: string,
  params?: Record<string, unknown> | string | null
) {
  return iotFetch<any[]>(`/telemetry/saved-queries/${queryId}/run`, {
    method: 'POST',
    body: JSON.stringify({ params }),
    headers: {
      'X-API-Key': apiKey,
    },
  })
}

export const useIotSavedQueriesQuery = <TData = IotSavedQuery[]>(
  {
    enabled = true,
  }: {
    enabled?: boolean
  } = {},
  options: UseCustomQueryOptions<IotSavedQuery[], Error, TData> = {}
) =>
  useQuery<IotSavedQuery[], Error, TData>({
    queryKey: iotSavedQueryKeys.list(),
    queryFn: ({ signal }) => getIotSavedQueries(signal),
    enabled,
    staleTime: 15 * 1000,
    ...options,
  })

export const useIotSavedQueryCreateMutation = ({
  onSuccess,
  ...options
}: Omit<
  UseCustomMutationOptions<IotSavedQuery, Error, { payload: IotSavedQueryPayload }>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<IotSavedQuery, Error, { payload: IotSavedQueryPayload }>({
    mutationFn: ({ payload }) => createIotSavedQuery(payload),
    async onSuccess(data, variables, context) {
      await queryClient.invalidateQueries({
        queryKey: iotSavedQueryKeys.list(),
      })
      await onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useIotSavedQueryUpdateMutation = ({
  onSuccess,
  ...options
}: Omit<
  UseCustomMutationOptions<
    IotSavedQuery,
    Error,
    { queryId: string | number; payload: IotSavedQueryPayload }
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<
    IotSavedQuery,
    Error,
    { queryId: string | number; payload: IotSavedQueryPayload }
  >({
    mutationFn: ({ queryId, payload }) => updateIotSavedQuery(queryId, payload),
    async onSuccess(data, variables, context) {
      await queryClient.invalidateQueries({
        queryKey: iotSavedQueryKeys.list(),
      })
      await onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useIotSavedQueryDeleteMutation = ({
  onSuccess,
  ...options
}: Omit<
  UseCustomMutationOptions<void, Error, { queryId: string | number }>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<void, Error, { queryId: string | number }>({
    mutationFn: ({ queryId }) => deleteIotSavedQuery(queryId),
    async onSuccess(_data, variables, context) {
      await queryClient.invalidateQueries({
        queryKey: iotSavedQueryKeys.list(),
      })
      await onSuccess?.(_data, variables, context)
    },
    ...options,
  })
}

export const useIotSavedQueryRunMutation = ({
  onSuccess,
  ...options
}: Omit<
  UseCustomMutationOptions<
    any[],
    Error,
    { queryId: string | number; apiKey: string; params?: Record<string, unknown> | string | null }
  >,
  'mutationFn'
> = {}) => {
  return useMutation<any[], Error, { queryId: string | number; apiKey: string; params?: Record<string, unknown> | string | null }>({
    mutationFn: ({ queryId, apiKey, params }) => runIotSavedQuery(queryId, apiKey, params),
    ...options,
  })
}
