import { useRouter } from 'next/router'
import { PropsWithChildren } from 'react'

import { useParams } from 'common'
import { GitHubStatus } from 'components/interfaces/Settings/Integrations/GithubIntegration/GitHubStatus'
import { ProductMenu } from 'components/ui/ProductMenu'
import { withAuth } from 'hooks/misc/withAuth'
import { useI18n } from 'lib/i18n'
import { ProjectLayout } from '../ProjectLayout'
import { generateBranchMenu } from './BranchLayout.utils'

const BranchProductMenu = () => {
  const router = useRouter()
  const { ref: projectRef = 'default' } = useParams()
  const { t } = useI18n()
  const page = router.pathname.split('/')[4] ?? 'branches'

  return (
    <>
      <ProductMenu page={page} menu={generateBranchMenu(projectRef, t)} />
      <div className="px-6">
        <h3 className="text-sm font-mono text-foreground-lighter uppercase mb-3">
          {t('branchMenu.configure', 'Configure')}
        </h3>
        <GitHubStatus />
      </div>
    </>
  )
}

const BranchLayout = ({ children }: PropsWithChildren<{}>) => {
  const { t } = useI18n()
  return (
    <ProjectLayout
      title={t('branchMenu.branching', 'Branching')}
      product={t('branchMenu.branching', 'Branching')}
      productMenu={<BranchProductMenu />}
      isBlocking={false}
    >
      {children}
    </ProjectLayout>
  )
}

export default withAuth(BranchLayout)
