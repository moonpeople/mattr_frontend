import { Blocks, Code, Database, History, Search } from 'lucide-react'

import { useParams } from 'common'
import { COMMAND_MENU_SECTIONS } from 'components/interfaces/App/CommandMenu/CommandMenu.utils'
import { orderCommandSectionsByPriority } from 'components/interfaces/App/CommandMenu/ordering'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useI18n } from 'lib/i18n'
import type { CommandOptions } from 'ui-patterns/CommandMenu'
import { useRegisterCommands } from 'ui-patterns/CommandMenu'
import { IRouteCommand } from 'ui-patterns/CommandMenu/internal/types'

export function useDatabaseGotoCommands(options?: CommandOptions) {
  let { ref } = useParams()
  ref ||= '_'
  const { t } = useI18n()

  const databaseLabel = t('nav.database', 'Database')
  const formatValue = (label: string) => `${databaseLabel}: ${label}`

  const { databaseReplication, databaseRoles, integrationsWrappers } = useIsFeatureEnabled([
    'database:replication',
    'database:roles',
    'integrations:wrappers',
  ])

  useRegisterCommands(
    COMMAND_MENU_SECTIONS.QUERY,
    [
      {
        id: 'run-sql',
        name: t('databaseCommands.runSql', 'Run SQL'),
        route: `/project/${ref}/sql/new`,
        icon: () => <Code />,
      },
    ],
    {
      ...options,
      deps: [ref],
      orderSection: orderCommandSectionsByPriority,
      sectionMeta: { priority: 2 },
    }
  )

  useRegisterCommands(
    COMMAND_MENU_SECTIONS.NAVIGATE,
    [
      {
        id: 'nav-database-tables',
        name: t('databaseMenu.tables', 'Tables'),
        value: formatValue(t('databaseMenu.tables', 'Tables')),
        route: `/project/${ref}/database/tables`,
        defaultHidden: true,
      },
      {
        id: 'nav-database-triggers',
        name: t('databaseMenu.triggers', 'Triggers'),
        value: formatValue(t('databaseMenu.triggers', 'Triggers')),
        route: `/project/${ref}/database/triggers`,
        defaultHidden: true,
      },
      {
        id: 'nav-database-functions',
        name: t('databaseMenu.functions', 'Functions'),
        value: formatValue(t('databaseMenu.functions', 'Functions')),
        route: `/project/${ref}/database/functions`,
        defaultHidden: true,
      },
      {
        id: 'nav-database-extensions',
        name: t('databaseMenu.extensions', 'Extensions'),
        value: formatValue(t('databaseMenu.extensions', 'Extensions')),
        route: `/project/${ref}/database/extensions`,
        defaultHidden: true,
      },
      ...(databaseRoles
        ? [
            {
              id: 'nav-database-roles',
              name: t('databaseMenu.roles', 'Roles'),
              value: formatValue(t('databaseMenu.roles', 'Roles')),
              route: `/project/${ref}/database/roles`,
              defaultHidden: true,
            } as IRouteCommand,
          ]
        : []),
      ...(databaseReplication
        ? [
            {
              id: 'nav-database-replication',
              name: t('databaseMenu.replication', 'Replication'),
              value: formatValue(t('databaseMenu.replication', 'Replication')),
              route: `/project/${ref}/database/replication`,
              defaultHidden: true,
            } as IRouteCommand,
          ]
        : []),
      {
        id: 'nav-database-hooks',
        name: t('databaseMenu.webhooks', 'Webhooks'),
        value: formatValue(t('databaseMenu.webhooks', 'Webhooks')),
        route: `/project/${ref}/integrations/webhooks`,
        defaultHidden: true,
      },
      {
        id: 'nav-database-backups',
        name: t('databaseMenu.backups', 'Backups'),
        value: formatValue(t('databaseMenu.backups', 'Backups')),
        route: `/project/${ref}/database/backups/scheduled`,
        defaultHidden: true,
      },
      ...(integrationsWrappers
        ? [
            {
              id: 'nav-database-wrappers',
              name: t('databaseMenu.wrappers', 'Wrappers'),
              value: formatValue(t('databaseMenu.wrappers', 'Wrappers')),
              route: `/project/${ref}/integrations?category=wrappers`,
              defaultHidden: true,
            } as IRouteCommand,
          ]
        : []),
      {
        id: 'nav-database-migrations',
        name: t('databaseMenu.migrations', 'Migrations'),
        value: formatValue(t('databaseMenu.migrations', 'Migrations')),
        route: `/project/${ref}/database/migrations`,
        defaultHidden: true,
      },
    ],
    { ...options, deps: [ref] }
  )

  useRegisterCommands(
    COMMAND_MENU_SECTIONS.DATABASE,
    [
      {
        id: 'run-schema-visualizer',
        name: t('databaseCommands.viewSchemas', 'View your schemas'),
        route: `/project/${ref}/database/schemas`,
        icon: () => <Search />,
      },
      {
        id: 'run-view-database-functions',
        name: t('databaseCommands.viewFunctions', 'View and create functions'),
        route: `/project/${ref}/database/functions`,
        icon: () => <Database />,
      },
      {
        id: 'run-view-database-triggers',
        name: t('databaseCommands.viewTriggers', 'View and create triggers'),
        route: `/project/${ref}/database/triggers`,
        icon: () => <Database />,
      },
      {
        id: 'run-view-database-enumerated-types',
        name: t('databaseCommands.viewTypes', 'View and create enumerated types'),
        route: `/project/${ref}/database/types`,
        icon: () => <Database />,
      },
      {
        id: 'run-view-database-extensions',
        name: t('databaseCommands.viewExtensions', 'View your extensions'),
        route: `/project/${ref}/database/extensions`,
        icon: () => <Blocks />,
      },
      {
        id: 'run-view-database-indexes',
        name: t('databaseCommands.viewIndexes', 'View and create indexes'),
        route: `/project/${ref}/database/indexes`,
        icon: () => <Database />,
      },
      ...(databaseRoles
        ? [
            {
              id: 'run-view-database-roles',
              name: t('databaseCommands.viewRoles', 'View your roles'),
              route: `/project/${ref}/database/roles`,
              icon: () => <Database />,
            } as IRouteCommand,
          ]
        : []),
      {
        id: 'run-view-database-backups',
        name: t('databaseCommands.viewBackups', 'View your backups'),
        route: `/project/${ref}/database/backups/scheduled`,
        icon: () => <Database />,
      },
      {
        id: 'run-view-database-migrations',
        name: t('databaseCommands.viewMigrations', 'View your migrations'),
        route: `/project/${ref}/database/migrations`,
        icon: () => <History />,
      },
    ],
    {
      ...options,
      deps: [ref],
      orderSection: orderCommandSectionsByPriority,
      sectionMeta: { priority: 3 },
    }
  )
}
