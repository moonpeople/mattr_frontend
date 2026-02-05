import { PropsWithChildren } from 'react'

import { useParams } from 'common'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import { UnknownInterface } from 'components/ui/UnknownInterface'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useI18n } from 'lib/i18n'
import AuthLayout from './AuthLayout'

export const AuthEmailsLayout = ({ children }: PropsWithChildren<{}>) => {
  const { ref } = useParams()
  const { t } = useI18n()

  const showEmails = useIsFeatureEnabled('authentication:emails')

  const navItems = [
    {
      label: t('authEmails.templates', 'Templates'),
      href: `/project/${ref}/auth/templates`,
    },
    {
      label: t('authEmails.smtpSettings', 'SMTP Settings'),
      href: `/project/${ref}/auth/smtp`,
    },
  ]

  return (
    <AuthLayout>
      {showEmails ? (
        <PageLayout
          title={t('authEmails.title', 'Emails')}
          subtitle={t(
            'authEmails.subtitle',
            'Configure what emails your users receive and how they are sent'
          )}
          navigationItems={navItems}
        >
          {children}
        </PageLayout>
      ) : (
        <UnknownInterface urlBack={`/project/${ref}/auth/users`} />
      )}
    </AuthLayout>
  )
}
