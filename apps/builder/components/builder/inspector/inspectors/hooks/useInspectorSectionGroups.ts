/**
 * Hook группировки секций inspector: нормализует и группирует секции для отображения.
 */
import { useMemo } from 'react'

import type { WidgetField } from 'widgets/runtime'

import { resolveListSectionConfig, type InspectorFieldGroup } from '../../model'

type UseInspectorSectionGroupsArgs = {
  baseFields: WidgetField[]
  rawFields: WidgetField[]
  widgetType: string
  normalizedSearch: string
  isFilteringActive: boolean
  isLabelPanel: boolean
  isTableColumnPanel: boolean
  supportsLabelAddon: boolean
  supportsEventHandlers: boolean
  matchesDependency: (field: WidgetField) => boolean
}

type UseInspectorSectionGroupsResult = {
  orderedGroups: InspectorFieldGroup[]
  showInteraction: boolean
  showHiddenInAppearance: boolean
  showProperties: boolean
  showAccess: boolean
  hasResults: boolean
}

export const useInspectorSectionGroups = ({
  baseFields,
  rawFields,
  widgetType,
  normalizedSearch,
  isFilteringActive,
  isLabelPanel,
  isTableColumnPanel,
  supportsLabelAddon,
  supportsEventHandlers,
  matchesDependency,
}: UseInspectorSectionGroupsArgs): UseInspectorSectionGroupsResult => {
  const matches = (value: string) => value.toLowerCase().includes(normalizedSearch)
  const matchesField = (field: WidgetField) =>
    matches(field.label) ||
    matches(field.key) ||
    (field.section ? matches(field.section) : false)

  const labelPanelFields = useMemo(() => {
    if (!isLabelPanel) {
      return [] as WidgetField[]
    }
    const byKey = new Map(baseFields.map((field) => [field.key, field]))
    const labelField = byKey.get('label')
    const captionField = byKey.get('labelCaption')
    const labelSectionFields = baseFields.filter((field) => field.section === 'Label')
    const styleFieldKeys = new Set([
      'labelCaptionColor',
      'labelFont',
      'labelTextColor',
      'labelRequiredIndicatorColor',
    ])
    const contentFields = [labelField, captionField]
      .filter((field): field is WidgetField => Boolean(field))
      .map((field) => ({ ...field, section: 'Content' }))
    const styleFields = labelSectionFields
      .filter((field) => styleFieldKeys.has(field.key))
      .map((field) => ({ ...field, section: 'Styles' }))
    const appearanceFields = labelSectionFields
      .filter((field) => field.key !== 'labelCaption' && !styleFieldKeys.has(field.key))
      .map((field) => ({ ...field, section: 'Appearance' }))
    return [...contentFields, ...appearanceFields, ...styleFields]
  }, [baseFields, isLabelPanel])

  const tableColumnPanelFields = useMemo(() => {
    if (!isTableColumnPanel) {
      return [] as WidgetField[]
    }
    const columnsField = baseFields.find((field) => field.key === 'columns')
    if (!columnsField) {
      return [] as WidgetField[]
    }
    return [{ ...columnsField, section: 'Content' }]
  }, [baseFields, isTableColumnPanel])

  const scopedFields = useMemo(
    () =>
      isLabelPanel
        ? labelPanelFields
        : isTableColumnPanel
          ? tableColumnPanelFields
          : rawFields,
    [isLabelPanel, isTableColumnPanel, labelPanelFields, rawFields, tableColumnPanelFields]
  )

  const fields = useMemo(
    () =>
      scopedFields
        .filter(matchesDependency)
        .filter((field) => !(supportsLabelAddon && field.section === 'Label' && !isLabelPanel)),
    [isLabelPanel, matchesDependency, scopedFields, supportsLabelAddon]
  )

  const filteredFields = isFilteringActive ? fields.filter(matchesField) : fields

  const groupedFields = useMemo(() => {
    const hasSections = filteredFields.some((field) => Boolean(field.section))
    const nextGroups: InspectorFieldGroup[] = []
    if (hasSections) {
      const lookup = new Map<string, InspectorFieldGroup>()
      filteredFields.forEach((field) => {
        const rawSection = field.section ?? ''
        const listSection = resolveListSectionConfig(rawSection, widgetType)
        const groupSection = listSection?.parent ?? rawSection
        if (!lookup.has(groupSection)) {
          const group = {
            section: groupSection || undefined,
            fields: [],
            advancedFields: [],
            listSections: [],
          }
          lookup.set(groupSection, group)
          nextGroups.push(group)
        }
        const group = lookup.get(groupSection)!
        if (listSection && !isFilteringActive) {
          let listGroup = group.listSections.find(
            (item) => item.storageKey === listSection.storageKey
          )
          if (!listGroup) {
            listGroup = {
              title: rawSection || listSection.parent,
              storageKey: listSection.storageKey,
              buttonPosition: listSection.buttonPosition,
              fields: [],
            }
            group.listSections.push(listGroup)
          }
          listGroup.fields.push(field)
          return
        }
        const isAdvanced =
          !isFilteringActive && Boolean(field.advanced) && Boolean(field.section)
        if (isAdvanced) {
          group.advancedFields.push(field)
        } else {
          group.fields.push(field)
        }
      })
      return nextGroups
    }
    if (filteredFields.length > 0) {
      nextGroups.push({ fields: filteredFields, advancedFields: [], listSections: [] })
    }
    return nextGroups
  }, [filteredFields, isFilteringActive, widgetType])

  const showInteraction =
    !isLabelPanel &&
    !isTableColumnPanel &&
    supportsEventHandlers &&
    (!isFilteringActive ||
      ['interaction', 'event', 'handler'].some((keyword) =>
        normalizedSearch.includes(keyword)
      ))
  const showHiddenInAppearance =
    !isLabelPanel &&
    !isTableColumnPanel &&
    (!isFilteringActive || normalizedSearch.includes('hidden'))
  const showProperties =
    !isFilteringActive ||
    filteredFields.length > 0 ||
    (showInteraction && !isLabelPanel && !isTableColumnPanel) ||
    showHiddenInAppearance

  const renderGroupsWithInteraction =
    showInteraction &&
    groupedFields.findIndex((group) => group.section === 'Interaction') === -1
      ? [
          ...groupedFields,
          { section: 'Interaction', fields: [], advancedFields: [], listSections: [] },
        ]
      : groupedFields

  const renderGroups =
    showHiddenInAppearance &&
    renderGroupsWithInteraction.findIndex((group) => group.section === 'Appearance') === -1
      ? (() => {
          const interactionIndex = renderGroupsWithInteraction.findIndex(
            (group) => group.section === 'Interaction'
          )
          const nextGroups = [...renderGroupsWithInteraction]
          const insertAt = interactionIndex === -1 ? nextGroups.length : interactionIndex
          nextGroups.splice(insertAt, 0, {
            section: 'Appearance',
            fields: [],
            advancedFields: [],
            listSections: [],
          })
          return nextGroups
        })()
      : renderGroupsWithInteraction

  const orderedGroups = useMemo(() => {
    if (isLabelPanel || isTableColumnPanel) {
      return renderGroups
    }
    const sectionOrder = new Map<string, number>([
      ['Content', 0],
      ['Add-ons', 1],
      ['Interaction', 2],
      ['Validation rules', 3],
      ['Appearance', 4],
      ['Styles', 5],
      ['Spacing', 6],
    ])
    return renderGroups
      .map((group, index) => ({
        ...group,
        __index: index,
        __order: group.section ? sectionOrder.get(group.section) ?? 999 : 999,
      }))
      .sort((a, b) => {
        if (a.__order !== b.__order) {
          return a.__order - b.__order
        }
        return a.__index - b.__index
      })
      .map(({ __index, __order, ...group }) => group)
  }, [isLabelPanel, isTableColumnPanel, renderGroups])

  const showAccess =
    !isLabelPanel &&
    !isTableColumnPanel &&
    (!isFilteringActive ||
      ['access', 'visibility', 'policy', 'visible', 'disabled'].some((keyword) =>
        normalizedSearch.includes(keyword)
      ))
  const hasResults = showProperties || showInteraction || showAccess

  return {
    orderedGroups,
    showInteraction,
    showHiddenInAppearance,
    showProperties,
    showAccess,
    hasResults,
  }
}
