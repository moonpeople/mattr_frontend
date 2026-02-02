import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { UseCustomMutationOptions, UseCustomQueryOptions } from 'types'
import { iotFetch } from './client'
import type { IotInstanceSettings } from './types'

export type IotInstanceSettingsPayload = Partial<
  Pick<
    IotInstanceSettings,
    | 'require_device_key'
    | 'require_project_key'
    | 'require_api_key'
    | 'provision_on_ingest'
    | 'allow_missing_device_id'
    | 'global_api_key'
    | 'encryption_key'
  >
>

export const iotInstanceSettingsKeys = {
  root: () => ['iot', 'instance-settings'] as const,
}

export async function getIotInstanceSettings(signal?: AbortSignal) {
  return iotFetch<IotInstanceSettings>('/instance_settings', { signal })
}

export async function updateIotInstanceSettings(payload: IotInstanceSettingsPayload) {
  return iotFetch<IotInstanceSettings>('/instance_settings', {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export const useIotInstanceSettingsQuery = <TData = IotInstanceSettings>(
  {
    enabled = true,
  }: {
    enabled?: boolean
  } = {},
  options: UseCustomQueryOptions<IotInstanceSettings, Error, TData> = {}
) =>
  useQuery<IotInstanceSettings, Error, TData>({
    queryKey: iotInstanceSettingsKeys.root(),
    queryFn: ({ signal }) => getIotInstanceSettings(signal),
    enabled,
    staleTime: 5 * 1000,
    ...options,
  })

export const useIotInstanceSettingsUpdateMutation = ({
  onSuccess,
  ...options
}: Omit<
  UseCustomMutationOptions<IotInstanceSettings, Error, { payload: IotInstanceSettingsPayload }>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<IotInstanceSettings, Error, { payload: IotInstanceSettingsPayload }>({
    mutationFn: ({ payload }) => updateIotInstanceSettings(payload),
    async onSuccess(data, variables, context) {
      await queryClient.invalidateQueries({
        queryKey: iotInstanceSettingsKeys.root(),
      })
      await onSuccess?.(data, variables, context)
    },
    ...options,
  })
}
