import { useRouter } from 'next/router'
import { PropsWithChildren } from 'react'

import { useParams } from 'common'
import { ProductMenu } from 'components/ui/ProductMenu'
import { withAuth } from 'hooks/misc/withAuth'
import { useI18n } from 'lib/i18n'
import { ProjectLayout } from '../ProjectLayout'

const EdgeFunctionsProductMenu = () => {
  const { ref: projectRef = 'default' } = useParams()
  const router = useRouter()
  const { t } = useI18n()
  const page = router.pathname.split('/')[4]

  const menuItems = [
    {
      title: t('edgeFunctionsMenu.manage', 'Manage'),
      items: [
        {
          name: t('edgeFunctionsMenu.functions', 'Functions'),
          key: 'main',
          pages: ['', '[functionSlug]', 'new'],
          url: `/project/${projectRef}/functions`,
          items: [],
        },
        {
          name: t('edgeFunctionsMenu.secrets', 'Secrets'),
          key: 'secrets',
          url: `/project/${projectRef}/functions/secrets`,
          items: [],
        },
      ],
    },
  ]

  return <ProductMenu page={page} menu={menuItems} />
}

const EdgeFunctionsLayout = ({ children }: PropsWithChildren<{}>) => {
  const { t } = useI18n()
  return (
    <ProjectLayout
      title={t('nav.edgeFunctions', 'Edge Functions')}
      product={t('nav.edgeFunctions', 'Edge Functions')}
      productMenu={<EdgeFunctionsProductMenu />}
      isBlocking={false}
    >
      {children}
    </ProjectLayout>
  )
}

export default withAuth(EdgeFunctionsLayout)
