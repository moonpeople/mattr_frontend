import {
  AlertDescription_Shadcn_,
  Alert_Shadcn_,
  AlertTitle_Shadcn_,
  Button,
  CriticalIcon,
  Input,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  SidePanel,
  Textarea,
} from 'ui'

type RuleChainTypeOption = { label: string; value: string }

type RuleChainInfoPanelProps = {
  visible: boolean
  onClose: () => void
  onSave: () => void
  isSaving: boolean
  name: string
  description: string
  type: string
  onNameChange: (value: string) => void
  onDescriptionChange: (value: string) => void
  onTypeChange: (value: string) => void
  typeOptions: RuleChainTypeOption[]
  typeLocked?: boolean
  onDelete: () => void
  canDelete: boolean
}

const RuleChainInfoPanel = ({
  visible,
  onClose,
  onSave,
  isSaving,
  name,
  description,
  type,
  onNameChange,
  onDescriptionChange,
  onTypeChange,
  typeOptions,
  typeLocked = false,
  onDelete,
  canDelete,
}: RuleChainInfoPanelProps) => {
  return (
    <SidePanel
      size="large"
      visible={visible}
      header="Rule chain info"
      onCancel={onClose}
      customFooter={
        <div className="flex w-full items-center justify-end gap-2 border-t border-default px-4 py-4">
          <Button type="default" onClick={onClose}>
            Cancel
          </Button>
          <Button type="primary" onClick={onSave} loading={isSaving} disabled={isSaving}>
            Save
          </Button>
        </div>
      }
    >
      <SidePanel.Content className="space-y-6 py-6">
        <div className="space-y-4 px-4">
          <Input id="rule-chain-name" label="Name" value={name} onChange={(event) => onNameChange(event.target.value)} />
          <Textarea
            id="rule-chain-description"
            label="Description"
            value={description}
            onChange={(event) => onDescriptionChange(event.target.value)}
            rows={4}
          />
          <div className="space-y-1">
            <p className="text-xs text-foreground-light">Type</p>
            <Select_Shadcn_ value={type} onValueChange={onTypeChange} disabled={typeLocked}>
              <SelectTrigger_Shadcn_ size="small">
                <SelectValue_Shadcn_ placeholder="Select type" />
              </SelectTrigger_Shadcn_>
              <SelectContent_Shadcn_>
                {typeOptions.map((option) => (
                  <SelectItem_Shadcn_
                    key={`rule-chain-type-${option.value}`}
                    value={option.value}
                    className="text-xs"
                  >
                    {option.label}
                  </SelectItem_Shadcn_>
                ))}
              </SelectContent_Shadcn_>
            </Select_Shadcn_>
          </div>
          <div className="border-t border-muted pt-4">
            <Alert_Shadcn_ variant="destructive">
              <CriticalIcon />
              <AlertTitle_Shadcn_>Delete rule chain</AlertTitle_Shadcn_>
              <AlertDescription_Shadcn_>
                Once deleted, this rule chain cannot be restored.
              </AlertDescription_Shadcn_>
              <AlertDescription_Shadcn_ className="mt-3">
                <Button type="danger" size="small" disabled={!canDelete} onClick={onDelete}>
                  Delete rule chain
                </Button>
              </AlertDescription_Shadcn_>
            </Alert_Shadcn_>
          </div>
        </div>
      </SidePanel.Content>
    </SidePanel>
  )
}

export default RuleChainInfoPanel
