import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { UseCustomMutationOptions, UseCustomQueryOptions } from 'types'
import { iotFetch } from './client'
import type { IotApiKey } from './types'

export type IotApiKeyPayload = {
  name: string
  scopes?: string[]
  expires_at?: string | null
}

export const iotApiKeyKeys = {
  list: () => ['iot', 'api-keys'] as const,
}

export async function getIotApiKeys(signal?: AbortSignal) {
  return iotFetch<IotApiKey[]>('/api_keys', { signal })
}

export async function createIotApiKey(payload: IotApiKeyPayload) {
  return iotFetch<IotApiKey>('/api_keys', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function deleteIotApiKey(apiKeyId: string | number) {
  return iotFetch<void>(`/api_keys/${apiKeyId}`, {
    method: 'DELETE',
  })
}

export const useIotApiKeysQuery = <TData = IotApiKey[]>(
  {
    enabled = true,
  }: {
    enabled?: boolean
  } = {},
  options: UseCustomQueryOptions<IotApiKey[], Error, TData> = {}
) =>
  useQuery<IotApiKey[], Error, TData>({
    queryKey: iotApiKeyKeys.list(),
    queryFn: ({ signal }) => getIotApiKeys(signal),
    enabled,
    staleTime: 15 * 1000,
    ...options,
  })

export const useIotApiKeyCreateMutation = ({
  onSuccess,
  ...options
}: Omit<
  UseCustomMutationOptions<IotApiKey, Error, { payload: IotApiKeyPayload }>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<IotApiKey, Error, { payload: IotApiKeyPayload }>({
    mutationFn: ({ payload }) => createIotApiKey(payload),
    async onSuccess(data, variables, context) {
      await queryClient.invalidateQueries({
        queryKey: iotApiKeyKeys.list(),
      })
      await onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useIotApiKeyDeleteMutation = ({
  onSuccess,
  ...options
}: Omit<
  UseCustomMutationOptions<void, Error, { apiKeyId: string | number }>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<void, Error, { apiKeyId: string | number }>({
    mutationFn: ({ apiKeyId }) => deleteIotApiKey(apiKeyId),
    async onSuccess(_data, variables, context) {
      await queryClient.invalidateQueries({
        queryKey: iotApiKeyKeys.list(),
      })
      await onSuccess?.(_data, variables, context)
    },
    ...options,
  })
}
