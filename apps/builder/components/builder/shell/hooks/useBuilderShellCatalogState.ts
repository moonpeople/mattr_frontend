/**
 * Производные данные каталога приложений: нормализация поиска, фильтрация и сортировка.
 */
import { useMemo } from 'react'

import type { BuilderApp } from 'data/builder/builder-apps'

export interface UseBuilderShellCatalogStateParams {
  apps: BuilderApp[]
  debouncedSearch: string
}

export const useBuilderShellCatalogState = ({
  apps,
  debouncedSearch,
}: UseBuilderShellCatalogStateParams) => {
  const normalizedSearch = debouncedSearch.trim().toLowerCase()

  const filteredApps = useMemo(() => {
    if (!normalizedSearch) {
      return apps
    }

    return apps.filter((app) => {
      const value = `${app.name ?? ''} ${app.id ?? ''} ${app.projectRef ?? ''} ${app.orgSlug ?? ''}`
      return value.toLowerCase().includes(normalizedSearch)
    })
  }, [apps, normalizedSearch])

  const sortedApps = useMemo(
    () => [...filteredApps].sort((a, b) => a.name.localeCompare(b.name)),
    [filteredApps]
  )
  const noSearchResults = normalizedSearch.length > 0 && sortedApps.length === 0

  return {
    normalizedSearch,
    sortedApps,
    noSearchResults,
  }
}
