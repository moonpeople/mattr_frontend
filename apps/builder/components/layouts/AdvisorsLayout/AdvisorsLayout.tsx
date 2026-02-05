import { useRouter } from 'next/router'
import { PropsWithChildren } from 'react'

import { withAuth } from 'hooks/misc/withAuth'
import { useI18n } from 'lib/i18n'
import { ProjectLayout } from '../ProjectLayout'
import { AdvisorsSidebarMenu } from './AdvisorsSidebarMenu'

export interface AdvisorsLayoutProps {
  title?: string
}

const AdvisorsLayout = ({ children }: PropsWithChildren<AdvisorsLayoutProps>) => {
  const router = useRouter()
  const page = router.pathname.split('/')[4]
  const { t } = useI18n()

  return (
    <ProjectLayout
      isLoading={false}
      product={t('nav.advisors', 'Advisors')}
      productMenu={<AdvisorsSidebarMenu page={page} />}
    >
      {children}
    </ProjectLayout>
  )
}

export default withAuth(AdvisorsLayout)
