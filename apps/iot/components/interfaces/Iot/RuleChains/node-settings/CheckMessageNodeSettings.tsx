import { Plus, Trash2 } from 'lucide-react'
import {
  Button,
  Checkbox_Shadcn_,
  Input_Shadcn_,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'
import NodeSettingsValidation from './NodeSettingsValidation'

type CheckMessageConfig = {
  messageKeys: string[]
  headerKeys: string[]
  checkAllKeys: boolean
}

type CheckMessageNodeSettingsProps = {
  config: CheckMessageConfig
  onChange: (next: {
    messageKeys?: string[]
    headerKeys?: string[]
    checkAllKeys?: boolean
  }) => void
  validationErrors: string[]
}

const CheckMessageNodeSettings = ({
  config,
  onChange,
  validationErrors,
}: CheckMessageNodeSettingsProps) => {
  return (
    <>
      <div className="space-y-3">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Tooltip>
              <TooltipTrigger asChild>
                <p className="text-xs text-foreground-light">Header keys</p>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                Header keys — сохраняется как metadata.headers.&lt;key&gt;
              </TooltipContent>
            </Tooltip>
            <Button
              size="tiny"
              type="text"
              className="px-1"
              icon={<Plus size={12} />}
              onClick={(event) => {
                event.preventDefault()
                onChange({
                  headerKeys: [...config.headerKeys, ''],
                })
              }}
            />
          </div>
          {config.headerKeys.length > 0 ? (
            <div className="space-y-2">
              {config.headerKeys.map((entry, index) => (
                <div key={`check-message-header-${index}`} className="flex gap-1">
                  <Input_Shadcn_
                    value={entry}
                    size="tiny"
                    placeholder="Message-Type"
                    onChange={(event) => {
                      const next = [...config.headerKeys]
                      next[index] = event.target.value
                      onChange({ headerKeys: next })
                    }}
                  />
                  <Button
                    size="tiny"
                    type="text"
                    className="h-6 w-6 px-0 flex items-center justify-center"
                    onClick={() => {
                      const next = config.headerKeys.filter((_value, valueIndex) => valueIndex !== index)
                      onChange({ headerKeys: next })
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
              <span className="text-xs text-foreground-light">No header keys</span>
            </div>
          )}
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Tooltip>
              <TooltipTrigger asChild>
                <p className="text-xs text-foreground-light">Payload keys</p>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                Payload keys — сохраняется как messageNames (payload)
              </TooltipContent>
            </Tooltip>
            <Button
              size="tiny"
              type="text"
              className="px-1"
              icon={<Plus size={12} />}
              onClick={(event) => {
                event.preventDefault()
                onChange({
                  messageKeys: [...config.messageKeys, ''],
                })
              }}
            />
          </div>
          {config.messageKeys.length > 0 ? (
            <div className="space-y-2">
              {config.messageKeys.map((entry, index) => (
                <div key={`check-message-key-${index}`} className="flex gap-1">
                  <Input_Shadcn_
                    value={entry}
                    size="tiny"
                    placeholder="data.ts"
                    onChange={(event) => {
                      const next = [...config.messageKeys]
                      next[index] = event.target.value
                      onChange({ messageKeys: next })
                    }}
                  />
                  <Button
                    size="tiny"
                    type="text"
                    className="h-6 w-6 px-0 flex items-center justify-center"
                    onClick={() => {
                      const next = config.messageKeys.filter((_value, valueIndex) => valueIndex !== index)
                      onChange({ messageKeys: next })
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
              <span className="text-xs text-foreground-light">No payload keys</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-foreground-light">
          <Checkbox_Shadcn_
            id="check-message-all-keys"
            checked={config.checkAllKeys}
            onCheckedChange={(checked) => onChange({ checkAllKeys: !!checked })}
          />
          <label htmlFor="check-message-all-keys">Require all keys</label>
        </div>
      </div>
      <NodeSettingsValidation errors={validationErrors} />
    </>
  )
}

export default CheckMessageNodeSettings
