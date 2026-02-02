import { useState } from 'react'
import type { IotDataTypeKey } from 'data/iot/types'
import { ChevronsUpDown } from 'lucide-react'
import {
  Button,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
} from 'ui'

type AttributeKeySelectProps = {
  options: IotDataTypeKey[]
  value: string
  onChange: (nextValue: string) => void
  disabled?: boolean
}

const formatDataTypeKeyLabel = (sensorType: IotDataTypeKey) =>
  `${sensorType.name} (${sensorType.data_key_name})`

export const AttributeKeySelect = ({ options, value, onChange, disabled }: AttributeKeySelectProps) => {
  const [open, setOpen] = useState(false)
  const selected = options.find((option) => option.data_key_name === value)
  const triggerLabel = selected ? formatDataTypeKeyLabel(selected) : 'Select key'

  return (
    <Popover_Shadcn_ modal={false} open={open} onOpenChange={setOpen}>
      <PopoverTrigger_Shadcn_ asChild>
        <Button
          size="tiny"
          type="default"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={`w-full justify-between text-left ${!selected ? 'text-foreground-muted' : ''}`}
          iconRight={<ChevronsUpDown className="text-foreground-muted" strokeWidth={2} size={14} />}
        >
          <span className="truncate">{triggerLabel}</span>
        </Button>
      </PopoverTrigger_Shadcn_>
      <PopoverContent_Shadcn_ side="bottom" align="end" className="w-[420px] p-4">
        <div className="max-h-[360px] space-y-3 overflow-auto text-xs text-foreground-light">
          <div>
            <p className="text-sm text-foreground">jq quick reference</p>
            <p>
              Use jq to transform the input into a single value. The input is an object with keys
              like <span className="font-mono">payload</span>,
              <span className="font-mono">metadata</span>, and
              <span className="font-mono">args</span>.
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-foreground">Examples</p>
            <ul className="list-disc space-y-1 pl-4">
              <li>
                <span className="font-mono">.payload.temperature</span>
              </li>
              <li>
                <span className="font-mono">.payload.rpm | if . &gt; 3000 then 1 else 0 end</span>
              </li>
              <li>
                <span className="font-mono">(.payload.voltage // 0) * 1.1</span>
              </li>
            </ul>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-foreground">Tips</p>
            <ul className="list-disc space-y-1 pl-4">
              <li>
                Use <span className="font-mono">{'//'}</span> to provide a default value.
              </li>
              <li>
                Use <span className="font-mono">if … then … else … end</span> for conditions.
              </li>
            </ul>
          </div>
        </div>
      </PopoverContent_Shadcn_>
    </Popover_Shadcn_>
  )
}
