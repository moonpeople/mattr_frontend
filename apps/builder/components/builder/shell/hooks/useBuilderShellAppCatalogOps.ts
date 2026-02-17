/**
 * Hook каталога приложений BuilderShell: create app + derived ui-флаги для empty-state.
 */
import { useCallback, useMemo } from 'react'

import type { BuilderApp, useCreateBuilderAppMutation } from 'data/builder/builder-apps'

interface CreateAppValues {
  name: string
  orgSlug?: string
}

export interface UseBuilderShellAppCatalogOpsParams {
  organizationSlug?: string | null
  organizationsCount: number
  formOrgSlug: string
  projectRef?: string | null
  setIsCreateOpen: (open: boolean) => void
  resetCreateForm: (values: { name: string; orgSlug: string }) => void
  createAppMutation: Pick<ReturnType<typeof useCreateBuilderAppMutation>, 'mutate'>
  navigateToBuilderApp: (app: BuilderApp) => void
}

export const useBuilderShellAppCatalogOps = ({
  organizationSlug,
  organizationsCount,
  formOrgSlug,
  projectRef,
  setIsCreateOpen,
  resetCreateForm,
  createAppMutation,
  navigateToBuilderApp,
}: UseBuilderShellAppCatalogOpsParams) => {
  const canOpenCreateApp = Boolean(organizationSlug || organizationsCount > 0)
  const canSubmitCreateApp = Boolean(organizationSlug || formOrgSlug)
  const fullFormHref = useMemo(
    () => (projectRef ? `/builder/new?ref=${projectRef}` : '/builder/new'),
    [projectRef]
  )

  const handleCreateApp = useCallback(
    (values: CreateAppValues) => {
      const orgSlug = organizationSlug ?? values.orgSlug
      if (!orgSlug) {
        return
      }

      createAppMutation.mutate(
        {
          name: values.name.trim(),
          projectRef,
          orgSlug,
        },
        {
          onSuccess: (app) => {
            setIsCreateOpen(false)
            resetCreateForm({ name: '', orgSlug })
            navigateToBuilderApp(app)
          },
        }
      )
    },
    [
      createAppMutation,
      navigateToBuilderApp,
      organizationSlug,
      projectRef,
      resetCreateForm,
      setIsCreateOpen,
    ]
  )

  return {
    canOpenCreateApp,
    canSubmitCreateApp,
    fullFormHref,
    handleCreateApp,
  }
}
