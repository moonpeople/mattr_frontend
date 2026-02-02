import type { ReactNode } from 'react'
import { Button, Input, Input_Shadcn_, Label_Shadcn_, TextArea_Shadcn_ } from 'ui'

type DeviceModelStepDetailsProps = {
  modelName: string
  modelDescription: string
  baseFirmwareVersion: string
  baseFirmwareUrl: string
  protocolContent?: ReactNode
  onModelNameChange: (value: string) => void
  onModelDescriptionChange: (value: string) => void
  onBaseFirmwareVersionChange: (value: string) => void
  onBaseFirmwareUrlChange: (value: string) => void
  showDelete: boolean
  isDeleting: boolean
  onDelete: () => void
}

export const DeviceModelStepDetails = ({
  modelName,
  modelDescription,
  baseFirmwareVersion,
  baseFirmwareUrl,
  protocolContent,
  onModelNameChange,
  onModelDescriptionChange,
  onBaseFirmwareVersionChange,
  onBaseFirmwareUrlChange,
  showDelete,
  isDeleting,
  onDelete,
}: DeviceModelStepDetailsProps) => (
  <div className="grid gap-6">
    <div>
      <Label_Shadcn_>Model name</Label_Shadcn_>
      <Input_Shadcn_
        id="device-model-name"
        value={modelName}
        onChange={(event) => onModelNameChange(event.target.value)}
      />
    </div>
    <div>
      <Label_Shadcn_>Description</Label_Shadcn_>
      <TextArea_Shadcn_
        id="device-model-description"
        value={modelDescription}
        onChange={(event) => onModelDescriptionChange(event.target.value)}
      />
    </div>
    {protocolContent && (
      <div className="space-y-3">
        <div>
          <p className="text-sm font-medium">Protocol settings</p>
          <p className="text-xs text-foreground-light">
            Configure transport-specific settings for this device model.
          </p>
        </div>
        {protocolContent}
      </div>
    )}
    <div>
      <Label_Shadcn_>Base firmware version</Label_Shadcn_>
      <Input_Shadcn_
        id="device-model-base-firmware-version"
        placeholder="e.g. 1.0.0"
        value={baseFirmwareVersion}
        onChange={(event) => onBaseFirmwareVersionChange(event.target.value)}
      />
    </div>
    <div>
      <Label_Shadcn_>Base firmware URL</Label_Shadcn_>
      <Input_Shadcn_
        id="device-model-base-firmware-url"
        placeholder="https://example.com/firmware.bin"
        value={baseFirmwareUrl}
        onChange={(event) => onBaseFirmwareUrlChange(event.target.value)}
      />
    </div>


    {showDelete && (
      <div className="rounded-md border border-destructive-200/40 bg-surface-100 p-4 space-y-3">
        <p className="text-sm text-foreground-light">
          Deleting a model removes its configuration and alert rules.
        </p>
        <Button type="danger" onClick={onDelete} disabled={isDeleting}>
          Delete model
        </Button>
      </div>
    )}
  </div>
)
