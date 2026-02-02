import { Plus, Trash2 } from 'lucide-react'
import { Button, Input_Shadcn_ } from 'ui'
import NodeSettingsValidation from './NodeSettingsValidation'

type MessageTypeSwitchMapping = {
  type: string
  relation: string
}

type MessageTypeSwitchConfig = {
  mappings: MessageTypeSwitchMapping[]
}

type MsgTypeSwitchNodeSettingsProps = {
  config: MessageTypeSwitchConfig
  onChange: (next: { mappings?: MessageTypeSwitchMapping[] }) => void
  validationErrors: string[]
}

const MsgTypeSwitchNodeSettings = ({
  config,
  onChange,
  validationErrors,
}: MsgTypeSwitchNodeSettingsProps) => {
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
                  mappings: [
                    ...config.mappings,
                    {
                      type: '',
                      relation: '',
                    },
                  ],
                })
              }
            />
          </div>
          {config.mappings.length > 0 ? (
            <div className="space-y-2">
              {config.mappings.map((entry, index) => (
                <div
                  key={`message-type-switch-${index}`}
                  className="grid grid-cols-[minmax(0,1fr)_auto] gap-1"
                >
                  <Input_Shadcn_
                    value={entry.type}
                    size="tiny"
                    placeholder="message_type"
                    onChange={(event) => {
                      const next = [...config.mappings]
                      const nextType = event.target.value
                      const existingRelation = next[index]?.relation ?? ''
                      next[index] = {
                        ...next[index],
                        type: nextType,
                        relation: existingRelation || nextType,
                      }
                      onChange({ mappings: next })
                    }}
                  />
                  <Button
                    size="tiny"
                    type="text"
                    className="h-6 w-6 px-0 flex items-center justify-center"
                    onClick={() => {
                      const next = config.mappings.filter((_value, valueIndex) => valueIndex !== index)
                      onChange({ mappings: next })
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

export default MsgTypeSwitchNodeSettings
