import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { UseCustomMutationOptions, UseCustomQueryOptions } from 'types'
import { iotFetch } from './client'
import type { IotRuleChain, IotRuleChainMetadata, IotRuleChainTemplate } from './types'

export type IotRuleChainPayload = {
  name: string
  description?: string | null
  model_id?: number | null
  type?: string | null
}

export type IotRuleChainMetadataPayload = {
  version?: number | null
  metadata?: Record<string, unknown> | null
}

export type IotRuleChainTestPayload = {
  protocol?: string
  headers?: Record<string, string>
  body?: string | Record<string, unknown> | unknown[]
  message_type?: string | null
  source_ip?: string | null
}

export type IotRuleChainTestResult = {
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

export const iotRuleChainKeys = {
  list: () => ['iot', 'rule-chains'] as const,
  detail: (ruleChainId: number | string) => ['iot', 'rule-chains', ruleChainId] as const,
  metadata: (ruleChainId: number | string) =>
    ['iot', 'rule-chains', ruleChainId, 'metadata'] as const,
  templates: (type?: string) => ['iot', 'rule-chains', 'templates', type ?? 'core'] as const,
}

export async function getIotRuleChains(signal?: AbortSignal) {
  return iotFetch<IotRuleChain[]>('/rule_chains', { signal })
}

export async function getIotRuleChain(ruleChainId: number | string, signal?: AbortSignal) {
  return iotFetch<IotRuleChain>(`/rule_chains/${ruleChainId}`, { signal })
}

export async function getIotRuleChainTemplates(type = 'core', signal?: AbortSignal) {
  const query = type ? `?type=${encodeURIComponent(type)}` : ''
  return iotFetch<IotRuleChainTemplate[]>(`/rule_chains/templates${query}`, { signal })
}

export async function createIotRuleChain(payload: IotRuleChainPayload) {
  return iotFetch<IotRuleChain>('/rule_chains', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function createIotDefaultRuleChain(payload: IotRuleChainPayload) {
  return iotFetch<IotRuleChain>('/rule_chains/default', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateIotRuleChain(
  ruleChainId: string | number,
  payload: IotRuleChainPayload
) {
  return iotFetch<IotRuleChain>(`/rule_chains/${ruleChainId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function deleteIotRuleChain(ruleChainId: string | number) {
  return iotFetch<void>(`/rule_chains/${ruleChainId}`, { method: 'DELETE' })
}

export async function getIotRuleChainMetadata(ruleChainId: string | number, signal?: AbortSignal) {
  return iotFetch<IotRuleChainMetadata>(`/rule_chains/${ruleChainId}/metadata`, { signal })
}

export async function saveIotRuleChainMetadata(
  ruleChainId: string | number,
  payload: IotRuleChainMetadataPayload
) {
  return iotFetch<IotRuleChainMetadata>(`/rule_chains/${ruleChainId}/metadata`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function testIotRuleChain(
  ruleChainId: string | number,
  payload: IotRuleChainTestPayload
) {
  return iotFetch<IotRuleChainTestResult>(`/rule_chains/${ruleChainId}/test`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export const useIotRuleChainsQuery = <TData = IotRuleChain[]>(
  {
    enabled = true,
  }: {
    enabled?: boolean
  } = {},
  options: UseCustomQueryOptions<IotRuleChain[], Error, TData> = {}
) =>
  useQuery<IotRuleChain[], Error, TData>({
    queryKey: iotRuleChainKeys.list(),
    queryFn: ({ signal }) => getIotRuleChains(signal),
    enabled,
    staleTime: 30 * 1000,
    ...options,
  })

export const useIotRuleChainTemplatesQuery = <TData = IotRuleChainTemplate[]>(
  type = 'core',
  options: UseCustomQueryOptions<IotRuleChainTemplate[], Error, TData> = {}
) =>
  useQuery<IotRuleChainTemplate[], Error, TData>({
    queryKey: iotRuleChainKeys.templates(type),
    queryFn: ({ signal }) => getIotRuleChainTemplates(type, signal),
    staleTime: 30 * 1000,
    ...options,
  })

export const useIotRuleChainQuery = <TData = IotRuleChain | null>(
  ruleChainId?: number | string,
  options: UseCustomQueryOptions<IotRuleChain | null, Error, TData> = {}
) =>
  useQuery<IotRuleChain | null, Error, TData>({
    queryKey: ruleChainId ? iotRuleChainKeys.detail(ruleChainId) : ['iot', 'rule-chains', 'detail'],
    queryFn: ({ signal }) => {
      if (!ruleChainId) return Promise.resolve(null)
      return getIotRuleChain(ruleChainId, signal)
    },
    enabled: !!ruleChainId,
    ...options,
  })

export const useIotRuleChainCreateMutation = ({
  onSuccess,
  ...options
}: Omit<
  UseCustomMutationOptions<IotRuleChain, Error, { payload: IotRuleChainPayload }>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<IotRuleChain, Error, { payload: IotRuleChainPayload }>({
    mutationFn: ({ payload }) => createIotRuleChain(payload),
    async onSuccess(data, variables, context) {
      await queryClient.invalidateQueries({ queryKey: iotRuleChainKeys.list() })
      await onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useIotRuleChainCreateDefaultMutation = ({
  onSuccess,
  ...options
}: Omit<
  UseCustomMutationOptions<IotRuleChain, Error, { payload: IotRuleChainPayload }>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<IotRuleChain, Error, { payload: IotRuleChainPayload }>({
    mutationFn: ({ payload }) => createIotDefaultRuleChain(payload),
    async onSuccess(data, variables, context) {
      await queryClient.invalidateQueries({ queryKey: iotRuleChainKeys.list() })
      await onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useIotRuleChainUpdateMutation = ({
  onSuccess,
  ...options
}: Omit<
  UseCustomMutationOptions<
    IotRuleChain,
    Error,
    { ruleChainId: string | number; payload: IotRuleChainPayload }
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<IotRuleChain, Error, { ruleChainId: string | number; payload: IotRuleChainPayload }>({
    mutationFn: ({ ruleChainId, payload }) => updateIotRuleChain(ruleChainId, payload),
    async onSuccess(data, variables, context) {
      await queryClient.invalidateQueries({ queryKey: iotRuleChainKeys.list() })
      await onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useIotRuleChainDeleteMutation = ({
  onSuccess,
  ...options
}: Omit<
  UseCustomMutationOptions<void, Error, { ruleChainId: string | number }>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<void, Error, { ruleChainId: string | number }>({
    mutationFn: ({ ruleChainId }) => deleteIotRuleChain(ruleChainId),
    async onSuccess(data, variables, context) {
      await queryClient.invalidateQueries({ queryKey: iotRuleChainKeys.list() })
      await onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useIotRuleChainMetadataQuery = <TData = IotRuleChainMetadata | null>(
  ruleChainId?: number | string,
  options: UseCustomQueryOptions<IotRuleChainMetadata | null, Error, TData> = {}
) =>
  useQuery<IotRuleChainMetadata | null, Error, TData>({
    queryKey: ruleChainId ? iotRuleChainKeys.metadata(ruleChainId) : ['iot', 'rule-chains', 'metadata'],
    queryFn: ({ signal }) => {
      if (!ruleChainId) return Promise.resolve(null)
      return getIotRuleChainMetadata(ruleChainId, signal)
    },
    enabled: !!ruleChainId,
    ...options,
  })

export const useIotRuleChainMetadataMutation = ({
  onSuccess,
  ...options
}: Omit<
  UseCustomMutationOptions<
    IotRuleChainMetadata,
    Error,
    { ruleChainId: string | number; payload: IotRuleChainMetadataPayload }
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<
    IotRuleChainMetadata,
    Error,
    { ruleChainId: string | number; payload: IotRuleChainMetadataPayload }
  >({
    mutationFn: ({ ruleChainId, payload }) => saveIotRuleChainMetadata(ruleChainId, payload),
    async onSuccess(data, variables, context) {
      await queryClient.invalidateQueries({
        queryKey: iotRuleChainKeys.metadata(variables.ruleChainId),
      })
      await onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useIotRuleChainTestMutation = ({
  ...options
}: Omit<
  UseCustomMutationOptions<
    IotRuleChainTestResult,
    Error,
    { ruleChainId: string | number; payload: IotRuleChainTestPayload }
  >,
  'mutationFn'
> = {}) => {
  return useMutation<
    IotRuleChainTestResult,
    Error,
    { ruleChainId: string | number; payload: IotRuleChainTestPayload }
  >({
    mutationFn: ({ ruleChainId, payload }) => testIotRuleChain(ruleChainId, payload),
    ...options,
  })
}
