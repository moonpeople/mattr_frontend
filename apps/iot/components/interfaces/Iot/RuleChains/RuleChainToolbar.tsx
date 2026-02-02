import { useMemo, useState } from 'react'
import { ArrowLeft, ChevronDown } from 'lucide-react'
import {
  Button,
  CommandEmpty_Shadcn_,
  CommandGroup_Shadcn_,
  CommandInput_Shadcn_,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
  Command_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
} from 'ui'

type SelectOption = { label: string; value: string }
type NodeTemplate = { label: string; value: string; section: string }

type RuleChainToolbarProps = {
  title: string
  isLoading: boolean
  canEdit: boolean
  isSaving?: boolean
  onBack?: () => void
  nodeSearch?: string
  onNodeSearchChange?: (value: string) => void
  filteredNodeTemplates?: NodeTemplate[]
  nodeSections?: SelectOption[]
  onAddNodeFromList?: (template: NodeTemplate) => void
}

const RuleChainToolbar = ({
  title,
  isLoading,
  canEdit,
  isSaving = false,
  onBack,
  nodeSearch,
  onNodeSearchChange,
  filteredNodeTemplates,
  nodeSections,
  onAddNodeFromList,
}: RuleChainToolbarProps) => {
  const displayTitle = title || (isLoading ? 'Loading rule chain...' : 'Rule chain')
  const [isNodePickerOpen, setIsNodePickerOpen] = useState(false)
  const shouldShowNodePicker =
    typeof nodeSearch === 'string' &&
    !!onNodeSearchChange &&
    !!onAddNodeFromList &&
    Array.isArray(filteredNodeTemplates) &&
    Array.isArray(nodeSections)

  const groupedNodeTemplates = useMemo(() => {
    if (!shouldShowNodePicker) return []
    const sections = nodeSections ?? []
    const templates = filteredNodeTemplates ?? []
    const groups = sections.reduce<{ section: string; label: string; items: NodeTemplate[] }[]>(
      (acc, entry) => {
        const items = templates.filter((template) => template.section === entry.value)
        if (items.length > 0) acc.push({ section: entry.value, label: entry.label, items })
        return acc
      },
      []
    )
    const ungrouped = templates.filter(
      (template) => !sections.some((entry) => entry.value === template.section)
    )
    if (ungrouped.length > 0) {
      groups.push({ section: 'other', label: 'Other', items: ungrouped })
    }
    return groups
  }, [filteredNodeTemplates, nodeSections, shouldShowNodePicker])

  const handleNodePickerOpenChange = (open: boolean) => {
    setIsNodePickerOpen(open)
    if (!open && nodeSearch) onNodeSearchChange?.('')
  }

  const handleNodeTemplateSelect = (template: NodeTemplate) => {
    onAddNodeFromList?.(template)
    handleNodePickerOpenChange(false)
  }

  return (
    <div className="builder-toolbar flex items-center justify-between gap-2 border-b border-foreground-muted/30 bg-surface-200 px-4 py-2">
      <div className="flex min-w-0 items-center gap-3">
        {onBack && (
          <Button
            size="tiny"
            type="text"
            icon={<ArrowLeft size={14} />}
            className="px-1"
            onClick={onBack}
            aria-label="Back to device model"
          />
        )}
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-foreground">{displayTitle}</div>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {shouldShowNodePicker && (
          <Popover_Shadcn_
            modal={false}
            open={isNodePickerOpen}
            onOpenChange={handleNodePickerOpenChange}
          >
            <PopoverTrigger_Shadcn_ asChild>
              <Button
                size="tiny"
                type="default"
                iconRight={<ChevronDown size={14} />}
                disabled={!canEdit}
              >
                Add node
              </Button>
            </PopoverTrigger_Shadcn_>
            <PopoverContent_Shadcn_ className="w-[320px] p-0" portal align="end">
              <Command_Shadcn_ shouldFilter={false}>
                <CommandInput_Shadcn_
                  placeholder="Search nodes..."
                  value={nodeSearch}
                  onValueChange={onNodeSearchChange}
                />
                <CommandList_Shadcn_ className="max-h-80 overflow-auto">
                  <CommandEmpty_Shadcn_>No nodes found.</CommandEmpty_Shadcn_>
                  {groupedNodeTemplates.map((group) => (
                    <CommandGroup_Shadcn_
                      key={group.section}
                      heading={`${group.label} · ${group.items.length}`}
                    >
                      {group.items.map((template) => (
                        <CommandItem_Shadcn_
                          key={template.value}
                          value={template.label}
                          onSelect={() => handleNodeTemplateSelect(template)}
                          onClick={() => handleNodeTemplateSelect(template)}
                          className="cursor-pointer"
                        >
                          <span className="truncate">{template.label}</span>
                        </CommandItem_Shadcn_>
                      ))}
                    </CommandGroup_Shadcn_>
                  ))}
                </CommandList_Shadcn_>
              </Command_Shadcn_>
            </PopoverContent_Shadcn_>
          </Popover_Shadcn_>
        )}
        {isSaving && <span className="text-xs text-foreground-muted">Saving…</span>}
      </div>
    </div>
  )
}

export default RuleChainToolbar
