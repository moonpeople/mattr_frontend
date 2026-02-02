import { useQuery } from '@tanstack/react-query'

import type { UseCustomQueryOptions } from 'types'
import { iotFetch } from './client'
import type { IotDeviceCommand } from './types'

export type IotDeviceCommandsParams = {
  status?: string
  limit?: number
  offset?: number
}

export const iotDeviceCommandKeys = {
  list: (deviceId: number | string, params?: IotDeviceCommandsParams) =>
    ['iot', 'device-commands', deviceId, params] as const,
}

export async function getIotDeviceCommands(
  deviceId: number | string,
  params: IotDeviceCommandsParams = {},
  signal?: AbortSignal
) {
  const query = new URLSearchParams()
  if (params.status) query.set('status', params.status)
  if (params.limit) query.set('limit', String(params.limit))
  if (params.offset) query.set('offset', String(params.offset))

  const queryString = query.toString()
  const url = queryString
    ? `/devices/${deviceId}/commands?${queryString}`
    : `/devices/${deviceId}/commands`

  return iotFetch<IotDeviceCommand[]>(url, { signal })
}

export const useIotDeviceCommandsQuery = <TData = IotDeviceCommand[]>(
  deviceId: number | string | null,
  params: IotDeviceCommandsParams = {},
  options: UseCustomQueryOptions<IotDeviceCommand[], Error, TData> = {}
) =>
  useQuery<IotDeviceCommand[], Error, TData>({
    queryKey: iotDeviceCommandKeys.list(deviceId ?? 'none', params),
    queryFn: ({ signal }) => getIotDeviceCommands(deviceId as number | string, params, signal),
    enabled: !!deviceId,
    staleTime: 10 * 1000,
    ...options,
  })
