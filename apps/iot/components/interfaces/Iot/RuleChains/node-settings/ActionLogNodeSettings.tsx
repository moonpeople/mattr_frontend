import { useMemo } from 'react'
import CodeEditor from 'components/ui/CodeEditor/CodeEditor'
import { Input_Shadcn_ } from 'ui'
import type { DefaultNodeSettingsProps } from './DefaultNodeSettings'
import NodeSettingsValidation from './NodeSettingsValidation'

type LogConfig = {
  raw: Record<string, any>
  label: string
  messageTemplate: string
}

const normalizeString = (value: unknown) =>
  typeof value === 'string' ? value.trim() : ''

const parseConfig = (nodeConfigText: string): LogConfig => {
  let parsed: Record<string, any> = {}
  if (nodeConfigText.trim()) {
    try {
      const raw = JSON.parse(nodeConfigText)
      parsed = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {}
    } catch (_err) {
      parsed = {}
    }
  }

  const label = typeof parsed.label === 'string' ? parsed.label : ''
  const messageTemplate =
    (typeof parsed.messageTemplate === 'string' && parsed.messageTemplate) ||
    (typeof parsed.message_template === 'string' && parsed.message_template) ||
    (typeof parsed.message === 'string' && parsed.message) ||
    (typeof parsed.text === 'string' && parsed.text) ||
    ''

  return {
    raw: parsed,
    label,
    messageTemplate,
  }
}

const buildPayload = (base: Record<string, any>, label: string, messageTemplate: string) => {
  const payload: Record<string, any> = {
    ...(base || {}),
  }

  const normalizedLabel = normalizeString(label)
  if (normalizedLabel) {
    payload.label = label
  } else {
    delete payload.label
  }

  const normalizedMessage = normalizeString(messageTemplate)
  if (normalizedMessage) {
    payload.messageTemplate = messageTemplate
  } else {
    delete payload.messageTemplate
  }

  return payload
}

const ActionLogNodeSettings = ({
  nodeConfigText,
  nodeConfigError,
  onNodeConfigTextChange,
  validationErrors,
  scriptSuggestionContext,
}: DefaultNodeSettingsProps) => {
  const config = parseConfig(nodeConfigText)

  const updateConfig = (next: { label?: string; messageTemplate?: string }) => {
    const payload = buildPayload(
      config.raw,
      next.label ?? config.label,
      next.messageTemplate ?? config.messageTemplate
    )
    onNodeConfigTextChange(JSON.stringify(payload, null, 2))
  }

  const localErrors = useMemo(() => {
    const errors: string[] = []
    if (config.label && typeof config.label !== 'string') {
      errors.push('Label must be a string.')
    }
    return errors
  }, [config.label])

  const combinedErrors = [...localErrors, ...(validationErrors ?? [])]

  return (
    <>
      <div className="space-y-3">
        <div className="space-y-1">
          <p className="text-xs text-foreground-light">Log message</p>
          {nodeConfigError && <p className="text-xs text-destructive-600">{nodeConfigError}</p>}
        </div>

        <div className="space-y-1">
          <p className="text-xs text-foreground-light">Label (optional)</p>
          <Input_Shadcn_
            value={config.label}
            onChange={(event) => updateConfig({ label: event.target.value })}
            placeholder="Voltage alerts"
            size="tiny"
          />
        </div>

        <div className="space-y-1">
          <p className="text-xs text-foreground-light">Message template</p>
          <div className="h-32 overflow-hidden rounded border border-muted bg-surface-200">
            <CodeEditor
              id="rule-chain-log-message"
              language="plaintext"
              value={config.messageTemplate}
              onInputChange={(value) => updateConfig({ messageTemplate: value ?? '' })}
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
            You can reference values inline using jq paths, for example:{' '}
            <code>.payload.data.voltage</code>
          </p>
        </div>
      </div>
      <NodeSettingsValidation errors={combinedErrors} />
    </>
  )
}

export default ActionLogNodeSettings
