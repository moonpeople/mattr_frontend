/**
 * Hook операций создания виджетов BuilderShell: add в root/parent + preset props.
 */
import { useCallback } from 'react'

import { getWidgetDefinition } from 'widgets/runtime'

import {
  cossInputPresetsByName,
  resolveCossPresetAliasProps,
  resolveCossPresetWidgetType,
} from '../../../../data/coss-input-presets'
import type {
  BuilderPage,
  BuilderWidgetAddOptions,
  BuilderWidgetInstance,
} from '../../types'
import { resolveWidgetSpacing } from '../../types'
import {
  addChildWidget,
  applySpacingToLayout,
  findWidgetById,
  getDefaultWidgetLayout,
} from '../layout-ops'

type WidgetDefinition = NonNullable<ReturnType<typeof getWidgetDefinition>>

export interface UseBuilderShellWidgetCreateOpsParams {
  activePageId: string | null
  activePage?: BuilderPage
  pages: BuilderPage[]
  activePageWidgets: BuilderWidgetInstance[]
  selectedWidgetId: string | null
  updatePageWidgetSlotById: (
    targetPageId: string,
    updater: (widgets: BuilderWidgetInstance[]) => BuilderWidgetInstance[]
  ) => void
  setActivePageId: (pageId: string | null) => void
  selectMainWidgetNode: (widgetId: string) => void
  buildWidgetId: (widgetType: string, existingIds?: Set<string>) => string
}

export const useBuilderShellWidgetCreateOps = ({
  activePageId,
  activePage,
  pages,
  activePageWidgets,
  selectedWidgetId,
  updatePageWidgetSlotById,
  setActivePageId,
  selectMainWidgetNode,
  buildWidgetId,
}: UseBuilderShellWidgetCreateOpsParams) => {
  const resolveWidgetProps = useCallback(
    (definition: WidgetDefinition, options?: BuilderWidgetAddOptions) => {
      const preset = options?.presetId
        ? cossInputPresetsByName.get(options.presetId)
        : undefined
      const presetWidgetType = preset ? resolveCossPresetWidgetType(preset) : undefined
      const presetProps =
        preset && presetWidgetType === definition.type ? preset.props : undefined
      const aliasProps = preset ? resolveCossPresetAliasProps(preset) : undefined
      return {
        ...definition.defaultProps,
        ...(presetProps ?? {}),
        ...(aliasProps ?? {}),
        ...(options?.props ?? {}),
      }
    },
    []
  )

  const isWidgetPresetCompatible = useCallback(
    (widgetType: string, options?: BuilderWidgetAddOptions) => {
      const presetId = options?.presetId?.trim()
      if (!presetId) {
        return true
      }
      const preset = cossInputPresetsByName.get(presetId)
      return Boolean(preset && resolveCossPresetWidgetType(preset) === widgetType)
    },
    []
  )

  const handleAddWidget = useCallback(
    (widgetType: string, options?: BuilderWidgetAddOptions) => {
      const definition = getWidgetDefinition(widgetType)
      if (!definition) {
        return
      }

      const spacing = resolveWidgetSpacing(widgetType)
      const targetPageId = activePageId ?? activePage?.id ?? pages[0]?.id
      if (!targetPageId) {
        return
      }

      const widgetId = buildWidgetId(widgetType)
      const newWidget: BuilderWidgetInstance = {
        id: widgetId,
        type: widgetType,
        props: resolveWidgetProps(definition, options),
        layout: undefined,
        spacing,
        policy: [],
        visibleWhen: '',
        disabledWhen: '',
      }

      const selectedParent =
        selectedWidgetId && activePage ? findWidgetById(activePageWidgets, selectedWidgetId) : null
      const parentDefinition = selectedParent
        ? getWidgetDefinition(selectedParent.type)
        : undefined
      const shouldNest = Boolean(selectedParent && parentDefinition?.supportsChildren)

      updatePageWidgetSlotById(targetPageId, (pageWidgets) => {
        if (shouldNest && selectedParent) {
          const parentWidget = findWidgetById(pageWidgets, selectedParent.id)
          return addChildWidget(pageWidgets, selectedParent.id, {
            ...newWidget,
            layout: applySpacingToLayout(
              getDefaultWidgetLayout(parentWidget?.children ?? [], widgetType),
              spacing
            ),
          })
        }

        return [
          ...pageWidgets,
          {
            ...newWidget,
            layout: applySpacingToLayout(getDefaultWidgetLayout(pageWidgets, widgetType), spacing),
          },
        ]
      })
      if (!activePageId) {
        setActivePageId(targetPageId)
      }
      selectMainWidgetNode(widgetId)
    },
    [
      activePage,
      activePageId,
      activePageWidgets,
      buildWidgetId,
      pages,
      resolveWidgetProps,
      selectMainWidgetNode,
      selectedWidgetId,
      setActivePageId,
      updatePageWidgetSlotById,
    ]
  )

  const handleAddWidgetAtRoot = useCallback(
    (widgetType: string, options?: BuilderWidgetAddOptions) => {
      const definition = getWidgetDefinition(widgetType)
      if (!definition) {
        return
      }

      const spacing = resolveWidgetSpacing(widgetType)
      const targetPageId = activePageId ?? activePage?.id ?? pages[0]?.id
      if (!targetPageId) {
        return
      }

      const widgetId = buildWidgetId(widgetType)
      const newWidget: BuilderWidgetInstance = {
        id: widgetId,
        type: widgetType,
        props: resolveWidgetProps(definition, options),
        layout: undefined,
        spacing,
        policy: [],
        visibleWhen: '',
        disabledWhen: '',
      }

      updatePageWidgetSlotById(targetPageId, (pageWidgets) => [
        ...pageWidgets,
        {
          ...newWidget,
          layout: applySpacingToLayout(getDefaultWidgetLayout(pageWidgets, widgetType), spacing),
        },
      ])
      if (!activePageId) {
        setActivePageId(targetPageId)
      }
      selectMainWidgetNode(widgetId)
    },
    [
      activePage,
      activePageId,
      buildWidgetId,
      pages,
      resolveWidgetProps,
      selectMainWidgetNode,
      setActivePageId,
      updatePageWidgetSlotById,
    ]
  )

  return {
    resolveWidgetProps,
    isWidgetPresetCompatible,
    handleAddWidget,
    handleAddWidgetAtRoot,
  }
}
