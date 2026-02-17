/**
 * Схема секций inspector: декларативная структура секций по типам сущностей/виджетов.
 */
import type { WidgetField } from 'widgets/runtime'

import type { InspectorFieldGroup, InspectorListSection } from './section-types'

const FORCE_FX_FIELDS = new Set(['disabled', 'loading', 'readOnly'])
const FORCE_FX_DEFAULTS: Record<string, unknown> = {
  disabled: false,
  loading: false,
  readOnly: false,
}

const resolveForceFxValue = (fieldKey: string, value: unknown) => {
  if (!FORCE_FX_FIELDS.has(fieldKey)) {
    return value
  }
  if (value === null || typeof value === 'undefined') {
    return FORCE_FX_DEFAULTS[fieldKey]
  }
  return value
}

type InlineFieldItem = {
  field: WidgetField
  inlineWith?: WidgetField
}

const buildInlineFieldItems = (fields: WidgetField[]) => {
  const lookup = new Map(fields.map((field) => [field.key, field]))
  const consumed = new Set<string>()
  const items: InlineFieldItem[] = []

  fields.forEach((field) => {
    if (consumed.has(field.key)) {
      return
    }
    if (field.inlineWith) {
      const inlineField = lookup.get(field.inlineWith)
      if (inlineField && !consumed.has(inlineField.key)) {
        items.push({ field, inlineWith: inlineField })
        consumed.add(field.key)
        consumed.add(inlineField.key)
        return
      }
    }
    items.push({ field })
    consumed.add(field.key)
  })

  return items
}

export type InspectorFieldRowSchema = {
  kind: 'field'
  key: string
  field: WidgetField
  value: unknown
  fxMode: boolean
  canToggleFxMode: boolean
}

export type InspectorInlineRowSchema = {
  kind: 'inline'
  key: string
  field: WidgetField
  inlineWith: WidgetField
  value: unknown
  inlineValue: unknown
  fxMode: boolean
  inlineFxMode: boolean
  canToggleFxMode: boolean
  canToggleInlineFxMode: boolean
}

export type InspectorEventHandlersRowSchema = {
  kind: 'eventHandlers'
  key: string
}

export type InspectorEventHandlersWithFieldRowSchema = {
  kind: 'eventHandlersWithField'
  key: string
  fieldRow: InspectorFieldRowSchema
}

export type InspectorHiddenRowSchema = {
  kind: 'hidden'
  key: string
  value: boolean | string
}

export type InspectorSectionRowSchema =
  | InspectorFieldRowSchema
  | InspectorInlineRowSchema
  | InspectorEventHandlersRowSchema
  | InspectorEventHandlersWithFieldRowSchema
  | InspectorHiddenRowSchema

export type InspectorSectionSchema = {
  key: string
  section?: string
  isCollapsible: boolean
  isCollapsed: boolean
  advancedRows: InspectorSectionRowSchema[]
  rows: InspectorSectionRowSchema[]
  listSections: InspectorListSection[]
  showStandaloneEventHandlers: boolean
}

const buildFieldRowSchema = ({
  sectionKey,
  field,
  getFieldValue,
  fxStickyFields,
  forceFxMode = false,
}: {
  sectionKey: string
  field: WidgetField
  getFieldValue: (field: WidgetField) => unknown
  fxStickyFields: Record<string, boolean>
  forceFxMode?: boolean
}): InspectorFieldRowSchema => {
  const shouldForceFxMode = forceFxMode || FORCE_FX_FIELDS.has(field.key)
  const value = getFieldValue(field)
  return {
    kind: 'field',
    key: `${sectionKey}:field:${field.key}`,
    field,
    value: resolveForceFxValue(field.key, value),
    fxMode: shouldForceFxMode || Boolean(fxStickyFields[field.key]),
    canToggleFxMode: !shouldForceFxMode,
  }
}

const buildInlineRowSchema = ({
  sectionKey,
  field,
  inlineWith,
  getFieldValue,
  fxStickyFields,
}: {
  sectionKey: string
  field: WidgetField
  inlineWith: WidgetField
  getFieldValue: (field: WidgetField) => unknown
  fxStickyFields: Record<string, boolean>
}): InspectorInlineRowSchema => {
  const forceFxMode = FORCE_FX_FIELDS.has(field.key)
  const forceInlineFxMode = FORCE_FX_FIELDS.has(inlineWith.key)
  const value = getFieldValue(field)
  const inlineValue = getFieldValue(inlineWith)

  return {
    kind: 'inline',
    key: `${sectionKey}:inline:${field.key}:${inlineWith.key}`,
    field,
    inlineWith,
    value: resolveForceFxValue(field.key, value),
    inlineValue: resolveForceFxValue(inlineWith.key, inlineValue),
    fxMode: forceFxMode || Boolean(fxStickyFields[field.key]),
    inlineFxMode: forceInlineFxMode || Boolean(fxStickyFields[inlineWith.key]),
    canToggleFxMode: !forceFxMode,
    canToggleInlineFxMode: !forceInlineFxMode,
  }
}

const buildInspectorSectionSchema = ({
  group,
  groupIndex,
  showInteraction,
  showHiddenInAppearance,
  supportsLabelAddon,
  supportsEventHandlers,
  getFieldValue,
  fxStickyFields,
  hiddenValue,
  isSectionCollapsible,
  isSectionCollapsed,
}: {
  group: InspectorFieldGroup
  groupIndex: number
  showInteraction: boolean
  showHiddenInAppearance: boolean
  supportsLabelAddon: boolean
  supportsEventHandlers: boolean
  getFieldValue: (field: WidgetField) => unknown
  fxStickyFields: Record<string, boolean>
  hiddenValue: boolean | string
  isSectionCollapsible: (section?: string) => boolean
  isSectionCollapsed: (section?: string) => boolean
}): InspectorSectionSchema => {
  const sectionName = group.section
  const sectionKey = sectionName ?? `group-${groupIndex}`
  const inlineEvents =
    sectionName === 'Interaction' && group.fields.some((field) => field.key === 'events')
  const shouldInlineEventHandlers =
    sectionName === 'Interaction' &&
    showInteraction &&
    !inlineEvents &&
    group.fields.some((field) => field.key === 'formDataKey')

  const rows: InspectorSectionRowSchema[] = []

  buildInlineFieldItems(group.fields).forEach((item) => {
    if (item.inlineWith) {
      rows.push(
        buildInlineRowSchema({
          sectionKey,
          field: item.field,
          inlineWith: item.inlineWith,
          getFieldValue,
          fxStickyFields,
        })
      )
      return
    }

    const field = item.field
    if (field.key === 'events' && supportsEventHandlers) {
      rows.push({
        kind: 'eventHandlers',
        key: `${sectionKey}:events-inline`,
      })
      return
    }

    const fieldRow = buildFieldRowSchema({
      sectionKey,
      field,
      getFieldValue,
      fxStickyFields,
      forceFxMode: field.key === 'loading' || field.key === 'readOnly',
    })

    if (shouldInlineEventHandlers && field.key === 'formDataKey') {
      rows.push({
        kind: 'eventHandlersWithField',
        key: `${sectionKey}:events-before:${field.key}`,
        fieldRow,
      })
      return
    }

    rows.push(fieldRow)
  })

  if (sectionName === 'Appearance' && showHiddenInAppearance) {
    rows.push({
      kind: 'hidden',
      key: `${sectionKey}:hidden`,
      value: hiddenValue,
    })
  }

  const advancedRows: InspectorSectionRowSchema[] = buildInlineFieldItems(
    group.advancedFields
  ).map((item) =>
    item.inlineWith
      ? buildInlineRowSchema({
          sectionKey: `${sectionKey}:advanced`,
          field: item.field,
          inlineWith: item.inlineWith,
          getFieldValue,
          fxStickyFields,
        })
      : buildFieldRowSchema({
          sectionKey: `${sectionKey}:advanced`,
          field: item.field,
          getFieldValue,
          fxStickyFields,
        })
  )

  const listSections = (group.listSections ?? []).map((listSection) => ({
    ...listSection,
    panelKeys:
      supportsLabelAddon && listSection.storageKey === 'addons' ? ['label'] : undefined,
  }))

  const showStandaloneEventHandlers =
    sectionName === 'Interaction' &&
    showInteraction &&
    !inlineEvents &&
    !shouldInlineEventHandlers

  return {
    key: sectionKey,
    section: sectionName,
    isCollapsible: isSectionCollapsible(sectionName),
    isCollapsed: isSectionCollapsed(sectionName),
    advancedRows,
    rows,
    listSections,
    showStandaloneEventHandlers,
  }
}

export const buildInspectorSectionsSchema = ({
  orderedGroups,
  showInteraction,
  showHiddenInAppearance,
  supportsLabelAddon,
  supportsEventHandlers,
  getFieldValue,
  fxStickyFields,
  hiddenValue,
  isSectionCollapsible,
  isSectionCollapsed,
}: {
  orderedGroups: InspectorFieldGroup[]
  showInteraction: boolean
  showHiddenInAppearance: boolean
  supportsLabelAddon: boolean
  supportsEventHandlers: boolean
  getFieldValue: (field: WidgetField) => unknown
  fxStickyFields: Record<string, boolean>
  hiddenValue: boolean | string
  isSectionCollapsible: (section?: string) => boolean
  isSectionCollapsed: (section?: string) => boolean
}) =>
  orderedGroups.map((group, groupIndex) =>
    buildInspectorSectionSchema({
      group,
      groupIndex,
      showInteraction,
      showHiddenInAppearance,
      supportsLabelAddon,
      supportsEventHandlers,
      getFieldValue,
      fxStickyFields,
      hiddenValue,
      isSectionCollapsible,
      isSectionCollapsed,
    })
  )
