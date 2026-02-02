import Link from 'next/link'

import { useParams } from 'common'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { ProjectLayoutWithAuth } from 'components/layouts/ProjectLayout'
import type { NextPageWithLayout } from 'types'
import { Card, CardContent, CardHeader, CardTitle } from 'ui'
import { PageContainer } from 'ui-patterns/PageContainer'
import { PageHeader, PageHeaderDescription, PageHeaderTitle } from 'ui-patterns/PageHeader'
import { PageSection, PageSectionContent } from 'ui-patterns/PageSection'

const ProjectOverviewPage: NextPageWithLayout = () => {
  const { ref } = useParams()

  const sections = [
    {
      title: 'Devices',
      description: 'Manage device inventory, models, and sensors.',
      href: `/project/${ref}/devices`,
    },
    {
      title: 'Telemetry',
      description: 'Explore raw ClickHouse data with filters and charts.',
      href: `/project/${ref}/telemetry`,
    },
    {
      title: 'Saved Queries',
      description: 'Store SQL queries and publish them via APIs.',
      href: `/project/${ref}/saved-queries`,
    },
    {
      title: 'API Keys',
      description: 'Generate and rotate project keys for ingestion and data.',
      href: `/project/${ref}/api-keys`,
    },
  ]

  return (
    <PageContainer size="large">
      <PageHeader>
        <PageHeaderTitle>IoT Overview</PageHeaderTitle>
        <PageHeaderDescription>
          Manage your project resources and monitor device data.
        </PageHeaderDescription>
      </PageHeader>
      <PageSection>
        <PageSectionContent>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {sections.map((section) => (
              <Card key={section.title} className="h-full">
                <CardHeader>
                  <CardTitle>{section.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-foreground-light">{section.description}</p>
                  <Link
                    className="text-sm text-brand-600 hover:text-brand-500"
                    href={section.href}
                  >
                    Open {section.title}
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </PageSectionContent>
      </PageSection>
    </PageContainer>
  )
}

ProjectOverviewPage.getLayout = (page) => (
  <DefaultLayout>
    <ProjectLayoutWithAuth>{page}</ProjectLayoutWithAuth>
  </DefaultLayout>
)

export default ProjectOverviewPage
