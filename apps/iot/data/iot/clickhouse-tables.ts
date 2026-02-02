import { useQuery } from '@tanstack/react-query'

import type { UseQueryOptions } from 'types'
import { IOT_DEFAULT_API_KEY } from 'lib/constants'
import { runIotClickhouseSql } from './clickhouse-sql'

export type ClickhouseTableRow = {
  database: string
  name: string
  engine?: string | null
  total_rows?: number | string | null
  total_bytes?: number | string | null
}

const CLICKHOUSE_TABLES_SQL = `
SELECT
  database,
  name,
  engine,
  total_rows,
  total_bytes
FROM system.tables
WHERE database NOT IN ('system', 'INFORMATION_SCHEMA', 'information_schema')
ORDER BY database, name
`.trim()

export const useIotClickhouseTablesQuery = (
  options: Omit<UseQueryOptions<ClickhouseTableRow[]>, 'queryKey' | 'queryFn'> = {}
) =>
  useQuery<ClickhouseTableRow[]>({
    queryKey: ['iot', 'clickhouse', 'tables'],
    queryFn: () => runIotClickhouseSql(CLICKHOUSE_TABLES_SQL, IOT_DEFAULT_API_KEY, null),
    ...options,
  })
