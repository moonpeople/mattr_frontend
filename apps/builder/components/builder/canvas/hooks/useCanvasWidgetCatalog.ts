/**
 * Собирает сгруппированный каталог виджетов и preset-группы для quick-add меню.
 */
import { useCallback, useMemo } from 'react'
import type { WidgetDefinition } from 'widgets/runtime'

import {
  cossInputPresets,
  cossInputPresetsByName,
  groupCossInputPresets,
  resolveCossPresetWidgetType,
  type CossInputPreset,
} from '../../../../data/coss-input-presets'
import { isFrameType, type BuilderWidgetAddOptions } from '../../types'
import { isQuickAddWidgetSelectable as checkQuickAddWidgetSelectable } from '../../utils/quickadd-dnd'
import { COMMON_WIDGET_TYPES } from '../shared'

type PresetGroup = {
  key: string
  label: string
  items: { preset: CossInputPreset; widget: WidgetDefinition }[]
}

export const useCanvasWidgetCatalog = (
  availableWidgets: WidgetDefinition[],
  search: string
) => {
  const { commonWidgets, groupedWidgets, presetGroups } = useMemo(() => {
    const normalized = search.trim().toLowerCase()
    const matches = (widget: WidgetDefinition) =>
      [widget.label, widget.type, widget.description]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(normalized))
    const matchesPreset = (preset: CossInputPreset) => {
      if (!normalized) {
        return true
      }
      return [preset.label, preset.name, preset.widgetType]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(normalized))
    }

    const filtered = normalized ? availableWidgets.filter(matches) : availableWidgets
    const common = COMMON_WIDGET_TYPES.map((type) =>
      filtered.find((widget) => widget.type === type)
    ).filter(Boolean) as WidgetDefinition[]
    const commonTypes = new Set(common.map((widget) => widget.type))

    const grouped = Array.from(
      filtered
        .filter((widget) => !commonTypes.has(widget.type))
        .reduce((acc, widget) => {
          if (!acc.has(widget.category)) {
            acc.set(widget.category, [])
          }
          acc.get(widget.category)?.push(widget)
          return acc
        }, new Map<string, WidgetDefinition[]>())
    )

    const presetGroups = groupCossInputPresets(cossInputPresets)
      .map((group) => {
        const items = group.presets
          .map((preset) => {
            const widgetType = resolveCossPresetWidgetType(preset)
            const widget = availableWidgets.find((item) => item.type === widgetType)
            if (!widget || !matchesPreset(preset)) {
              return null
            }
            return { preset, widget }
          })
          .filter(Boolean) as { preset: CossInputPreset; widget: WidgetDefinition }[]
        return items.length > 0 ? { key: group.key, label: group.label, items } : null
      })
      .filter(Boolean) as PresetGroup[]

    return { commonWidgets: common, groupedWidgets: grouped, presetGroups }
  }, [availableWidgets, search])

  const availableWidgetTypes = useMemo(
    () => new Set(availableWidgets.map((widget) => widget.type)),
    [availableWidgets]
  )

  const isQuickAddWidgetSelectable = useCallback(
    (widgetType: string, options?: BuilderWidgetAddOptions) =>
      checkQuickAddWidgetSelectable({
        widgetType,
        options,
        availableWidgetTypes,
        isFrameType,
        resolvePresetWidgetType: (presetId) => {
          const preset = cossInputPresetsByName.get(presetId)
          return preset ? resolveCossPresetWidgetType(preset) : undefined
        },
      }),
    [availableWidgetTypes]
  )

  return {
    commonWidgets,
    groupedWidgets,
    presetGroups,
    isQuickAddWidgetSelectable,
  }
}
