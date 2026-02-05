import { ArrowUpRight } from 'lucide-react'

import type { ProductMenuGroup } from 'components/ui/ProductMenu/ProductMenu.types'
import type { Project } from 'data/projects/project-detail-query'
import { IS_PLATFORM } from 'lib/constants'

type Translator = (key: string, fallback?: string) => string

const translate = (t: Translator | undefined, key: string, fallback: string) => {
  return t ? t(key, fallback) : fallback
}

export const generateDatabaseMenu = (
  project?: Project,
  flags?: {
    pgNetExtensionExists: boolean
    pitrEnabled: boolean
    columnLevelPrivileges: boolean
    showPgReplicate: boolean
    enablePgReplicate: boolean
    showRoles: boolean
    showWrappers: boolean
  },
  t?: Translator
): ProductMenuGroup[] => {
  const ref = project?.ref ?? 'default'
  const {
    pgNetExtensionExists,
    pitrEnabled,
    columnLevelPrivileges,
    showPgReplicate,
    enablePgReplicate,
    showRoles,
    showWrappers,
  } = flags || {}

  return [
    {
      title: translate(t, 'databaseMenu.management', 'Database Management'),
      items: [
        {
          name: translate(t, 'databaseMenu.schemaVisualizer', 'Schema Visualizer'),
          key: 'schemas',
          url: `/project/${ref}/database/schemas`,
          items: [],
        },
        {
          name: translate(t, 'databaseMenu.tables', 'Tables'),
          key: 'tables',
          url: `/project/${ref}/database/tables`,
          items: [],
        },
        {
          name: translate(t, 'databaseMenu.functions', 'Functions'),
          key: 'functions',
          url: `/project/${ref}/database/functions`,
          items: [],
        },
        {
          name: translate(t, 'databaseMenu.triggers', 'Triggers'),
          key: 'triggers',
          url: `/project/${ref}/database/triggers`,
          items: [],
        },
        {
          name: translate(t, 'databaseMenu.enumeratedTypes', 'Enumerated Types'),
          key: 'types',
          url: `/project/${ref}/database/types`,

          items: [],
        },
        {
          name: translate(t, 'databaseMenu.extensions', 'Extensions'),
          key: 'extensions',
          url: `/project/${ref}/database/extensions`,
          items: [],
        },
        {
          name: translate(t, 'databaseMenu.indexes', 'Indexes'),
          key: 'indexes',
          url: `/project/${ref}/database/indexes`,
          items: [],
        },
        {
          name: translate(t, 'databaseMenu.publications', 'Publications'),
          key: 'publications',
          url: `/project/${ref}/database/publications`,
          items: [],
        },
      ],
    },
    {
      title: translate(t, 'databaseMenu.configuration', 'Configuration'),
      items: [
        ...(showRoles
          ? [
              {
                name: translate(t, 'databaseMenu.roles', 'Roles'),
                key: 'roles',
                url: `/project/${ref}/database/roles`,
                items: [],
              },
            ]
          : []),
        ...(columnLevelPrivileges
          ? [
              {
                name: translate(t, 'databaseMenu.columnPrivileges', 'Column Privileges'),
                key: 'column-privileges',
                url: `/project/${ref}/database/column-privileges`,
                items: [],
              },
            ]
          : []),
        {
          name: translate(t, 'databaseMenu.policies', 'Policies'),
          key: 'policies',
          url: `/project/${ref}/auth/policies`,
          rightIcon: <ArrowUpRight strokeWidth={1} className="h-4 w-4" />,
          items: [],
        },
        {
          name: translate(t, 'databaseMenu.settings', 'Settings'),
          key: 'settings',
          url: `/project/${ref}/database/settings`,
          items: [],
        },
      ],
    },
    {
      title: translate(t, 'databaseMenu.platform', 'Platform'),
      items: [
        ...(showPgReplicate
          ? [
              {
                name: translate(t, 'databaseMenu.replication', 'Replication'),
                key: 'replication',
                url: `/project/${ref}/database/replication`,
                label: enablePgReplicate ? translate(t, 'databaseMenu.new', 'New') : undefined,
                items: [],
              },
            ]
          : []),
        ...(IS_PLATFORM
          ? [
              {
                name: translate(t, 'databaseMenu.backups', 'Backups'),
                key: 'backups',
                url: pitrEnabled
                  ? `/project/${ref}/database/backups/pitr`
                  : `/project/${ref}/database/backups/scheduled`,
                items: [],
              },
            ]
          : []),
        {
          name: translate(t, 'databaseMenu.migrations', 'Migrations'),
          key: 'migrations',
          url: `/project/${ref}/database/migrations`,
          items: [],
        },
        ...(showWrappers
          ? [
              {
                name: translate(t, 'databaseMenu.wrappers', 'Wrappers'),
                key: 'wrappers',
                url: `/project/${ref}/integrations?category=wrapper`,
                rightIcon: <ArrowUpRight strokeWidth={1} className="h-4 w-4" />,
                items: [],
              },
            ]
          : []),
        ...(!!pgNetExtensionExists
          ? [
              {
                name: translate(t, 'databaseMenu.webhooks', 'Webhooks'),
                key: 'hooks',
                url: `/project/${ref}/integrations/webhooks/overview`,
                rightIcon: <ArrowUpRight strokeWidth={1} className="h-4 w-4" />,
                items: [],
              },
            ]
          : []),
      ],
    },
    {
      title: translate(t, 'databaseMenu.tools', 'Tools'),
      items: [
        {
          name: translate(t, 'databaseMenu.securityAdvisor', 'Security Advisor'),
          key: 'security-advisor',
          url: `/project/${ref}/advisors/security`,
          rightIcon: <ArrowUpRight strokeWidth={1} className="h-4 w-4" />,
          items: [],
        },
        {
          name: translate(t, 'databaseMenu.performanceAdvisor', 'Performance Advisor'),
          key: 'performance-advisor',
          url: `/project/${ref}/advisors/performance`,
          rightIcon: <ArrowUpRight strokeWidth={1} className="h-4 w-4" />,
          items: [],
        },
        {
          name: translate(t, 'databaseMenu.queryPerformance', 'Query Performance'),
          key: 'query-performance',
          url: `/project/${ref}/observability/query-performance`,
          rightIcon: <ArrowUpRight strokeWidth={1} className="h-4 w-4" />,
          items: [],
        },
      ],
    },
  ]
}
