import { Trash2 } from 'lucide-react'
import {
  Button,
  Checkbox_Shadcn_,
  Input_Shadcn_,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
} from 'ui'
import PathSuggestInput from '../PathSuggestInput'
import NodeSettingsValidation from './NodeSettingsValidation'

type SelectOption = { label: string; value: string }

type PathSuggestion = { label: string; value: string }

type TimeseriesValue = {
  key: string
  valuePath: string
  valueType: string
}

type TimeseriesConfig = {
  deviceIdPath: string
  useServerTs: boolean
  tsPath: string
  values: TimeseriesValue[]
}

type TimeseriesNodeSettingsProps = {
  config: TimeseriesConfig
  valueTypeOptions: SelectOption[]
  testBodySuggestions: PathSuggestion[]
  onChange: (next: {
    deviceIdPath?: string
    useServerTs?: boolean
    tsPath?: string
    values?: TimeseriesValue[]
  }) => void
  validationErrors: string[]
}

const TimeseriesNodeSettings = ({
  config,
  valueTypeOptions,
  testBodySuggestions,
  onChange,
  validationErrors,
}: TimeseriesNodeSettingsProps) => {
  return (
    <>
      <div className="space-y-4">
        <div className="space-y-1">
          <p className="text-xs text-foreground-light">Device id path</p>
          <PathSuggestInput
            value={config.deviceIdPath}
            onValueChange={(nextValue) => onChange({ deviceIdPath: nextValue })}
            suggestions={testBodySuggestions}
            size="tiny"
          />
        </div>
        <div className="flex items-center gap-2">
          <Checkbox_Shadcn_
            checked={config.useServerTs}
            onCheckedChange={(value) => onChange({ useServerTs: value === true })}
          />
          <span className="text-xs text-foreground-light">Use server timestamp</span>
        </div>
        {!config.useServerTs && (
          <div className="space-y-1">
            <p className="text-xs text-foreground-light">Timestamp path</p>
            <p className="text-[11px] text-foreground-light">
              Required when server timestamp is disabled. Example: payload.data.ts
            </p>
            <PathSuggestInput
              value={config.tsPath}
              onValueChange={(nextValue) => onChange({ tsPath: nextValue })}
              suggestions={testBodySuggestions}
              size="tiny"
            />
          </div>
        )}
        <div className="space-y-2">
          <p className="text-xs text-foreground-light">Values</p>
          <p className="text-[11px] text-foreground-light">
            Leave empty to store the full payload (timestamp policy still applies). Add fields to
            store only mapped keys.
          </p>
          {config.values.length > 0 && (
            <div className="space-y-2">
              <div className="grid grid-cols-[1.1fr_1.5fr_0.9fr_auto] gap-2 text-[11px] uppercase text-foreground-light">
                <span>Key</span>
                <span>Value path</span>
                <span>Type</span>
                <span />
              </div>
              {config.values.map((entry, index) => (
                <div
                  key={`timeseries-value-${index}`}
                  className="grid grid-cols-[1.1fr_1.5fr_0.9fr_auto] gap-2"
                >
                  <Input_Shadcn_
                    value={entry.key}
                    onChange={(event) => {
                      const next = [...config.values]
                      next[index] = { ...next[index], key: event.target.value }
                      onChange({ values: next })
                    }}
                    size="tiny"
                  />
                  <PathSuggestInput
                    value={entry.valuePath}
                    onValueChange={(nextValue) => {
                      const next = [...config.values]
                      next[index] = { ...next[index], valuePath: nextValue }
                      onChange({ values: next })
                    }}
                    suggestions={testBodySuggestions}
                    size="tiny"
                  />
                  <Select_Shadcn_
                    value={entry.valueType}
                    onValueChange={(value) => {
                      const next = [...config.values]
                      next[index] = { ...next[index], valueType: value }
                      onChange({ values: next })
                    }}
                  >
                    <SelectTrigger_Shadcn_ size="tiny">
                      <SelectValue_Shadcn_ placeholder="Type" />
                    </SelectTrigger_Shadcn_>
                    <SelectContent_Shadcn_>
                      {valueTypeOptions.map((option) => (
                        <SelectItem_Shadcn_
                          key={`timeseries-type-${option.value}`}
                          value={option.value}
                          className="text-xs"
                        >
                          {option.label}
                        </SelectItem_Shadcn_>
                      ))}
                    </SelectContent_Shadcn_>
                  </Select_Shadcn_>
                  <Button
                    size="tiny"
                    type="text"
                    icon={<Trash2 size={12} />}
                    onClick={() => {
                      const next = config.values.filter((_value, valueIndex) => valueIndex !== index)
                      onChange({ values: next })
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
                  values: [
                    ...config.values,
                    { key: '', valuePath: '', valueType: 'number' },
                  ],
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

export default TimeseriesNodeSettings
