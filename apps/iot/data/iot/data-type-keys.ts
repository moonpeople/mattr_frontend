import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { UseCustomMutationOptions, UseCustomQueryOptions } from 'types'
import { iotFetch } from './client'
import type { IotDataTypeKey } from './types'

export type IotDataTypeKeyPayload = {
  name: string
  data_key_name: string
  value_type: string
  unit?: string | null
  decimals?: number | null
  chart_type?: string | null
}

export const iotDataTypeKeyKeys = {
  list: () => ['iot', 'data-type-keys'] as const,
}

export async function getIotDataTypeKeys(signal?: AbortSignal) {
  return iotFetch<IotDataTypeKey[]>('/data_type_keys', { signal })
}

export async function createIotDataTypeKey(payload: IotDataTypeKeyPayload) {
  return iotFetch<IotDataTypeKey>('/data_type_keys', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateIotDataTypeKey(
  dataTypeKeyId: string | number,
  payload: IotDataTypeKeyPayload
) {
  return iotFetch<IotDataTypeKey>(`/data_type_keys/${dataTypeKeyId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function deleteIotDataTypeKey(dataTypeKeyId: string | number) {
  return iotFetch<void>(`/data_type_keys/${dataTypeKeyId}`, {
    method: 'DELETE',
  })
}

export const useIotDataTypeKeysQuery = <TData = IotDataTypeKey[]>(
  {
    enabled = true,
  }: {
    enabled?: boolean
  } = {},
  options: UseCustomQueryOptions<IotDataTypeKey[], Error, TData> = {}
) =>
  useQuery<IotDataTypeKey[], Error, TData>({
    queryKey: iotDataTypeKeyKeys.list(),
    queryFn: ({ signal }) => getIotDataTypeKeys(signal),
    enabled,
    staleTime: 30 * 1000,
    ...options,
  })

export const useIotDataTypeKeyCreateMutation = ({
  onSuccess,
  ...options
}: Omit<
  UseCustomMutationOptions<IotDataTypeKey, Error, { payload: IotDataTypeKeyPayload }>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<IotDataTypeKey, Error, { payload: IotDataTypeKeyPayload }>({
    mutationFn: ({ payload }) => createIotDataTypeKey(payload),
    async onSuccess(data, variables, context) {
      await queryClient.invalidateQueries({
        queryKey: iotDataTypeKeyKeys.list(),
      })
      await onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useIotDataTypeKeyUpdateMutation = ({
  onSuccess,
  ...options
}: Omit<
  UseCustomMutationOptions<
    IotDataTypeKey,
    Error,
    { dataTypeKeyId: string | number; payload: IotDataTypeKeyPayload }
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<
    IotDataTypeKey,
    Error,
    { dataTypeKeyId: string | number; payload: IotDataTypeKeyPayload }
  >({
    mutationFn: ({ dataTypeKeyId, payload }) => updateIotDataTypeKey(dataTypeKeyId, payload),
    async onSuccess(data, variables, context) {
      await queryClient.invalidateQueries({
        queryKey: iotDataTypeKeyKeys.list(),
      })
      await onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useIotDataTypeKeyDeleteMutation = ({
  onSuccess,
  ...options
}: Omit<
  UseCustomMutationOptions<void, Error, { dataTypeKeyId: string | number }>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<void, Error, { dataTypeKeyId: string | number }>({
    mutationFn: ({ dataTypeKeyId }) => deleteIotDataTypeKey(dataTypeKeyId),
    async onSuccess(_data, variables, context) {
      await queryClient.invalidateQueries({
        queryKey: iotDataTypeKeyKeys.list(),
      })
      await onSuccess?.(_data, variables, context)
    },
    ...options,
  })
}
