import { useRouter } from 'next/router'
import { PropsWithChildren } from 'react'

import { useParams } from 'common'
import { ProductMenu } from 'components/ui/ProductMenu'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { withAuth } from 'hooks/misc/withAuth'
import { useI18n } from 'lib/i18n'
import { ProjectLayout } from '../ProjectLayout'
import { generateSettingsMenu } from './SettingsMenu.utils'

interface SettingsLayoutProps {
  title?: string
}

const SettingsLayout = ({ title, children }: PropsWithChildren<SettingsLayoutProps>) => {
  const router = useRouter()
  const { ref } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const { data: organization } = useSelectedOrganizationQuery()
  const { t } = useI18n()

  const page = router.pathname.split('/')[4]

  const {
    projectAuthAll: authEnabled,
    authenticationShowProviders: authProvidersEnabled,
    projectEdgeFunctionAll: edgeFunctionsEnabled,
    projectStorageAll: storageEnabled,
    projectSettingsLegacyJwtKeys: legacyJWTKeysEnabled,
    projectSettingsLogDrains,
  } = useIsFeatureEnabled([
    'project_auth:all',
    'authentication:show_providers',
    'project_edge_function:all',
    'project_storage:all',
    'project_settings:legacy_jwt_keys',
    'project_settings:log_drains',
  ])

  const menuRoutes = generateSettingsMenu(ref, project, organization, {
    auth: authEnabled,
    authProviders: authProvidersEnabled,
    edgeFunctions: edgeFunctionsEnabled,
    storage: storageEnabled,
    legacyJwtKeys: legacyJWTKeysEnabled,
    logDrains: projectSettingsLogDrains,
  }, t)

  return (
    <ProjectLayout
      isBlocking={false}
      title={title || t('settingsMenu.settingsTitle', 'Settings')}
      product={t('settingsMenu.settingsTitle', 'Settings')}
      productMenu={<ProductMenu page={page} menu={menuRoutes} />}
    >
      {children}
    </ProjectLayout>
  )
}

export default withAuth(SettingsLayout)
