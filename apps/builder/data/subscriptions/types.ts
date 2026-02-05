import type { components } from 'data/api'
import type { OrganizationDetail } from 'data/organizations/organization-query'

export type SubscriptionTier =
  | 'tier_free'
  | 'tier_pro'
  | 'tier_payg'
  | 'tier_team'
  | 'tier_enterprise'
  | 'tier_platform'

export type AddonVariantId = components['schemas']['UpdateAddonBody']['addon_variant']

export type OrgSubscription = {
  plan: OrganizationDetail['plan']
  usage_billing_enabled: boolean
  current_period_start?: number
  current_period_end?: number
  addons?: { supabase_prod_id: string }[]
}

export type ProjectAddon = components['schemas']['GetSubscriptionResponse']['project_addons'][0]

export type PlanId = OrganizationDetail['plan']['id']

export type OrgPlan = components['schemas']['PlansResponse']['plans'][0]

export type ProjectAddonType = components['schemas']['UpdateAddonBody']['addon_type']

export interface ProjectAddonVariantMeta {
  cpu_cores?: number
  cpu_dedicated?: boolean
  baseline_disk_io_mbs?: number
  max_disk_io_mbs?: number
  memory_gb?: number
  connections_direct?: number
  connections_pooler?: number
  backup_duration_days?: number
  supported_cloud_providers?: string[]
}

export type ProjectSelectedAddon =
  components['schemas']['ProjectAddonsResponse']['selected_addons'][0]
export type ProjectAvailableAddon =
  components['schemas']['ProjectAddonsResponse']['available_addons'][0]
