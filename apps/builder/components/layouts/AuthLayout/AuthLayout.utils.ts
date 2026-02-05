import type { ProductMenuGroup } from 'components/ui/ProductMenu/ProductMenu.types'
import { IS_PLATFORM } from 'lib/constants'

type Translator = (key: string, fallback?: string) => string

const translate = (t: Translator | undefined, key: string, fallback: string) => {
  return t ? t(key, fallback) : fallback
}

export const generateAuthMenu = (
  ref: string,
  flags?: {
    authenticationSignInProviders: boolean
    authenticationRateLimits: boolean
    authenticationEmails: boolean
    authenticationMultiFactor: boolean
    authenticationAttackProtection: boolean
    authenticationShowOverview: boolean
    authenticationOauth21: boolean
    authenticationPerformance: boolean
  },
  t?: Translator
): ProductMenuGroup[] => {
  const {
    authenticationSignInProviders,
    authenticationRateLimits,
    authenticationEmails,
    authenticationMultiFactor,
    authenticationAttackProtection,
    authenticationShowOverview,
    authenticationOauth21,
    authenticationPerformance,
  } = flags ?? {}

  return [
    {
      title: translate(t, 'authMenu.manage', 'Manage'),
      items: [
        ...(authenticationShowOverview
          ? [
              {
                name: translate(t, 'authMenu.overview', 'Overview'),
                key: 'overview',
                url: `/project/${ref}/auth/overview`,
                items: [],
              },
            ]
          : []),
        {
          name: translate(t, 'authMenu.users', 'Users'),
          key: 'users',
          url: `/project/${ref}/auth/users`,
          items: [],
        },
        ...(authenticationOauth21
          ? [
              {
                name: translate(t, 'authMenu.oauthApps', 'OAuth Apps'),
                key: 'oauth-apps',
                url: `/project/${ref}/auth/oauth-apps`,
                items: [],
              },
            ]
          : []),
      ],
    },
    ...(authenticationEmails && IS_PLATFORM
      ? [
          {
            title: translate(t, 'authMenu.notifications', 'Notifications'),
            items: [
              ...(authenticationEmails
                ? [
                    {
                      name: translate(t, 'authMenu.email', 'Email'),
                      key: 'email',
                      pages: ['templates', 'smtp'],
                      url: `/project/${ref}/auth/templates`,
                      items: [],
                    },
                  ]
                : []),
            ],
          },
        ]
      : []),
    {
      title: translate(t, 'authMenu.configuration', 'Configuration'),
      items: [
        {
          name: translate(t, 'authMenu.policies', 'Policies'),
          key: 'policies',
          url: `/project/${ref}/auth/policies`,
          items: [],
        },
        ...(IS_PLATFORM
          ? [
              ...(authenticationSignInProviders
                ? [
                    {
                      name: translate(t, 'authMenu.signInProviders', 'Sign In / Providers'),
                      key: 'sign-in-up',
                      pages: ['providers', 'third-party'],
                      url: `/project/${ref}/auth/providers`,
                      items: [],
                    },
                  ]
                : []),
              ...(authenticationOauth21
                ? [
                    {
                      name: translate(t, 'authMenu.oauthServer', 'OAuth Server'),
                      key: 'oauth-server',
                      url: `/project/${ref}/auth/oauth-server`,
                      label: translate(t, 'authMenu.beta', 'Beta'),
                    },
                  ]
                : []),
              {
                name: translate(t, 'authMenu.sessions', 'Sessions'),
                key: 'sessions',
                url: `/project/${ref}/auth/sessions`,
                items: [],
              },
              ...(authenticationRateLimits
                ? [
                    {
                      name: translate(t, 'authMenu.rateLimits', 'Rate Limits'),
                      key: 'rate-limits',
                      url: `/project/${ref}/auth/rate-limits`,
                      items: [],
                    },
                  ]
                : []),
              ...(authenticationMultiFactor
                ? [
                    {
                      name: translate(t, 'authMenu.multiFactor', 'Multi-Factor'),
                      key: 'mfa',
                      url: `/project/${ref}/auth/mfa`,
                      items: [],
                    },
                  ]
                : []),
              {
                name: translate(t, 'authMenu.urlConfiguration', 'URL Configuration'),
                key: 'url-configuration',
                url: `/project/${ref}/auth/url-configuration`,
                items: [],
              },
              ...(authenticationAttackProtection
                ? [
                    {
                      name: translate(t, 'authMenu.attackProtection', 'Attack Protection'),
                      key: 'protection',
                      url: `/project/${ref}/auth/protection`,
                      items: [],
                    },
                  ]
                : []),
              {
                name: translate(t, 'authMenu.authHooks', 'Auth Hooks'),
                key: 'hooks',
                url: `/project/${ref}/auth/hooks`,
                items: [],
                label: translate(t, 'authMenu.beta', 'Beta'),
              },
              {
                name: translate(t, 'authMenu.auditLogs', 'Audit Logs'),
                key: 'audit-logs',
                url: `/project/${ref}/auth/audit-logs`,
                items: [],
              },
              ...(authenticationPerformance
                ? [
                    {
                      name: translate(t, 'authMenu.performance', 'Performance'),
                      key: 'performance',
                      url: `/project/${ref}/auth/performance`,
                      items: [],
                    },
                  ]
                : []),
            ]
          : []),
      ],
    },
  ]
}
