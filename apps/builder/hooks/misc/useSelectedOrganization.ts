import { LOCAL_STORAGE_KEYS, useIsLoggedIn, useParams } from 'common'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { useProjectDetailQuery } from 'data/projects/project-detail-query'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'

export function useSelectedOrganizationQuery({ enabled = true } = {}) {
  const isLoggedIn = useIsLoggedIn()

  const { ref, slug } = useParams()
  const { data: selectedProject } = useProjectDetailQuery({ ref })
  const [lastVisitedOrganization] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.LAST_VISITED_ORGANIZATION,
    ''
  )

  return useOrganizationsQuery({
    enabled: isLoggedIn && enabled,
    select: (data) => {
      const matched = data.find((org) => {
        if (slug !== undefined) return org.slug === slug
        if (selectedProject !== undefined) return org.id === selectedProject.organization_id
        if (lastVisitedOrganization) return org.slug === lastVisitedOrganization
        return undefined
      })
      return matched ?? data[0]
    },
  })
}
