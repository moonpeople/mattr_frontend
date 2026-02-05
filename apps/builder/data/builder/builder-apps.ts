import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { builderRequest, withProjectRef } from './builder-client'
import { builderKeys } from './keys'
import type { ResponseError, UseCustomMutationOptions, UseCustomQueryOptions } from 'types'

export type BuilderApp = {
  id: string
  name: string
  projectRef?: string | null
  orgSlug: string
  ownerId?: string | null
  instanceId?: string | null
  insertedAt?: string
  updatedAt?: string
}

export type BuilderAppsResponse = {
  apps: BuilderApp[]
}

export type BuilderAppVariables = {
  appId: string
}

export type BuilderAppCreateVariables = {
  name: string
  projectRef?: string | null
  orgSlug: string
  ownerId?: string | null
  instanceId?: string | null
}

export type BuilderAppUpdateVariables = {
  appId: string
  name?: string
}

export type BuilderAppDeleteVariables = {
  appId: string
  projectRef?: string
}

export async function listBuilderApps(
  { projectRef }: { projectRef?: string },
  signal?: AbortSignal
) {
  const search = projectRef ? `?projectRef=${encodeURIComponent(projectRef)}` : ''
  const payload = await builderRequest<BuilderAppsResponse>(`/apps${search}`, { signal })
  return payload.apps
}

export async function getBuilderApp({ appId }: BuilderAppVariables, signal?: AbortSignal) {
  return builderRequest<BuilderApp>(`/apps/${appId}`, { signal })
}

export async function createBuilderApp(variables: BuilderAppCreateVariables) {
  return builderRequest<BuilderApp>('/apps', { method: 'POST', body: variables })
}

export async function updateBuilderApp({ appId, ...attrs }: BuilderAppUpdateVariables) {
  return builderRequest<BuilderApp>(`/apps/${appId}`, { method: 'PATCH', body: attrs })
}

export async function deleteBuilderApp({ appId, projectRef }: BuilderAppDeleteVariables) {
  return builderRequest<unknown>(withProjectRef(`/apps/${appId}`, projectRef), {
    method: 'DELETE',
  })
}

type BuilderAppsData = Awaited<ReturnType<typeof listBuilderApps>>

type BuilderAppsError = ResponseError

export const useBuilderAppsQuery = <TData = BuilderAppsData>(
  { projectRef }: { projectRef?: string },
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<BuilderAppsData, BuilderAppsError, TData> = {}
) => {
  return useQuery<BuilderAppsData, BuilderAppsError, TData>({
    queryKey: builderKeys.apps(projectRef),
    queryFn: ({ signal }) => listBuilderApps({ projectRef }, signal),
    enabled,
    ...options,
  })
}

export const useBuilderAppQuery = <TData = BuilderApp>(
  { appId }: { appId?: string },
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<BuilderApp, BuilderAppsError, TData> = {}
) => {
  return useQuery<BuilderApp, BuilderAppsError, TData>({
    queryKey: builderKeys.app(appId),
    queryFn: ({ signal }) => getBuilderApp({ appId: appId as string }, signal),
    enabled: enabled && typeof appId !== 'undefined',
    ...options,
  })
}

export const useCreateBuilderAppMutation = ({
  onSuccess,
  ...options
}: UseCustomMutationOptions<BuilderApp, BuilderAppsError, BuilderAppCreateVariables> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<BuilderApp, BuilderAppsError, BuilderAppCreateVariables>({
    mutationFn: (vars) => createBuilderApp(vars),
    async onSuccess(data, variables, context) {
      await queryClient.invalidateQueries({ queryKey: builderKeys.apps(variables.projectRef) })
      await onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useUpdateBuilderAppMutation = ({
  onSuccess,
  ...options
}: UseCustomMutationOptions<BuilderApp, BuilderAppsError, BuilderAppUpdateVariables> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<BuilderApp, BuilderAppsError, BuilderAppUpdateVariables>({
    mutationFn: (vars) => updateBuilderApp(vars),
    async onSuccess(data, variables, context) {
      await queryClient.invalidateQueries({ queryKey: builderKeys.app(variables.appId) })
      await queryClient.invalidateQueries({ queryKey: builderKeys.appsBase() })
      await onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useDeleteBuilderAppMutation = ({
  onSuccess,
  ...options
}: UseCustomMutationOptions<unknown, BuilderAppsError, BuilderAppDeleteVariables> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<unknown, BuilderAppsError, BuilderAppDeleteVariables>({
    mutationFn: (vars) => deleteBuilderApp(vars),
    async onSuccess(data, variables, context) {
      await queryClient.invalidateQueries({ queryKey: builderKeys.apps(variables.projectRef) })
      await onSuccess?.(data, variables, context)
    },
    ...options,
  })
}
