import { useParams } from 'common'
import { COMMAND_MENU_SECTIONS } from 'components/interfaces/App/CommandMenu/CommandMenu.utils'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useI18n } from 'lib/i18n'
import type { CommandOptions } from 'ui-patterns/CommandMenu'
import { useRegisterCommands } from 'ui-patterns/CommandMenu'
import { IRouteCommand } from 'ui-patterns/CommandMenu/internal/types'

export function useLogsGotoCommands(options?: CommandOptions) {
  let { ref } = useParams()
  ref ||= '_'
  const { t } = useI18n()

  const { logsCollections } = useIsFeatureEnabled(['logs:collections'])

  useRegisterCommands(
    COMMAND_MENU_SECTIONS.NAVIGATE,
    [
      {
        id: 'nav-logs-explorer',
        name: t('logsCommands.logsExplorer', 'Logs Explorer'),
        route: `/project/${ref}/logs/explorer`,
        defaultHidden: true,
      },
      ...(logsCollections
        ? ([
            {
              id: 'nav-logs-postgres',
              name: t('logsCommands.postgresLogs', 'Postgres Logs'),
              route: `/project/${ref}/logs/postgres-logs`,
              defaultHidden: true,
            },
            {
              id: 'nav-logs-postgrest',
              name: t('logsCommands.postgrestLogs', 'PostgREST Logs'),
              route: `/project/${ref}/logs/postgrest-logs`,
              defaultHidden: true,
            },
            {
              id: 'nav-logs-pooler',
              name: t('logsCommands.poolerLogs', 'Pooler Logs'),
              route: `/project/${ref}/logs/pooler-logs`,
              defaultHidden: true,
            },
            {
              id: 'nav-logs-auth',
              name: t('logsCommands.authLogs', 'Auth Logs'),
              route: `/project/${ref}/logs/auth-logs`,
              defaultHidden: true,
            },
            {
              id: 'nav-logs-storage',
              name: t('logsCommands.storageLogs', 'Storage Logs'),
              route: `/project/${ref}/logs/storage-logs`,
              defaultHidden: true,
            },
            {
              id: 'nav-logs-realtime',
              name: t('logsCommands.realtimeLogs', 'Realtime Logs'),
              route: `/project/${ref}/logs/realtime-logs`,
              defaultHidden: true,
            },
          ] as IRouteCommand[])
        : []),
    ],
    { ...options, deps: [ref] }
  )
}
