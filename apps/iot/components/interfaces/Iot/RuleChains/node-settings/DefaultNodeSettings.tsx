import { Textarea } from 'ui'
import NodeSettingsValidation from './NodeSettingsValidation'

export type DefaultNodeSettingsProps = {
  nodeConfigText: string
  nodeConfigError: string | null
  onNodeConfigTextChange: (value: string) => void
  validationErrors: string[]
  scriptSuggestionContext?: Record<string, any>
  dataTypeKeyOptions?: Array<{ label: string; value: string }>
}

const DefaultNodeSettings = ({
  nodeConfigText,
  nodeConfigError,
  onNodeConfigTextChange,
  validationErrors,
}: DefaultNodeSettingsProps) => {
  return (
    <>
      <div className="space-y-1">
        <p className="text-sm text-foreground-light">Configuration (JSON)</p>
        <Textarea
          id="rule-chain-node-config"
          className="input-mono"
          value={nodeConfigText}
          onChange={(event) => onNodeConfigTextChange(event.target.value)}
          rows={6}
        />
        {nodeConfigError && (
          <p className="text-xs text-destructive-600">{nodeConfigError}</p>
        )}
      </div>
      <NodeSettingsValidation errors={validationErrors} />
    </>
  )
}

export default DefaultNodeSettings
