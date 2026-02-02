import { useEffect, useMemo, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import {
  Button,
  Input_Shadcn_,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
} from 'ui'
import CodeEditor from 'components/ui/CodeEditor/CodeEditor'
import { validateIotJq } from 'data/iot/jq'
import { useDebouncedValue } from 'hooks/misc/useDebouncedValue'
import { DefaultNodeSettingsProps } from './DefaultNodeSettings'
import NodeSettingsValidation from './NodeSettingsValidation'

type CalculatedFieldEntry = {
  name: string
  type: string
  expression: string
  outputName: string
  outputType: string
  outputScope: string
  decimals: string
}

type JqValidationState = {
  status: 'idle' | 'validating' | 'valid' | 'error'
  error: string | null
}

const normalizeString = (value: unknown) =>
  typeof value === 'string' ? value.trim() : ''

const OUTPUT_TYPE_OPTIONS = [
  { label: 'Telemetry', value: 'TIME_SERIES' },
  { label: 'Attributes', value: 'ATTRIBUTES' },
]

const ATTRIBUTE_SCOPE_OPTIONS = [
  { label: 'Client', value: 'CLIENT_SCOPE' },
  { label: 'Shared', value: 'SHARED_SCOPE' },
  { label: 'Server', value: 'SERVER_SCOPE' },
]

const parseCalculatedFieldsConfig = (nodeConfigText: string) => {
  let parsed: Record<string, any> = {}
  if (nodeConfigText.trim()) {
    try {
      const raw = JSON.parse(nodeConfigText)
      parsed = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {}
    } catch (_err) {
      parsed = {}
    }
  }

  const version =
    typeof parsed.version === 'number' && Number.isFinite(parsed.version)
      ? parsed.version
      : 1
  const rawFields = Array.isArray(parsed.fields)
    ? parsed.fields
    : Array.isArray(parsed.calculatedFields)
      ? parsed.calculatedFields
      : []

  const fields = rawFields.map((entry: Record<string, any>) => {
    const field = typeof entry === 'object' && entry ? entry : {}
    const configuration = typeof field.configuration === 'object' && field.configuration
      ? field.configuration
      : {}
    const output = typeof configuration.output === 'object' && configuration.output
      ? configuration.output
      : {}
    const name = normalizeString(field.name)
    const expression = normalizeString(configuration.expression)
    const outputName = normalizeString(output.name)
    const outputType = normalizeString(output.type) || 'TIME_SERIES'
    const outputScope =
      normalizeString(output.scope) || (outputType === 'ATTRIBUTES' ? 'CLIENT_SCOPE' : '')
    const decimalsRaw = output.decimalsByDefault ?? output.decimals_by_default
    const decimals =
      decimalsRaw === null || decimalsRaw === undefined ? '' : String(decimalsRaw)
    const type = normalizeString(field.type) || 'SCRIPT'

    return {
      name,
      type,
      expression,
      outputName,
      outputType,
      outputScope,
      decimals,
    }
  })

  return { version, fields, raw: parsed }
}

const buildCalculatedFieldsPayload = (
  baseConfig: Record<string, any>,
  version: number,
  fields: CalculatedFieldEntry[]
) => {
  const payload: Record<string, any> = {
    ...(baseConfig || {}),
    version,
    fields: fields.map((field) => {
      const outputType = normalizeString(field.outputType) || 'TIME_SERIES'
      const output: Record<string, any> = {
        name: field.outputName || '',
        type: outputType,
      }
      if (outputType === 'ATTRIBUTES') {
        output.scope = normalizeString(field.outputScope) || 'CLIENT_SCOPE'
      }
      const decimals = normalizeString(field.decimals)
      if (decimals.length > 0) {
        const parsed = Number(decimals)
        output.decimalsByDefault = Number.isNaN(parsed) ? decimals : parsed
      }
      return {
        name: field.name,
        type: 'SCRIPT',
        configurationVersion: 1,
        configuration: {
          expression: field.expression,
          arguments: {},
          output,
        },
      }
    }),
  }

  if ('calculatedFields' in payload) {
    delete payload.calculatedFields
  }

  return payload
}

const TelemetryCalculatedFieldsNodeSettings = ({
  nodeConfigText,
  nodeConfigError,
  onNodeConfigTextChange,
  validationErrors,
  scriptSuggestionContext,
  dataTypeKeyOptions,
}: DefaultNodeSettingsProps) => {
  const [showRawConfig, setShowRawConfig] = useState(false)
  const [fieldValidation, setFieldValidation] = useState<JqValidationState[]>([])
  const config = parseCalculatedFieldsConfig(nodeConfigText)
  const outputKeyOptions = dataTypeKeyOptions ?? []
  const outputKeyValues = useMemo(
    () => new Set(outputKeyOptions.map((option) => option.value)),
    [outputKeyOptions]
  )
  const expressionSignature = useMemo(
    () => config.fields.map((field) => field.expression || '').join('\n--\n'),
    [config.fields]
  )
  const debouncedExpressionSignature = useDebouncedValue(expressionSignature, 500)

  const updateFields = (nextFields: CalculatedFieldEntry[]) => {
    const payload = buildCalculatedFieldsPayload(config.raw ?? {}, config.version ?? 1, nextFields)
    onNodeConfigTextChange(JSON.stringify(payload, null, 2))
  }

  const handleFieldUpdate = (index: number, patch: Partial<CalculatedFieldEntry>) => {
    const next = [...config.fields]
    const current = next[index]
    if (!current) return
    const nextEntry = { ...current, ...patch }
    next[index] = nextEntry
    updateFields(next)
  }

  const handleNameChange = (index: number, value: string) => {
    const current = config.fields[index]
    if (!current) return
    handleFieldUpdate(index, { name: value })
  }

  useEffect(() => {
    if (config.fields.length === 0) {
      setFieldValidation([])
      return
    }

    const baseStates = config.fields.map((field) => {
      if (!field.expression.trim()) {
        return { status: 'error', error: 'jq expression is required.' }
      }
      return { status: 'validating', error: null }
    })

    setFieldValidation(baseStates)

    let cancelled = false
    const context = scriptSuggestionContext ?? {}

    Promise.all(
      config.fields.map((field, index) => {
        const expression = field.expression.trim()
        if (!expression) {
          return Promise.resolve({ index, status: 'error', error: 'jq expression is required.' })
        }
        return validateIotJq({ expression, sample: context })
          .then((result) => ({
            index,
            status: result.valid ? 'valid' : 'error',
            error: result.valid ? null : result.error || 'Invalid jq expression.',
          }))
          .catch((err) => ({
            index,
            status: 'error',
            error: err instanceof Error ? err.message : 'Failed to validate jq expression.',
          }))
      })
    ).then((results) => {
      if (cancelled) return
      setFieldValidation((prev) => {
        const next = [...prev]
        results.forEach((result) => {
          next[result.index] = {
            status: result.status as JqValidationState['status'],
            error: result.error ?? null,
          }
        })
        return next
      })
    })

    return () => {
      cancelled = true
    }
  }, [config.fields.length, debouncedExpressionSignature, scriptSuggestionContext])

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs text-foreground-light">Calculated fields</p>
          <div className="flex items-center gap-2">
            <Button size="tiny" type="text" onClick={() => setShowRawConfig((prev) => !prev)}>
              {showRawConfig ? 'Hide JSON' : 'Raw JSON'}
            </Button>
            <Button
              size="tiny"
              type="text"
              className="px-1"
              icon={<Plus size={12} />}
              onClick={() =>
                updateFields([
                  ...config.fields,
                  {
                    name: '',
                    type: 'SCRIPT',
                    expression: '',
                    outputName: outputKeyOptions[0]?.value ?? '',
                    outputType: 'TIME_SERIES',
                    outputScope: 'CLIENT_SCOPE',
                    decimals: '',
                  },
                ])
              }
            />
          </div>
        </div>
        {nodeConfigError && (
          <p className="text-xs text-destructive-600">{nodeConfigError}</p>
        )}
        {showRawConfig && (
          <div className="space-y-1">
            <p className="text-xs text-foreground-light">Configuration (JSON)</p>
            <div className="h-40 overflow-hidden rounded border border-muted bg-surface-200">
              <CodeEditor
                id="rule-chain-calculated-fields-json"
                language="json"
                value={nodeConfigText}
                onInputChange={(value) => onNodeConfigTextChange(value ?? '')}
                options={{ wordWrap: 'on' }}
                hideLineNumbers
              />
            </div>
          </div>
        )}
        {config.fields.length > 0 ? (
          <div className="space-y-3">
            {config.fields.map((field, index) => (
              <div
                key={`calculated-field-${index}`}
                className="space-y-2 rounded border border-muted bg-surface-100 p-3"
              >
                <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
                  <Input_Shadcn_
                    value={field.name}
                    size="tiny"
                    placeholder="Field name"
                    onChange={(event) => handleNameChange(index, event.target.value)}
                  />
                  <Button
                    size="tiny"
                    type="text"
                    className="h-6 w-6 px-0 flex items-center justify-center"
                    onClick={() => {
                      const next = config.fields.filter((_value, valueIndex) => valueIndex !== index)
                      updateFields(next)
                    }}
                  >
                    <Trash2 size={12} className="text-foreground-lighter" />
                    <span className="sr-only">Remove</span>
                  </Button>
                </div>
                <div className="grid grid-cols-[minmax(0,0.6fr)_minmax(0,1fr)] gap-2">
                  <Select_Shadcn_
                    value={field.outputType}
                    onValueChange={(value) => {
                      const patch: Partial<CalculatedFieldEntry> = { outputType: value }
                      if (value === 'TIME_SERIES') {
                        const fallbackKey = outputKeyOptions[0]?.value ?? ''
                        if (!outputKeyValues.has(field.outputName)) {
                          patch.outputName = fallbackKey
                        }
                      }
                      handleFieldUpdate(index, patch)
                    }}
                  >
                    <SelectTrigger_Shadcn_ size="tiny">
                      <SelectValue_Shadcn_ placeholder="Output type" />
                    </SelectTrigger_Shadcn_>
                    <SelectContent_Shadcn_>
                      {OUTPUT_TYPE_OPTIONS.map((option) => (
                        <SelectItem_Shadcn_
                          key={`calculated-output-type-${option.value}`}
                          value={option.value}
                          className="text-xs"
                        >
                          {option.label}
                        </SelectItem_Shadcn_>
                      ))}
                    </SelectContent_Shadcn_>
                  </Select_Shadcn_>
                  {field.outputType === 'ATTRIBUTES' ? (
                    <Input_Shadcn_
                      value={field.outputName}
                      size="tiny"
                      placeholder="Attribute key"
                      onChange={(event) =>
                        handleFieldUpdate(index, { outputName: event.target.value })
                      }
                    />
                  ) : (
                    <Select_Shadcn_
                      value={field.outputName}
                      disabled={outputKeyOptions.length === 0}
                      onValueChange={(value) => handleFieldUpdate(index, { outputName: value })}
                    >
                      <SelectTrigger_Shadcn_ size="tiny">
                        <SelectValue_Shadcn_ placeholder="Output key" />
                      </SelectTrigger_Shadcn_>
                      <SelectContent_Shadcn_>
                        {field.outputName &&
                          !outputKeyValues.has(field.outputName) && (
                            <SelectItem_Shadcn_
                              key={`calculated-output-key-missing-${field.outputName}`}
                              value={field.outputName}
                              className="text-xs text-destructive-600"
                            >
                              {field.outputName} (not in model)
                            </SelectItem_Shadcn_>
                          )}
                        {outputKeyOptions.map((option) => (
                          <SelectItem_Shadcn_
                            key={`calculated-output-key-${option.value}`}
                            value={option.value}
                            className="text-xs"
                          >
                            {option.label}
                          </SelectItem_Shadcn_>
                        ))}
                      </SelectContent_Shadcn_>
                    </Select_Shadcn_>
                  )}
                </div>
                <div className="grid grid-cols-[minmax(0,0.6fr)_minmax(0,0.4fr)] gap-2">
                  {field.outputType === 'ATTRIBUTES' ? (
                    <Select_Shadcn_
                      value={field.outputScope}
                      onValueChange={(value) => handleFieldUpdate(index, { outputScope: value })}
                    >
                      <SelectTrigger_Shadcn_ size="tiny">
                        <SelectValue_Shadcn_ placeholder="Scope" />
                      </SelectTrigger_Shadcn_>
                      <SelectContent_Shadcn_>
                        {ATTRIBUTE_SCOPE_OPTIONS.map((option) => (
                          <SelectItem_Shadcn_
                            key={`calculated-output-scope-${option.value}`}
                            value={option.value}
                            className="text-xs"
                          >
                            {option.label}
                          </SelectItem_Shadcn_>
                        ))}
                      </SelectContent_Shadcn_>
                    </Select_Shadcn_>
                  ) : (
                    <div />
                  )}
                  <Input_Shadcn_
                    value={field.decimals}
                    size="tiny"
                    placeholder="Decimals"
                    onChange={(event) =>
                      handleFieldUpdate(index, { decimals: event.target.value })
                    }
                  />
                </div>
                {!field.outputName && (
                  <p className="text-xs text-destructive-600">Output key is required.</p>
                )}
                {field.outputType === 'TIME_SERIES' && outputKeyOptions.length === 0 && (
                  <p className="text-xs text-destructive-600">
                    В модели нет data type keys. Нельзя сохранить calculated telemetry.
                  </p>
                )}
                {field.outputType === 'TIME_SERIES' &&
                  field.outputName &&
                  !outputKeyValues.has(field.outputName) && (
                    <p className="text-xs text-destructive-600">
                      Output key должен быть выбран из data type keys модели устройства.
                    </p>
                  )}
                {field.outputType === 'TIME_SERIES' && (
                  <p className="text-xs text-foreground-light">
                    Output key выбирается из data type keys модели устройства. Если ключа нет в модели,
                    телеметрия не сохранится.
                  </p>
                )}
                {field.outputType === 'ATTRIBUTES' && (
                  <p className="text-xs text-foreground-light">
                    Output key будет сохранен как атрибут в выбранном scope.
                  </p>
                )}
                <div className="space-y-1">
                  <p className="text-xs text-foreground-light">Expression (jq)</p>
                  <p className="text-[11px] text-foreground-light">
                    Доступно: payload, metadata, attributes.client/server/shared, args, ctx.
                  </p>
                  <div className="h-28 overflow-hidden rounded border border-muted bg-surface-200">
                    <CodeEditor
                      id={`calculated-field-expression-${index}`}
                      language="jq"
                      value={field.expression}
                      onInputChange={(value) =>
                        handleFieldUpdate(index, { expression: value ?? '' })
                      }
                      options={{ wordWrap: 'on' }}
                      hideLineNumbers
                      autoTriggerSuggestions
                      customSuggestions={{
                        enabled: true,
                        context: scriptSuggestionContext ?? {},
                      }}
                    />
                  </div>
                  {fieldValidation[index]?.status === 'validating' && (
                    <p className="text-xs text-foreground-light">Validating jq expression...</p>
                  )}
                  {fieldValidation[index]?.error && (
                    <p className="text-xs text-destructive-600">
                      {fieldValidation[index]?.error}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center rounded border border-strong border-dashed py-3">
            <span className="text-xs text-foreground-light">No calculated fields</span>
          </div>
        )}
      </div>
      <NodeSettingsValidation errors={validationErrors} />
    </>
  )
}

export default TelemetryCalculatedFieldsNodeSettings
