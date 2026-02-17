import {
  BarChartIcon,
  Box,
  Calendar,
  ChevronDown,
  Edit,
  FileText,
  Image as ImageIcon,
  Layers,
  LayoutGrid,
  List,
  ListTree,
  Menu,
  MousePointer2,
  Table2,
  Upload,
  User,
} from 'lucide-react'

import type { WidgetDefinition } from 'widgets/runtime'
import { Button, Input_Shadcn_, ScrollArea, Separator } from 'ui'

import type { BuilderWidgetAddOptions } from '../types'
import type { CossInputPreset } from '../../../data/coss-input-presets'

const widgetIconMap: Record<string, typeof Box> = {
  Text: FileText,
  Button: MousePointer2,
  TextInput: Edit,
  Email: Edit,
  Url: Edit,
  Select: ChevronDown,
  Switch: Box,
  DatePicker: Calendar,
  Calendar: Calendar,
  DateRangePicker: Calendar,
  DateTimePicker: Calendar,
  TimePicker: Calendar,
  DatetimeInput: Calendar,
  CalendarInput: Calendar,
  Date: Calendar,
  DateRange: Calendar,
  DateTime: Calendar,
  Day: Calendar,
  Month: Calendar,
  Time: Calendar,
  Year: Calendar,
  FileUpload: Upload,
  Container: LayoutGrid,
  Tabs: LayoutGrid,
  Sidebar: Layers,
  Drawer: ListTree,
  SplitPane: LayoutGrid,
  Modal: Box,
  Form: Box,
  Table: Table2,
  ListView: List,
  Chart: BarChartIcon,
  Image: ImageIcon,
  Icon: Box,
  Navigation: Menu,
  Avatar: User,
}

type PresetGroup = {
  key: string
  label: string
  items: { preset: CossInputPreset; widget: WidgetDefinition }[]
}

export type QuickAddMenuProps = {
  commonWidgets: WidgetDefinition[]
  presetGroups: PresetGroup[]
  groupedWidgets: [string, WidgetDefinition[]][]
  search: string
  onSearchChange: (value: string) => void
  onSelect: (widgetType: string, options?: BuilderWidgetAddOptions) => void
  isWidgetSelectable?: (widgetType: string, options?: BuilderWidgetAddOptions) => boolean
}

export const QuickAddMenu = ({
  commonWidgets,
  presetGroups,
  groupedWidgets,
  search,
  onSearchChange,
  onSelect,
  isWidgetSelectable,
}: QuickAddMenuProps) => {
  const hasAnyWidgets =
    commonWidgets.length > 0 || presetGroups.length > 0 || groupedWidgets.length > 0

  return (
    <div>
      <div className="p-2">
        <Input_Shadcn_
          value={search}
          size={"tiny"}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search components"
        />
      </div>
      <Separator />
      <ScrollArea className="h-72">
        <div className="space-y-3 p-2">
          {commonWidgets.length > 0 && (
            <div className="space-y-1">
              <div className="px-2 py-1 text-xs uppercase text-foreground">Common</div>
              <div>
                {commonWidgets.map((widget) => (
                  <WidgetMenuItem
                    key={widget.type}
                    widget={widget}
                    onSelect={onSelect}
                    disabled={isWidgetSelectable ? !isWidgetSelectable(widget.type) : false}
                  />
                ))}
              </div>
            </div>
          )}
          {commonWidgets.length > 0 && (presetGroups.length > 0 || groupedWidgets.length > 0) && (
            <Separator />
          )}
          {presetGroups.length > 0 && (
            <div className="space-y-3">
              {presetGroups.map((group) => (
                <div key={group.key} className="space-y-1">
                  <div className="px-2 py-1 text-xs uppercase text-foreground">{group.label}</div>
                  <div>
                    {group.items.map(({ preset, widget }) => (
                      <WidgetMenuItem
                        key={preset.name}
                        widget={widget}
                        label={preset.label ?? preset.name}
                        addOptions={{ presetId: preset.name }}
                        onSelect={onSelect}
                        disabled={
                          isWidgetSelectable
                            ? !isWidgetSelectable(widget.type, { presetId: preset.name })
                            : false
                        }
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          {presetGroups.length > 0 && groupedWidgets.length > 0 && <Separator />}
          {groupedWidgets.map(([category, items]) => (
            <div key={category} className="space-y-1">
              <div className="px-2 py-1 text-xs uppercase text-foreground">{category}</div>
              <div>
                {items.map((widget) => (
                  <WidgetMenuItem
                    key={widget.type}
                    widget={widget}
                    onSelect={onSelect}
                    disabled={isWidgetSelectable ? !isWidgetSelectable(widget.type) : false}
                  />
                ))}
              </div>
            </div>
          ))}
          {!hasAnyWidgets && (
            <div className="px-2 py-2 text-sm text-foreground-muted">No widgets found.</div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

const WidgetMenuItem = ({
  widget,
  onSelect,
  addOptions,
  label,
  disabled,
}: {
  widget: WidgetDefinition
  onSelect: (widgetType: string, options?: BuilderWidgetAddOptions) => void
  addOptions?: BuilderWidgetAddOptions
  label?: string
  disabled?: boolean
}) => {
  const Icon = widgetIconMap[widget.type] ?? Box

  return (
    <Button
      type="text"
      size="tiny"
      className="h-12 w-full justify-start rounded-none px-2 py-0.5 disabled:cursor-not-allowed disabled:opacity-50"
      onClick={() => onSelect(widget.type, addOptions)}
      disabled={disabled}
    >
      <div className="mr-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-foreground-muted/25 text-foreground-muted">
        <Icon size={14} />
      </div>
      <div className="flex min-w-0 flex-col items-start leading-5">
        <span className="truncate text-xs text-foreground">{label ?? widget.label}</span>
        {widget.description && (
          <span className="line-clamp-1 text-xs text-foreground-muted">
            {widget.description}
          </span>
        )}
      </div>
      {addOptions?.presetId && (
        <span className="ml-auto rounded border border-foreground-muted/30 px-1.5 py-0.5 text-[10px] uppercase text-foreground-muted">
          preset
        </span>
      )}
    </Button>
  )
}
