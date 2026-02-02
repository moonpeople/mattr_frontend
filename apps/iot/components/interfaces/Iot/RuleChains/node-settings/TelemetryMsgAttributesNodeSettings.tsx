import { Trash2 } from 'lucide-react'
import {
  Button,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
} from 'ui'
import PathSuggestInput from '../PathSuggestInput'
import NodeSettingsValidation from './NodeSettingsValidation'

type AttributeMapping = {
  key: string
  path: string
}

type SelectOption = { label: string; value: string }
type PathSuggestion = { label: string; value: string }

type TelemetryMsgAttributesNodeSettingsProps = {
  attributes: AttributeMapping[]
  keyOptions: SelectOption[]
  testBodySuggestions: PathSuggestion[]
  onChange: (next: { attributes?: AttributeMapping[] }) => void
  validationErrors: string[]
  fallbackKeys: string[]
}

const TelemetryMsgAttributesNodeSettings = ({
  attributes,
  keyOptions,
  testBodySuggestions,
  onChange,
  validationErrors,
  fallbackKeys,
}: TelemetryMsgAttributesNodeSettingsProps) => {
  const presets = [
    { id: 'defaults', label: 'Add defaults', keys: fallbackKeys },
    {
      id: 'signal',
      label: 'Signal + battery',
      keys: ['rssi', 'snr', 'signal_quality', 'battery_level', 'battery_voltage'],
    },
    {
      id: 'identity',
      label: 'Device info',
      keys: [
        'model',
        'serial',
        'fw_version',
        'hw_version',
        'config_version',
        'imei',
        'imsi',
        'iccid',
        'mac_address',
        'ip_address',
      ],
    },
  ]

  const applyPreset = (keys: string[]) => {
    const existing = new Set(
      attributes.map((entry) => entry.key).filter((value) => value.trim() !== '')
    )
    const next = [...attributes]

    keys.forEach((key) => {
      if (!key || existing.has(key)) return
      next.push({ key, path: `payload.${key}` })
      existing.add(key)
    })

    onChange({ attributes: next })
  }

  return (
    <>
      <div className="space-y-4">
        <div className="space-y-2">
          <p className="text-xs text-foreground-light">Attributes</p>
          <p className="text-[11px] text-foreground-light">
            Map known device attributes to paths in the incoming message. If empty, the node looks
            for default keys in payload: {fallbackKeys.join(', ')}.
          </p>
          <div className="space-y-2 rounded border border-strong bg-surface-200/40 p-3">
            <p className="text-[11px] uppercase text-foreground-light">Presets</p>
            <p className="text-[11px] text-foreground-light">
              Add multiple mappings at once. Presets only append missing keys and default paths are
              set to payload.&lt;key&gt;.
            </p>
            <div className="flex flex-wrap gap-2">
              {presets.map((preset) => (
                <Button
                  key={preset.id}
                  size="tiny"
                  type="outline"
                  onClick={() => applyPreset(preset.keys)}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>
          {attributes.length > 0 && (
            <div className="space-y-2">
              <div className="grid grid-cols-[1.2fr_1.6fr_auto] gap-2 text-[11px] uppercase text-foreground-light">
                <span>Key</span>
                <span>Value path</span>
                <span />
              </div>
              {attributes.map((entry, index) => (
                <div
                  key={`attribute-mapping-${index}`}
                  className="grid grid-cols-[1.2fr_1.6fr_auto] gap-2"
                >
                  <Select_Shadcn_
                    value={entry.key}
                    onValueChange={(value) => {
                      const next = [...attributes]
                      next[index] = { ...next[index], key: value }
                      onChange({ attributes: next })
                    }}
                  >
                    <SelectTrigger_Shadcn_ size="tiny">
                      <SelectValue_Shadcn_ placeholder="Select key" />
                    </SelectTrigger_Shadcn_>
                    <SelectContent_Shadcn_>
                      {keyOptions.map((option) => (
                        <SelectItem_Shadcn_
                          key={`attribute-key-${option.value}`}
                          value={option.value}
                          className="text-xs"
                        >
                          {option.label}
                        </SelectItem_Shadcn_>
                      ))}
                    </SelectContent_Shadcn_>
                  </Select_Shadcn_>
                  <PathSuggestInput
                    value={entry.path}
                    onValueChange={(nextValue) => {
                      const next = [...attributes]
                      next[index] = { ...next[index], path: nextValue }
                      onChange({ attributes: next })
                    }}
                    suggestions={testBodySuggestions}
                    size="tiny"
                  />
                  <Button
                    size="tiny"
                    type="text"
                    icon={<Trash2 size={12} />}
                    onClick={() => {
                      const next = attributes.filter((_value, valueIndex) => valueIndex !== index)
                      onChange({ attributes: next })
                    }}
                  >
                    <span className="sr-only">Remove</span>
                  </Button>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-center justify-center rounded border border-strong border-dashed py-3">
            <Button
              size="tiny"
              type="default"
              onClick={() =>
                onChange({
                  attributes: [...attributes, { key: '', path: '' }],
                })
              }
            >
              Add field
            </Button>
          </div>
        </div>
      </div>
      <NodeSettingsValidation errors={validationErrors} />
    </>
  )
}

export default TelemetryMsgAttributesNodeSettings
