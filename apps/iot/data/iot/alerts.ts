import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { UseCustomMutationOptions, UseCustomQueryOptions } from 'types'
import { iotFetch } from './client'
import type { IotDeviceAlert } from './types'

export type IotAlertQueryParams = {
  device_id?: string
  status?: string
  search_status?: string
  acknowledged?: string
  cleared?: string
  assignee_id?: string
  severity?: string
  type?: string
  limit?: string
  order?: 'asc' | 'desc'
}

export type IotAlertStatusPayload = {
  status?: string
  acknowledged?: boolean
  cleared?: boolean
  assignee_id?: string | null
}

export const iotAlertKeys = {
  base: () => ['iot', 'alerts'] as const,
  list: (params?: IotAlertQueryParams | null) => ['iot', 'alerts', params ?? null] as const,
  device: (deviceId?: number | string, params?: IotAlertQueryParams | null) =>
    ['iot', 'alerts', 'device', deviceId ?? null, params ?? null] as const,
  detail: (alertId?: number | string) => ['iot', 'alerts', alertId ?? null] as const,
}

export async function getIotAlerts(params?: IotAlertQueryParams | null, signal?: AbortSignal) {
  const search = new URLSearchParams()
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (!value) return
    search.set(key, value)
  })

  const query = search.toString()
  const path = query ? `/alerts?${query}` : '/alerts'

  return iotFetch<IotDeviceAlert[]>(path, { signal })
}

export async function getIotDeviceAlerts(
  deviceId: number | string,
  params?: IotAlertQueryParams | null,
  signal?: AbortSignal
) {
  const search = new URLSearchParams()
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (!value) return
    search.set(key, value)
  })

  const query = search.toString()
  const path = query ? `/devices/${deviceId}/alerts?${query}` : `/devices/${deviceId}/alerts`

  return iotFetch<IotDeviceAlert[]>(path, { signal })
}

export async function getIotAlert(alertId: number | string, signal?: AbortSignal) {
  return iotFetch<IotDeviceAlert>(`/alerts/${alertId}`, { signal })
}

export async function updateIotAlertStatus(alertId: number | string, payload: IotAlertStatusPayload) {
  return iotFetch<IotDeviceAlert>(`/alerts/${alertId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export const useIotAlertsQuery = <TData = IotDeviceAlert[]>(
  {
    params,
    enabled = true,
  }: {
    params?: IotAlertQueryParams | null
    enabled?: boolean
  } = {},
  options: UseCustomQueryOptions<IotDeviceAlert[], Error, TData> = {}
) =>
  useQuery<IotDeviceAlert[], Error, TData>({
    queryKey: iotAlertKeys.list(params ?? null),
    queryFn: ({ signal }) => getIotAlerts(params ?? null, signal),
    enabled,
    staleTime: 10 * 1000,
    ...options,
  })

export const useIotDeviceAlertsQuery = <TData = IotDeviceAlert[]>(
  {
    deviceId,
    params,
    enabled = true,
  }: {
    deviceId?: number | string
    params?: IotAlertQueryParams | null
    enabled?: boolean
  } = {},
  options: UseCustomQueryOptions<IotDeviceAlert[], Error, TData> = {}
) =>
  useQuery<IotDeviceAlert[], Error, TData>({
    queryKey: iotAlertKeys.device(deviceId, params ?? null),
    queryFn: ({ signal }) => {
      if (!deviceId) return Promise.resolve([])
      return getIotDeviceAlerts(deviceId, params ?? null, signal)
    },
    enabled: enabled && !!deviceId,
    staleTime: 10 * 1000,
    ...options,
  })

export const useIotAlertQuery = <TData = IotDeviceAlert | null>(
  alertId?: number | string,
  options: UseCustomQueryOptions<IotDeviceAlert | null, Error, TData> = {}
) =>
  useQuery<IotDeviceAlert | null, Error, TData>({
    queryKey: iotAlertKeys.detail(alertId),
    queryFn: ({ signal }) => {
      if (!alertId) return Promise.resolve(null)
      return getIotAlert(alertId, signal)
    },
    enabled: !!alertId,
    ...options,
  })

export const useIotAlertStatusMutation = ({
  onSuccess,
  ...options
}: Omit<
  UseCustomMutationOptions<IotDeviceAlert, Error, { alertId: string | number; payload: IotAlertStatusPayload }>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<IotDeviceAlert, Error, { alertId: string | number; payload: IotAlertStatusPayload }>({
    mutationFn: ({ alertId, payload }) => updateIotAlertStatus(alertId, payload),
    async onSuccess(data, variables, context) {
      await queryClient.invalidateQueries({ queryKey: iotAlertKeys.base() })
      await queryClient.invalidateQueries({ queryKey: iotAlertKeys.detail(variables.alertId) })
      await onSuccess?.(data, variables, context)
    },
    ...options,
  })
}
