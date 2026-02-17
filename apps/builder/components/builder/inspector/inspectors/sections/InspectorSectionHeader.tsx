/**
 * Заголовок секции inspector: название, действия и состояние раскрытия секции.
 */
import type { ReactNode } from 'react'
import { MoreHorizontal } from 'lucide-react'

import { PopoverContent_Shadcn_, PopoverTrigger_Shadcn_, Popover_Shadcn_ } from 'ui'

type InspectorSectionHeaderProps = {
  section?: string
  isCollapsible: boolean
  isFilteringActive: boolean
  advancedContent?: ReactNode
  onToggleSection: (section?: string) => void
}

export const InspectorSectionHeader = ({
  section,
  isCollapsible,
  isFilteringActive,
  advancedContent,
  onToggleSection,
}: InspectorSectionHeaderProps) => {
  if (!section) {
    return null
  }

  return (
    <div className="flex h-6 items-center justify-between">
      {isCollapsible ? (
        <button
          type="button"
          className="flex items-center gap-1 text-[12px] font-medium text-foreground hover:text-foreground"
          onClick={() => onToggleSection(section)}
        >
          <span>{section}</span>
        </button>
      ) : (
        <div className="text-[12px] font-medium text-foreground">{section}</div>
      )}
      {advancedContent && !isFilteringActive ? (
        <Popover_Shadcn_>
          <PopoverTrigger_Shadcn_ asChild>
            <button
              type="button"
              className="rounded-md px-1 py-1 text-[11px] font-medium text-foreground-muted hover:bg-foreground/10 hover:text-foreground"
            >
              <MoreHorizontal size={12} />
            </button>
          </PopoverTrigger_Shadcn_>
          <PopoverContent_Shadcn_ className="w-80 p-3" align="end">
            {advancedContent}
          </PopoverContent_Shadcn_>
        </Popover_Shadcn_>
      ) : null}
    </div>
  )
}
