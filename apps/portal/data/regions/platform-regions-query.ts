import { useQuery } from '@tanstack/react-query'

import { get, handleError } from 'data/fetchers'
import type { ResponseError, UseCustomQueryOptions } from 'types'
import { regionKeys } from './keys'

export type PlatformRegion = {
  id: string
  slug: string
  name: string
  enabled?: boolean
  internal_host?: string | null
  public_base_domain?: string | null
  public_protocol?: string | null
  public_port?: number | null
}

export type PlatformRegionsData = { regions: PlatformRegion[] }

export async function getPlatformRegions(signal?: AbortSignal): Promise<PlatformRegionsData> {
  const { data, error } = await (get as any)('/platform/regions', { signal })
  if (error) handleError(error)

  if (!data) return { regions: [] }
  if (Array.isArray(data)) return { regions: data as PlatformRegion[] }

  return data as PlatformRegionsData
}

export type PlatformRegionsError = ResponseError

export const usePlatformRegionsQuery = <TData = PlatformRegionsData>(
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<PlatformRegionsData, PlatformRegionsError, TData> = {}
) =>
  useQuery<PlatformRegionsData, PlatformRegionsError, TData>({
    queryKey: regionKeys.list(),
    queryFn: ({ signal }) => getPlatformRegions(signal),
    enabled,
    ...options,
  })
