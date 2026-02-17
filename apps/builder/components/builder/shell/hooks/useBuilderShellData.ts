/**
 * Data-hook BuilderShell: централизует загрузку сущностей builder и mutations приложения.
 */
import { useMemo } from 'react'

import {
  useBuilderAppsQuery,
  useCreateBuilderAppMutation,
  useUpdateBuilderAppMutation,
} from 'data/builder/builder-apps'
import {
  useBuilderPagesQuery,
  useCreateBuilderPageMutation,
  useDeleteBuilderPageMutation,
} from 'data/builder/builder-pages'
import {
  useBuilderQueriesQuery,
  useCreateBuilderQueryMutation,
  useUpdateBuilderQueryMutation,
} from 'data/builder/builder-queries'
import {
  useBuilderJsQuery,
  useCreateBuilderJsMutation,
  useUpdateBuilderJsMutation,
} from 'data/builder/builder-js'
import {
  useBuilderRuntimeQuery,
  usePublishBuilderRuntimeMutation,
} from 'data/builder/builder-runtime'
import {
  useBuilderDraftQuery,
  useUpsertBuilderDraftMutation,
} from 'data/builder/builder-draft'
import { useProjectDetailQuery } from 'data/projects/project-detail-query'

import type { UseBuilderShellDataParams } from '../model'

export const useBuilderShellData = ({
  projectRef,
  appIdParam,
  isPreviewing,
  onCreatePageSuccess,
}: UseBuilderShellDataParams) => {
  const requestedProjectRef = projectRef ?? undefined
  const { data: apps = [], isLoading: isAppsLoading } = useBuilderAppsQuery({
    projectRef: requestedProjectRef,
  })
  const createAppMutation = useCreateBuilderAppMutation()
  const updateAppMutation = useUpdateBuilderAppMutation()

  const activeApp = useMemo(() => {
    if (!appIdParam) {
      return undefined
    }
    return apps.find((app) => app.id === appIdParam) ?? apps[0]
  }, [apps, appIdParam])

  const activeAppId = activeApp?.id
  const rawProjectRef = activeApp?.projectRef ?? requestedProjectRef
  const activeProjectRef = rawProjectRef ?? undefined

  const { data: project } = useProjectDetailQuery(
    { ref: activeProjectRef },
    { enabled: Boolean(activeProjectRef) }
  )

  const { data: draftData, isLoading: isDraftLoading } = useBuilderDraftQuery(
    { appId: activeAppId, projectRef: activeProjectRef },
    { enabled: Boolean(activeAppId) }
  )

  const { data: remotePagesData, isLoading: isPagesLoading } = useBuilderPagesQuery(
    { appId: activeAppId, projectRef: activeProjectRef },
    { enabled: Boolean(activeAppId) }
  )
  const remotePages = useMemo(() => remotePagesData ?? [], [remotePagesData])

  const createPageMutation = useCreateBuilderPageMutation(
    onCreatePageSuccess ? { onSuccess: onCreatePageSuccess } : undefined
  )
  const deletePageMutation = useDeleteBuilderPageMutation()

  const { data: queriesData } = useBuilderQueriesQuery(
    { appId: activeAppId, projectRef: activeProjectRef },
    { enabled: Boolean(activeAppId) }
  )
  const queries = useMemo(() => queriesData ?? [], [queriesData])
  const createQueryMutation = useCreateBuilderQueryMutation()
  const updateQueryMutation = useUpdateBuilderQueryMutation()

  const { data: jsFunctionsData } = useBuilderJsQuery(
    { appId: activeAppId, projectRef: activeProjectRef },
    { enabled: Boolean(activeAppId) }
  )
  const jsFunctions = useMemo(() => jsFunctionsData ?? [], [jsFunctionsData])
  const createJsMutation = useCreateBuilderJsMutation()
  const updateJsMutation = useUpdateBuilderJsMutation()

  const { data: runtimeData } = useBuilderRuntimeQuery(
    { appId: activeAppId, projectRef: activeProjectRef },
    { enabled: isPreviewing && Boolean(activeAppId) }
  )
  const publishRuntimeMutation = usePublishBuilderRuntimeMutation()
  const upsertDraftMutation = useUpsertBuilderDraftMutation()

  return {
    apps,
    isAppsLoading,
    activeApp,
    activeAppId,
    activeProjectRef,
    project,
    draftData,
    isDraftLoading,
    remotePages,
    isPagesLoading,
    createAppMutation,
    updateAppMutation,
    createPageMutation,
    deletePageMutation,
    queries,
    createQueryMutation,
    updateQueryMutation,
    jsFunctions,
    createJsMutation,
    updateJsMutation,
    runtimeData,
    publishRuntimeMutation,
    upsertDraftMutation,
  }
}
