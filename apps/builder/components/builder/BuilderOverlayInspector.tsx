import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react'

import type { WidgetDefinition } from 'widgets'
import {
  Badge,
  Button,
  ButtonGroup,
  ButtonGroupItem,
  Input_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  Select_Shadcn_,
  Separator,
  Switch,
} from 'ui'

import type { BuilderWidgetInstance } from './types'
import { BuilderEventHandlers } from './BuilderEventHandlers'

type BuilderOverlayInspectorProps = {
  widget: BuilderWidgetInstance
  definition?: WidgetDefinition
  mode: 'drawer' | 'modal'
  widgetMode: 'global' | 'page-global'
  eventTargets: { id: string; label: string; type?: string }[]
  eventQueries: { id: string; label: string }[]
  eventScripts: { id: string; label: string }[]
  eventPages: { id: string; label: string }[]
  eventApps: { id: string; label: string }[]
  eventVariables?: { id: string; label: string }[]
  onUpdateProps: (patch: Record<string, unknown>) => void
  onUpdateHidden: (hidden: boolean | string) => void
  onUpdateChildProps: (
    parentId: string,
    childId: string,
    patch: Record<string, unknown>,
    mode: 'global' | 'page-global'
  ) => void
  onDelete?: () => void
}

type OverlayAddonView = 'root' | 'header' | 'footer'

const drawerWidths = [
  { value: 'small', label: 'Small', px: 320 },
  { value: 'medium', label: 'Medium', px: 400 },
  { value: 'large', label: 'Large', px: 480 },
]

const modalSizes = [
  { value: 'small', label: 'Small', px: 480 },
  { value: 'medium', label: 'Medium', px: 640 },
  { value: 'large', label: 'Large', px: 800 },
]

const parseBoolean = (value: unknown, fallback = false) => {
  if (typeof value === 'boolean') {
    return value
  }
  if (typeof value === 'number') {
    return value !== 0
  }
  if (typeof value === 'string') {
    const trimmed = value.trim().toLowerCase()
    if (['true', '1', 'yes', 'y'].includes(trimmed)) {
      return true
    }
    if (['false', '0', 'no', 'n'].includes(trimmed)) {
      return false
    }
  }
  return fallback
}


export const BuilderOverlayInspector = ({
  widget,
  definition,
  mode,
  widgetMode,
  eventTargets,
  eventQueries,
  eventScripts,
  eventPages,
  eventApps,
  eventVariables = [],
  onUpdateProps,
  onUpdateHidden,
  onUpdateChildProps,
  onDelete,
}: BuilderOverlayInspectorProps) => {
  const [addonView, setAddonView] = useState<OverlayAddonView>('root')
  useEffect(() => {
    setAddonView('root')
  }, [widget.id])

  const overlayProps = widget.props as
    | {
        title?: string
        showHeader?: boolean
        showFooter?: boolean
        showOverlay?: boolean
        closeOnOutsideClick?: boolean
        expandToFit?: boolean
        padding?: 'normal' | 'none'
        width?: 'small' | 'medium' | 'large'
        size?: 'small' | 'medium' | 'large'
        events?: unknown
      }
    | undefined
  const showHeader = overlayProps?.showHeader !== false
  const showFooter = overlayProps?.showFooter !== false
  const headerType = mode === 'drawer' ? 'DrawerHeader' : 'ModalHeader'
  const footerType = mode === 'drawer' ? 'DrawerFooter' : 'ModalFooter'
  const headerWidget = widget.children?.find((child) => child.type === headerType)
  const footerWidget = widget.children?.find((child) => child.type === footerType)
  const headerProps = headerWidget?.props as
    | { showSeparator?: boolean; padding?: 'normal' | 'none' }
    | undefined
  const footerProps = footerWidget?.props as
    | { showSeparator?: boolean; padding?: 'normal' | 'none' }
    | undefined
  const SectionTitle = ({ children }: { children: string }) => (
    <div className="text-[11px] uppercase text-foreground-muted">{children}</div>
  )

  const Segmented = ({
    value,
    onChange,
  }: {
    value: 'normal' | 'none'
    onChange: (next: 'normal' | 'none') => void
  }) => (
    <ButtonGroup>
      <ButtonGroupItem
        size="tiny"
        type={value === 'normal' ? 'default' : 'text'}
        onClick={() => onChange('normal')}
      >
        Normal
      </ButtonGroupItem>
      <ButtonGroupItem
        size="tiny"
        type={value === 'none' ? 'default' : 'text'}
        onClick={() => onChange('none')}
      >
        None
      </ButtonGroupItem>
    </ButtonGroup>
  )

  const renderAddonRow = (
    label: string,
    enabled: boolean,
    onOpen: () => void
  ) => (
    <button
      type="button"
      className="flex w-full items-center justify-between rounded-md border border-foreground-muted/30 bg-surface-100 px-3 py-2 text-left text-xs text-foreground transition hover:border-foreground-muted/50"
      onClick={onOpen}
    >
      <span>{label}</span>
      <span className="flex items-center gap-2 text-foreground-muted">
        <span>{enabled ? 'Enabled' : 'Disabled'}</span>
        <ChevronRight size={12} />
      </span>
    </button>
  )

  const renderHeader = (title: string) => (
    <div className="flex items-center gap-2 px-4 py-2 text-xs text-foreground-muted">
      <button
        type="button"
        className="flex items-center gap-1 text-foreground-muted hover:text-foreground"
        onClick={() => setAddonView('root')}
      >
        <ChevronLeft size={14} />
        <span>{widget.id}</span>
      </button>
      <span className="text-foreground">›</span>
      <span className="text-foreground">{title}</span>
    </div>
  )

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between px-4 py-2">
        <div>
          <div className="text-[11px] font-semibold">{definition?.label ?? 'Frame'}</div>
          <div className="text-[10px] text-foreground-muted">{widget.id}</div>
        </div>
        <div className="flex items-center gap-2">
          <Badge>Selected</Badge>
          {onDelete && (
            <Button
              type="text"
              size="tiny"
              icon={<Trash2 size={14} />}
              onClick={onDelete}
              aria-label="Delete component"
            />
          )}
        </div>
      </div>
      <Separator />
      {addonView === 'header' && renderHeader('Header')}
      {addonView === 'footer' && renderHeader('Footer')}
      {addonView === 'root' && (
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-3">
          <div className="space-y-3">
            <SectionTitle>Content</SectionTitle>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <SectionTitle>Add-ons</SectionTitle>
              <Button type="text" size="tiny" icon={<Plus size={14} />} />
            </div>
            <div className="space-y-2">
              {renderAddonRow('Header', showHeader, () => setAddonView('header'))}
              {renderAddonRow('Footer', showFooter, () => setAddonView('footer'))}
            </div>
          </div>
          <Separator />
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <SectionTitle>Interaction</SectionTitle>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-foreground-muted">
                Close when clicking outside
              </span>
              <Switch
                checked={overlayProps?.closeOnOutsideClick !== false}
                onCheckedChange={(checked) => onUpdateProps({ closeOnOutsideClick: checked })}
                size="small"
              />
            </div>
            <BuilderEventHandlers
              events={overlayProps?.events}
              onChange={(nextEvents) => onUpdateProps({ events: nextEvents })}
              eventTargets={eventTargets}
              eventQueries={eventQueries}
              eventScripts={eventScripts}
              eventPages={eventPages}
              eventApps={eventApps}
              eventVariables={eventVariables}
              defaultTargetId={widget.id}
              resetKey={widget.id}
            />
          </div>
          <Separator />
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <SectionTitle>Appearance</SectionTitle>
              <Button type="text" size="tiny" icon={<Plus size={14} />} />
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-foreground-muted">Show overlay</span>
              <Switch
                checked={overlayProps?.showOverlay !== false}
                onCheckedChange={(checked) => onUpdateProps({ showOverlay: checked })}
                size="small"
              />
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-foreground-muted">Expand content to fit</span>
              <Switch
                checked={overlayProps?.expandToFit === true}
                onCheckedChange={(checked) => onUpdateProps({ expandToFit: checked })}
                size="small"
              />
            </div>
            <div className="space-y-2">
              <span className="text-xs text-foreground-muted">Hidden</span>
              <Input_Shadcn_
                value={String(parseBoolean(widget.hidden, false))}
                onChange={(event) => onUpdateHidden(event.target.value === 'true')}
                className="h-7 font-mono text-xs"
              />
            </div>
            <div className="space-y-2">
              <span className="text-xs text-foreground-muted">Styles</span>
              <div className="flex items-center justify-between rounded-md border border-foreground-muted/30 bg-surface-100 px-3 py-2 text-xs text-foreground-muted">
                <span>None</span>
                <Plus size={12} />
              </div>
            </div>
            <div className="space-y-2">
              <span className="text-xs text-foreground-muted">Nested styles</span>
              <div className="flex items-center justify-between rounded-md border border-foreground-muted/30 bg-surface-100 px-3 py-2 text-xs text-foreground-muted">
                <span>None</span>
                <Plus size={12} />
              </div>
            </div>
          </div>
          <Separator />
          <div className="space-y-3">
            <SectionTitle>Spacing</SectionTitle>
            <div className="space-y-2">
              <span className="text-xs text-foreground-muted">
                {mode === 'drawer' ? 'Width' : 'Size'}
              </span>
              <Select_Shadcn_
                value={mode === 'drawer' ? overlayProps?.width ?? 'medium' : overlayProps?.size ?? 'medium'}
                onValueChange={(value) =>
                  onUpdateProps(mode === 'drawer' ? { width: value } : { size: value })
                }
              >
                <SelectTrigger_Shadcn_ className="h-7">
                  <SelectValue_Shadcn_ />
                </SelectTrigger_Shadcn_>
                <SelectContent_Shadcn_>
                  {(mode === 'drawer' ? drawerWidths : modalSizes).map((option) => (
                    <SelectItem_Shadcn_
                      key={option.value}
                      value={option.value}
                    >
                      {option.label} {option.px}px
                    </SelectItem_Shadcn_>
                  ))}
                </SelectContent_Shadcn_>
              </Select_Shadcn_>
            </div>
            <div className="space-y-2">
              <span className="text-xs text-foreground-muted">Padding</span>
              <Segmented
                value={overlayProps?.padding === 'none' ? 'none' : 'normal'}
                onChange={(value) => onUpdateProps({ padding: value })}
              />
            </div>
          </div>
        </div>
      )}
      {addonView !== 'root' && (
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-3">
          <div className="space-y-3">
            <SectionTitle>Appearance</SectionTitle>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-foreground-muted">
                Show {addonView === 'header' ? 'header' : 'footer'}
              </span>
              <Switch
                checked={addonView === 'header' ? showHeader : showFooter}
                onCheckedChange={(checked) =>
                  onUpdateProps(
                    addonView === 'header' ? { showHeader: checked } : { showFooter: checked }
                  )
                }
                size="small"
              />
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-foreground-muted">Show separator</span>
              <Switch
                checked={
                  addonView === 'header'
                    ? headerProps?.showSeparator !== false
                    : footerProps?.showSeparator !== false
                }
                onCheckedChange={(checked) => {
                  const target = addonView === 'header' ? headerWidget : footerWidget
                  if (!target) {
                    return
                  }
                  onUpdateChildProps(widget.id, target.id, { showSeparator: checked }, widgetMode)
                }}
                size="small"
              />
            </div>
          </div>
          <Separator />
          <div className="space-y-3">
            <SectionTitle>Spacing</SectionTitle>
            <div className="space-y-2">
              <span className="text-xs text-foreground-muted">Padding</span>
              <Segmented
                value={
                  addonView === 'header'
                    ? headerProps?.padding === 'none'
                      ? 'none'
                      : 'normal'
                    : footerProps?.padding === 'none'
                      ? 'none'
                      : 'normal'
                }
                onChange={(value) => {
                  const target = addonView === 'header' ? headerWidget : footerWidget
                  if (!target) {
                    return
                  }
                  onUpdateChildProps(widget.id, target.id, { padding: value }, widgetMode)
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
