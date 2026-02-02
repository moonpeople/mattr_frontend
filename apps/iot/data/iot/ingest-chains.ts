import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { UseCustomMutationOptions, UseCustomQueryOptions } from 'types'
import { iotFetch } from './client'
import type { IotIngestChain, IotIngestChainMetadata, IotRuleChainTemplate } from './types'

export type IotIngestChainPayload = {
  name: string
  description?: string | null
  model_id?: number | null
  type?: string | null
}

export type IotIngestChainMetadataPayload = {
  version?: number | null
  metadata?: Record<string, unknown> | null
}

export type IotIngestChainTestPayload = {
  protocol?: string
  headers?: Record<string, string>
  body?: string | Record<string, unknown> | unknown[]
  message_type?: string | null
  source_ip?: string | null
}

export type IotIngestChainTestResult = {
  protocol?: string
  envelopes?: unknown[]
  results?: Array<{
    env?: unknown
    steps?: number
    effects?: unknown[]
    errors?: unknown[]
    prepared?: Record<string, unknown>
    outgoing_messages?: unknown[]
  }>
}

const normalizeIngestChainId = (value: number | string | undefined | null) => {
  if (value === undefined || value === null) return undefined
  const trimmed = String(value).trim()
  if (!trimmed || trimmed === 'undefined' || trimmed === 'null') return undefined
  return trimmed
}

export const ingestChainsKeys = {
  list: () => ['iot', 'ingest-chains'] as const,
  detail: (ingestChainId: number | string) => ['iot', 'ingest-chains', ingestChainId] as const,
  metadata: (ingestChainId: number | string) =>
    ['iot', 'ingest-chains', ingestChainId, 'metadata'] as const,
  templates: () => ['iot', 'ingest-chains', 'templates'] as const,
}

export async function getIotIngestChains(signal?: AbortSignal) {
  return iotFetch<IotIngestChain[]>('/ingest_chains', { signal })
}

export async function getIotIngestChain(ingestChainId: number | string, signal?: AbortSignal) {
  const normalizedId = normalizeIngestChainId(ingestChainId)
  if (!normalizedId) throw new Error('Ingest chain id is required')
  return iotFetch<IotIngestChain>(`/ingest_chains/${normalizedId}`, { signal })
}

export async function getIotIngestChainTemplates(signal?: AbortSignal) {
  return iotFetch<IotRuleChainTemplate[]>('/ingest_chains/templates', { signal })
}

export async function createIotIngestChain(payload: IotIngestChainPayload) {
  return iotFetch<IotIngestChain>('/ingest_chains', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateIotIngestChain(
  ingestChainId: string | number,
  payload: IotIngestChainPayload
) {
  const normalizedId = normalizeIngestChainId(ingestChainId)
  if (!normalizedId) throw new Error('Ingest chain id is required')
  return iotFetch<IotIngestChain>(`/ingest_chains/${normalizedId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function deleteIotIngestChain(ingestChainId: string | number) {
  const normalizedId = normalizeIngestChainId(ingestChainId)
  if (!normalizedId) throw new Error('Ingest chain id is required')
  return iotFetch<void>(`/ingest_chains/${normalizedId}`, { method: 'DELETE' })
}

export async function getIotIngestChainMetadata(
  ingestChainId: string | number,
  signal?: AbortSignal
) {
  const normalizedId = normalizeIngestChainId(ingestChainId)
  if (!normalizedId) throw new Error('Ingest chain id is required')
  return iotFetch<IotIngestChainMetadata>(`/ingest_chains/${normalizedId}/metadata`, { signal })
}

export async function saveIotIngestChainMetadata(
  ingestChainId: string | number,
  payload: IotIngestChainMetadataPayload
) {
  const normalizedId = normalizeIngestChainId(ingestChainId)
  if (!normalizedId) throw new Error('Ingest chain id is required')
  return iotFetch<IotIngestChainMetadata>(`/ingest_chains/${normalizedId}/metadata`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function testIotIngestChain(
  ingestChainId: string | number,
  payload: IotIngestChainTestPayload
) {
  const normalizedId = normalizeIngestChainId(ingestChainId)
  if (!normalizedId) throw new Error('Ingest chain id is required')
  return iotFetch<IotIngestChainTestResult>(`/ingest_chains/${normalizedId}/test`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function useIotIngestChainsQuery(options: UseCustomQueryOptions<IotIngestChain[]> = {}) {
  return useQuery<IotIngestChain[]>({
    queryKey: ingestChainsKeys.list(),
    queryFn: ({ signal }) => getIotIngestChains(signal),
    ...options,
  })
}

export function useIotIngestChainTemplatesQuery(
  options: UseCustomQueryOptions<IotRuleChainTemplate[]> = {}
) {
  return useQuery<IotRuleChainTemplate[]>({
    queryKey: ingestChainsKeys.templates(),
    queryFn: ({ signal }) => getIotIngestChainTemplates(signal),
    staleTime: 30 * 1000,
    ...options,
  })
}

export function useIotIngestChainQuery(
  ingestChainId: number | string | undefined,
  options: UseCustomQueryOptions<IotIngestChain> = {}
) {
  const normalizedId = normalizeIngestChainId(ingestChainId)
  return useQuery<IotIngestChain>({
    queryKey: ingestChainsKeys.detail(normalizedId ?? 'unknown'),
    queryFn: ({ signal }) => getIotIngestChain(normalizedId ?? '', signal),
    enabled: !!normalizedId,
    ...options,
  })
}

export function useIotIngestChainCreateMutation(
  options: UseCustomMutationOptions<IotIngestChain, Error, { payload: IotIngestChainPayload }> = {}
) {
  const queryClient = useQueryClient()

  return useMutation<IotIngestChain, Error, { payload: IotIngestChainPayload }>({
    mutationFn: ({ payload }) => createIotIngestChain(payload),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ingestChainsKeys.list() })
      options.onSuccess?.(...args)
    },
    ...options,
  })
}

export function useIotIngestChainUpdateMutation(
  options: UseCustomMutationOptions<
    IotIngestChain,
    Error,
    { ingestChainId: string | number; payload: IotIngestChainPayload }
  > = {}
) {
  const queryClient = useQueryClient()

  return useMutation<
    IotIngestChain,
    Error,
    { ingestChainId: string | number; payload: IotIngestChainPayload }
  >({
    mutationFn: ({ ingestChainId, payload }) => updateIotIngestChain(ingestChainId, payload),
    onSuccess: (data, variables, ctx) => {
      queryClient.invalidateQueries({ queryKey: ingestChainsKeys.list() })
      queryClient.invalidateQueries({ queryKey: ingestChainsKeys.detail(variables.ingestChainId) })
      options.onSuccess?.(data, variables, ctx)
    },
    ...options,
  })
}

export function useIotIngestChainDeleteMutation(
  options: UseCustomMutationOptions<void, Error, { ingestChainId: string | number }> = {}
) {
  const queryClient = useQueryClient()

  return useMutation<void, Error, { ingestChainId: string | number }>({
    mutationFn: ({ ingestChainId }) => deleteIotIngestChain(ingestChainId),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ingestChainsKeys.list() })
      options.onSuccess?.(...args)
    },
    ...options,
  })
}

export function useIotIngestChainMetadataQuery(
  ingestChainId: number | string | undefined,
  options: UseCustomQueryOptions<IotIngestChainMetadata> = {}
) {
  const normalizedId = normalizeIngestChainId(ingestChainId)
  return useQuery<IotIngestChainMetadata>({
    queryKey: ingestChainsKeys.metadata(normalizedId ?? 'unknown'),
    queryFn: ({ signal }) => getIotIngestChainMetadata(normalizedId ?? '', signal),
    enabled: !!normalizedId,
    ...options,
  })
}

export function useIotIngestChainMetadataMutation(
  options: UseCustomMutationOptions<
    IotIngestChainMetadata,
    Error,
    { ingestChainId: string | number; payload: IotIngestChainMetadataPayload }
  > = {}
) {
  const queryClient = useQueryClient()

  return useMutation<
    IotIngestChainMetadata,
    Error,
    { ingestChainId: string | number; payload: IotIngestChainMetadataPayload }
  >({
    mutationFn: ({ ingestChainId, payload }) => saveIotIngestChainMetadata(ingestChainId, payload),
    onSuccess: (data, variables, ctx) => {
      queryClient.invalidateQueries({ queryKey: ingestChainsKeys.metadata(variables.ingestChainId) })
      options.onSuccess?.(data, variables, ctx)
    },
    ...options,
  })
}

export function useIotIngestChainTestMutation(
  options: UseCustomMutationOptions<
    IotIngestChainTestResult,
    Error,
    { ingestChainId: string | number; payload: IotIngestChainTestPayload }
  > = {}
) {
  return useMutation<
    IotIngestChainTestResult,
    Error,
    { ingestChainId: string | number; payload: IotIngestChainTestPayload }
  >({
    mutationFn: ({ ingestChainId, payload }) => testIotIngestChain(ingestChainId, payload),
    ...options,
  })
}
