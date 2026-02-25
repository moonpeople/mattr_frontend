import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { components } from 'api-types'
import { handleError, patch } from 'data/fetchers'
import type { ResponseError, UseCustomMutationOptions } from 'types'
import { configKeys } from './keys'

type IotDashboardSettingsBody =
  components['schemas']['IotDashboardSettingsBody']

export type ProjectIotDashboardSettingsUpdateVariables = {
  projectRef: string
  accessMode: 'basic' | 'portal' | 'hybrid'
  dashboardHost?: string
  dashboardPortalHost?: string
}

export async function updateProjectIotDashboardSettings({
  projectRef,
  accessMode,
  dashboardHost,
  dashboardPortalHost,
}: ProjectIotDashboardSettingsUpdateVariables) {
  if (!projectRef) throw new Error('projectRef is required')

  const normalizedDashboardHost = dashboardHost?.trim()
  const normalizedDashboardPortalHost = dashboardPortalHost?.trim()

  const body: IotDashboardSettingsBody = {
    iot_dashboard: {
      dashboard_access_mode: accessMode,
      dashboard_host: normalizedDashboardHost || undefined,
      dashboard_portal_host: normalizedDashboardPortalHost || undefined,
    },
  }

  const { data, error } = await patch(
    '/platform/projects/{ref}/settings/iot-dashboard',
    {
      params: { path: { ref: projectRef } },
      body,
    }
  )

  if (error) handleError(error)
  return data
}

type ProjectIotDashboardSettingsUpdateData = Awaited<
  ReturnType<typeof updateProjectIotDashboardSettings>
>

export const useProjectIotDashboardSettingsUpdateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<
    ProjectIotDashboardSettingsUpdateData,
    ResponseError,
    ProjectIotDashboardSettingsUpdateVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<
    ProjectIotDashboardSettingsUpdateData,
    ResponseError,
    ProjectIotDashboardSettingsUpdateVariables
  >({
    mutationFn: (vars) => updateProjectIotDashboardSettings(vars),
    async onSuccess(data, variables, context) {
      const { projectRef } = variables
      await queryClient.invalidateQueries({
        queryKey: configKeys.settingsV2(projectRef),
      })
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to update IoT dashboard settings: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
