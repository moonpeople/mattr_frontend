/**
 * Рендер list-разделов секции inspector: списки item-элементов и их controls.
 */
import { Plus } from 'lucide-react'

import type { WidgetField } from 'widgets/runtime'
import {
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
} from 'ui'

import type {
  InlineEditorLayout,
  StyleFieldFallback,
} from '../../model'
import {
  ICON_PICKER_FIELDS,
  getTypographyBadge,
  resolveColorSwatch,
  resolveIconComponent,
  type InspectorControlRuntime,
} from '../controls'
import {
  SectionLinkRow,
  SectionRow,
} from '../rows'

const isSectionItemActive = (field: WidgetField, value: unknown) => {
  if (field.key === 'labelFont') {
    const raw = typeof value === 'string' ? value.trim().toLowerCase() : ''
    if (!raw || raw === 'default') {
      return false
    }
  }
  if (field.type === 'select' || field.type === 'radioGroup') {
    const raw = typeof value === 'string' ? value : ''
    if (!raw) {
      return false
    }
    if (raw === 'default' && field.options?.some((option) => option.value === 'default')) {
      return false
    }
    return raw !== 'none'
  }
  if (field.type === 'boolean') {
    return Boolean(value)
  }
  if (typeof value === 'string') {
    return value.trim().length > 0
  }
  return Boolean(value)
}

export const resolveSectionKeys = (
  fields: WidgetField[],
  props: Record<string, unknown>,
  storageKey: string
) => {
  const stored = Array.isArray(props[storageKey])
    ? (props[storageKey] as string[]).filter(Boolean)
    : null
  if (stored && stored.length > 0) {
    const storedSet = new Set(stored)
    return fields.filter((field) => storedSet.has(field.key)).map((field) => field.key)
  }
  return fields
    .filter((field) => isSectionItemActive(field, props[field.key]))
    .map((field) => field.key)
}

const getSectionEmptyValue = (field: WidgetField) => {
  if (field.type === 'boolean') {
    return false
  }
  if (field.type === 'select' || field.type === 'radioGroup') {
    if (field.options.some((option) => option.value === 'none')) {
      return 'none'
    }
    if (field.options.some((option) => option.value === 'default')) {
      return 'default'
    }
    return ''
  }
  return ''
}

type SectionListHeaderProps = {
  title: string
  storageKey: string
  openKey: string | null
  onOpenChange: (next: string | null) => void
  fields: WidgetField[]
  widgetProps: Record<string, unknown>
  onAdd: (storageKey: string, key: string) => void
  getStyleFallback?: (field: WidgetField) => StyleFieldFallback | null
  buttonPosition?: 'left' | 'right'
}

export const SectionListHeader = ({
  title,
  storageKey,
  openKey,
  onOpenChange,
  fields,
  widgetProps,
  onAdd,
  getStyleFallback,
  buttonPosition = 'right',
}: SectionListHeaderProps) => {
  const activeKeys = resolveSectionKeys(fields, widgetProps, storageKey)
  const availableFields = fields.filter((field) => !activeKeys.includes(field.key))
  const renderFieldPreview = (field: WidgetField, value: unknown) => {
    const fallback = getStyleFallback?.(field)
    const hasValue =
      typeof value === 'string'
        ? value.trim().length > 0 && value.trim() !== 'default'
        : Boolean(value)
    if (ICON_PICKER_FIELDS.has(field.key)) {
      const Icon = resolveIconComponent(typeof value === 'string' ? value : undefined)
      if (Icon) {
        return <Icon size={12} className="text-foreground-muted" />
      }
    }
    if (field.type === 'color') {
      const swatch = hasValue
        ? resolveColorSwatch(value)
        : fallback?.kind === 'color'
          ? fallback.swatch ?? 'transparent'
          : 'transparent'
      return (
        <span className="flex items-center gap-2 text-[11px] text-foreground-muted">
          <span
            className="h-4 w-4 rounded border border-foreground-muted/40"
            style={{ backgroundColor: swatch }}
          />
        </span>
      )
    }
    if (field.control === 'typography' || field.key.toLowerCase().includes('font')) {
      const raw = typeof value === 'string' ? value.trim() : ''
      const displayLabel =
        hasValue && raw !== 'default'
          ? raw
          : fallback?.kind === 'typography'
            ? fallback.label
            : 'Default'
      const badge = getTypographyBadge(displayLabel || 'Default')
      return (
        <span className="flex h-5 w-5 items-center justify-center rounded border border-foreground-muted/30 text-[10px] text-foreground-muted">
          {badge}
        </span>
      )
    }
    if (field.type === 'select' || field.type === 'radioGroup') {
      const raw = typeof value === 'string' ? value : ''
      const option = field.options?.find((item) => item.value === raw)
      const label = option?.label ?? ''
      if (!label) {
        if (!hasValue && fallback?.kind === 'value') {
          return <span className="text-[11px] text-foreground-muted">{fallback.label}</span>
        }
        return null
      }
      return <span className="text-[11px] text-foreground-muted">{label}</span>
    }
    if (field.type === 'boolean') {
      return (
        <span className="text-[11px] text-foreground-muted">
          {Boolean(value) ? 'On' : 'Off'}
        </span>
      )
    }
    if (typeof value === 'string' && value.trim().length > 0) {
      return (
        <span className="max-w-[80px] truncate text-[11px] text-foreground-muted">
          {value}
        </span>
      )
    }
    if (!hasValue && fallback?.kind === 'value') {
      return <span className="text-[11px] text-foreground-muted">{fallback.label}</span>
    }
    return null
  }
  const actionButton = (
    <Popover_Shadcn_
      open={openKey === storageKey}
      onOpenChange={(nextOpen) => onOpenChange(nextOpen ? storageKey : null)}
    >
      <PopoverTrigger_Shadcn_ asChild>
        <button
          type="button"
          className="rounded-md px-1 py-1 text-[11px] font-medium text-foreground-muted hover:bg-foreground/10 hover:text-foreground"
        >
          <Plus size={12} />
        </button>
      </PopoverTrigger_Shadcn_>
      <PopoverContent_Shadcn_ className="w-44 p-1" align="end">
        {availableFields.length === 0 ? (
          <div className="px-2 py-1 text-xs text-foreground-muted">All added</div>
        ) : (
          <div className="space-y-1">
            {availableFields.map((field) => (
              <button
                key={field.key}
                type="button"
                className="flex w-full items-center justify-between gap-2 rounded-sm px-2 py-1 text-xs text-foreground hover:bg-surface-200"
                onClick={() => onAdd(storageKey, field.key)}
              >
                <span className="min-w-0 truncate">{field.label}</span>
                <span className="shrink-0">
                  {renderFieldPreview(field, widgetProps[field.key])}
                </span>
              </button>
            ))}
          </div>
        )}
      </PopoverContent_Shadcn_>
    </Popover_Shadcn_>
  )

  return (
    <div className="mt-2 flex h-6 items-center justify-between">
      {buttonPosition === 'left' ? (
        <div className="flex items-center gap-2">
          {actionButton}
          <div className="text-[12px] font-medium text-foreground">{title}</div>
        </div>
      ) : (
        <>
          <div className="text-[12px] font-medium text-foreground">{title}</div>
          {actionButton}
        </>
      )}
    </div>
  )
}

type SectionListProps = {
  fields: WidgetField[]
  widgetProps: Record<string, unknown>
  storageKey: string
  widgetId: string
  panelKeys?: string[]
  onOpenPanel?: (key: string, label: string) => void
  onChange: (patch: Record<string, unknown>) => void
  fxModeLookup?: Record<string, boolean>
  inlineOverflowLookup?: Record<string, InlineEditorLayout>
  controlRuntime?: InspectorControlRuntime
  getStyleFallback?: (field: WidgetField) => StyleFieldFallback | null
  labelBasis?: number
}

export const SectionList = ({
  fields,
  widgetProps,
  storageKey,
  widgetId,
  panelKeys,
  onOpenPanel,
  onChange,
  fxModeLookup,
  inlineOverflowLookup,
  controlRuntime,
  getStyleFallback,
  labelBasis = 88,
}: SectionListProps) => {
  const addonKeys = resolveSectionKeys(fields, widgetProps, storageKey)
  const fieldMap = new Map(fields.map((field) => [field.key, field]))
  const items = addonKeys
    .map((key) => fieldMap.get(key))
    .filter((field): field is WidgetField => Boolean(field))
  const isAddonList = storageKey === 'addons'

  const ensureAddonKey = (key: string) => {
    const base = resolveSectionKeys(fields, widgetProps, storageKey)
    return base.includes(key) ? base : [...base, key]
  }

  if (items.length === 0) {
    return (
      <div className="rounded-md border border-foreground-muted/20 bg-surface-100 px-2 py-0.5 text-[12px] text-foreground-muted">
        None
      </div>
    )
  }

  return (
    <div
      className={
        isAddonList
          ? 'rounded-md border border-foreground-muted/20 bg-background'
          : 'rounded-sm border border-foreground-muted/20 p-0.5'
      }
    >
      <div className={isAddonList ? 'divide-y divide-foreground-muted/20' : ''}>
        {items.map((field) =>
          panelKeys?.includes(field.key) && onOpenPanel ? (
            <SectionLinkRow
              key={field.key}
              label={field.label}
              value={widgetProps[field.key]}
              onOpen={() => onOpenPanel(field.key, field.label)}
              onRemove={() => {
                const nextAddons = resolveSectionKeys(fields, widgetProps, storageKey).filter(
                  (key) => key !== field.key
                )
                onChange({
                  [storageKey]: nextAddons,
                  [field.key]: getSectionEmptyValue(field),
                })
              }}
              variant={isAddonList ? 'addons' : undefined}
              labelBasis={labelBasis}
            />
          ) : (
            <SectionRow
              key={field.key}
              field={field}
              value={widgetProps[field.key]}
              editorId={`builder-fx-${widgetId}-${field.key}`}
              onChange={(patch) => {
                const nextAddons = ensureAddonKey(field.key)
                onChange({ [storageKey]: nextAddons, ...patch })
              }}
              onRemove={() => {
                const nextAddons = resolveSectionKeys(fields, widgetProps, storageKey).filter(
                  (key) => key !== field.key
                )
                onChange({
                  [storageKey]: nextAddons,
                  [field.key]: getSectionEmptyValue(field),
                })
              }}
              fxMode={Boolean(fxModeLookup?.[field.key])}
              inlineOverflow={inlineOverflowLookup?.[field.key]?.overflow}
              controlRuntime={controlRuntime}
              variant={isAddonList ? 'addons' : undefined}
              styleFallback={getStyleFallback?.(field)}
              labelBasis={labelBasis}
            />
          )
        )}
      </div>
    </div>
  )
}
