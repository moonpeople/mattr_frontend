import { AlertTriangleIcon } from 'lucide-react'
import { NextPage } from 'next'

import { IS_PLATFORM } from 'common'
import {
  Header,
  LoadingCardView,
  NoOrganizationsState,
} from 'components/interfaces/Home/ProjectList/EmptyStates'
import { OrganizationCard } from 'components/interfaces/Organization/OrganizationCard'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { withAuth } from 'hooks/misc/withAuth'
import {
  Alert_Shadcn_,
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
} from 'ui'

const OrganizationsPage: NextPage = () => {
  const {
    data: organizations = [],
    isPending: isLoadingOrganizations,
    isError: isErrorOrganizations,
  } = useOrganizationsQuery({
    enabled: IS_PLATFORM,
  })

  return (
    <div className="h-screen flex flex-col">
      <Header />
      <PageLayout className="flex-grow min-h-0" title="Organizations">
        <ScaffoldContainer className="flex-grow flex flex-col">
          <ScaffoldSection isFullWidth className="flex-grow pt-0 flex flex-col gap-y-4 h-px">
            {isLoadingOrganizations ? (
              <LoadingCardView />
            ) : isErrorOrganizations ? (
              <Alert_Shadcn_ variant="warning">
                <AlertTriangleIcon />
                <AlertTitle_Shadcn_>Failed to load your organizations</AlertTitle_Shadcn_>
                <AlertDescription_Shadcn_>Try refreshing the page</AlertDescription_Shadcn_>
              </Alert_Shadcn_>
            ) : organizations.length === 0 ? (
              <NoOrganizationsState />
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {organizations.map((organization) => (
                  <OrganizationCard key={organization.slug} organization={organization} />
                ))}
              </div>
            )}
          </ScaffoldSection>
        </ScaffoldContainer>
      </PageLayout>
    </div>
  )
}

export default withAuth(OrganizationsPage)
