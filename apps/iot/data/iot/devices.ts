import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { UseCustomMutationOptions, UseCustomQueryOptions } from 'types'
import { iotFetch } from './client'
import type { IotDevice, IotDeviceCredential } from './types'

export type IotDevicePayload = {
  name: string
  serial_number: string
  model_id?: string | number | null
  gateway_id?: string | number | null
  is_gateway?: boolean | null
  description?: string | null
  firmware_version?: string | null
  software_version?: string | null
  receive_data?: boolean | null
  transport_config?: Record<string, unknown> | null
}

export type IotDeviceCredentialPayload = {
  auth_type?: string
  key_id?: string | null
  config?: Record<string, unknown> | null
  status?: string | null
}

export const iotDeviceKeys = {
  list: () => ['iot', 'devices'] as const,
  credentials: (deviceId: string | number) =>
    ['iot', 'devices', deviceId, 'credentials'] as const,
}

export async function getIotDevices(signal?: AbortSignal) {
  return iotFetch<IotDevice[]>('/devices', { signal })
}

export async function createIotDevice(payload: IotDevicePayload) {
  return iotFetch<IotDevice>('/devices', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function createIotDeviceCredential(
  deviceId: string | number,
  payload: IotDeviceCredentialPayload
) {
  return iotFetch<IotDeviceCredential>(`/devices/${deviceId}/credentials`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function getIotDeviceCredentials(
  deviceId: string | number,
  signal?: AbortSignal
) {
  return iotFetch<IotDeviceCredential[]>(`/devices/${deviceId}/credentials`, { signal })
}

export async function updateIotDevice(deviceId: string | number, payload: IotDevicePayload) {
  return iotFetch<IotDevice>(`/devices/${deviceId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function deleteIotDevice(deviceId: string | number) {
  return iotFetch<void>(`/devices/${deviceId}`, {
    method: 'DELETE',
  })
}

export const useIotDevicesQuery = <TData = IotDevice[]>(
  {
    enabled = true,
  }: {
    enabled?: boolean
  } = {},
  options: UseCustomQueryOptions<IotDevice[], Error, TData> = {}
) =>
  useQuery<IotDevice[], Error, TData>({
    queryKey: iotDeviceKeys.list(),
    queryFn: ({ signal }) => getIotDevices(signal),
    enabled,
    staleTime: 10 * 1000,
    ...options,
  })

export const useIotDeviceCreateMutation = ({
  onSuccess,
  ...options
}: Omit<
  UseCustomMutationOptions<IotDevice, Error, { payload: IotDevicePayload }>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<IotDevice, Error, { payload: IotDevicePayload }>({
    mutationFn: ({ payload }) => createIotDevice(payload),
    async onSuccess(data, variables, context) {
      await queryClient.invalidateQueries({
        queryKey: iotDeviceKeys.list(),
      })
      await onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useIotDeviceCredentialCreateMutation = ({
  onSuccess,
  ...options
}: Omit<
  UseCustomMutationOptions<
    IotDeviceCredential,
    Error,
    { deviceId: string | number; payload: IotDeviceCredentialPayload }
  >,
  'mutationFn'
> = {}) => {
  return useMutation<
    IotDeviceCredential,
    Error,
    { deviceId: string | number; payload: IotDeviceCredentialPayload }
  >({
    mutationFn: ({ deviceId, payload }) => createIotDeviceCredential(deviceId, payload),
    async onSuccess(data, variables, context) {
      await onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useIotDeviceCredentialsQuery = <TData = IotDeviceCredential[]>(
  {
    deviceId,
    enabled = true,
  }: {
    deviceId: string | number
    enabled?: boolean
  },
  options: UseCustomQueryOptions<IotDeviceCredential[], Error, TData> = {}
) =>
  useQuery<IotDeviceCredential[], Error, TData>({
    queryKey: iotDeviceKeys.credentials(deviceId),
    queryFn: ({ signal }) => getIotDeviceCredentials(deviceId, signal),
    enabled: enabled && !!deviceId,
    staleTime: 10 * 1000,
    ...options,
  })

export const useIotDeviceUpdateMutation = ({
  onSuccess,
  ...options
}: Omit<
  UseCustomMutationOptions<IotDevice, Error, { deviceId: string | number; payload: IotDevicePayload }>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<IotDevice, Error, { deviceId: string | number; payload: IotDevicePayload }>({
    mutationFn: ({ deviceId, payload }) => updateIotDevice(deviceId, payload),
    async onSuccess(data, variables, context) {
      await queryClient.invalidateQueries({
        queryKey: iotDeviceKeys.list(),
      })
      await onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useIotDeviceDeleteMutation = ({
  onSuccess,
  ...options
}: Omit<UseCustomMutationOptions<void, Error, { deviceId: string | number }>, 'mutationFn'> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<void, Error, { deviceId: string | number }>({
    mutationFn: ({ deviceId }) => deleteIotDevice(deviceId),
    async onSuccess(_data, variables, context) {
      await queryClient.invalidateQueries({
        queryKey: iotDeviceKeys.list(),
      })
      await onSuccess?.(_data, variables, context)
    },
    ...options,
  })
}
