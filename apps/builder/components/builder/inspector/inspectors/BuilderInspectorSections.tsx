/**
 * Рендер секций inspector: собирает и выводит секции/поля по текущей конфигурации.
 */
import { Fragment, type ReactNode } from 'react'

import type { WidgetDefinition, WidgetField } from 'widgets/runtime'

import type { BuilderWidgetInstance } from '../../types'
import { BuilderEventHandlers } from '../features/events'
import {
  buildInspectorSectionsSchema,
} from '../model'
import type {
  InlineEditorLayout,
  InspectorFieldRowSchema,
  InspectorFieldGroup,
  InspectorHiddenRowSchema,
  InspectorInlineRowSchema,
  InspectorListSection,
  InspectorSectionSchema,
  InspectorPanel,
  InspectorSectionRowSchema,
  StyleFieldFallback,
} from '../model'
import {
  InspectorSectionsContent,
  SectionList,
  SectionListHeader,
  resolveSectionKeys,
} from './sections'
import {
  FieldRow,
  InlineFieldRow,
} from './rows'
import {
  type InspectorControlRuntime,
} from './controls'

const HIDDEN_FX_FIELD: WidgetField = {
  key: 'hidden',
  label: 'Hidden',
  type: 'boolean',
  supportsFx: true,
  valueType: ['boolean', 'void'],
  description: 'Hide this widget in preview and runtime.',
}

const INLINE_FIELD_SECONDARY_WIDTH = 'w-20 shrink-0'

type BuilderInspectorSectionsProps = {
  orderedGroups: InspectorFieldGroup[]
  showProperties: boolean
  showInteraction: boolean
  showHiddenInAppearance: boolean
  isFilteringActive: boolean
  supportsLabelAddon: boolean
  supportsEventHandlers: boolean
  widget: BuilderWidgetInstance
  definition: WidgetDefinition
  events: unknown
  eventTargets: { id: string; label: string; type?: string }[]
  eventQueries: { id: string; label: string }[]
  eventScripts: { id: string; label: string }[]
  eventPages: { id: string; label: string }[]
  eventApps: { id: string; label: string }[]
  eventVariables: { id: string; label: string }[]
  listPopoverOpen: string | null
  setListPopoverOpen: (next: string | null) => void
  setAddonPanel: (panel: { key: string; label: string } | null) => void
  activeAddonPanel: InspectorPanel | null
  onUpdateProps: (patch: Record<string, unknown>) => void
  onUpdateHidden: (hidden: boolean | string) => void
  controlRuntime: InspectorControlRuntime
  getStyleFallback?: (field: WidgetField) => StyleFieldFallback | null
  fxStickyFields: Record<string, boolean>
  handleFieldChange: (field: WidgetField, patch: Record<string, unknown>) => void
  handleInlineFieldChange: (patch: Record<string, unknown>) => void
  getFieldValue: (field: WidgetField) => unknown
  inlineEditorLayout: Record<string, InlineEditorLayout>
  isSectionCollapsible: (section?: string) => boolean
  isSectionCollapsed: (section?: string) => boolean
  toggleSection: (section?: string) => void
}

export const BuilderInspectorSections = ({
  orderedGroups,
  showProperties,
  showInteraction,
  showHiddenInAppearance,
  isFilteringActive,
  supportsLabelAddon,
  supportsEventHandlers,
  widget,
  definition,
  events,
  eventTargets,
  eventQueries,
  eventScripts,
  eventPages,
  eventApps,
  eventVariables,
  listPopoverOpen,
  setListPopoverOpen,
  setAddonPanel,
  activeAddonPanel,
  onUpdateProps,
  onUpdateHidden,
  controlRuntime,
  getStyleFallback,
  fxStickyFields,
  handleFieldChange,
  handleInlineFieldChange,
  getFieldValue,
  inlineEditorLayout,
  isSectionCollapsible,
  isSectionCollapsed,
  toggleSection,
}: BuilderInspectorSectionsProps) => {
  if (!showProperties) {
    return null
  }

  const sectionSchemas = buildInspectorSectionsSchema({
    orderedGroups,
    showInteraction,
    showHiddenInAppearance,
    supportsLabelAddon,
    supportsEventHandlers,
    getFieldValue,
    fxStickyFields,
    hiddenValue: widget.hidden ?? false,
    isSectionCollapsible,
    isSectionCollapsed,
  })

  const renderEventHandlers = (key: string) => (
    <BuilderEventHandlers
      key={key}
      events={events}
      onChange={(nextEvents) => onUpdateProps({ events: nextEvents })}
      eventTargets={eventTargets}
      eventQueries={eventQueries}
      eventScripts={eventScripts}
      eventPages={eventPages}
      eventApps={eventApps}
      eventVariables={eventVariables}
      eventOptions={definition.builder?.eventOptions}
      actionOptions={definition.builder?.eventActionOptions}
      defaultTargetId={widget.id}
      resetKey={widget.id}
    />
  )

  const effectiveControlRuntime: InspectorControlRuntime = {
    ...controlRuntime,
    activeInspectorPanel: activeAddonPanel,
    onActiveInspectorPanelChange: setAddonPanel,
  }

  const renderFieldRow = (row: InspectorFieldRowSchema) => (
    <FieldRow
      key={row.key}
      field={row.field}
      value={row.value}
      editorId={`builder-fx-${widget.id}-${row.field.key}`}
      onChange={(patch) => handleFieldChange(row.field, patch)}
      fxMode={row.fxMode}
      inlineOverflow={inlineEditorLayout[row.field.key]?.overflow}
      controlRuntime={
        row.canToggleFxMode
          ? effectiveControlRuntime
          : { ...effectiveControlRuntime, onToggleFxMode: undefined }
      }
    />
  )

  const renderInlineRow = (row: InspectorInlineRowSchema) => (
    <InlineFieldRow
      key={row.key}
      field={row.field}
      inlineWith={row.inlineWith}
      value={row.value}
      inlineValue={row.inlineValue}
      editorId={`builder-fx-${widget.id}-${row.field.key}`}
      inlineEditorId={`builder-fx-${widget.id}-${row.inlineWith.key}`}
      onChange={handleInlineFieldChange}
      fxMode={row.fxMode}
      inlineFxMode={row.inlineFxMode}
      onToggleInlineFxMode={
        row.canToggleInlineFxMode ? effectiveControlRuntime.onToggleFxMode : undefined
      }
      inlineOverflow={inlineEditorLayout[row.field.key]?.overflow}
      inlineOverflowSecondary={inlineEditorLayout[row.inlineWith.key]?.overflow}
      controlRuntime={
        row.canToggleFxMode
          ? effectiveControlRuntime
          : { ...effectiveControlRuntime, onToggleFxMode: undefined }
      }
      secondaryWidthClass={INLINE_FIELD_SECONDARY_WIDTH}
    />
  )

  const hiddenControlRuntime: InspectorControlRuntime = {
    ...effectiveControlRuntime,
    onToggleFxMode: undefined,
    onFxClick: (field, value, editorId) =>
      effectiveControlRuntime.onFxClick?.(field, value, editorId, (nextValue) =>
        onUpdateHidden(nextValue)
      ),
  }

  const renderHiddenRow = (row: InspectorHiddenRowSchema) => (
    <FieldRow
      key={row.key}
      field={HIDDEN_FX_FIELD}
      value={row.value}
      editorId={`builder-fx-${widget.id}-hidden`}
      onChange={(patch) => onUpdateHidden(patch.hidden as boolean | string)}
      fxMode
      inlineOverflow={inlineEditorLayout.hidden?.overflow}
      controlRuntime={hiddenControlRuntime}
    />
  )

  const renderSectionRow = (row: InspectorSectionRowSchema): ReactNode => {
    if (row.kind === 'field') {
      return renderFieldRow(row)
    }
    if (row.kind === 'inline') {
      return renderInlineRow(row)
    }
    if (row.kind === 'eventHandlers') {
      return renderEventHandlers(row.key)
    }
    if (row.kind === 'eventHandlersWithField') {
      const fieldRow = {
        ...row.fieldRow,
        key: `${row.key}:field`,
      }
      return (
        <Fragment key={row.key}>
          {renderEventHandlers(`${row.key}:events`)}
          {renderFieldRow(fieldRow)}
        </Fragment>
      )
    }
    return renderHiddenRow(row)
  }

  const renderListSection = (
    _sectionSchema: InspectorSectionSchema,
    listSection: InspectorListSection
  ) => (
    <>
      <SectionListHeader
        title={listSection.title}
        storageKey={listSection.storageKey}
        buttonPosition={listSection.buttonPosition}
        openKey={listPopoverOpen}
        onOpenChange={setListPopoverOpen}
        fields={listSection.fields}
        widgetProps={widget.props}
        getStyleFallback={getStyleFallback}
        onAdd={(storageKey, key) => {
          const nextKeys = resolveSectionKeys(
            listSection.fields,
            widget.props,
            storageKey
          )
          if (!nextKeys.includes(key)) {
            const nextPatch: Record<string, unknown> = {
              [storageKey]: [...nextKeys, key],
            }
            if (storageKey === 'addons' && key === 'label') {
              const currentValue = widget.props?.[key]
              const isEmpty =
                currentValue === null ||
                typeof currentValue === 'undefined' ||
                (typeof currentValue === 'string' &&
                  currentValue.trim().length === 0)
              if (isEmpty) {
                nextPatch[key] = 'Label'
              }
            }
            onUpdateProps(nextPatch)
          }
          setListPopoverOpen(null)
        }}
      />
      <SectionList
        fields={listSection.fields}
        widgetProps={widget.props}
        storageKey={listSection.storageKey}
        widgetId={widget.id}
        getStyleFallback={getStyleFallback}
        inlineOverflowLookup={inlineEditorLayout}
        panelKeys={listSection.panelKeys}
        onOpenPanel={(key, label) => {
          setAddonPanel({ key, label })
          setListPopoverOpen(null)
        }}
        onChange={onUpdateProps}
        fxModeLookup={fxStickyFields}
        controlRuntime={effectiveControlRuntime}
      />
    </>
  )

  const renderStandaloneEventHandlers = (sectionSchema: InspectorSectionSchema) =>
    sectionSchema.showStandaloneEventHandlers
      ? renderEventHandlers(`${sectionSchema.key}:events-standalone`)
      : null

  return (
    <InspectorSectionsContent
      sectionSchemas={sectionSchemas}
      isFilteringActive={isFilteringActive}
      onToggleSection={toggleSection}
      renderSectionRow={renderSectionRow}
      renderListSection={renderListSection}
      renderStandaloneEventHandlers={renderStandaloneEventHandlers}
    />
  )
}
