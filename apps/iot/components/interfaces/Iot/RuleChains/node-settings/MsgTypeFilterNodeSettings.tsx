import { Plus, Trash2 } from 'lucide-react'
import { Button, Input_Shadcn_ } from 'ui'
import NodeSettingsValidation from './NodeSettingsValidation'

type MessageTypeFilterConfig = {
  messageTypes: string[]
}

type MsgTypeFilterNodeSettingsProps = {
  config: MessageTypeFilterConfig
  onChange: (next: { messageTypes?: string[] }) => void
  validationErrors: string[]
}

const MsgTypeFilterNodeSettings = ({
  config,
  onChange,
  validationErrors,
}: MsgTypeFilterNodeSettingsProps) => {
  return (
    <>
      <div className="space-y-3">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs text-foreground-light">Message types</p>
            <Button
              size="tiny"
              type="text"
              className="px-1"
              icon={<Plus size={12} />}
              onClick={() =>
                onChange({
                  messageTypes: [...config.messageTypes, ''],
                })
              }
            />
          </div>
          {config.messageTypes.length > 0 ? (
            <div className="space-y-2">
              {config.messageTypes.map((entry, index) => (
                <div key={`message-type-${index}`} className="flex gap-1">
                  <Input_Shadcn_
                    value={entry}
                    size="tiny"
                    onChange={(event) => {
                      const next = [...config.messageTypes]
                      next[index] = event.target.value
                      onChange({ messageTypes: next })
                    }}
                  />
                  <Button
                    size="tiny"
                    type="text"
                    className="h-6 w-6 px-0 flex items-center justify-center"
                    onClick={() => {
                      const next = config.messageTypes.filter((_value, valueIndex) => valueIndex !== index)
                      onChange({ messageTypes: next })
                    }}
                  >
                    <Trash2 size={12} className="text-foreground-lighter" />
                    <span className="sr-only">Remove</span>
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center rounded border border-strong border-dashed py-3">
              <span className="text-xs text-foreground-light">No types</span>
            </div>
          )}
        </div>
      </div>
      <NodeSettingsValidation errors={validationErrors} />
    </>
  )
}

export default MsgTypeFilterNodeSettings
