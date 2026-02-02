import { useEffect, useMemo, useRef, useState } from 'react'
import { Trash2 } from 'lucide-react'
import {
  Button,
  Input_Shadcn_,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
} from 'ui'
import type { DefaultNodeSettingsProps } from './DefaultNodeSettings'
import NodeSettingsValidation from './NodeSettingsValidation'

type RenameEntry = {
  source: string
  target: string
}

type RenameSource = 'DATA' | 'METADATA'

const normalizeString = (value: unknown) =>
  typeof value === 'string' ? value.trim() : ''

const normalizeRenameSource = (value: unknown): RenameSource => {
  if (typeof value === 'boolean') {
    return value ? 'METADATA' : 'DATA'
  }

  const normalized = normalizeString(value).toUpperCase()
  return normalized === 'METADATA' ? 'METADATA' : 'DATA'
}

const parseConfig = (nodeConfigText: string) => {
  let parsed: Record<string, any> = {}
  if (nodeConfigText.trim()) {
    try {
      const raw = JSON.parse(nodeConfigText)
      parsed = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {}
    } catch (_err) {
      parsed = {}
    }
  }

  const mapping =
    (typeof parsed.renameKeysMapping === 'object' && parsed.renameKeysMapping) ||
    (typeof parsed.rename_keys_mapping === 'object' && parsed.rename_keys_mapping) ||
    (typeof parsed.mapping === 'object' && parsed.mapping) ||
    {}

  const renameIn =
    parsed.renameIn ??
    parsed.rename_in ??
    parsed.fromMetadata ??
    parsed.from_metadata ??
    'DATA'

  const entries: RenameEntry[] = Object.entries(mapping).map(([source, target]) => ({
    source: normalizeString(source),
    target: normalizeString(target),
  }))

  return { raw: parsed, entries, renameIn: normalizeRenameSource(renameIn) }
}

const buildPayload = (base: Record<string, any>, entries: RenameEntry[], renameIn: RenameSource) => {
  const mapping = entries.reduce<Record<string, string>>((acc, entry) => {
    const source = normalizeString(entry.source)
    const target = normalizeString(entry.target)
    if (!source || !target) return acc
    acc[source] = target
    return acc
  }, {})

  const payload: Record<string, any> = {
    ...(base || {}),
    renameIn,
    renameKeysMapping: mapping,
  }

  delete payload.rename_keys_mapping
  delete payload.mapping
  delete payload.rename_in
  delete payload.fromMetadata
  delete payload.from_metadata

  return payload
}

const TransformRenameKeysNodeSettings = ({
  nodeConfigText,
  nodeConfigError,
  onNodeConfigTextChange,
  validationErrors,
  dataTypeKeyOptions,
}: DefaultNodeSettingsProps) => {
  const config = useMemo(() => parseConfig(nodeConfigText), [nodeConfigText])
  const options = dataTypeKeyOptions ?? []
  const [entries, setEntries] = useState<RenameEntry[]>(config.entries)
  const [renameIn, setRenameIn] = useState<RenameSource>(config.renameIn)
  const lastConfigTextRef = useRef(nodeConfigText)

  useEffect(() => {
    if (nodeConfigText === lastConfigTextRef.current) return
    setEntries(config.entries)
    setRenameIn(config.renameIn)
    lastConfigTextRef.current = nodeConfigText
  }, [config.entries, config.renameIn, nodeConfigText])

  const updateRenameIn = (nextRenameIn: RenameSource) => {
    const payload = buildPayload(config.raw, entries, nextRenameIn)
    const nextText = JSON.stringify(payload, null, 2)
    setRenameIn(nextRenameIn)
    lastConfigTextRef.current = nextText
    onNodeConfigTextChange(nextText)
  }

  const updateEntries = (nextEntries: RenameEntry[]) => {
    const payload = buildPayload(config.raw, nextEntries, renameIn)
    const nextText = JSON.stringify(payload, null, 2)
    setEntries(nextEntries)
    lastConfigTextRef.current = nextText
    onNodeConfigTextChange(nextText)
  }

  const localErrors = useMemo(() => {
    const errors: string[] = []
    entries.forEach((entry, index) => {
      if (!normalizeString(entry.source) && normalizeString(entry.target)) {
        errors.push(`Row ${index + 1}: source key is required.`)
      }
      if (normalizeString(entry.source) && !normalizeString(entry.target)) {
        errors.push(`Row ${index + 1}: target key is required.`)
      }
    })
    return errors
  }, [entries])

  const combinedErrors = [...localErrors, ...(validationErrors ?? [])]

  return (
    <>
      <div className="space-y-3">
        <div className="space-y-1">
          <p className="text-xs text-foreground-light">Rename keys</p>
          {nodeConfigError && <p className="text-xs text-destructive-600">{nodeConfigError}</p>}
        </div>

        <div className="space-y-1">
          <p className="text-xs text-foreground-light">Rename in</p>
          <Select_Shadcn_
            value={renameIn}
            onValueChange={(value) => updateRenameIn(value as RenameSource)}
          >
            <SelectTrigger_Shadcn_ size="tiny">
              <SelectValue_Shadcn_ placeholder="Select source" />
            </SelectTrigger_Shadcn_>
            <SelectContent_Shadcn_>
              <SelectItem_Shadcn_ value="DATA" className="text-xs">
                DATA (payload)
              </SelectItem_Shadcn_>
              <SelectItem_Shadcn_ value="METADATA" className="text-xs">
                METADATA
              </SelectItem_Shadcn_>
            </SelectContent_Shadcn_>
          </Select_Shadcn_>
        </div>

        {entries.length > 0 && (
          <div className="space-y-2">
            <div className="grid grid-cols-[1fr_1fr_auto] gap-2 text-[11px] uppercase text-foreground-light">
              <span>Source key</span>
              <span>Target key (data type key)</span>
              <span />
            </div>
            {entries.map((entry, index) => (
              <div
                key={`rename-entry-${index}`}
                className="grid grid-cols-[1fr_1fr_auto] gap-2"
              >
                <Input_Shadcn_
                  value={entry.source}
                  onChange={(event) => {
                    const next = [...entries]
                    next[index] = { ...next[index], source: event.target.value }
                    updateEntries(next)
                  }}
                  size="tiny"
                  placeholder="http_voltage_1"
                />
                <Select_Shadcn_
                  value={entry.target}
                  onValueChange={(value) => {
                    const next = [...entries]
                    next[index] = { ...next[index], target: value }
                    updateEntries(next)
                  }}
                  disabled={options.length === 0}
                >
                  <SelectTrigger_Shadcn_ size="tiny">
                    <SelectValue_Shadcn_
                      placeholder={options.length === 0 ? 'No data type keys' : 'Select key'}
                    />
                  </SelectTrigger_Shadcn_>
                  <SelectContent_Shadcn_>
                    {options.map((option) => (
                      <SelectItem_Shadcn_
                        key={`rename-target-${option.value}`}
                        value={option.value}
                        className="text-xs"
                      >
                        {option.label}
                      </SelectItem_Shadcn_>
                    ))}
                  </SelectContent_Shadcn_>
                </Select_Shadcn_>
                <Button
                  size="tiny"
                  type="text"
                  icon={<Trash2 size={12} />}
                  onClick={() => {
                    const next = entries.filter((_entry, entryIndex) => entryIndex !== index)
                    updateEntries(next)
                  }}
                >
                  <span className="sr-only">Remove</span>
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-center rounded border border-strong border-dashed py-3">
          <Button
            size="tiny"
            type="default"
            onClick={() => updateEntries([...entries, { source: '', target: '' }])}
          >
            Add mapping
          </Button>
        </div>
      </div>
      <NodeSettingsValidation errors={combinedErrors} />
    </>
  )
}

export default TransformRenameKeysNodeSettings
