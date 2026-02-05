import { Textarea } from 'ui'

type BuilderResourceSqlProps = {
  config: Record<string, unknown>
  onChange: (config: Record<string, unknown>) => void
}

export const BuilderResourceSql = ({ config, onChange }: BuilderResourceSqlProps) => {
  const query = typeof config.query === 'string' ? config.query : ''

  return (
    <div className="space-y-2">
      <div className="text-[11px] uppercase text-foreground-muted">SQL query</div>
      <Textarea
        className="min-h-[160px] font-mono text-xs"
        value={query}
        onChange={(event) => onChange({ ...config, query: event.target.value })}
        placeholder="select * from users;"
      />
    </div>
  )
}
