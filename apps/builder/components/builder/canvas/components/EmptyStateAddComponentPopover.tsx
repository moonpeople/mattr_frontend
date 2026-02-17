/**
 * Popover пустого состояния: quick-add меню для пустых зон frame/container.
 */
import { useState } from 'react'
import { Plus } from 'lucide-react'
import type { WidgetDefinition } from 'widgets/runtime'
import {
  Button_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
} from 'ui'

import type { BuilderWidgetAddOptions } from '../../types'
import type { CossInputPreset } from '../../../../data/coss-input-presets'
import { QuickAddMenu } from '../../components/QuickAddMenu'

export const EmptyStateAddComponentPopover = ({
  commonWidgets,
  presetGroups,
  groupedWidgets,
  search,
  onSearchChange,
  isWidgetSelectable,
  onSelect,
}: {
  commonWidgets: WidgetDefinition[]
  presetGroups: {
    key: string
    label: string
    items: { preset: CossInputPreset; widget: WidgetDefinition }[]
  }[]
  groupedWidgets: [string, WidgetDefinition[]][]
  search: string
  onSearchChange: (value: string) => void
  isWidgetSelectable?: (widgetType: string, options?: BuilderWidgetAddOptions) => boolean
  onSelect: (widgetType: string, options?: BuilderWidgetAddOptions) => void
}) => {
  const [open, setOpen] = useState(false)
  return (
    <Popover_Shadcn_
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (nextOpen) {
          onSearchChange('')
        }
      }}
    >
      <PopoverTrigger_Shadcn_ asChild>
        <Button_Shadcn_
          type="button"
          variant={'ghost'}
          size={'sm'}
          className="gap-2"
          onClick={(event) => event.stopPropagation()}
        >
          <Plus size={14} />
          Add component
        </Button_Shadcn_>
      </PopoverTrigger_Shadcn_>
      <PopoverContent_Shadcn_
        className="w-80 p-0"
        align="center"
        side="bottom"
        onClick={(event) => event.stopPropagation()}
      >
        <QuickAddMenu
          commonWidgets={commonWidgets}
          presetGroups={presetGroups}
          groupedWidgets={groupedWidgets}
          search={search}
          onSearchChange={onSearchChange}
          isWidgetSelectable={isWidgetSelectable}
          onSelect={(widgetType, options) => {
            onSelect(widgetType, options)
            setOpen(false)
          }}
        />
      </PopoverContent_Shadcn_>
    </Popover_Shadcn_>
  )
}
