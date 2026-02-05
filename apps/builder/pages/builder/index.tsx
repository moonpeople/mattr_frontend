import { BuilderShell } from 'components/builder/BuilderShell'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { ProjectLayoutWithAuth } from 'components/layouts/ProjectLayout'
import type { NextPageWithLayout } from 'types'

const BuilderPage: NextPageWithLayout = () => {
  return <BuilderShell />
}

BuilderPage.getLayout = (page) => (
  <DefaultLayout headerTitle="Builder">
    <ProjectLayoutWithAuth title="Builder" isBlocking={false}>
      {page}
    </ProjectLayoutWithAuth>
  </DefaultLayout>
)

export default BuilderPage
