/**
 * Рендер строк полей inspector: строит последовательность field rows внутри секций.
 */
import { ChevronRight, X } from 'lucide-react'

import type { WidgetField } from 'widgets/runtime'

import {
  shouldUseCollectionItemsEditor,
} from '../../features/collection-items'
import { shouldUseTableColumnsEditor } from '../../features/table-columns'
import {
  BOOLEAN_CHECKBOX_FIELDS,
  ICON_PICKER_FIELDS,
  renderFieldControl,
  shouldStackField,
  shouldTopAlignField,
  type InspectorControlRuntime,
} from '../controls'
import type {
  StyleFieldFallback,
} from '../../model'
import { isFxValue } from '../../model'
import { InspectorFieldLabel, InspectorRow } from '../../shared'

type FieldRowProps = {
  field: WidgetField
  value: unknown
  onChange: (patch: Record<string, unknown>) => void
  editorId: string
  fxMode?: boolean
  inlineOverflow?: boolean
  controlRuntime?: InspectorControlRuntime
}

export const FieldRow = ({
  field,
  value,
  onChange,
  editorId,
  fxMode,
  inlineOverflow,
  controlRuntime,
}: FieldRowProps) => {
  const { fxEvalContext, onToggleFxMode } = controlRuntime ?? {}
  const widgetPropsForCustomControl = (
    (fxEvalContext?.self as Record<string, unknown> | undefined) ??
    fxEvalContext
  ) as Record<string, unknown> | undefined
  const isItemsCollectionControl = shouldUseCollectionItemsEditor(
    field,
    widgetPropsForCustomControl
  )
  const isTableColumnsControl = shouldUseTableColumnsEditor(
    field,
    widgetPropsForCustomControl
  )
  if (isItemsCollectionControl || isTableColumnsControl) {
    return (
      <div className="space-y-1">
        {renderFieldControl({
          field,
          value,
          onChange,
          editorId,
          forceFxMode: fxMode,
          runtime: controlRuntime,
        })}
      </div>
    )
  }

  const topAligned = shouldTopAlignField(field, value)
  const stacked = shouldStackField(field, value, fxMode, inlineOverflow)
  const showFxBadge =
    stacked &&
    field.type === 'boolean' &&
    field.supportsFx &&
    isFxValue(value) &&
    BOOLEAN_CHECKBOX_FIELDS.has(field.key) &&
    Boolean(onToggleFxMode)
  const showSelectFxToggle =
    field.type === 'select' &&
    field.supportsFx &&
    ICON_PICKER_FIELDS.has(field.key) &&
    Boolean(onToggleFxMode)
  const isFxActive = field.supportsFx && isFxValue(value)

  return (
    <InspectorRow
      label={
        showFxBadge ? (
          <div className="flex min-h-7 w-full items-center justify-between gap-2">
            <InspectorFieldLabel
              label={field.label}
              valueType={field.valueType}
              description={field.description}
            />
            <button
              type="button"
              className="rounded bg-foreground/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-foreground"
              onClick={() => onToggleFxMode?.(field, value)}
            >
              fx
            </button>
          </div>
        ) : showSelectFxToggle ? (
          <div className="flex min-h-7 w-full items-center justify-between gap-2">
            <InspectorFieldLabel
              label={field.label}
              valueType={field.valueType}
              description={field.description}
            />
            <button
              type="button"
              className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase transition-colors ${
                isFxActive
                  ? 'bg-foreground/10 text-foreground'
                  : 'pointer-events-none opacity-0 text-foreground-muted group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100 hover:bg-foreground/10 hover:text-foreground'
              }`}
              onClick={() => onToggleFxMode?.(field, value)}
            >
              fx
            </button>
          </div>
        ) : (
          <InspectorFieldLabel
            label={field.label}
            valueType={field.valueType}
            description={field.description}
          />
        )
      }
      topAligned={topAligned}
      stacked={stacked}
    >
      {renderFieldControl({
        field,
        value,
        onChange,
        editorId,
        forceFxMode: fxMode,
        runtime: controlRuntime,
      })}
    </InspectorRow>
  )
}

type InlineFieldRowProps = {
  field: WidgetField
  inlineWith: WidgetField
  value: unknown
  inlineValue: unknown
  onChange: (patch: Record<string, unknown>) => void
  editorId: string
  inlineEditorId: string
  fxMode?: boolean
  inlineFxMode?: boolean
  onToggleInlineFxMode?: (field: WidgetField, value: unknown) => void
  inlineOverflow?: boolean
  inlineOverflowSecondary?: boolean
  controlRuntime?: InspectorControlRuntime
  secondaryWidthClass?: string
}

export const InlineFieldRow = ({
  field,
  inlineWith,
  value,
  inlineValue,
  onChange,
  editorId,
  inlineEditorId,
  fxMode,
  inlineFxMode,
  onToggleInlineFxMode,
  inlineOverflow,
  inlineOverflowSecondary,
  controlRuntime,
  secondaryWidthClass = 'w-20 shrink-0',
}: InlineFieldRowProps) => {
  const primaryRuntime = controlRuntime
  const secondaryRuntime = onToggleInlineFxMode
    ? { ...(controlRuntime ?? {}), onToggleFxMode: onToggleInlineFxMode }
    : controlRuntime

  const topAligned =
    shouldTopAlignField(field, value) || shouldTopAlignField(inlineWith, inlineValue)
  const stacked =
    shouldStackField(field, value, fxMode, inlineOverflow) ||
    shouldStackField(inlineWith, inlineValue, inlineFxMode, inlineOverflowSecondary)

  return (
    <InspectorRow
      label={
        <InspectorFieldLabel
          label={field.label}
          valueType={field.valueType}
          description={field.description}
        />
      }
      topAligned={topAligned}
      stacked={stacked}
    >
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          {renderFieldControl({
            field,
            value,
            onChange,
            editorId,
            forceFxMode: fxMode,
            runtime: primaryRuntime,
          })}
        </div>
        <div className={secondaryWidthClass}>
          {renderFieldControl({
            field: inlineWith,
            value: inlineValue,
            onChange,
            editorId: inlineEditorId,
            forceFxMode: inlineFxMode,
            runtime: secondaryRuntime,
          })}
        </div>
      </div>
    </InspectorRow>
  )
}

type SectionVariant = 'addons'

type SectionLinkRowProps = {
  label: string
  value?: unknown
  onOpen: () => void
  onRemove: () => void
  variant?: SectionVariant
  labelBasis?: number
}

export const SectionLinkRow = ({
  label,
  value,
  onOpen,
  onRemove,
  variant,
  labelBasis = 88,
}: SectionLinkRowProps) => {
  const displayValue = typeof value === 'string' ? value.trim() : ''
  const hasValue = displayValue.length > 0
  const labelDecor =
    variant === 'addons'
      ? 'border-b border-dotted border-foreground-muted/40'
      : ''
  return (
    <div
      className={`group flex min-h-7 items-center px-2 py-1 text-[12px] leading-4 ${
        variant === 'addons' ? 'bg-transparent' : 'rounded-md bg-surface-100'
      }`}
    >
      <div className="flex w-full items-center gap-2">
        <button
          type="button"
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
          onClick={onOpen}
          aria-label={`Open ${label} settings`}
        >
          <div
            className="flex shrink-0 justify-between text-foreground"
            style={{ flexBasis: labelBasis }}
          >
            <span className={`truncate text-foreground ${labelDecor}`}>{label}</span>
          </div>
          <div className="flex min-h-6 min-w-0 flex-1 items-center justify-between gap-2 rounded-md px-2 text-foreground hover:bg-surface-200">
            {hasValue && (
              <span className="max-w-[140px] truncate text-[11px] text-foreground">
                {displayValue}
              </span>
            )}
            <ChevronRight size={12} />
          </div>
        </button>
        <button
          type="button"
          className="invisible text-foreground-muted hover:text-foreground group-hover:visible"
          onClick={onRemove}
          aria-label={`Remove ${label}`}
        >
          <X size={12} />
        </button>
      </div>
    </div>
  )
}

type SectionRowProps = {
  field: WidgetField
  value: unknown
  onChange: (patch: Record<string, unknown>) => void
  onRemove: () => void
  editorId: string
  fxMode?: boolean
  inlineOverflow?: boolean
  controlRuntime?: InspectorControlRuntime
  variant?: SectionVariant
  styleFallback?: StyleFieldFallback | null
  labelBasis?: number
}

export const SectionRow = ({
  field,
  value,
  onChange,
  onRemove,
  editorId,
  fxMode,
  inlineOverflow,
  controlRuntime,
  variant,
  styleFallback,
  labelBasis = 88,
}: SectionRowProps) => {
  const { onToggleFxMode } = controlRuntime ?? {}
  const topAligned = shouldTopAlignField(field, value)
  const stacked = shouldStackField(field, value, fxMode, inlineOverflow)
  const labelDecor =
    variant === 'addons'
      ? 'border-b border-dotted border-foreground-muted/40'
      : ''
  const showSelectFxToggle =
    field.type === 'select' &&
    field.supportsFx &&
    ICON_PICKER_FIELDS.has(field.key) &&
    Boolean(onToggleFxMode)
  const isFxActive = field.supportsFx && isFxValue(value)

  if (
    field.key === 'options' ||
    field.key === 'items' ||
    field.control === 'collectionItems'
  ) {
    return (
      <div className="space-y-1">
        {renderFieldControl({
          field,
          value,
          onChange,
          editorId,
          forceFxMode: fxMode,
          runtime: controlRuntime,
        })}
      </div>
    )
  }

  if (stacked) {
    return (
      <div
        className={`group min-h-7 space-y-2 px-2 py-1 text-[12px] leading-4 ${
          variant === 'addons' ? 'bg-transparent' : 'rounded-md bg-surface-100'
        }`}
      >
        <div className="flex min-h-7 w-full items-center justify-between gap-2 text-foreground">
          <span className={labelDecor}>
            <InspectorFieldLabel
              label={field.label}
              valueType={field.valueType}
              description={field.description}
            />
          </span>
          {showSelectFxToggle && (
            <button
              type="button"
              className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase transition-colors ${
                isFxActive
                  ? 'bg-foreground/10 text-foreground'
                  : 'pointer-events-none opacity-0 text-foreground-muted group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100 hover:bg-foreground/10 hover:text-foreground'
              }`}
              onClick={() => onToggleFxMode?.(field, value)}
            >
              fx
            </button>
          )}
        </div>
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            {renderFieldControl({
              field,
              value,
              onChange,
              editorId,
              forceFxMode: fxMode,
              styleFallback,
              runtime: controlRuntime,
            })}
          </div>
          <button
            type="button"
            className="invisible text-foreground-muted hover:text-foreground group-hover:visible"
            onClick={onRemove}
            aria-label={`Remove ${field.label}`}
          >
            <X size={12} />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`group min-h-7 px-2 py-1 text-[12px] leading-4 ${
        variant === 'addons' ? 'bg-transparent' : 'rounded-md bg-surface-100'
      } ${topAligned ? '' : 'flex items-center'}`}
    >
      <div className={`flex w-full gap-2 ${topAligned ? 'items-start' : 'items-center'}`}>
        <div
          className={`flex shrink-0 justify-between text-foreground ${
            topAligned ? 'mt-1' : ''
          }`}
          style={{ flexBasis: labelBasis }}
        >
          <div className="flex min-h-7 w-full items-center justify-between gap-2">
            <span className={labelDecor}>
              <InspectorFieldLabel
                label={field.label}
                valueType={field.valueType}
                description={field.description}
              />
            </span>
            {showSelectFxToggle && (
              <button
                type="button"
                className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase transition-colors ${
                  isFxActive
                    ? 'bg-foreground/10 text-foreground'
                    : 'pointer-events-none opacity-0 text-foreground-muted group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100 hover:bg-foreground/10 hover:text-foreground'
                }`}
                onClick={() => onToggleFxMode?.(field, value)}
              >
                fx
              </button>
            )}
          </div>
        </div>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <div className="min-w-0 flex-1">
            {renderFieldControl({
              field,
              value,
              onChange,
              editorId,
              forceFxMode: fxMode,
              styleFallback,
              runtime: controlRuntime,
            })}
          </div>
          <button
            type="button"
            className="invisible text-foreground-muted hover:text-foreground group-hover:visible"
            onClick={onRemove}
            aria-label={`Remove ${field.label}`}
          >
            <X size={12} />
          </button>
        </div>
      </div>
    </div>
  )
}
