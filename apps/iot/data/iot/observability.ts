import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { UseCustomQueryOptions } from 'types'
import { iotFetch } from './client'

export type IotObservabilitySummary = {
  kafka_messages_last_hour: number
  kafka_errors_last_hour: number
  rule_steps_last_hour: number
  last_batch?: IotBatchEvent | null
  storage?: {
    last_ingest_ts?: string | null
    telemetry_last_hour?: number | null
  } | null
}

export type IotBatchEvent = {
  ts?: string
  status?: string | null
  message_count?: number | null
  row_count?: number | null
  duration_ms?: number | null
  error_message?: string | null
}

export type IotIngestError = {
  ts?: string
  device_id?: number | null
  protocol?: string | null
  error_type?: string | null
  error_message?: string | null
}

export type IotRuleStep = {
  ts?: string
  rule_chain_id?: number | null
  node_index?: number | null
  node_type?: string | null
  status?: string | null
  outputs?: number | null
  relations?: string[] | null
  effects?: string[] | null
  depth?: number | null
  error_message?: string | null
}

export type IotRuleLog = {
  ts?: string
  device_id?: number | null
  rule_chain_id?: number | null
  node_index?: number | null
  node_type?: string | null
  label?: string | null
  message?: string | null
}

export type IotRuleAlarm = {
  ts?: string
  device_id?: number | null
  rule_chain_id?: number | null
  node_index?: number | null
  node_type?: string | null
  action?: string | null
  alarm_type?: string | null
  severity?: string | null
  status?: string | null
  message?: string | null
  details?: string | null
  alert_id?: number | null
  start_ts_ms?: number | null
  end_ts_ms?: number | null
}

export type IotFailedMessage = {
  ts?: string
  stage?: string | null
  device_id?: number | null
  protocol?: string | null
  message_type?: string | null
  error_type?: string | null
  error_message?: string | null
  payload?: string | null
  raw_payload?: string | null
}

export type IotUnknownDevice = {
  lookup_key?: string | null
  device_id?: number | null
  device_id_raw?: string | null
  serial_number?: string | null
  protocol?: string | null
  adapter?: string | null
  model_id?: number | null
  device_key_id?: string | null
  first_seen_at?: string | null
  last_seen_at?: string | null
  seen_count?: number | null
  last_payload?: Record<string, unknown> | null
  last_raw_payload?: string | null
  last_headers?: Record<string, unknown> | null
  last_error?: string | null
  last_message_type?: string | null
  last_source_ip?: string | null
}

export const iotObservabilityKeys = {
  summary: () => ['iot', 'observability', 'summary'] as const,
  ingestErrors: (limit?: number | string) =>
    ['iot', 'observability', 'ingest-errors', limit] as const,
  ruleSteps: (limit?: number | string) =>
    ['iot', 'observability', 'rule-steps', limit] as const,
  ruleLogs: (limit?: number | string, deviceId?: number | string, ruleChainId?: number | string) =>
    ['iot', 'observability', 'rule-logs', limit, deviceId, ruleChainId] as const,
  ruleAlarms: (
    limit?: number | string,
    deviceId?: number | string,
    ruleChainId?: number | string,
    action?: string,
    alarmType?: string
  ) => ['iot', 'observability', 'rule-alarms', limit, deviceId, ruleChainId, action, alarmType] as const,
  batchEvents: (limit?: number | string) =>
    ['iot', 'observability', 'batch-events', limit] as const,
  failedMessages: (limit?: number | string, stage?: string) =>
    ['iot', 'observability', 'failed-messages', limit, stage] as const,
  unknownDevices: (limit?: number | string, offset?: number | string) =>
    ['iot', 'observability', 'unknown-devices', limit, offset] as const,
}

export async function getIotObservabilitySummary(signal?: AbortSignal) {
  return iotFetch<IotObservabilitySummary>('/observability/summary', { signal })
}

export async function getIotObservabilityIngestErrors(limit: number | string, signal?: AbortSignal) {
  const query = new URLSearchParams()
  if (limit) query.set('limit', String(limit))
  const suffix = query.toString()
  return iotFetch<IotIngestError[]>(
    `/observability/ingest-errors${suffix ? `?${suffix}` : ''}`,
    { signal }
  )
}

export async function getIotObservabilityRuleSteps(limit: number | string, signal?: AbortSignal) {
  const query = new URLSearchParams()
  if (limit) query.set('limit', String(limit))
  const suffix = query.toString()
  return iotFetch<IotRuleStep[]>(
    `/observability/rule-steps${suffix ? `?${suffix}` : ''}`,
    { signal }
  )
}

export async function getIotObservabilityRuleLogs(
  limit: number | string,
  {
    deviceId,
    ruleChainId,
  }: { deviceId?: number | string; ruleChainId?: number | string } = {},
  signal?: AbortSignal
) {
  const query = new URLSearchParams()
  if (limit) query.set('limit', String(limit))
  if (deviceId) query.set('device_id', String(deviceId))
  if (ruleChainId) query.set('rule_chain_id', String(ruleChainId))
  const suffix = query.toString()
  return iotFetch<IotRuleLog[]>(
    `/observability/rule-logs${suffix ? `?${suffix}` : ''}`,
    { signal }
  )
}

export async function getIotObservabilityRuleAlarms(
  limit: number | string,
  {
    deviceId,
    ruleChainId,
    action,
    alarmType,
  }: {
    deviceId?: number | string
    ruleChainId?: number | string
    action?: string
    alarmType?: string
  } = {},
  signal?: AbortSignal
) {
  const query = new URLSearchParams()
  if (limit) query.set('limit', String(limit))
  if (deviceId) query.set('device_id', String(deviceId))
  if (ruleChainId) query.set('rule_chain_id', String(ruleChainId))
  if (action) query.set('action', action)
  if (alarmType) query.set('alarm_type', alarmType)
  const suffix = query.toString()
  return iotFetch<IotRuleAlarm[]>(
    `/observability/rule-alarms${suffix ? `?${suffix}` : ''}`,
    { signal }
  )
}

export async function getIotObservabilityBatchEvents(limit: number | string, signal?: AbortSignal) {
  const query = new URLSearchParams()
  if (limit) query.set('limit', String(limit))
  const suffix = query.toString()
  return iotFetch<IotBatchEvent[]>(
    `/observability/batch-events${suffix ? `?${suffix}` : ''}`,
    { signal }
  )
}

export async function getIotObservabilityFailedMessages(
  limit: number | string,
  stage?: string,
  signal?: AbortSignal
) {
  const query = new URLSearchParams()
  if (limit) query.set('limit', String(limit))
  if (stage) query.set('stage', stage)
  const suffix = query.toString()
  return iotFetch<IotFailedMessage[]>(
    `/observability/failed-messages${suffix ? `?${suffix}` : ''}`,
    { signal }
  )
}

export async function deleteIotUnknownDevice(lookupKey: string) {
  return iotFetch<void>(`/observability/unknown-devices/${encodeURIComponent(lookupKey)}`, {
    method: 'DELETE',
  })
}

export async function getIotObservabilityUnknownDevices(
  limit: number | string,
  offset: number | string,
  signal?: AbortSignal
) {
  const query = new URLSearchParams()
  if (limit) query.set('limit', String(limit))
  if (offset) query.set('offset', String(offset))
  const suffix = query.toString()
  return iotFetch<IotUnknownDevice[]>(
    `/observability/unknown-devices${suffix ? `?${suffix}` : ''}`,
    { signal }
  )
}

export const useIotObservabilitySummaryQuery = <TData = IotObservabilitySummary>(
  options: UseCustomQueryOptions<IotObservabilitySummary, Error, TData> = {}
) =>
  useQuery<IotObservabilitySummary, Error, TData>({
    queryKey: iotObservabilityKeys.summary(),
    queryFn: ({ signal }) => getIotObservabilitySummary(signal),
    staleTime: 10 * 1000,
    ...options,
  })

export const useIotObservabilityIngestErrorsQuery = <TData = IotIngestError[]>(
  {
    limit = 50,
    enabled = true,
  }: { limit?: number | string; enabled?: boolean } = {},
  options: UseCustomQueryOptions<IotIngestError[], Error, TData> = {}
) =>
  useQuery<IotIngestError[], Error, TData>({
    queryKey: iotObservabilityKeys.ingestErrors(limit),
    queryFn: ({ signal }) => getIotObservabilityIngestErrors(limit, signal),
    enabled,
    staleTime: 10 * 1000,
    ...options,
  })

export const useIotObservabilityRuleStepsQuery = <TData = IotRuleStep[]>(
  {
    limit = 100,
    enabled = true,
  }: { limit?: number | string; enabled?: boolean } = {},
  options: UseCustomQueryOptions<IotRuleStep[], Error, TData> = {}
) =>
  useQuery<IotRuleStep[], Error, TData>({
    queryKey: iotObservabilityKeys.ruleSteps(limit),
    queryFn: ({ signal }) => getIotObservabilityRuleSteps(limit, signal),
    enabled,
    staleTime: 10 * 1000,
    ...options,
  })

export const useIotObservabilityRuleLogsQuery = <TData = IotRuleLog[]>(
  {
    limit = 50,
    deviceId,
    ruleChainId,
    enabled = true,
  }: {
    limit?: number | string
    deviceId?: number | string
    ruleChainId?: number | string
    enabled?: boolean
  } = {},
  options: UseCustomQueryOptions<IotRuleLog[], Error, TData> = {}
) =>
  useQuery<IotRuleLog[], Error, TData>({
    queryKey: iotObservabilityKeys.ruleLogs(limit, deviceId, ruleChainId),
    queryFn: ({ signal }) =>
      getIotObservabilityRuleLogs(limit, { deviceId, ruleChainId }, signal),
    enabled,
    staleTime: 10 * 1000,
    ...options,
  })

export const useIotObservabilityRuleAlarmsQuery = <TData = IotRuleAlarm[]>(
  {
    limit = 50,
    deviceId,
    ruleChainId,
    action,
    alarmType,
    enabled = true,
  }: {
    limit?: number | string
    deviceId?: number | string
    ruleChainId?: number | string
    action?: string
    alarmType?: string
    enabled?: boolean
  } = {},
  options: UseCustomQueryOptions<IotRuleAlarm[], Error, TData> = {}
) =>
  useQuery<IotRuleAlarm[], Error, TData>({
    queryKey: iotObservabilityKeys.ruleAlarms(limit, deviceId, ruleChainId, action, alarmType),
    queryFn: ({ signal }) =>
      getIotObservabilityRuleAlarms(
        limit,
        { deviceId, ruleChainId, action, alarmType },
        signal
      ),
    enabled,
    staleTime: 10 * 1000,
    ...options,
  })

export const useIotObservabilityBatchEventsQuery = <TData = IotBatchEvent[]>(
  {
    limit = 20,
    enabled = true,
  }: { limit?: number | string; enabled?: boolean } = {},
  options: UseCustomQueryOptions<IotBatchEvent[], Error, TData> = {}
) =>
  useQuery<IotBatchEvent[], Error, TData>({
    queryKey: iotObservabilityKeys.batchEvents(limit),
    queryFn: ({ signal }) => getIotObservabilityBatchEvents(limit, signal),
    enabled,
    staleTime: 10 * 1000,
    ...options,
  })

export const useIotObservabilityFailedMessagesQuery = <TData = IotFailedMessage[]>(
  {
    limit = 50,
    stage,
    enabled = true,
  }: { limit?: number | string; stage?: string; enabled?: boolean } = {},
  options: UseCustomQueryOptions<IotFailedMessage[], Error, TData> = {}
) =>
  useQuery<IotFailedMessage[], Error, TData>({
    queryKey: iotObservabilityKeys.failedMessages(limit, stage),
    queryFn: ({ signal }) => getIotObservabilityFailedMessages(limit, stage, signal),
    enabled,
    staleTime: 10 * 1000,
    ...options,
  })

export const useIotObservabilityUnknownDevicesQuery = <TData = IotUnknownDevice[]>(
  {
    limit = 50,
    offset = 0,
    enabled = true,
  }: { limit?: number | string; offset?: number | string; enabled?: boolean } = {},
  options: UseCustomQueryOptions<IotUnknownDevice[], Error, TData> = {}
) =>
  useQuery<IotUnknownDevice[], Error, TData>({
    queryKey: iotObservabilityKeys.unknownDevices(limit, offset),
    queryFn: ({ signal }) => getIotObservabilityUnknownDevices(limit, offset, signal),
    enabled,
    staleTime: 10 * 1000,
    ...options,
  })

export const useIotUnknownDeviceDeleteMutation = ({
  onSuccess,
  ...options
}: Omit<
  UseCustomMutationOptions<void, Error, { lookupKey: string }>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<void, Error, { lookupKey: string }>({
    mutationFn: ({ lookupKey }) => deleteIotUnknownDevice(lookupKey),
    async onSuccess(data, variables, context) {
      await queryClient.invalidateQueries({ queryKey: iotObservabilityKeys.unknownDevices() })
      await onSuccess?.(data, variables, context)
    },
    ...options,
  })
}
