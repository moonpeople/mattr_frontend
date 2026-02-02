import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { UseCustomMutationOptions, UseCustomQueryOptions } from 'types'
import { iotFetch } from './client'
import type { IotSensor } from './types'

export type IotSensorPayload = {
  data_type_key_id: string | number
  name?: string | null
  threshold_idle?: number | null
  threshold_shutdown?: number | null
}

export const iotSensorKeys = {
  listByDevice: (deviceId?: string | number) => ['iot', 'devices', deviceId, 'sensors'] as const,
}

export async function getIotSensors(deviceId: string | number, signal?: AbortSignal) {
  return iotFetch<IotSensor[]>(`/devices/${deviceId}/sensors`, { signal })
}

export async function createIotSensor(deviceId: string | number, payload: IotSensorPayload) {
  return iotFetch<IotSensor>(`/devices/${deviceId}/sensors`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateIotSensor(
  deviceId: string | number,
  sensorId: string | number,
  payload: IotSensorPayload
) {
  return iotFetch<IotSensor>(`/devices/${deviceId}/sensors/${sensorId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function deleteIotSensor(deviceId: string | number, sensorId: string | number) {
  return iotFetch<void>(`/devices/${deviceId}/sensors/${sensorId}`, {
    method: 'DELETE',
  })
}

export const useIotSensorsQuery = <TData = IotSensor[]>(
  {
    deviceId,
    enabled = true,
  }: {
    deviceId?: string | number
    enabled?: boolean
  } = {},
  options: UseCustomQueryOptions<IotSensor[], Error, TData> = {}
) =>
  useQuery<IotSensor[], Error, TData>({
    queryKey: iotSensorKeys.listByDevice(deviceId),
    queryFn: ({ signal }) => {
      if (deviceId === undefined || deviceId === null || deviceId === '') {
        throw new Error('Device id is required')
      }
      return getIotSensors(deviceId, signal)
    },
    enabled: enabled && deviceId !== undefined && deviceId !== null && deviceId !== '',
    staleTime: 15 * 1000,
    ...options,
  })

export const useIotSensorCreateMutation = ({
  onSuccess,
  ...options
}: Omit<
  UseCustomMutationOptions<IotSensor, Error, { deviceId: string | number; payload: IotSensorPayload }>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<IotSensor, Error, { deviceId: string | number; payload: IotSensorPayload }>(
    {
      mutationFn: ({ deviceId, payload }) => createIotSensor(deviceId, payload),
      async onSuccess(data, variables, context) {
        await queryClient.invalidateQueries({
          queryKey: iotSensorKeys.listByDevice(variables.deviceId),
        })
        await onSuccess?.(data, variables, context)
      },
      ...options,
    }
  )
}

export const useIotSensorUpdateMutation = ({
  onSuccess,
  ...options
}: Omit<
  UseCustomMutationOptions<
    IotSensor,
    Error,
    { deviceId: string | number; sensorId: string | number; payload: IotSensorPayload }
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<
    IotSensor,
    Error,
    { deviceId: string | number; sensorId: string | number; payload: IotSensorPayload }
  >({
    mutationFn: ({ deviceId, sensorId, payload }) => updateIotSensor(deviceId, sensorId, payload),
    async onSuccess(data, variables, context) {
      await queryClient.invalidateQueries({
        queryKey: iotSensorKeys.listByDevice(variables.deviceId),
      })
      await onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useIotSensorDeleteMutation = ({
  onSuccess,
  ...options
}: Omit<
  UseCustomMutationOptions<void, Error, { deviceId: string | number; sensorId: string | number }>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<void, Error, { deviceId: string | number; sensorId: string | number }>({
    mutationFn: ({ deviceId, sensorId }) => deleteIotSensor(deviceId, sensorId),
    async onSuccess(_data, variables, context) {
      await queryClient.invalidateQueries({
        queryKey: iotSensorKeys.listByDevice(variables.deviceId),
      })
      await onSuccess?.(_data, variables, context)
    },
    ...options,
  })
}
