import CodeEditor from 'components/ui/CodeEditor/CodeEditor'
import NodeSettingsValidation from './NodeSettingsValidation'

type JqValidationState = {
  status: 'idle' | 'validating' | 'valid' | 'error'
  error: string | null
}

type TransformMsgConfig = {
  script: string
}

type TransformMsgNodeSettingsProps = {
  config: TransformMsgConfig
  onChange: (script: string) => void
  validation: JqValidationState
  scriptSuggestionContext: Record<string, any>
  validationErrors: string[]
}

const TransformMsgNodeSettings = ({
  config,
  onChange,
  validation,
  scriptSuggestionContext,
  validationErrors,
}: TransformMsgNodeSettingsProps) => {
  return (
    <>
      <div className="space-y-2">
        <p className="text-xs text-foreground-light">Transform (jq)</p>
        <div className="h-48 overflow-hidden rounded border border-muted bg-surface-200">
          <CodeEditor
            id="rule-chain-transform-msg"
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

export default TransformMsgNodeSettings
