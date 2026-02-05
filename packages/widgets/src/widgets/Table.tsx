import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from 'ui'
import { ArrowUp, Check, Database, Download, Filter, RotateCw } from 'lucide-react'

import type { WidgetDefinition } from '../types'
import { normalizeArray, parseMaybeJson } from '../helpers'

type TableColumn = {
  key: string
  label?: string
}

type TableProps = {
  data: string
  columns: string
  showHeader: boolean
  striped: boolean
  rowLimit: number
  events: string
}

const toColumns = (columns: unknown, data: Record<string, unknown>[]) => {
  const parsed = normalizeArray<TableColumn | string>(columns, [])
  if (parsed.length > 0) {
    return parsed.map((entry) => {
      if (typeof entry === 'string') {
        return { key: entry, label: entry }
      }
      return { key: entry.key, label: entry.label ?? entry.key }
    })
  }

  if (data.length > 0) {
    return Object.keys(data[0]).map((key) => ({ key, label: key }))
  }

  return []
}

type SampleRow = {
  id: number
  user: {
    name: string
    email: string
    initials: string
    tone: 'violet' | 'rose' | 'blue' | 'amber'
  }
  role: {
    label: string
    tone: 'emerald' | 'amber' | 'violet'
  }
  enabled: boolean
  createdAt: string
  teams: Array<{ label: string; tone: 'amber' | 'blue' | 'emerald' | 'violet' | 'rose' }>
}

const SAMPLE_ROWS: SampleRow[] = [
  {
    id: 10,
    user: {
      name: 'Amberly Fender',
      email: 'amberlyfender@outlook.com',
      initials: 'AF',
      tone: 'violet',
    },
    role: { label: 'Editor', tone: 'emerald' },
    enabled: true,
    createdAt: 'Apr 24, 2023',
    teams: [
      { label: 'Engineering', tone: 'amber' },
      { label: 'Sales', tone: 'blue' },
    ],
  },
  {
    id: 96,
    user: {
      name: 'Amberly Hellcat',
      email: 'ahellcat@gmail.com',
      initials: 'AH',
      tone: 'rose',
    },
    role: { label: 'Editor', tone: 'emerald' },
    enabled: false,
    createdAt: 'Mar 31, 2023',
    teams: [
      { label: 'Marketing', tone: 'emerald' },
      { label: 'Sales', tone: 'blue' },
    ],
  },
  {
    id: 73,
    user: {
      name: 'Amberly Worling',
      email: 'amberlyworling@yahoo.com',
      initials: 'AW',
      tone: 'violet',
    },
    role: { label: 'Editor', tone: 'emerald' },
    enabled: false,
    createdAt: 'Aug 15, 2022',
    teams: [
      { label: 'Recruiting', tone: 'blue' },
      { label: 'Design', tone: 'amber' },
    ],
  },
  {
    id: 68,
    user: {
      name: 'Anica Ansteys',
      email: 'a.ansteys@outlook.com',
      initials: 'AA',
      tone: 'blue',
    },
    role: { label: 'Viewer', tone: 'violet' },
    enabled: false,
    createdAt: 'Jul 25, 2022',
    teams: [
      { label: 'Support', tone: 'violet' },
      { label: 'Finance', tone: 'rose' },
    ],
  },
  {
    id: 51,
    user: {
      name: 'Anica Whitelock',
      email: 'anicawhitelock@yahoo.com',
      initials: 'AW',
      tone: 'violet',
    },
    role: { label: 'Admin', tone: 'amber' },
    enabled: false,
    createdAt: 'Jun 29, 2022',
    teams: [{ label: 'Engineering', tone: 'amber' }],
  },
  {
    id: 44,
    user: {
      name: 'Arley Goodayle',
      email: 'agoodayle@gmail.com',
      initials: 'AG',
      tone: 'blue',
    },
    role: { label: 'Editor', tone: 'emerald' },
    enabled: true,
    createdAt: 'Dec 14, 2021',
    teams: [
      { label: 'Workplace', tone: 'amber' },
      { label: 'Support', tone: 'violet' },
    ],
  },
]

const toneClassMap = {
  emerald: 'bg-emerald-100 text-emerald-900',
  amber: 'bg-amber-100 text-amber-900',
  violet: 'bg-violet-100 text-violet-900',
  blue: 'bg-blue-100 text-blue-900',
  rose: 'bg-rose-100 text-rose-900',
}

const avatarToneClassMap = {
  violet: 'bg-violet-100 text-violet-900',
  rose: 'bg-rose-100 text-rose-900',
  blue: 'bg-blue-100 text-blue-900',
  amber: 'bg-amber-100 text-amber-900',
}

const renderRetoolPreview = () => {
  return (
    <div className="rounded-lg border border-foreground-muted/30 bg-surface-100 shadow-sm">
      <Table className="text-sm">
        <TableHeader className="[&_tr]:bg-surface-100">
          <TableRow>
            <TableHead className="text-xs font-semibold text-foreground">ID</TableHead>
            <TableHead className="text-xs font-semibold text-foreground">
              <span className="inline-flex items-center gap-1">
                <span>User</span>
                <ArrowUp className="h-3 w-3 text-foreground-muted" />
              </span>
            </TableHead>
            <TableHead className="text-xs font-semibold text-foreground">Role</TableHead>
            <TableHead className="text-xs font-semibold text-foreground">Enabled</TableHead>
            <TableHead className="text-xs font-semibold text-foreground">Created at</TableHead>
            <TableHead className="text-xs font-semibold text-foreground">Teams</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {SAMPLE_ROWS.map((row) => (
            <TableRow key={row.id} className="hover:bg-surface-200/60">
              <TableCell className="py-3 font-medium text-foreground">{row.id}</TableCell>
              <TableCell className="py-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold ${avatarToneClassMap[row.user.tone]}`}
                  >
                    {row.user.initials}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium text-foreground">{row.user.name}</span>
                    <span className="text-xs text-foreground-muted">{row.user.email}</span>
                  </div>
                </div>
              </TableCell>
              <TableCell className="py-3">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${toneClassMap[row.role.tone]}`}
                >
                  {row.role.label}
                </span>
              </TableCell>
              <TableCell className="py-3">
                {row.enabled ? (
                  <Check className="h-4 w-4 text-brand-600" />
                ) : (
                  <span className="text-xs text-foreground-muted">-</span>
                )}
              </TableCell>
              <TableCell className="py-3">{row.createdAt}</TableCell>
              <TableCell className="py-3">
                <div className="flex flex-wrap gap-2">
                  {row.teams.map((team) => (
                    <span
                      key={`${row.id}-${team.label}`}
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${toneClassMap[team.tone]}`}
                    >
                      {team.label}
                    </span>
                  ))}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow className="border-b-0">
            <TableCell colSpan={6} className="py-2">
              <div className="flex items-center justify-between text-xs text-foreground-muted">
                <span className="inline-flex items-center gap-1">
                  <Database className="h-3 w-3" />
                  <span>100 results</span>
                </span>
                <div className="flex items-center gap-3 text-foreground-muted">
                  <Filter className="h-4 w-4" />
                  <Download className="h-4 w-4" />
                  <RotateCw className="h-4 w-4" />
                </div>
              </div>
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  )
}

export const TableWidget: WidgetDefinition<TableProps> = {
  type: 'Table',
  label: 'Table',
  category: 'data',
  description: 'Tabular data view',
  defaultProps: {
    data: JSON.stringify(
      [
        { name: 'Acme', status: 'Active', seats: 12 },
        { name: 'Globex', status: 'Trial', seats: 4 },
      ],
      null,
      2
    ),
    columns: '',
    showHeader: true,
    striped: true,
    rowLimit: 10,
    events: '[]',
  },
  fields: [
    {
      key: 'data',
      label: 'Data (JSON)',
      type: 'json',
      placeholder: '[{\"name\":\"Acme\",\"status\":\"Active\"}]',
    },
    {
      key: 'columns',
      label: 'Columns (JSON)',
      type: 'json',
      placeholder: '[{\"key\":\"name\",\"label\":\"Name\"}]',
    },
    { key: 'showHeader', label: 'Show header', type: 'boolean' },
    { key: 'striped', label: 'Striped', type: 'boolean' },
    { key: 'rowLimit', label: 'Row limit', type: 'number', min: 1, max: 100 },
    {
      key: 'events',
      label: 'Events (JSON)',
      type: 'json',
      placeholder: '[{\"event\":\"rowClick\",\"type\":\"query\",\"queryName\":\"onRow\"}]',
    },
  ],
  render: (props, context) => {
    if (context?.mode === 'canvas') {
      return renderRetoolPreview()
    }

    const parsedData = normalizeArray<Record<string, unknown>>(parseMaybeJson(props.data), [])
    const limit =
      typeof props.rowLimit === 'number' && props.rowLimit > 0
        ? props.rowLimit
        : parsedData.length
    const data = parsedData.slice(0, limit)
    const columns = toColumns(parseMaybeJson(props.columns), parsedData)

    if (columns.length === 0) {
      return (
        <div className="rounded-md border border-dashed border-foreground-muted/40 px-3 py-6 text-center text-xs text-foreground-muted">
          Provide table data to preview rows.
        </div>
      )
    }

    return (
      <div className="rounded-lg border border-foreground-muted/30 bg-surface-100 shadow-sm">
        <Table>
          {props.showHeader && (
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead key={column.key}>{column.label}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
          )}
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-xs text-foreground-muted">
                  No rows
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, index) => (
                <TableRow
                  key={index}
                  className={props.striped && index % 2 === 1 ? 'bg-surface-200/40' : undefined}
                  onClick={() => context?.runActions?.('rowClick', { row, index })}
                >
                  {columns.map((column) => (
                    <TableCell key={`${index}-${column.key}`}>
                      {String(row[column.key] ?? '')}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    )
  },
}
