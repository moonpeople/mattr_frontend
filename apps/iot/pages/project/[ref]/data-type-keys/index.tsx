import DefaultLayout from 'components/layouts/DefaultLayout'
import DevicesLayout from 'components/layouts/DevicesLayout/DevicesLayout'
import type { NextPageWithLayout } from 'types'
import { PageHeader, PageHeaderMeta, PageHeaderSummary, PageHeaderTitle } from 'ui-patterns/PageHeader'
import { PageSection, PageSectionContent } from 'ui-patterns/PageSection'
import { DataTypeKeysCard } from '../devices'

const DataTypeKeysPage: NextPageWithLayout = () => {
  return (
    <>
      <PageHeader size="large">
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>Data type keys</PageHeaderTitle>
          </PageHeaderSummary>
        </PageHeaderMeta>
      </PageHeader>
      <PageSection className="px-6 xl:px-10">
        <PageSectionContent>
          <DataTypeKeysCard />
        </PageSectionContent>
      </PageSection>
    </>
  )
}

DataTypeKeysPage.getLayout = (page) => (
  <DefaultLayout>
    <DevicesLayout>{page}</DevicesLayout>
  </DefaultLayout>
)

export default DataTypeKeysPage
