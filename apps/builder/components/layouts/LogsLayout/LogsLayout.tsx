import { PermissionAction } from '@supabase/shared-types/out/constants'

import { PropsWithChildren } from 'react'

import NoPermission from 'components/ui/NoPermission'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { withAuth } from 'hooks/misc/withAuth'
import { useI18n } from 'lib/i18n'
import { ProjectLayout } from '../ProjectLayout'
import { LogsSidebarMenuV2 } from './LogsSidebarMenuV2'

interface LogsLayoutProps {
  title?: string
}

const LogsLayout = ({ title, children }: PropsWithChildren<LogsLayoutProps>) => {
  const { isLoading, can: canUseLogsExplorer } = useAsyncCheckPermissions(
    PermissionAction.ANALYTICS_READ,
    'logflare'
  )
  const { t } = useI18n()

  if (!canUseLogsExplorer) {
    if (isLoading) {
      return <ProjectLayout isLoading></ProjectLayout>
    }

    if (!isLoading && !canUseLogsExplorer) {
      return (
        <ProjectLayout>
          <NoPermission
            isFullPage
            resourceText={t('logsMenu.noPermission', "access your project's logs")}
          />
        </ProjectLayout>
      )
    }
  }

  return (
    <ProjectLayout
      title={title}
      product={t('logsMenu.product', 'Logs & Analytics')}
      productMenu={<LogsSidebarMenuV2 />}
    >
      {children}
    </ProjectLayout>
  )
}

export default withAuth(LogsLayout)
