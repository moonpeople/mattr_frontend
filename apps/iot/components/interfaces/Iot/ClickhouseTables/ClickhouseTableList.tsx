import { Search } from 'lucide-react'
import { useMemo, useState } from 'react'

import AlertError from 'components/ui/AlertError'
import { useIotClickhouseTablesQuery } from 'data/iot/clickhouse-tables'
import { formatBytes } from 'lib/helpers'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

const normalizeRow = (row: {
  database: string
  name: string
  engine?: string | null
  total_rows?: number | string | null
  total_bytes?: number | string | null
}) => ({
  database: String(row.database ?? ''),
  name: String(row.name ?? ''),
  engine: row.engine ? String(row.engine) : '',
  totalRows:
    row.total_rows === null || row.total_rows === undefined ? undefined : Number(row.total_rows),
  totalBytes:
    row.total_bytes === null || row.total_bytes === undefined ? undefined : Number(row.total_bytes),
})

export const ClickhouseTableList = () => {
  const [search, setSearch] = useState('')
  const { data, isPending, isError, error } = useIotClickhouseTablesQuery()

  const normalized = useMemo(() => (data ?? []).map(normalizeRow), [data])
  const filtered = useMemo(() => {
    if (!search) return normalized
    const query = search.toLowerCase()
    return normalized.filter(
      (row) =>
        row.database.toLowerCase().includes(query) ||
        row.name.toLowerCase().includes(query) ||
        row.engine.toLowerCase().includes(query)
    )
  }, [normalized, search])

  return (
    <Card>
      <CardHeader className="space-y-3">
        <CardTitle>Tables</CardTitle>
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-foreground-muted" />
          <Input
            placeholder="Search tables"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {isPending && <GenericSkeletonLoader />}
        {isError && <AlertError error={error} subject="Failed to load ClickHouse tables" />}
        {!isPending && !isError && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Database</TableHead>
                <TableHead>Table</TableHead>
                <TableHead>Engine</TableHead>
                <TableHead className="text-right">Rows</TableHead>
                <TableHead className="text-right">Size</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-foreground-muted">
                    No tables found
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((row) => (
                <TableRow key={`${row.database}.${row.name}`}>
                  <TableCell>{row.database || '-'}</TableCell>
                  <TableCell className="font-medium">{row.name}</TableCell>
                  <TableCell>{row.engine || '-'}</TableCell>
                  <TableCell className="text-right">
                    {row.totalRows === undefined || Number.isNaN(row.totalRows)
                      ? '-'
                      : row.totalRows.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {row.totalBytes === undefined || Number.isNaN(row.totalBytes)
                      ? '-'
                      : formatBytes(row.totalBytes)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
