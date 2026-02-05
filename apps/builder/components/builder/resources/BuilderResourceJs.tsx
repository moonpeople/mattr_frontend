import { Textarea } from 'ui'

type BuilderResourceJsProps = {
  config: Record<string, unknown>
  onChange: (config: Record<string, unknown>) => void
}

export const BuilderResourceJs = ({ config, onChange }: BuilderResourceJsProps) => {
  const code = typeof config.code === 'string' ? config.code : ''

  return (
    <div className="space-y-2">
      <div className="text-[11px] uppercase text-foreground-muted">Code</div>
      <Textarea
        className="min-h-[160px] font-mono text-xs"
        value={code}
        onChange={(event) => onChange({ ...config, code: event.target.value })}
        placeholder="return data"
      />
    </div>
  )
}
