import { Lock } from 'lucide-react'

import { useParams } from 'common'
import { COMMAND_MENU_SECTIONS } from 'components/interfaces/App/CommandMenu/CommandMenu.utils'
import { orderCommandSectionsByPriority } from 'components/interfaces/App/CommandMenu/ordering'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useI18n } from 'lib/i18n'
import type { CommandOptions } from 'ui-patterns/CommandMenu'
import { useRegisterCommands } from 'ui-patterns/CommandMenu'
import { IRouteCommand } from 'ui-patterns/CommandMenu/internal/types'

export function useAuthGotoCommands(options?: CommandOptions) {
  let { ref } = useParams()
  ref ||= '_'
  const { t } = useI18n()

  const authLabel = t('nav.authentication', 'Authentication')
  const formatValue = (label: string) => `${authLabel}: ${label}`

  const {
    authenticationSignInProviders,
    authenticationThirdPartyAuth,
    authenticationRateLimits,
    authenticationEmails,
    authenticationMultiFactor,
    authenticationAttackProtection,
    authenticationPerformance,
  } = useIsFeatureEnabled([
    'authentication:sign_in_providers',
    'authentication:third_party_auth',
    'authentication:rate_limits',
    'authentication:emails',
    'authentication:multi_factor',
    'authentication:attack_protection',
    'authentication:performance',
  ])

  useRegisterCommands(
    'Actions',
    [
      {
        id: 'create-rls-policy',
        name: t('authCommands.createRlsPolicy', 'Create RLS policy'),
        value: t('authCommands.createRlsPolicyValue', 'Create RLS (Row Level Security) policy'),
        route: `/project/${ref}/auth/policies`,
        icon: () => <Lock />,
      },
    ],
    {
      ...options,
      deps: [ref],
      enabled: (options?.enabled ?? true) && ref !== '_',
      orderSection: orderCommandSectionsByPriority,
      sectionMeta: { priority: 3 },
    }
  )

  useRegisterCommands(
    COMMAND_MENU_SECTIONS.NAVIGATE,
    [
      {
        id: 'nav-auth-users',
        name: t('authMenu.users', 'Users'),
        value: formatValue(t('authMenu.users', 'Users')),
        route: `/project/${ref}/auth/users`,
        defaultHidden: true,
      },
      {
        id: 'nav-auth-policies',
        name: t('authMenu.policies', 'Policies'),
        value: t('authCommands.policiesValue', 'Auth: Policies (RLS)'),
        route: `/project/${ref}/auth/policies`,
        defaultHidden: true,
      },
      ...(authenticationSignInProviders
        ? [
            {
              id: 'nav-auth-providers',
              name: t('authCommands.providers', 'Providers'),
              value: t(
                'authCommands.providersValue',
                'Auth: Providers (Social Login, SSO)'
              ),
              route: `/project/${ref}/auth/providers`,
              defaultHidden: true,
            } as IRouteCommand,
          ]
        : []),
      ...(authenticationThirdPartyAuth
        ? [
            {
              id: 'nav-auth-providers',
              name: t('authCommands.providersThirdParty', 'Providers (Third Party)'),
              value: t(
                'authCommands.providersThirdPartyValue',
                'Auth: Providers (Third Party)'
              ),
              route: `/project/${ref}/auth/third-party`,
              defaultHidden: true,
            } as IRouteCommand,
          ]
        : []),
      {
        id: 'nav-auth-sessions',
        name: t('authMenu.sessions', 'Sessions'),
        value: t('authCommands.sessionsValue', 'Auth: Sessions (User Sessions)'),
        route: `/project/${ref}/auth/sessions`,
        defaultHidden: true,
      },
      ...(authenticationRateLimits
        ? [
            {
              id: 'nav-auth-rate-limits',
              name: t('authMenu.rateLimits', 'Rate Limits'),
              value: formatValue(t('authMenu.rateLimits', 'Rate Limits')),
              route: `/project/${ref}/auth/rate-limits`,
              defaultHidden: true,
            } as IRouteCommand,
          ]
        : []),
      ...(authenticationEmails
        ? [
            {
              id: 'nav-auth-templates',
              name: t('authCommands.emailTemplates', 'Email Templates'),
              value: t('authCommands.emailTemplatesValue', 'Auth: Email Templates'),
              route: `/project/${ref}/auth/templates`,
              defaultHidden: true,
            } as IRouteCommand,
            {
              id: 'nav-auth-smtp',
              name: t('authCommands.smtpSettings', 'SMTP Settings'),
              value: t(
                'authCommands.smtpSettingsValue',
                'Auth: SMTP Settings (Email Configuration)'
              ),
              route: `/project/${ref}/auth/smtp`,
              defaultHidden: true,
            } as IRouteCommand,
          ]
        : []),
      ...(authenticationMultiFactor
        ? [
            {
              id: 'nav-auth-mfa',
              name: t('authCommands.mfa', 'Multi Factor Authentication (MFA)'),
              value: t('authCommands.mfaValue', 'Auth: Multi Factor Authentication (MFA)'),
              route: `/project/${ref}/auth/mfa`,
              defaultHidden: true,
            } as IRouteCommand,
          ]
        : []),
      {
        id: 'nav-auth-url-configuration',
        name: t('authMenu.urlConfiguration', 'URL Configuration'),
        value: t(
          'authCommands.urlConfigurationValue',
          'Auth: URL Configuration (Site URL, Redirect URLs)'
        ),
        route: `/project/${ref}/auth/url-configuration`,
        defaultHidden: true,
      },
      ...(authenticationAttackProtection
        ? [
            {
              id: 'nav-auth-attack-protection',
              name: t('authMenu.attackProtection', 'Attack Protection'),
              value: formatValue(t('authMenu.attackProtection', 'Attack Protection')),
              route: `/project/${ref}/auth/protection`,
              defaultHidden: true,
            } as IRouteCommand,
          ]
        : []),
      {
        id: 'nav-auth-auth-hooks',
        name: t('authMenu.authHooks', 'Auth Hooks'),
        value: formatValue(t('authMenu.authHooks', 'Auth Hooks')),
        route: `/project/${ref}/auth/hooks`,
        defaultHidden: true,
      },
      ...(authenticationPerformance
        ? [
            {
              id: 'nav-auth-performance-settings',
              name: t('authCommands.performanceSettings', 'Auth Performance Settings'),
              value: t('authCommands.performanceSettingsValue', 'Auth: Performance Settings'),
              route: `/project/${ref}/auth/performance`,
              defaultHidden: true,
            } as IRouteCommand,
          ]
        : []),
    ],
    { ...options, deps: [ref] }
  )
}
