import { AlertTriangleIcon } from 'lucide-react'
import { NextPage } from 'next'
import { useRouter } from 'next/router'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

import { IS_PLATFORM, LOCAL_STORAGE_KEYS, useParams } from 'common'
import {
  Header,
  LoadingCardView,
  NoOrganizationsState,
} from 'components/interfaces/Home/ProjectList/EmptyStates'
import { ProjectList } from 'components/interfaces/Home/ProjectList/ProjectList'
import { HomePageActions } from 'components/interfaces/HomePageActions'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { withAuth } from 'hooks/misc/withAuth'
import { EmptyStatePresentational } from 'ui-patterns'
import {
  Alert_Shadcn_,
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Button,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
} from 'ui'

const fallbackStudioUrl = 'http://localhost:8082'

const OrganizationProjectsPage: NextPage = () => {
  const router = useRouter()
  const { slug } = useParams()
  const queryParams = useMemo(() => {
    const params = { ...router.query }
    delete params.slug
    return params
  }, [router.query])

  const [lastVisitedOrgSlug] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.LAST_VISITED_ORGANIZATION,
    ''
  )

  const {
    data: organizations = [],
    isSuccess: isSuccessOrganizations,
    isPending: isLoadingOrganizations,
    isError: isErrorOrganizations,
  } = useOrganizationsQuery({
    enabled: IS_PLATFORM,
  })

  const [selectedSlug, setSlug] = useState<string>(
    slug || lastVisitedOrgSlug || organizations[0]?.slug
  )
  const selectedOrganization = organizations.find((x) => x.slug === selectedSlug)

  const studioBase = (process.env.NEXT_PUBLIC_STUDIO_URL || fallbackStudioUrl).replace(/\/$/, '')
  const studioProjectsUrl = `${studioBase}/organizations`

  const buildBuilderUrl = (projectRef: string) => {
    const params = new URLSearchParams(queryParams as Record<string, string>)
    params.set('ref', projectRef)
    return `/builder?${params.toString()}`
  }

  useEffect(() => {
    if (!!lastVisitedOrgSlug) {
      setSlug(lastVisitedOrgSlug)
    } else if (isSuccessOrganizations) {
      setSlug(organizations[0]?.slug)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastVisitedOrgSlug, isSuccessOrganizations])

  useEffect(() => {
    if (!selectedSlug) {
      return
    }
    if (slug && slug !== selectedSlug) {
      router.replace(`/org/${selectedSlug}`)
    }
  }, [router, selectedSlug, slug])

  return (
    <div className="h-screen flex flex-col">
      <Header />
      <PageLayout className="flex-grow min-h-0" title="Select a project to open App Builder">
        <ScaffoldContainer className="flex-grow flex flex-col">
          {organizations.length > 0 && (
            <ScaffoldSection isFullWidth>
              <div className="flex items-center gap-x-2">
                <Select_Shadcn_
                  value={selectedSlug}
                  onValueChange={(nextSlug) => {
                    setSlug(nextSlug)
                    router.push(`/org/${nextSlug}`)
                  }}
                >
                  <SelectTrigger_Shadcn_ size="tiny" className="w-60 truncate">
                    <div className="flex items-center gap-x-2">
                      <p className="text-xs text-foreground-light">Organization:</p>
                      <SelectValue_Shadcn_ placeholder="Select an organization" />
                    </div>
                  </SelectTrigger_Shadcn_>
                  <SelectContent_Shadcn_ className="col-span-8">
                    {organizations.map((org) => (
                      <SelectItem_Shadcn_ key={org.slug} value={org.slug} className="text-xs">
                        {org.name}
                      </SelectItem_Shadcn_>
                    ))}
                  </SelectContent_Shadcn_>
                </Select_Shadcn_>
                <HomePageActions hideNewProject />
              </div>
            </ScaffoldSection>
          )}
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
            ) : !!selectedOrganization ? (
              <ProjectList
                organization={selectedOrganization}
                rewriteHref={buildBuilderUrl}
                emptyState={
                  <EmptyStatePresentational
                    title="Create a project in Studio"
                    description="Create a project in Studio before building interfaces."
                  >
                    <Button size="tiny" type="primary" asChild>
                      <Link href={studioProjectsUrl}>Open Studio</Link>
                    </Button>
                  </EmptyStatePresentational>
                }
              />
            ) : null}
          </ScaffoldSection>
        </ScaffoldContainer>
      </PageLayout>
    </div>
  )
}

export default withAuth(OrganizationProjectsPage)
