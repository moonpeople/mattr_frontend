/**
 * Композитор props для BuilderAppsCatalogView, чтобы не держать большой объект в BuilderShell.
 */
import { useMemo } from 'react'
import type { ComponentProps } from 'react'

import type { BuilderApp } from 'data/builder/builder-apps'

import { BuilderAppsCatalogView } from '../components/BuilderAppsCatalogView'

export interface UseBuilderShellCatalogViewPropsParams {
  apps: BuilderApp[]
  sortedApps: BuilderApp[]
  normalizedSearch: string
  noSearchResults: boolean
  search: string
  setSearch: (value: string) => void
  viewMode: 'grid' | 'table'
  setViewMode?: (value: 'grid' | 'table') => void
  canOpenCreateApp: boolean
  canSubmitCreateApp: boolean
  fullFormHref: string
  projectRef?: string | null
  isCreateOpen: boolean
  setIsCreateOpen: (open: boolean) => void
  createForm: ComponentProps<typeof BuilderAppsCatalogView>['createForm']
  onCreateApp: ComponentProps<typeof BuilderAppsCatalogView>['onCreateApp']
  createAppPending: boolean
  createAppErrorMessage?: string
  organizations: Array<{ slug: string; name: string }>
  isOrganizationsLoading: boolean
  setSelectedOrgSlug: (slug: string) => void
}

export const useBuilderShellCatalogViewProps = ({
  apps,
  sortedApps,
  normalizedSearch,
  noSearchResults,
  search,
  setSearch,
  viewMode,
  setViewMode,
  canOpenCreateApp,
  canSubmitCreateApp,
  fullFormHref,
  projectRef,
  isCreateOpen,
  setIsCreateOpen,
  createForm,
  onCreateApp,
  createAppPending,
  createAppErrorMessage,
  organizations,
  isOrganizationsLoading,
  setSelectedOrgSlug,
}: UseBuilderShellCatalogViewPropsParams): ComponentProps<typeof BuilderAppsCatalogView> =>
  useMemo(
    () => ({
      apps,
      sortedApps,
      normalizedSearch,
      noSearchResults,
      search,
      setSearch,
      viewMode,
      setViewMode,
      canOpenCreateApp,
      canSubmitCreateApp,
      fullFormHref,
      projectRef,
      isCreateOpen,
      setIsCreateOpen,
      createForm,
      onCreateApp,
      createAppPending,
      createAppErrorMessage,
      organizations,
      isOrganizationsLoading,
      setSelectedOrgSlug,
    }),
    [
      apps,
      sortedApps,
      normalizedSearch,
      noSearchResults,
      search,
      setSearch,
      viewMode,
      setViewMode,
      canOpenCreateApp,
      canSubmitCreateApp,
      fullFormHref,
      projectRef,
      isCreateOpen,
      setIsCreateOpen,
      createForm,
      onCreateApp,
      createAppPending,
      createAppErrorMessage,
      organizations,
      isOrganizationsLoading,
      setSelectedOrgSlug,
    ]
  )
