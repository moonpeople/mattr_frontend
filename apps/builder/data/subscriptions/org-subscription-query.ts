import { useQuery } from '@tanstack/react-query'

import type { ResponseError, UseCustomQueryOptions } from 'types'
import { getOrganization } from 'data/organizations/organization-query'
import type { OrgSubscription } from './types'
import { subscriptionKeys } from './keys'

export type OrgSubscriptionVariables = {
  orgSlug?: string
}

export async function getOrgSubscription(
  { orgSlug }: OrgSubscriptionVariables,
  signal?: AbortSignal
) {
  if (!orgSlug) throw new Error('orgSlug is required')

  const org = await getOrganization({ slug: orgSlug }, signal)
  const subscription: OrgSubscription = {
    plan: org.plan,
    usage_billing_enabled: org.usage_billing_enabled,
  }

  return subscription
}

export type OrgSubscriptionData = Awaited<ReturnType<typeof getOrgSubscription>>
export type OrgSubscriptionError = ResponseError

export const useOrgSubscriptionQuery = <TData = OrgSubscriptionData>(
  { orgSlug }: OrgSubscriptionVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<OrgSubscriptionData, OrgSubscriptionError, TData> = {}
) => {
  return useQuery<OrgSubscriptionData, OrgSubscriptionError, TData>({
    queryKey: subscriptionKeys.orgSubscription(orgSlug),
    queryFn: ({ signal }) => getOrgSubscription({ orgSlug }, signal),
    enabled: enabled && typeof orgSlug !== 'undefined',
    staleTime: 60 * 60 * 1000,
    ...options,
  })
}

export const useHasAccessToProjectLevelPermissions = (slug: string) => {
  const { data: subscription } = useOrgSubscriptionQuery({ orgSlug: slug })
  return (
    subscription?.plan.id === 'enterprise' ||
    subscription?.plan.id === 'team' ||
    subscription?.plan.id === 'platform'
  )
}
