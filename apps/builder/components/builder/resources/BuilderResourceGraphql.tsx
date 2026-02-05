import { useMemo } from 'react'

import { Input_Shadcn_, Textarea } from 'ui'

import {
  BuilderResourceKeyValueList,
  buildKeyValueObject,
  normalizeKeyValueItems,
  type KeyValueItem,
} from './BuilderResourceKeyValueList'

type BuilderResourceGraphqlProps = {
  config: Record<string, unknown>
  onChange: (config: Record<string, unknown>) => void
}

export const BuilderResourceGraphql = ({ config, onChange }: BuilderResourceGraphqlProps) => {
  const url = typeof config.url === 'string' ? config.url : ''
  const query = typeof config.query === 'string' ? config.query : ''
  const variables =
    typeof config.variables === 'string'
      ? config.variables
      : config.variables
        ? JSON.stringify(config.variables, null, 2)
        : ''

  const headers = useMemo<KeyValueItem[]>(
    () => normalizeKeyValueItems(config.headers),
    [config.headers]
  )

  const handleUpdate = (partial: Record<string, unknown>) => {
    onChange({ ...config, ...partial })
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <div className="text-[11px] uppercase text-foreground-muted">URL</div>
        <Input_Shadcn_
          placeholder="https://example.com/graphql"
          value={url}
          onChange={(event) => handleUpdate({ url: event.target.value })}
        />
      </div>

      <BuilderResourceKeyValueList
        label="Headers"
        items={headers}
        onChange={(items) => handleUpdate({ headers: buildKeyValueObject(items) })}
      />

      <div className="space-y-2">
        <div className="text-[11px] uppercase text-foreground-muted">Query</div>
        <Textarea
          className="min-h-[140px] font-mono text-xs"
          value={query}
          onChange={(event) => handleUpdate({ query: event.target.value })}
          placeholder="query { users { id name } }"
        />
      </div>

      <div className="space-y-2">
        <div className="text-[11px] uppercase text-foreground-muted">Variables</div>
        <Textarea
          className="min-h-[120px] font-mono text-xs"
          value={variables}
          onChange={(event) => handleUpdate({ variables: event.target.value })}
          placeholder='{"id": 1}'
        />
      </div>
    </div>
  )
}
