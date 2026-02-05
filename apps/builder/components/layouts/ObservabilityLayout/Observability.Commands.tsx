import { useMemo } from 'react'

import { useParams } from 'common'
import { COMMAND_MENU_SECTIONS } from 'components/interfaces/App/CommandMenu/CommandMenu.utils'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useI18n } from 'lib/i18n'
import type { CommandOptions, ICommand } from 'ui-patterns/CommandMenu'
import { orderSectionFirst, useQuery, useRegisterCommands } from 'ui-patterns/CommandMenu'

const QUERY_PERFORMANCE_COMMAND_ID = 'nav-reports-query-performance'

export function useReportsGotoCommands(options?: CommandOptions) {
  let { ref } = useParams()
  ref ||= '_'
  const { t } = useI18n()

  const { reportsAll } = useIsFeatureEnabled(['reports:all'])

  const commandQuery = useQuery()?.toLowerCase() ?? ''
  const prioritizeQueryPerformance = commandQuery.includes('query')

  const orderQueryPerformanceCommand = useMemo(() => {
    if (!prioritizeQueryPerformance) return undefined

    return (existingCommands: ICommand[], incomingCommands: ICommand[]) => {
      const filteredExisting = existingCommands.filter(
        (command) => command.id !== QUERY_PERFORMANCE_COMMAND_ID
      )

      return [...incomingCommands, ...filteredExisting]
    }
  }, [prioritizeQueryPerformance])

  const orderNavigateSection = useMemo<CommandOptions['orderSection'] | undefined>(() => {
    return prioritizeQueryPerformance ? orderSectionFirst : options?.orderSection
  }, [options?.orderSection, prioritizeQueryPerformance])

  useRegisterCommands(
    COMMAND_MENU_SECTIONS.NAVIGATE,
    reportsAll
      ? [
          {
            id: 'nav-reports',
            name: t('observabilityCommands.reports', 'Reports'),
            route: `/project/${ref}/observability`,
            defaultHidden: true,
          },
          {
            id: 'nav-reports-api',
            name: t('observabilityCommands.apiReports', 'API Reports'),
            route: `/project/${ref}/observability/api-overview`,
            defaultHidden: true,
          },
          {
            id: 'nav-reports-storage',
            name: t('observabilityCommands.storageReports', 'Storage Reports'),
            route: `/project/${ref}/observability/storage`,
            defaultHidden: true,
          },
          {
            id: 'nav-reports-database',
            name: t('observabilityCommands.databaseReports', 'Database Reports'),
            route: `/project/${ref}/observability/database`,
            defaultHidden: true,
          },
        ]
      : [],
    {
      ...options,
      orderSection: orderNavigateSection,
      deps: [ref, orderNavigateSection, ...(options?.deps ?? [])],
    }
  )

  useRegisterCommands(
    COMMAND_MENU_SECTIONS.NAVIGATE,
    reportsAll
      ? [
          {
            id: QUERY_PERFORMANCE_COMMAND_ID,
            name: t('observabilityCommands.queryPerformanceReports', 'Query Performance Reports'),
            route: `/project/${ref}/observability/query-performance`,
            defaultHidden: true,
          },
        ]
      : [],
    {
      ...options,
      orderCommands: orderQueryPerformanceCommand ?? options?.orderCommands,
      orderSection: orderNavigateSection,
      deps: [ref, orderQueryPerformanceCommand, orderNavigateSection, ...(options?.deps ?? [])],
    }
  )
}
