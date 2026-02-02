import { useMutation } from '@tanstack/react-query'

import type { UseCustomMutationOptions } from 'types'
import { iotFetch } from './client'

export type IotClickhouseSqlRunPayload = {
  sql: string
  params?: Record<string, unknown> | string | null
}

export async function runIotClickhouseSql(sql: string, apiKey?: string, params?: Record<string, unknown> | string | null) {
  const headers: Record<string, string> = {}
  if (apiKey) headers['X-API-Key'] = apiKey

  return iotFetch<any[]>('/clickhouse/sql/run', {
    method: 'POST',
    body: JSON.stringify({ sql, params }),
    headers,
  })
}

export const useIotClickhouseSqlRunMutation = ({
  onSuccess,
  ...options
}: Omit<
  UseCustomMutationOptions<any[], Error, { sql: string; apiKey?: string; params?: Record<string, unknown> | string | null }>,
  'mutationFn'
> = {}) =>
  useMutation<any[], Error, { sql: string; apiKey?: string; params?: Record<string, unknown> | string | null }>({
    mutationFn: ({ sql, apiKey, params }) => runIotClickhouseSql(sql, apiKey, params),
    onSuccess,
    ...options,
  })
