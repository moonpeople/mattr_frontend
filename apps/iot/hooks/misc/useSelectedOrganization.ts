import { useIsLoggedIn, useParams } from 'common'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'

export function useSelectedOrganizationQuery({ enabled = true } = {}) {
  const isLoggedIn = useIsLoggedIn()

  const { slug } = useParams()
  const { data: selectedProject } = useSelectedProjectQuery({ enabled })

  return useOrganizationsQuery({
    enabled: isLoggedIn && enabled,
    select: (data) => {
      if (slug !== undefined) {
        return data.find((org) => org.slug === slug || String(org.id) === slug)
      }
      if (selectedProject !== undefined) {
        return data.find((org) => org.id === selectedProject.organization_id)
      }
      return data[0]
    },
  })
}
