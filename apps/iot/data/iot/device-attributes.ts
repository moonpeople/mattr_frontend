import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { UseCustomMutationOptions, UseCustomQueryOptions } from 'types'
import { iotFetch } from './client'
import type { IotDeviceAttribute } from './types'

export type IotDeviceAttributePayload = {
  scope?: string | null
  attributes: Record<string, unknown>
}

export const iotDeviceAttributeKeys = {
  list: (deviceId: string | number, scope?: string | null) =>
    ['iot', 'devices', deviceId, 'attributes', scope ?? 'all'] as const,
}

export async function getIotDeviceAttributes(
  deviceId: string | number,
  scope?: string | null,
  signal?: AbortSignal
) {
  const params = new URLSearchParams()
  if (scope) params.set('scope', scope)
  const query = params.toString()
  return iotFetch<IotDeviceAttribute[]>(
    `/devices/${deviceId}/attributes${query ? `?${query}` : ''}`,
    { signal }
  )
}

export async function upsertIotDeviceAttributes(
  deviceId: string | number,
  payload: IotDeviceAttributePayload
) {
  return iotFetch<{ device_id: number; scope: string; attributes: Record<string, unknown> }>(
    `/devices/${deviceId}/attributes`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  )
}

export const useIotDeviceAttributesQuery = <TData = IotDeviceAttribute[]>(
  {
    deviceId,
    scope,
    enabled = true,
  }: {
    deviceId: string | number
    scope?: string | null
    enabled?: boolean
  },
  options: UseCustomQueryOptions<IotDeviceAttribute[], Error, TData> = {}
) =>
  useQuery<IotDeviceAttribute[], Error, TData>({
    queryKey: iotDeviceAttributeKeys.list(deviceId, scope ?? null),
    queryFn: ({ signal }) => getIotDeviceAttributes(deviceId, scope ?? null, signal),
    enabled: enabled && !!deviceId,
    staleTime: 10 * 1000,
    ...options,
  })

export const useIotDeviceAttributesUpsertMutation = ({
  onSuccess,
  ...options
}: Omit<
  UseCustomMutationOptions<
    { device_id: number; scope: string; attributes: Record<string, unknown> },
    Error,
    { deviceId: string | number; payload: IotDeviceAttributePayload }
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<
    { device_id: number; scope: string; attributes: Record<string, unknown> },
    Error,
    { deviceId: string | number; payload: IotDeviceAttributePayload }
  >({
    mutationFn: ({ deviceId, payload }) => upsertIotDeviceAttributes(deviceId, payload),
    async onSuccess(data, variables, context) {
      await queryClient.invalidateQueries({
        queryKey: iotDeviceAttributeKeys.list(variables.deviceId, variables.payload.scope ?? null),
      })
      await onSuccess?.(data, variables, context)
    },
    ...options,
  })
}
