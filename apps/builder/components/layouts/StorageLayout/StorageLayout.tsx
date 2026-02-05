import { ReactNode } from 'react'

import { StorageMenuV2 } from 'components/interfaces/Storage/StorageMenuV2'
import { withAuth } from 'hooks/misc/withAuth'
import { useI18n } from 'lib/i18n'
import { ProjectLayout } from '../ProjectLayout'

export interface StorageLayoutProps {
  title: string
  children: ReactNode
}

const StorageLayout = ({ title, children }: StorageLayoutProps) => {
  const { t } = useI18n()
  return (
    <ProjectLayout
      title={title || t('nav.storage', 'Storage')}
      product={t('nav.storage', 'Storage')}
      productMenu={<StorageMenuV2 />}
    >
      {children}
    </ProjectLayout>
  )
}

export default withAuth(StorageLayout)
