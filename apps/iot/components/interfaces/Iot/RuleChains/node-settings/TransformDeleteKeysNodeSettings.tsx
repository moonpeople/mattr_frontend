import { useMemo } from 'react'
import CodeEditor from 'components/ui/CodeEditor/CodeEditor'
import {
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
} from 'ui'
import type { DefaultNodeSettingsProps } from './DefaultNodeSettings'
import NodeSettingsValidation from './NodeSettingsValidation'

type DeleteSource = 'DATA' | 'METADATA'

const normalizeString = (value: unknown) =>
  typeof value === 'string' ? value.trim() : ''

const normalizeDeleteSource = (value: unknown): DeleteSource => {
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

  const deleteFrom =
    parsed.deleteFrom ??
    parsed.delete_from ??
    parsed.dataToFetch ??
    parsed.data_to_fetch ??
    'DATA'

  const keysRaw = Array.isArray(parsed.keys) ? parsed.keys : []
  const keys = keysRaw.map((entry) => (typeof entry === 'string' ? entry : String(entry ?? '')))

  return { raw: parsed, deleteFrom: normalizeDeleteSource(deleteFrom), keys }
}

const buildPayload = (base: Record<string, any>, deleteFrom: DeleteSource, keys: string[]) => {
  const payload: Record<string, any> = {
    ...(base || {}),
    deleteFrom,
    keys,
  }

  delete payload.delete_from
  delete payload.dataToFetch
  delete payload.data_to_fetch

  return payload
}

const TransformDeleteKeysNodeSettings = ({
  nodeConfigText,
  nodeConfigError,
  onNodeConfigTextChange,
  validationErrors,
  scriptSuggestionContext,
}: DefaultNodeSettingsProps) => {
  const config = parseConfig(nodeConfigText)
  const keysText = config.keys.join('\n')

  const updateConfig = (nextDeleteFrom: DeleteSource, nextKeys: string[]) => {
    const payload = buildPayload(config.raw, nextDeleteFrom, nextKeys)
    onNodeConfigTextChange(JSON.stringify(payload, null, 2))
  }

  const updateDeleteFrom = (nextDeleteFrom: DeleteSource) => {
    updateConfig(nextDeleteFrom, config.keys)
  }

  const updateKeys = (nextKeys: string[]) => {
    updateConfig(config.deleteFrom, nextKeys)
  }

  const updateKeysText = (value: string) => {
    const nextKeys = value
      .split(/\r?\n/)
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0)

    updateKeys(nextKeys)
  }

  const localErrors = useMemo(() => {
    const errors: string[] = []
    const hasNonEmptyKey = config.keys.some((entry) => normalizeString(entry).length > 0)
    if (!hasNonEmptyKey) {
      errors.push('At least one key is required.')
    }
    return errors
  }, [config.keys])

  const combinedErrors = [...localErrors, ...(validationErrors ?? [])]

  return (
    <>
      <div className="space-y-3">
        <div className="space-y-1">
          <p className="text-xs text-foreground-light">Delete keys</p>
          {nodeConfigError && <p className="text-xs text-destructive-600">{nodeConfigError}</p>}
        </div>

        <div className="space-y-1">
          <p className="text-xs text-foreground-light">Delete from</p>
          <Select_Shadcn_
            value={config.deleteFrom}
            onValueChange={(value) => updateDeleteFrom(value as DeleteSource)}
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

        <div className="space-y-1">
          <p className="text-xs text-foreground-light">Keys to delete (one per line)</p>
          <div className="h-28 overflow-hidden rounded border border-muted bg-surface-200">
            <CodeEditor
              id="rule-chain-delete-keys"
              language="jq"
              value={keysText}
              onInputChange={(value) => updateKeysText(value ?? '')}
              options={{ wordWrap: 'on' }}
              hideLineNumbers
              autoTriggerSuggestions
              customSuggestions={{
                enabled: true,
                context: scriptSuggestionContext ?? {},
              }}
            />
          </div>
          <p className="text-[11px] text-foreground-light">
            Enter exact keys, one per line (for example, <code>http_temp_1</code>).
          </p>
        </div>
      </div>
      <NodeSettingsValidation errors={combinedErrors} />
    </>
  )
}

export default TransformDeleteKeysNodeSettings
