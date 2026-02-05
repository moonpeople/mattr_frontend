import { ArrowUpRight } from 'lucide-react'

import type { ProductMenuGroup } from 'components/ui/ProductMenu/ProductMenu.types'
import type { Project } from 'data/projects/project-detail-query'
import { IS_PLATFORM, PROJECT_STATUS } from 'lib/constants'
import type { Organization } from 'types'

type Translator = (key: string, fallback?: string) => string

const translate = (t: Translator | undefined, key: string, fallback: string) => {
  return t ? t(key, fallback) : fallback
}

export const generateSettingsMenu = (
  ref?: string,
  project?: Project,
  organization?: Organization,
  features?: {
    auth?: boolean
    authProviders?: boolean
    edgeFunctions?: boolean
    storage?: boolean
    legacyJwtKeys?: boolean
    logDrains?: boolean
  },
  t?: Translator
): ProductMenuGroup[] => {
  if (!IS_PLATFORM) {
    return [
      {
        title: translate(t, 'settingsMenu.projectSettings', 'Project Settings'),
        items: [
          {
            name: translate(t, 'settingsMenu.logDrains', 'Log Drains'),
            key: `log-drains`,
            url: `/project/${ref}/settings/log-drains`,
            items: [],
          },
        ],
      },
    ]
  }
  const isProjectBuilding = project?.status === PROJECT_STATUS.COMING_UP
  const buildingUrl = `/project/${ref}`

  const authEnabled = features?.auth ?? true
  const authProvidersEnabled = features?.authProviders ?? true
  const edgeFunctionsEnabled = features?.edgeFunctions ?? true
  const storageEnabled = features?.storage ?? true
  const legacyJwtKeysEnabled = features?.legacyJwtKeys ?? true

  return [
    {
      title: translate(t, 'settingsMenu.projectSettings', 'Project Settings'),
      items: [
        {
          name: translate(t, 'settingsMenu.general', 'General'),
          key: 'general',
          url: `/project/${ref}/settings/general`,
          items: [],
        },
        {
          name: translate(t, 'settingsMenu.computeAndDisk', 'Compute and Disk'),
          key: 'compute-and-disk',
          url: `/project/${ref}/settings/compute-and-disk`,
          items: [],
        },
        {
          name: translate(t, 'settingsMenu.infrastructure', 'Infrastructure'),
          key: 'infrastructure',
          url: isProjectBuilding ? buildingUrl : `/project/${ref}/settings/infrastructure`,
          items: [],
        },

        {
          name: translate(t, 'settingsMenu.integrations', 'Integrations'),
          key: 'integrations',
          url: `/project/${ref}/settings/integrations`,
          items: [],
        },

        {
          name: translate(t, 'settingsMenu.dataApi', 'Data API'),
          key: 'api',
          url: isProjectBuilding ? buildingUrl : `/project/${ref}/settings/api`,
          items: [],
        },
        {
          name: translate(t, 'settingsMenu.apiKeys', 'API Keys'),
          key: 'api-keys',
          url: `/project/${ref}/settings/api-keys/new`,
          items: [],
        },
        {
          name: translate(t, 'settingsMenu.jwtKeys', 'JWT Keys'),
          key: 'jwt',
          url: legacyJwtKeysEnabled
            ? `/project/${ref}/settings/jwt`
            : `/project/${ref}/settings/jwt/signing-keys`,
          items: [],
        },

        {
          name: translate(t, 'settingsMenu.logDrains', 'Log Drains'),
          key: `log-drains`,
          url: `/project/${ref}/settings/log-drains`,
          items: [],
        },
        {
          name: translate(t, 'settingsMenu.addOns', 'Add Ons'),
          key: 'addons',
          url: `/project/${ref}/settings/addons`,
          items: [],
        },
        {
          name: translate(t, 'settingsMenu.vault', 'Vault'),
          key: 'vault',
          url: isProjectBuilding ? buildingUrl : `/project/${ref}/integrations/vault/overview`,
          items: [],
          rightIcon: <ArrowUpRight strokeWidth={1} className="h-4 w-4" />,
          label: translate(t, 'settingsMenu.beta', 'Beta'),
        },
      ],
    },
    {
      title: translate(t, 'settingsMenu.configuration', 'Configuration'),
      items: [
        {
          name: translate(t, 'settingsMenu.database', 'Database'),
          key: 'database',
          url: isProjectBuilding ? buildingUrl : `/project/${ref}/database/settings`,
          items: [],
          rightIcon: <ArrowUpRight strokeWidth={1} className="h-4 w-4" />,
        },
        ...(authEnabled
          ? [
              {
                name: translate(t, 'settingsMenu.authentication', 'Authentication'),
                key: 'auth',
                url: authProvidersEnabled
                  ? `/project/${ref}/auth/providers`
                  : `/project/${ref}/auth/policies`,
                items: [],
                rightIcon: <ArrowUpRight strokeWidth={1} className="h-4 w-4" />,
              },
            ]
          : []),
        ...(storageEnabled
          ? [
              {
                name: translate(t, 'settingsMenu.storage', 'Storage'),
                key: 'storage',
                url: `/project/${ref}/storage/settings`,
                items: [],
                rightIcon: <ArrowUpRight strokeWidth={1} className="h-4 w-4" />,
              },
            ]
          : []),
        ...(edgeFunctionsEnabled
          ? [
              {
                name: translate(t, 'settingsMenu.edgeFunctions', 'Edge Functions'),
                key: 'functions',
                url: `/project/${ref}/functions/secrets`,
                items: [],
                rightIcon: <ArrowUpRight strokeWidth={1} className="h-4 w-4" />,
              },
            ]
          : []),
      ],
    },

    {
      title: translate(t, 'settingsMenu.usageTitle', 'Usage'),
      items: [
        {
          name: translate(t, 'settingsMenu.usage', 'Usage'),
          key: 'usage',
          url: `/org/${organization?.slug}/usage?projectRef=${ref}`,
          items: [],
          rightIcon: <ArrowUpRight strokeWidth={1} className="h-4 w-4" />,
        },
      ],
    },
  ]
}
