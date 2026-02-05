import { AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react'

import { Badge, Separator } from 'ui'

import type { BuilderQueryRunResult } from './types'

type BuilderCodeOutputPanelProps = {
  result?: BuilderQueryRunResult | null
}

const formatPayload = (value: unknown) => {
  if (typeof value === 'string') {
    return value
  }
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

export const BuilderCodeOutputPanel = ({ result }: BuilderCodeOutputPanelProps) => {
  const status = result?.status

  return (
    <div className="builder-panel h-full border-l border-foreground-muted/30 bg-surface-100">
      <div className="builder-panel-header flex h-9 items-center justify-between border-b border-foreground-muted/30 bg-surface-200 px-3 text-[11px] font-semibold">
        <span>Output</span>
        {status && (
          <Badge>
            {status === 'running' ? (
              <span className="flex items-center gap-1">
                <Loader2 size={12} className="animate-spin" />
                Running
              </span>
            ) : status === 'success' ? (
              <span className="flex items-center gap-1">
                <CheckCircle2 size={12} />
                Success
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <AlertTriangle size={12} />
                Error
              </span>
            )}
          </Badge>
        )}
      </div>
      <Separator />
      <div className="h-[calc(100%-34px)] overflow-auto p-3 text-xs text-foreground-muted">
        {!result ? (
          <div className="flex h-full items-center justify-center text-center text-[11px] text-foreground-muted">
            No query ran yet. Click Run to see the output.
          </div>
        ) : result.status === 'error' ? (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 p-2 text-destructive">
            {result.error ?? 'Query failed'}
          </div>
        ) : result.status === 'running' ? (
          <div className="flex items-center gap-2 text-foreground-muted">
            <Loader2 size={14} className="animate-spin" />
            Running query...
          </div>
        ) : (
          <pre className="whitespace-pre-wrap rounded-md border border-foreground-muted/30 bg-surface-75 p-2 text-[11px] text-foreground">
            {formatPayload(result.data)}
          </pre>
        )}
      </div>
    </div>
  )
}
