import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { components } from 'data/api'
import { handleError, post } from 'data/fetchers'
import { PROVIDERS } from 'lib/constants'
import { captureCriticalError } from 'lib/error-reporting'
import type { ResponseError, UseCustomMutationOptions } from 'types'
import { DesiredInstanceSize, PostgresEngine, ReleaseChannel } from './new-project.constants'
import { useInvalidateProjectsInfiniteQuery } from './org-projects-infinite-query'

type CreateProjectBody = components['schemas']['CreateProjectBody']
type CloudProvider = CreateProjectBody['cloud_provider']

export type ProjectCreateVariables = {
  name: string
  organizationSlug: string
  dbPass?: string
  projectType?: 'base' | 'iot'
  iotDashboardAccessMode?: 'basic' | 'portal' | 'hybrid'
  iotDashboardHost?: string
  iotDashboardPortalHost?: string
  dbRegion?: string
  regionSelection?: CreateProjectBody['region_selection']
  dbSql?: string
  dbPricingTierId?: string
  cloudProvider?: string
  authSiteUrl?: string
  customSupabaseRequest?: CreateProjectBody['custom_supabase_internal_requests']
  dbInstanceSize?: DesiredInstanceSize
  dataApiExposedSchemas?: string[]
  dataApiUseApiSchema?: boolean
  postgresEngine?: PostgresEngine
  releaseChannel?: ReleaseChannel
}

export async function createProject({
  name,
  organizationSlug,
  dbPass,
  projectType,
  iotDashboardAccessMode,
  iotDashboardHost,
  iotDashboardPortalHost,
  dbRegion,
  regionSelection,
  dbSql,
  cloudProvider = PROVIDERS.AWS.id,
  authSiteUrl,
  customSupabaseRequest,
  dbInstanceSize,
  dataApiExposedSchemas,
  dataApiUseApiSchema,
  postgresEngine,
  releaseChannel,
}: ProjectCreateVariables) {
  const normalizedIotDashboardHost = iotDashboardHost?.trim()
  const normalizedIotDashboardPortalHost = iotDashboardPortalHost?.trim()

  const body: CreateProjectBody & {
    project_type?: 'base' | 'iot'
    iot_dashboard_access_mode?: 'basic' | 'portal' | 'hybrid'
    iot_dashboard_host?: string
    iot_dashboard_portal_host?: string
  } = {
    cloud_provider: cloudProvider as CloudProvider,
    organization_slug: organizationSlug,
    name,
    ...(projectType ? { project_type: projectType } : {}),
    ...(dbPass !== undefined ? { db_pass: dbPass } : {}),
    db_region: dbRegion,
    region_selection: regionSelection,
    db_sql: dbSql,
    auth_site_url: authSiteUrl,
    ...(customSupabaseRequest !== undefined
      ? { custom_supabase_internal_requests: customSupabaseRequest }
      : {}),
    desired_instance_size: dbInstanceSize,
    data_api_exposed_schemas: dataApiExposedSchemas,
    data_api_use_api_schema: dataApiUseApiSchema,
    postgres_engine: postgresEngine,
    release_channel: releaseChannel,
    ...(projectType === 'iot' && iotDashboardAccessMode
      ? { iot_dashboard_access_mode: iotDashboardAccessMode }
      : {}),
    ...(projectType === 'iot' && normalizedIotDashboardHost
      ? { iot_dashboard_host: normalizedIotDashboardHost }
      : {}),
    ...(projectType === 'iot' && normalizedIotDashboardPortalHost
      ? { iot_dashboard_portal_host: normalizedIotDashboardPortalHost }
      : {}),
  }

  const { data, error } = await post(`/platform/projects`, {
    body,
  })

  if (error) handleError(error)
  return data
}

type ProjectCreateData = Awaited<ReturnType<typeof createProject>>

export const useProjectCreateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<ProjectCreateData, ResponseError, ProjectCreateVariables>,
  'mutationFn'
> = {}) => {
  const { invalidateProjectsQuery } = useInvalidateProjectsInfiniteQuery()

  return useMutation<ProjectCreateData, ResponseError, ProjectCreateVariables>({
    mutationFn: (vars) => createProject(vars),
    async onSuccess(data, variables, context) {
      await invalidateProjectsQuery()
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to create new project: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
      captureCriticalError(data, 'create project')
    },
    ...options,
  })
}
