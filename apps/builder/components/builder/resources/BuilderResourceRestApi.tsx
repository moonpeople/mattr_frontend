import { useMemo } from 'react'

import { SelectContent_Shadcn_, SelectItem_Shadcn_, SelectTrigger_Shadcn_, SelectValue_Shadcn_, Select_Shadcn_, Textarea, Input_Shadcn_ } from 'ui'

import {
  BuilderResourceKeyValueList,
  buildKeyValueObject,
  normalizeKeyValueItems,
  type KeyValueItem,
} from './BuilderResourceKeyValueList'

type BuilderResourceRestApiProps = {
  config: Record<string, unknown>
  onChange: (config: Record<string, unknown>) => void
}

const METHOD_OPTIONS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD']

export const BuilderResourceRestApi = ({ config, onChange }: BuilderResourceRestApiProps) => {
  const method = typeof config.method === 'string' ? config.method : 'GET'
  const url = typeof config.url === 'string' ? config.url : ''
  const body = typeof config.body === 'string' ? config.body : config.body ? JSON.stringify(config.body, null, 2) : ''

  const urlParams = useMemo<KeyValueItem[]>(
    () => normalizeKeyValueItems(config.urlParams ?? config.params),
    [config.params, config.urlParams]
  )
  const headers = useMemo<KeyValueItem[]>(
    () => normalizeKeyValueItems(config.headers),
    [config.headers]
  )
  const cookies = useMemo<KeyValueItem[]>(
    () => normalizeKeyValueItems(config.cookies),
    [config.cookies]
  )

  const handleUpdate = (partial: Record<string, unknown>) => {
    onChange({ ...config, ...partial })
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-[110px_1fr]">
        <Select_Shadcn_ value={method} onValueChange={(value) => handleUpdate({ method: value })}>
          <SelectTrigger_Shadcn_ className="h-8 text-xs">
            <SelectValue_Shadcn_ />
          </SelectTrigger_Shadcn_>
          <SelectContent_Shadcn_>
            {METHOD_OPTIONS.map((option) => (
              <SelectItem_Shadcn_ key={option} value={option}>
                {option}
              </SelectItem_Shadcn_>
            ))}
          </SelectContent_Shadcn_>
        </Select_Shadcn_>
        <Input_Shadcn_
          placeholder="https://example.com/api/v1/endpoint"
          value={url}
          onChange={(event) => handleUpdate({ url: event.target.value })}
        />
      </div>

      <BuilderResourceKeyValueList
        label="URL parameters"
        items={urlParams}
        onChange={(items) => handleUpdate({ urlParams: items })}
      />

      <BuilderResourceKeyValueList
        label="Headers"
        items={headers}
        onChange={(items) => handleUpdate({ headers: buildKeyValueObject(items) })}
      />

      <div className="space-y-2">
        <div className="text-[11px] uppercase text-foreground-muted">Body</div>
        <Textarea
          className="min-h-[120px] text-xs"
          value={body}
          onChange={(event) => handleUpdate({ body: event.target.value })}
          placeholder='{"id": 1}'
        />
      </div>

      <BuilderResourceKeyValueList
        label="Cookies"
        items={cookies}
        onChange={(items) => handleUpdate({ cookies: items })}
      />
    </div>
  )
}
