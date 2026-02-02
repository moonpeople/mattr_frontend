import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { UseCustomMutationOptions, UseCustomQueryOptions } from 'types'
import { iotFetch } from './client'
import type {
  IotGateway,
  IotGatewayConfig,
  IotGatewayConnector,
  IotGatewayDevice,
  IotGatewayLog,
} from './types'

export type IotGatewayPayload = {
  name: string
  serial_number: string
  description?: string | null
  firmware_version?: string | null
  receive_data?: boolean | null
}

export type IotGatewayConnectorPayload = {
  name: string
  type: string
  enabled?: boolean | null
  status?: string | null
  last_seen_at?: string | null
  config?: Record<string, unknown> | null
}

export type IotGatewayLogPayload = {
  connector_id?: number | null
  level?: string | null
  category?: string | null
  message: string
  payload?: Record<string, unknown> | null
}

export const iotGatewayKeys = {
  list: () => ['iot', 'gateways'] as const,
  detail: (gatewayId: string | number) => ['iot', 'gateways', gatewayId] as const,
  config: (gatewayId: string | number) => ['iot', 'gateways', gatewayId, 'config'] as const,
  connectors: (gatewayId: string | number) => ['iot', 'gateways', gatewayId, 'connectors'] as const,
  logs: (gatewayId: string | number) => ['iot', 'gateways', gatewayId, 'logs'] as const,
  devices: (gatewayId: string | number) => ['iot', 'gateways', gatewayId, 'devices'] as const,
}

export async function getIotGateways(signal?: AbortSignal) {
  return iotFetch<IotGateway[]>('/gateways', { signal })
}

export async function createIotGateway(payload: IotGatewayPayload) {
  return iotFetch<IotGateway>('/gateways', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateIotGateway(gatewayId: string | number, payload: IotGatewayPayload) {
  return iotFetch<IotGateway>(`/gateways/${gatewayId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function deleteIotGateway(gatewayId: string | number) {
  return iotFetch<void>(`/gateways/${gatewayId}`, {
    method: 'DELETE',
  })
}

export async function getIotGatewayConfig(gatewayId: string | number, signal?: AbortSignal) {
  return iotFetch<IotGatewayConfig>(`/gateways/${gatewayId}/config`, { signal })
}

export async function getIotGatewayDockerCompose(gatewayId: string | number) {
  return iotFetch<string>(
    `/device-connectivity/gateway-launch/${gatewayId}/docker-compose/download`,
    {
      headers: { Accept: 'application/octet-stream' },
    }
  )
}

export async function updateIotGatewayConfig(
  gatewayId: string | number,
  payload: Partial<IotGatewayConfig>
) {
  return iotFetch<IotGatewayConfig>(`/gateways/${gatewayId}/config`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export async function publishIotGatewayConfig(gatewayId: string | number) {
  return iotFetch<IotGatewayConfig>(`/gateways/${gatewayId}/config/publish`, {
    method: 'POST',
  })
}

export async function getIotGatewayTemplateConfig() {
  return iotFetch<Record<string, unknown>>('/gateways/templates/config')
}

export async function getIotGatewayConnectorTemplateTypes() {
  return iotFetch<string[]>('/gateways/templates/connectors')
}

export async function getIotGatewayConnectorTemplate(type: string) {
  return iotFetch<Record<string, unknown>>(`/gateways/templates/connectors/${type}`)
}

export async function getIotGatewayConnectors(
  gatewayId: string | number,
  signal?: AbortSignal
) {
  return iotFetch<IotGatewayConnector[]>(`/gateways/${gatewayId}/connectors`, { signal })
}

export async function createIotGatewayConnector(
  gatewayId: string | number,
  payload: IotGatewayConnectorPayload
) {
  return iotFetch<IotGatewayConnector>(`/gateways/${gatewayId}/connectors`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateIotGatewayConnector(
  gatewayId: string | number,
  connectorId: string | number,
  payload: Partial<IotGatewayConnectorPayload>
) {
  return iotFetch<IotGatewayConnector>(`/gateways/${gatewayId}/connectors/${connectorId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function deleteIotGatewayConnector(
  gatewayId: string | number,
  connectorId: string | number
) {
  return iotFetch<void>(`/gateways/${gatewayId}/connectors/${connectorId}`, {
    method: 'DELETE',
  })
}

export async function getIotGatewayLogs(
  gatewayId: string | number,
  params?: Record<string, string | number | undefined>,
  signal?: AbortSignal
) {
  const query = new URLSearchParams()
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query.set(key, String(value))
      }
    })
  }
  const suffix = query.toString() ? `?${query.toString()}` : ''
  return iotFetch<IotGatewayLog[]>(`/gateways/${gatewayId}/logs${suffix}`, { signal })
}

export async function getIotGatewayDevices(gatewayId: string | number, signal?: AbortSignal) {
  return iotFetch<IotGatewayDevice[]>(`/gateways/${gatewayId}/devices`, { signal })
}

export async function createIotGatewayLog(
  gatewayId: string | number,
  payload: IotGatewayLogPayload
) {
  return iotFetch<IotGatewayLog>(`/gateways/${gatewayId}/logs`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export const useIotGatewaysQuery = <TData = IotGateway[]>(
  {
    enabled = true,
  }: {
    enabled?: boolean
  } = {},
  options: UseCustomQueryOptions<IotGateway[], Error, TData> = {}
) =>
  useQuery<IotGateway[], Error, TData>({
    queryKey: iotGatewayKeys.list(),
    queryFn: ({ signal }) => getIotGateways(signal),
    enabled,
    staleTime: 10 * 1000,
    ...options,
  })

export const useIotGatewayQuery = <TData = IotGateway>(
  gatewayId: string | number,
  options: UseCustomQueryOptions<IotGateway, Error, TData> = {}
) =>
  useQuery<IotGateway, Error, TData>({
    queryKey: iotGatewayKeys.detail(gatewayId),
    queryFn: ({ signal }) => iotFetch<IotGateway>(`/gateways/${gatewayId}`, { signal }),
    enabled: !!gatewayId,
    staleTime: 10 * 1000,
    ...options,
  })

export const useIotGatewayCreateMutation = ({
  onSuccess,
  ...options
}: Omit<
  UseCustomMutationOptions<IotGateway, Error, { payload: IotGatewayPayload }>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<IotGateway, Error, { payload: IotGatewayPayload }>({
    mutationFn: ({ payload }) => createIotGateway(payload),
    async onSuccess(data, variables, context) {
      await queryClient.invalidateQueries({ queryKey: iotGatewayKeys.list() })
      await onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useIotGatewayUpdateMutation = ({
  onSuccess,
  ...options
}: Omit<
  UseCustomMutationOptions<IotGateway, Error, { gatewayId: string | number; payload: IotGatewayPayload }>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<IotGateway, Error, { gatewayId: string | number; payload: IotGatewayPayload }>(
    {
      mutationFn: ({ gatewayId, payload }) => updateIotGateway(gatewayId, payload),
      async onSuccess(data, variables, context) {
        await queryClient.invalidateQueries({ queryKey: iotGatewayKeys.list() })
        await queryClient.invalidateQueries({ queryKey: iotGatewayKeys.detail(variables.gatewayId) })
        await onSuccess?.(data, variables, context)
      },
      ...options,
    }
  )
}

export const useIotGatewayDeleteMutation = ({
  onSuccess,
  ...options
}: Omit<
  UseCustomMutationOptions<void, Error, { gatewayId: string | number }>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<void, Error, { gatewayId: string | number }>({
    mutationFn: ({ gatewayId }) => deleteIotGateway(gatewayId),
    async onSuccess(data, variables, context) {
      await queryClient.invalidateQueries({ queryKey: iotGatewayKeys.list() })
      await onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useIotGatewayConfigQuery = <TData = IotGatewayConfig>(
  gatewayId: string | number,
  options: UseCustomQueryOptions<IotGatewayConfig, Error, TData> = {}
) =>
  useQuery<IotGatewayConfig, Error, TData>({
    queryKey: iotGatewayKeys.config(gatewayId),
    queryFn: ({ signal }) => getIotGatewayConfig(gatewayId, signal),
    enabled: !!gatewayId,
    ...options,
  })

export const useIotGatewayConfigMutation = ({
  onSuccess,
  ...options
}: Omit<
  UseCustomMutationOptions<
    IotGatewayConfig,
    Error,
    { gatewayId: string | number; payload: Partial<IotGatewayConfig> }
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<
    IotGatewayConfig,
    Error,
    { gatewayId: string | number; payload: Partial<IotGatewayConfig> }
  >({
    mutationFn: ({ gatewayId, payload }) => updateIotGatewayConfig(gatewayId, payload),
    async onSuccess(data, variables, context) {
      await queryClient.invalidateQueries({ queryKey: iotGatewayKeys.config(variables.gatewayId) })
      await onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useIotGatewayConfigPublishMutation = ({
  onSuccess,
  ...options
}: Omit<
  UseCustomMutationOptions<IotGatewayConfig, Error, { gatewayId: string | number }>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<IotGatewayConfig, Error, { gatewayId: string | number }>({
    mutationFn: ({ gatewayId }) => publishIotGatewayConfig(gatewayId),
    async onSuccess(data, variables, context) {
      await queryClient.invalidateQueries({ queryKey: iotGatewayKeys.config(variables.gatewayId) })
      await onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useIotGatewayConnectorsQuery = <TData = IotGatewayConnector[]>(
  gatewayId: string | number,
  options: UseCustomQueryOptions<IotGatewayConnector[], Error, TData> = {}
) =>
  useQuery<IotGatewayConnector[], Error, TData>({
    queryKey: iotGatewayKeys.connectors(gatewayId),
    queryFn: ({ signal }) => getIotGatewayConnectors(gatewayId, signal),
    enabled: !!gatewayId,
    ...options,
  })

export const useIotGatewayConnectorCreateMutation = ({
  onSuccess,
  ...options
}: Omit<
  UseCustomMutationOptions<
    IotGatewayConnector,
    Error,
    { gatewayId: string | number; payload: IotGatewayConnectorPayload }
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<
    IotGatewayConnector,
    Error,
    { gatewayId: string | number; payload: IotGatewayConnectorPayload }
  >({
    mutationFn: ({ gatewayId, payload }) => createIotGatewayConnector(gatewayId, payload),
    async onSuccess(data, variables, context) {
      await queryClient.invalidateQueries({
        queryKey: iotGatewayKeys.connectors(variables.gatewayId),
      })
      await onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useIotGatewayConnectorUpdateMutation = ({
  onSuccess,
  ...options
}: Omit<
  UseCustomMutationOptions<
    IotGatewayConnector,
    Error,
    {
      gatewayId: string | number
      connectorId: string | number
      payload: Partial<IotGatewayConnectorPayload>
    }
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<
    IotGatewayConnector,
    Error,
    {
      gatewayId: string | number
      connectorId: string | number
      payload: Partial<IotGatewayConnectorPayload>
    }
  >({
    mutationFn: ({ gatewayId, connectorId, payload }) =>
      updateIotGatewayConnector(gatewayId, connectorId, payload),
    async onSuccess(data, variables, context) {
      await queryClient.invalidateQueries({
        queryKey: iotGatewayKeys.connectors(variables.gatewayId),
      })
      await onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useIotGatewayConnectorDeleteMutation = ({
  onSuccess,
  ...options
}: Omit<
  UseCustomMutationOptions<void, Error, { gatewayId: string | number; connectorId: string | number }>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<void, Error, { gatewayId: string | number; connectorId: string | number }>({
    mutationFn: ({ gatewayId, connectorId }) => deleteIotGatewayConnector(gatewayId, connectorId),
    async onSuccess(data, variables, context) {
      await queryClient.invalidateQueries({
        queryKey: iotGatewayKeys.connectors(variables.gatewayId),
      })
      await onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useIotGatewayLogsQuery = <TData = IotGatewayLog[]>(
  gatewayId: string | number,
  params?: Record<string, string | number | undefined>,
  options: UseCustomQueryOptions<IotGatewayLog[], Error, TData> = {}
) =>
  useQuery<IotGatewayLog[], Error, TData>({
    queryKey: [...iotGatewayKeys.logs(gatewayId), params] as const,
    queryFn: ({ signal }) => getIotGatewayLogs(gatewayId, params, signal),
    enabled: !!gatewayId,
    ...options,
  })

export const useIotGatewayDevicesQuery = <TData = IotGatewayDevice[]>(
  gatewayId: string | number,
  options: UseCustomQueryOptions<IotGatewayDevice[], Error, TData> = {}
) =>
  useQuery<IotGatewayDevice[], Error, TData>({
    queryKey: iotGatewayKeys.devices(gatewayId),
    queryFn: ({ signal }) => getIotGatewayDevices(gatewayId, signal),
    enabled: !!gatewayId,
    ...options,
  })

export const useIotGatewayLogCreateMutation = ({
  onSuccess,
  ...options
}: Omit<
  UseCustomMutationOptions<
    IotGatewayLog,
    Error,
    { gatewayId: string | number; payload: IotGatewayLogPayload }
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<IotGatewayLog, Error, { gatewayId: string | number; payload: IotGatewayLogPayload }>(
    {
      mutationFn: ({ gatewayId, payload }) => createIotGatewayLog(gatewayId, payload),
      async onSuccess(data, variables, context) {
        await queryClient.invalidateQueries({
          queryKey: iotGatewayKeys.logs(variables.gatewayId),
        })
        await onSuccess?.(data, variables, context)
      },
      ...options,
    }
  )
}
