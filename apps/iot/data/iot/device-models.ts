import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { UseCustomMutationOptions, UseCustomQueryOptions } from 'types'
import { iotFetch } from './client'
import type { IotDeviceModel } from './types'

export type IotDeviceModelPayload = {
  name: string
  description?: string | null
  transport_type?: string | null
  transport_config?: Record<string, unknown> | null
  profile_config?: Record<string, unknown> | null
  provision_config?: Record<string, unknown> | null
  base_firmware_version?: string | null
  base_firmware_url?: string | null
  data_type_key_ids?: number[]
}

export const iotDeviceModelKeys = {
  list: () => ['iot', 'device-models'] as const,
}

export async function getIotDeviceModels(signal?: AbortSignal) {
  return iotFetch<IotDeviceModel[]>('/device_models', { signal })
}

export async function createIotDeviceModel(payload: IotDeviceModelPayload) {
  return iotFetch<IotDeviceModel>('/device_models', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateIotDeviceModel(
  modelId: string | number,
  payload: IotDeviceModelPayload
) {
  return iotFetch<IotDeviceModel>(`/device_models/${modelId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function deleteIotDeviceModel(modelId: string | number) {
  return iotFetch<void>(`/device_models/${modelId}`, {
    method: 'DELETE',
  })
}

export type IotDeviceModelTestMessagePayload = {
  name?: string | null
  headers?: Record<string, unknown> | string | null
  body?: unknown
  message_type?: string | null
}

export type IotDeviceModelTestPayload = {
  messages: IotDeviceModelTestMessagePayload[]
}

export type IotDeviceModelTestResult = {
  model_id: number
  protocol: string
  ingest_chain_id: number
  core_chain_id: number
  results: Array<{
    index: number
    message: {
      name?: string | null
      message_type?: string | null
      headers?: unknown
      body?: unknown
    }
    incoming?: {
      name?: string | null
      message_type?: string | null
      headers?: unknown
      body?: unknown
      source_ip?: string | null
    }
    adapter: {
      envelopes: unknown[]
      error?: unknown | null
    }
    ingest: Array<{
      env: unknown
      steps: number
      effects: unknown[]
      errors: unknown[]
      prepared: Record<string, unknown>
      outgoing_messages?: unknown[]
      core: Array<{
        kafka: unknown
        env: unknown
        steps: number
        effects: unknown[]
        errors: unknown[]
        prepared: Record<string, unknown>
        outgoing_messages?: unknown[]
      }>
    }>
    errors: unknown[]
  }>
}

export async function testIotDeviceModel(
  modelId: string | number,
  payload: IotDeviceModelTestPayload
) {
  return iotFetch<IotDeviceModelTestResult>(`/device_models/${modelId}/test`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export const useIotDeviceModelsQuery = <TData = IotDeviceModel[]>(
  {
    enabled = true,
  }: {
    enabled?: boolean
  } = {},
  options: UseCustomQueryOptions<IotDeviceModel[], Error, TData> = {}
) =>
  useQuery<IotDeviceModel[], Error, TData>({
    queryKey: iotDeviceModelKeys.list(),
    queryFn: ({ signal }) => getIotDeviceModels(signal),
    enabled,
    staleTime: 30 * 1000,
    ...options,
  })

export const useIotDeviceModelCreateMutation = ({
  onSuccess,
  ...options
}: Omit<
  UseCustomMutationOptions<IotDeviceModel, Error, { payload: IotDeviceModelPayload }>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<IotDeviceModel, Error, { payload: IotDeviceModelPayload }>({
    mutationFn: ({ payload }) => createIotDeviceModel(payload),
    async onSuccess(data, variables, context) {
      await queryClient.invalidateQueries({
        queryKey: iotDeviceModelKeys.list(),
      })
      await onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useIotDeviceModelUpdateMutation = ({
  onSuccess,
  ...options
}: Omit<
  UseCustomMutationOptions<
    IotDeviceModel,
    Error,
    { modelId: string | number; payload: IotDeviceModelPayload }
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<
    IotDeviceModel,
    Error,
    { modelId: string | number; payload: IotDeviceModelPayload }
  >({
    mutationFn: ({ modelId, payload }) => updateIotDeviceModel(modelId, payload),
    async onSuccess(data, variables, context) {
      await queryClient.invalidateQueries({
        queryKey: iotDeviceModelKeys.list(),
      })
      await onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useIotDeviceModelDeleteMutation = ({
  onSuccess,
  ...options
}: Omit<
  UseCustomMutationOptions<void, Error, { modelId: string | number }>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<void, Error, { modelId: string | number }>({
    mutationFn: ({ modelId }) => deleteIotDeviceModel(modelId),
    async onSuccess(_data, variables, context) {
      await queryClient.invalidateQueries({
        queryKey: iotDeviceModelKeys.list(),
      })
      await onSuccess?.(_data, variables, context)
    },
    ...options,
  })
}

export const useIotDeviceModelTestMutation = ({
  onSuccess,
  ...options
}: Omit<
  UseCustomMutationOptions<
    IotDeviceModelTestResult,
    Error,
    { modelId: string | number; payload: IotDeviceModelTestPayload }
  >,
  'mutationFn'
> = {}) => {
  return useMutation<
    IotDeviceModelTestResult,
    Error,
    { modelId: string | number; payload: IotDeviceModelTestPayload }
  >({
    mutationFn: ({ modelId, payload }) => testIotDeviceModel(modelId, payload),
    async onSuccess(data, variables, context) {
      await onSuccess?.(data, variables, context)
    },
    ...options,
  })
}
