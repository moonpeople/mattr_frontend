import CodeEditor from 'components/ui/CodeEditor/CodeEditor'
import NodeSettingsValidation from './NodeSettingsValidation'

type JqValidationState = {
  status: 'idle' | 'validating' | 'valid' | 'error'
  error: string | null
}

type ScriptFilterConfig = {
  script: string
}

type ScriptFilterNodeSettingsProps = {
  config: ScriptFilterConfig
  onChange: (script: string) => void
  validation: JqValidationState
  scriptSuggestionContext: Record<string, any>
  validationErrors: string[]
}

const ScriptFilterNodeSettings = ({
  config,
  onChange,
  validation,
  scriptSuggestionContext,
  validationErrors,
}: ScriptFilterNodeSettingsProps) => {
  return (
    <>
      <div className="space-y-2">
        <p className="text-xs text-foreground-light">Script (jq)</p>
        <p className="text-[11px] text-foreground-light">
          The expression runs against the full message. Example: .payload.data.voltage &gt; 20
        </p>
        <div className="h-40 overflow-hidden rounded border border-muted bg-surface-200">
          <CodeEditor
            id="rule-chain-script-filter"
            language="jq"
            value={config.script}
            onInputChange={(value) => onChange(value ?? '')}
            options={{ wordWrap: 'on' }}
            hideLineNumbers
            autoTriggerSuggestions
            customSuggestions={{
              enabled: true,
              context: scriptSuggestionContext,
            }}
          />
        </div>
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

export default ScriptFilterNodeSettings
