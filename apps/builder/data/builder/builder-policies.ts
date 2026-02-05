import { useQuery } from '@tanstack/react-query'

import type { ResponseError, UseCustomQueryOptions } from 'types'
import { builderRequest } from './builder-client'
import { builderKeys } from './keys'

export type BuilderPoliciesResponse = {
  policies: string[]
}

export async function listBuilderPolicies(signal?: AbortSignal) {
  const payload = await builderRequest<BuilderPoliciesResponse>('/policies', { signal })
  return payload.policies
}

export const useBuilderPoliciesQuery = <TData = string[]>(
  options: UseCustomQueryOptions<string[], ResponseError, TData> = {}
) => {
  return useQuery<string[], ResponseError, TData>({
    queryKey: builderKeys.policies(),
    queryFn: ({ signal }) => listBuilderPolicies(signal),
    ...options,
  })
}
