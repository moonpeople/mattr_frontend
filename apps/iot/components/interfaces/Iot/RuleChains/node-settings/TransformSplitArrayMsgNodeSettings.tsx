import { useEffect, useMemo, useState } from 'react'
import CodeEditor from 'components/ui/CodeEditor/CodeEditor'
import { validateIotJq } from 'data/iot/jq'
import { useDebouncedValue } from 'hooks/misc/useDebouncedValue'
import { DefaultNodeSettingsProps } from './DefaultNodeSettings'
import NodeSettingsValidation from './NodeSettingsValidation'

type JqValidationState = {
  status: 'idle' | 'validating' | 'valid' | 'error'
  error: string | null
}

const DEFAULT_ARRAY_PATH = '.data'

const normalizeString = (value: unknown) => (typeof value === 'string' ? value.trim() : '')

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

  const arrayPath =
    normalizeString(parsed.arrayPath) ||
    normalizeString(parsed.array_path) ||
    normalizeString(parsed.path) ||
    normalizeString(parsed.jq) ||
    normalizeString(parsed.script) ||
    normalizeString(parsed.expression) ||
    normalizeString(parsed.filter) ||
    DEFAULT_ARRAY_PATH

  return { raw: parsed, arrayPath }
}

const buildPayload = (base: Record<string, any>, arrayPath: string) => {
  const payload: Record<string, any> = {
    ...(base || {}),
    arrayPath,
  }

  delete payload.array_path
  delete payload.path
  delete payload.jq
  delete payload.script
  delete payload.expression
  delete payload.filter

  return payload
}

const TransformSplitArrayMsgNodeSettings = ({
  nodeConfigText,
  nodeConfigError,
  onNodeConfigTextChange,
  validationErrors,
  scriptSuggestionContext,
}: DefaultNodeSettingsProps) => {
  const config = parseConfig(nodeConfigText)
  const [validation, setValidation] = useState<JqValidationState>({ status: 'idle', error: null })
  const debouncedArrayPath = useDebouncedValue(config.arrayPath, 400)

  const validationSample = useMemo(() => {
    if (scriptSuggestionContext?.payload && typeof scriptSuggestionContext.payload === 'object') {
      return scriptSuggestionContext.payload as Record<string, unknown>
    }
    return (scriptSuggestionContext ?? {}) as Record<string, unknown>
  }, [scriptSuggestionContext])

  const updateArrayPath = (nextArrayPath: string) => {
    const payload = buildPayload(config.raw, nextArrayPath)
    onNodeConfigTextChange(JSON.stringify(payload, null, 2))
  }

  useEffect(() => {
    const expression = debouncedArrayPath.trim()
    if (!expression) {
      setValidation({ status: 'error', error: 'jq path is required.' })
      return
    }

    let cancelled = false
    setValidation({ status: 'validating', error: null })

    validateIotJq({ expression, sample: validationSample, expected: 'array' })
      .then((result) => {
        if (cancelled) return
        if (result.valid) {
          setValidation({ status: 'valid', error: null })
        } else {
          setValidation({
            status: 'error',
            error: result.error || 'Invalid jq expression.',
          })
        }
      })
      .catch((err) => {
        if (cancelled) return
        setValidation({
          status: 'error',
          error: err instanceof Error ? err.message : 'Failed to validate jq expression.',
        })
      })

    return () => {
      cancelled = true
    }
  }, [debouncedArrayPath, validationSample])

  return (
    <>
      <div className="space-y-2">
        <p className="text-xs text-foreground-light">Array path (jq)</p>
        <div className="h-28 overflow-hidden rounded border border-muted bg-surface-200">
          <CodeEditor
            id="rule-chain-split-array-path"
            language="jq"
            value={config.arrayPath}
            onInputChange={(value) => updateArrayPath(value ?? '')}
            options={{ wordWrap: 'on' }}
            hideLineNumbers
            autoTriggerSuggestions
            customSuggestions={{
              enabled: true,
              context: validationSample,
            }}
          />
        </div>
        {nodeConfigError && <p className="text-xs text-destructive-600">{nodeConfigError}</p>}
        {validation.status === 'validating' && (
          <p className="text-xs text-foreground-light">Validating jq expression...</p>
        )}
        {validation.error && (
          <p className="text-xs text-destructive-600">{validation.error}</p>
        )}
      </div>
      <NodeSettingsValidation errors={validationErrors} />
    </>
  )
}

export default TransformSplitArrayMsgNodeSettings
