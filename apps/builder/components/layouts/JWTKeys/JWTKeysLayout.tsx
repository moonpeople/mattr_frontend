import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import { ScaffoldContainer } from 'components/layouts/Scaffold'
import { PropsWithChildren } from 'react'

import { useParams } from 'common'
import { useI18n } from 'lib/i18n'

const JWTKeysLayout = ({ children }: PropsWithChildren) => {
  const { ref: projectRef } = useParams()
  const { t } = useI18n()

  const navigationItems = [
    {
      label: t('jwtKeys.signingKeys', 'JWT Signing Keys'),
      href: `/project/${projectRef}/settings/jwt`,
      id: 'signing-keys',
    },
    {
      label: t('jwtKeys.legacySecret', 'Legacy JWT Secret'),
      href: `/project/${projectRef}/settings/jwt/legacy`,
      id: 'legacy-jwt-keys',
    },
  ]

  return (
    <PageLayout
      title={t('jwtKeys.title', 'JWT Keys')}
      subtitle={t(
        'jwtKeys.subtitle',
        'Control the keys used to sign JSON Web Tokens for your project'
      )}
      navigationItems={navigationItems}
    >
      <ScaffoldContainer className="flex flex-col py-8 gap-8" bottomPadding>
        {children}
      </ScaffoldContainer>
    </PageLayout>
  )
}

export default JWTKeysLayout
