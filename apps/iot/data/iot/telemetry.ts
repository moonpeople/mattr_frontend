import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { UseCustomMutationOptions, UseCustomQueryOptions } from 'types'
import { iotFetch } from './client'

export type IotTelemetryRow = {
  device_id: number
  sensor_id?: number | null
  data_type_key_id?: number | null
  data_key?: string | null
  protocol?: string | null
  ts?: string
  ingest_ts?: string
  value_float?: number | null
  value_int?: number | null
  value_string?: string | null
  value_bool?: number | null
  value_json?: string | null
  raw_value?: string | null
}

export type IotTelemetryRollupRow = {
  window_start: string
  count?: number | null
  min?: number | null
  max?: number | null
  sum?: number | null
  avg?: number | null
}

export type IotTelemetryQueryParams = {
  device_id?: string
  serial_number?: string
  sensor_id?: string
  data_type_key_id?: string
  data_key?: string
  from?: string
  to?: string
  limit?: string
  order?: 'asc' | 'desc'
}

export type IotTelemetryRollupParams = IotTelemetryQueryParams & {
  interval?: '1s' | '10s' | '1m' | '6m' | '10m' | '1h'
}

export type IotTelemetryDeletePayload = {
  data_type_key_id: string
  from: string
  to: string
}

export type IotTelemetryDeleteResult = {
  status: string
  request_id?: string
  tables: string[]
}

export type IotTelemetryDeleteMutationStatus = {
  database?: string
  table?: string
  mutation_id?: string
  command?: string
  create_time?: string
  is_done?: number
  parts_to_do?: number
}

export type IotTelemetryDeleteStatusResult = {
  request_id: string
  mutations: IotTelemetryDeleteMutationStatus[]
}

export const iotTelemetryKeys = {
  raw: (apiKey?: string, params?: IotTelemetryQueryParams | null) =>
    ['iot', 'telemetry', 'raw', apiKey, params] as const,
  rollup: (apiKey?: string, params?: IotTelemetryRollupParams | null) =>
    ['iot', 'telemetry', 'rollup', apiKey, params] as const,
  deleteStatus: (deviceId?: number | string, requestId?: string) =>
    ['iot', 'telemetry', 'delete-status', deviceId, requestId] as const,
}

export async function getIotTelemetryRaw(
  apiKey: string | null | undefined,
  params: IotTelemetryQueryParams,
  signal?: AbortSignal
) {
  const search = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (!value) return
    search.set(key, value)
  })

  const query = search.toString()
  const path = query ? `/telemetry/raw?${query}` : '/telemetry/raw'

  const headers = apiKey ? { 'X-API-Key': apiKey } : undefined

  return iotFetch<IotTelemetryRow[]>(path, {
    signal,
    headers,
  })
}

export async function getIotTelemetryRollup(
  apiKey: string | null | undefined,
  params: IotTelemetryRollupParams,
  signal?: AbortSignal
) {
  const search = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (!value) return
    search.set(key, value)
  })

  const query = search.toString()
  const path = query ? `/telemetry/rollup?${query}` : '/telemetry/rollup'

  const headers = apiKey ? { 'X-API-Key': apiKey } : undefined

  return iotFetch<IotTelemetryRollupRow[]>(path, {
    signal,
    headers,
  })
}

export async function deleteIotDeviceTelemetry(
  deviceId: string | number,
  payload: IotTelemetryDeletePayload
) {
  return iotFetch<IotTelemetryDeleteResult>(`/devices/${deviceId}/telemetry/delete`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function getIotDeviceTelemetryDeleteStatus(
  deviceId: string | number,
  requestId: string,
  signal?: AbortSignal
) {
  const query = new URLSearchParams()
  query.set('request_id', requestId)
  return iotFetch<IotTelemetryDeleteStatusResult>(
    `/devices/${deviceId}/telemetry/delete/status?${query.toString()}`,
    { signal }
  )
}

export const useIotTelemetryRawQuery = <TData = IotTelemetryRow[]>(
  {
    apiKey,
    params,
    enabled = true,
  }: {
    apiKey?: string
    params?: IotTelemetryQueryParams | null
    enabled?: boolean
  } = {},
  options: UseCustomQueryOptions<IotTelemetryRow[], Error, TData> = {}
) =>
  useQuery<IotTelemetryRow[], Error, TData>({
    queryKey: iotTelemetryKeys.raw(apiKey, params ?? null),
    queryFn: ({ signal }) => {
      if (!params) throw new Error('Query parameters are required')
      return getIotTelemetryRaw(apiKey, params, signal)
    },
    enabled: enabled && !!params,
    staleTime: 5 * 1000,
    ...options,
  })

export const useIotTelemetryRollupQuery = <TData = IotTelemetryRollupRow[]>(
  {
    apiKey,
    params,
    enabled = true,
  }: {
    apiKey?: string
    params?: IotTelemetryRollupParams | null
    enabled?: boolean
  } = {},
  options: UseCustomQueryOptions<IotTelemetryRollupRow[], Error, TData> = {}
) =>
  useQuery<IotTelemetryRollupRow[], Error, TData>({
    queryKey: iotTelemetryKeys.rollup(apiKey, params ?? null),
    queryFn: ({ signal }) => {
      if (!params) throw new Error('Query parameters are required')
      return getIotTelemetryRollup(apiKey, params, signal)
    },
    enabled: enabled && !!params,
    staleTime: 5 * 1000,
    ...options,
  })

export const useIotTelemetryDeleteStatusQuery = <TData = IotTelemetryDeleteStatusResult>(
  {
    deviceId,
    requestId,
    enabled = true,
  }: {
    deviceId?: number | string
    requestId?: string
    enabled?: boolean
  } = {},
  options: UseCustomQueryOptions<IotTelemetryDeleteStatusResult, Error, TData> = {}
) =>
  useQuery<IotTelemetryDeleteStatusResult, Error, TData>({
    queryKey: iotTelemetryKeys.deleteStatus(deviceId, requestId),
    queryFn: ({ signal }) => {
      if (!deviceId || !requestId) throw new Error('Request id is required')
      return getIotDeviceTelemetryDeleteStatus(deviceId, requestId, signal)
    },
    enabled: enabled && !!deviceId && !!requestId,
    staleTime: 5 * 1000,
    ...options,
  })

export const useIotTelemetryDeleteMutation = ({
  onSuccess,
  ...options
}: Omit<
  UseCustomMutationOptions<
    IotTelemetryDeleteResult,
    Error,
    { deviceId: string | number; payload: IotTelemetryDeletePayload }
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<
    IotTelemetryDeleteResult,
    Error,
    { deviceId: string | number; payload: IotTelemetryDeletePayload }
  >({
    mutationFn: ({ deviceId, payload }) => deleteIotDeviceTelemetry(deviceId, payload),
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({ queryKey: ['iot', 'telemetry'] })
      if (onSuccess) await onSuccess(...args)
    },
    ...options,
  })
}
