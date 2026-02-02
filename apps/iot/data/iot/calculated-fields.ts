import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { UseCustomMutationOptions, UseCustomQueryOptions } from 'types'
import { iotFetch } from './client'
import type { IotCalculatedField } from './types'

export type IotCalculatedFieldPayload = {
  name: string
  type: string
  configuration_version: number
  configuration: Record<string, unknown>
  debug_settings?: Record<string, unknown> | null
  version?: number | null
}

export const iotCalculatedFieldKeys = {
  list: (modelId?: number | null) => ['iot', 'calculated-fields', modelId] as const,
}

export async function getIotCalculatedFields(modelId: number, signal?: AbortSignal) {
  return iotFetch<IotCalculatedField[]>(`/device_models/${modelId}/calculated_fields`, { signal })
}

export async function createIotCalculatedField(
  modelId: number,
  payload: IotCalculatedFieldPayload
) {
  return iotFetch<IotCalculatedField>(`/device_models/${modelId}/calculated_fields`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateIotCalculatedField(
  fieldId: number,
  payload: Partial<IotCalculatedFieldPayload>
) {
  return iotFetch<IotCalculatedField>(`/calculated_fields/${fieldId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function deleteIotCalculatedField(fieldId: number) {
  return iotFetch<void>(`/calculated_fields/${fieldId}`, {
    method: 'DELETE',
  })
}

export const useIotCalculatedFieldsQuery = <TData = IotCalculatedField[]>(
  modelId?: number | null,
  {
    enabled = true,
  }: {
    enabled?: boolean
  } = {},
  options: UseCustomQueryOptions<IotCalculatedField[], Error, TData> = {}
) =>
  useQuery<IotCalculatedField[], Error, TData>({
    queryKey: iotCalculatedFieldKeys.list(modelId ?? null),
    queryFn: ({ signal }) => {
      if (!modelId) return Promise.resolve([] as IotCalculatedField[])
      return getIotCalculatedFields(modelId, signal)
    },
    enabled: enabled && !!modelId,
    staleTime: 30 * 1000,
    ...options,
  })

export const useIotCalculatedFieldCreateMutation = ({
  onSuccess,
  ...options
}: Omit<
  UseCustomMutationOptions<
    IotCalculatedField,
    Error,
    { modelId: number; payload: IotCalculatedFieldPayload }
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<
    IotCalculatedField,
    Error,
    { modelId: number; payload: IotCalculatedFieldPayload }
  >({
    mutationFn: ({ modelId, payload }) => createIotCalculatedField(modelId, payload),
    async onSuccess(data, variables, context) {
      await queryClient.invalidateQueries({
        queryKey: iotCalculatedFieldKeys.list(variables.modelId),
      })
      await onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useIotCalculatedFieldUpdateMutation = ({
  onSuccess,
  ...options
}: Omit<
  UseCustomMutationOptions<
    IotCalculatedField,
    Error,
    { fieldId: number; modelId: number; payload: Partial<IotCalculatedFieldPayload> }
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<
    IotCalculatedField,
    Error,
    { fieldId: number; modelId: number; payload: Partial<IotCalculatedFieldPayload> }
  >({
    mutationFn: ({ fieldId, payload }) => updateIotCalculatedField(fieldId, payload),
    async onSuccess(data, variables, context) {
      await queryClient.invalidateQueries({
        queryKey: iotCalculatedFieldKeys.list(variables.modelId),
      })
      await onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useIotCalculatedFieldDeleteMutation = ({
  onSuccess,
  ...options
}: Omit<
  UseCustomMutationOptions<void, Error, { fieldId: number; modelId: number }>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<void, Error, { fieldId: number; modelId: number }>({
    mutationFn: ({ fieldId }) => deleteIotCalculatedField(fieldId),
    async onSuccess(_data, variables, context) {
      await queryClient.invalidateQueries({
        queryKey: iotCalculatedFieldKeys.list(variables.modelId),
      })
      await onSuccess?.(_data, variables, context)
    },
    ...options,
  })
}
