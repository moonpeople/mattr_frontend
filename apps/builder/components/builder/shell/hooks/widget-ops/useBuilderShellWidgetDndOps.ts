/**
 * DnD и insert/move операции виджетов в BuilderShell.
 */
import { useCallback } from 'react'
import type { Layout } from 'react-grid-layout'

import { getWidgetDefinition } from 'widgets/runtime'

import {
  type BuilderWidgetAddOptions,
  type BuilderWidgetInstance,
  createPageFramesFromWidgets,
  getPageFrameWidgets,
  isFrameType,
  resolveWidgetSpacing,
} from '../../../types'
import {
  applyPageFrames,
  applyPageWidgets,
  resolvePageFramesState,
  resolvePageWidgetsState,
} from '../../../utils/layout-slots'
import {
  addChildWidget,
  DEFAULT_WIDGET_LAYOUT,
  getDefaultWidgetHeight,
  getDefaultWidgetMinH,
  getDefaultWidgetMinW,
  insertAdjacentWidget,
  moveWidgetAdjacentAcrossScopes,
  moveWidgetToContainerAcrossScopes,
  moveWidgetToPageRootAcrossScopes,
  type ScopedMoveResult,
} from '../../layout-ops'

import type {
  UseBuilderShellWidgetDndOpsParams,
  WidgetDndHandlers,
} from './types'

export const useBuilderShellWidgetDndOps = ({
  pages,
  activePageId,
  appFrameWidgets,
  setAppFrameWidgets,
  updatePageLayoutSlotById,
  updatePageWidgetSlotById,
  selectMainWidgetNode,
  selectFrameNode,
  resolveWidgetProps,
  buildWidgetId,
  isWidgetPresetCompatible,
  updateAppFrameWidget,
  updatePageFrameWidget,
}: UseBuilderShellWidgetDndOpsParams): WidgetDndHandlers => {
  const handleDropWidget = useCallback(
    (
      widgetType: string,
      layoutItem: Layout,
      parentId?: string,
      options?: BuilderWidgetAddOptions
    ) => {
      if (!isWidgetPresetCompatible(widgetType, options)) {
        return
      }
      if (isFrameType(widgetType)) {
        return
      }
      const definition = getWidgetDefinition(widgetType)
      if (!definition) {
        return
      }

      const spacing = resolveWidgetSpacing(widgetType)
      const targetPageId = activePageId ?? pages[0]?.id
      if (!targetPageId) {
        return
      }

      const widgetId = buildWidgetId(widgetType)
      const newWidget: BuilderWidgetInstance = {
        id: widgetId,
        type: widgetType,
        props: resolveWidgetProps(definition, options),
        layout: {
          x: layoutItem.x ?? 0,
          y: layoutItem.y ?? 0,
          w: layoutItem.w ?? DEFAULT_WIDGET_LAYOUT.w,
          h: getDefaultWidgetHeight(widgetType),
          minW: getDefaultWidgetMinW(widgetType),
          minH: getDefaultWidgetMinH(widgetType, spacing),
        },
        spacing,
        policy: [],
        visibleWhen: '',
        disabledWhen: '',
      }

      updatePageWidgetSlotById(targetPageId, (pageWidgets) =>
        parentId ? addChildWidget(pageWidgets, parentId, newWidget) : [...pageWidgets, newWidget]
      )
      selectMainWidgetNode(widgetId)
    },
    [
      activePageId,
      pages,
      buildWidgetId,
      isWidgetPresetCompatible,
      resolveWidgetProps,
      updatePageWidgetSlotById,
      selectMainWidgetNode,
    ]
  )

  const handleInsertAdjacentWidget = useCallback(
    (
      targetWidgetId: string,
      position: 'above' | 'below',
      widgetType: string,
      options?: BuilderWidgetAddOptions
    ) => {
      if (!isWidgetPresetCompatible(widgetType, options)) {
        return
      }
      if (isFrameType(widgetType)) {
        return
      }
      const definition = getWidgetDefinition(widgetType)
      if (!definition) {
        return
      }

      const spacing = resolveWidgetSpacing(widgetType)
      const targetPageId = activePageId ?? pages[0]?.id
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

      updatePageWidgetSlotById(targetPageId, (widgets) => {
        const [nextWidgets, inserted] = insertAdjacentWidget(
          widgets,
          targetWidgetId,
          position,
          newWidget
        )
        return inserted ? nextWidgets : widgets
      })
      selectMainWidgetNode(widgetId)
    },
    [
      activePageId,
      pages,
      buildWidgetId,
      isWidgetPresetCompatible,
      resolveWidgetProps,
      updatePageWidgetSlotById,
      selectMainWidgetNode,
    ]
  )

  const applyScopedMoveResult = useCallback(
    (targetPageId: string, result: ScopedMoveResult) => {
      if (result.appFrameWidgetsChanged) {
        setAppFrameWidgets(() => result.appFrameWidgets)
      }

      updatePageLayoutSlotById(targetPageId, (page) =>
        applyPageFrames(
          applyPageWidgets(page, result.pageWidgets),
          createPageFramesFromWidgets(result.pageFrameWidgets)
        )
      )
    },
    [setAppFrameWidgets, updatePageLayoutSlotById]
  )

  const handleMoveWidgetAdjacent = useCallback(
    (activeWidgetId: string, targetWidgetId: string, position: 'above' | 'below') => {
      const targetPageId = activePageId ?? pages[0]?.id
      if (!targetPageId) {
        return
      }
      const targetPage = pages.find((page) => page.id === targetPageId)
      if (!targetPage) {
        return
      }
      const result = moveWidgetAdjacentAcrossScopes({
        pageWidgets: resolvePageWidgetsState(targetPage),
        pageFrameWidgets: getPageFrameWidgets(resolvePageFramesState(targetPage)),
        appFrameWidgets,
        activeId: activeWidgetId,
        targetId: targetWidgetId,
        position,
      })
      if (!result.moved || !result.targetScope) {
        return
      }

      applyScopedMoveResult(targetPageId, result)

      if (result.targetScope === 'page') {
        selectMainWidgetNode(activeWidgetId)
      } else {
        selectFrameNode(activeWidgetId)
      }
    },
    [
      activePageId,
      pages,
      appFrameWidgets,
      applyScopedMoveResult,
      selectMainWidgetNode,
      selectFrameNode,
    ]
  )

  const handleMoveWidgetToContainer = useCallback(
    (
      activeWidgetId: string,
      parentId: string,
      slot?: string,
      targetLayout?: Partial<Layout>
    ) => {
      const targetPageId = activePageId ?? pages[0]?.id
      if (!targetPageId) {
        return
      }
      const targetPage = pages.find((page) => page.id === targetPageId)
      if (!targetPage) {
        return
      }
      const result = moveWidgetToContainerAcrossScopes({
        pageWidgets: resolvePageWidgetsState(targetPage),
        pageFrameWidgets: getPageFrameWidgets(resolvePageFramesState(targetPage)),
        appFrameWidgets,
        activeId: activeWidgetId,
        parentId,
        slot,
        targetLayout,
      })
      if (!result.moved || !result.targetScope) {
        return
      }

      applyScopedMoveResult(targetPageId, result)

      if (result.targetScope === 'page') {
        selectMainWidgetNode(activeWidgetId)
      } else {
        selectFrameNode(activeWidgetId)
      }
    },
    [
      activePageId,
      pages,
      appFrameWidgets,
      applyScopedMoveResult,
      selectMainWidgetNode,
      selectFrameNode,
    ]
  )

  const handleMoveWidgetToPageRoot = useCallback(
    (activeWidgetId: string, targetLayout?: Partial<Layout>) => {
      const targetPageId = activePageId ?? pages[0]?.id
      if (!targetPageId) {
        return
      }
      const targetPage = pages.find((page) => page.id === targetPageId)
      if (!targetPage) {
        return
      }
      const result = moveWidgetToPageRootAcrossScopes({
        pageWidgets: resolvePageWidgetsState(targetPage),
        pageFrameWidgets: getPageFrameWidgets(resolvePageFramesState(targetPage)),
        appFrameWidgets,
        activeId: activeWidgetId,
        targetLayout,
      })
      if (!result.moved) {
        return
      }

      applyScopedMoveResult(targetPageId, result)
      selectMainWidgetNode(activeWidgetId)
    },
    [activePageId, pages, appFrameWidgets, applyScopedMoveResult, selectMainWidgetNode]
  )

  const handleDropAppFrameWidget = useCallback(
    (
      widgetType: string,
      layoutItem: Layout,
      parentId: string,
      options?: BuilderWidgetAddOptions
    ) => {
      if (!isWidgetPresetCompatible(widgetType, options)) {
        return
      }
      if (isFrameType(widgetType)) {
        return
      }
      const definition = getWidgetDefinition(widgetType)
      if (!definition) {
        return
      }

      const widgetId = buildWidgetId(widgetType)
      const spacing = resolveWidgetSpacing(widgetType)
      const newWidget: BuilderWidgetInstance = {
        id: widgetId,
        type: widgetType,
        props: resolveWidgetProps(definition, options),
        layout: {
          x: layoutItem.x ?? 0,
          y: layoutItem.y ?? 0,
          w: layoutItem.w ?? DEFAULT_WIDGET_LAYOUT.w,
          h: getDefaultWidgetHeight(widgetType),
          minW: getDefaultWidgetMinW(widgetType),
          minH: getDefaultWidgetMinH(widgetType, spacing),
        },
        spacing,
        policy: [],
        visibleWhen: '',
        disabledWhen: '',
      }

      updateAppFrameWidget(parentId, (parent) => ({
        ...parent,
        children: [...(parent.children ?? []), newWidget],
      }))
      selectFrameNode(widgetId)
    },
    [
      buildWidgetId,
      isWidgetPresetCompatible,
      resolveWidgetProps,
      updateAppFrameWidget,
      selectFrameNode,
    ]
  )

  const handleDropPageFrameWidget = useCallback(
    (
      widgetType: string,
      layoutItem: Layout,
      parentId: string,
      options?: BuilderWidgetAddOptions
    ) => {
      if (!isWidgetPresetCompatible(widgetType, options)) {
        return
      }
      if (isFrameType(widgetType)) {
        return
      }
      const definition = getWidgetDefinition(widgetType)
      if (!definition) {
        return
      }

      const widgetId = buildWidgetId(widgetType)
      const spacing = resolveWidgetSpacing(widgetType)
      const newWidget: BuilderWidgetInstance = {
        id: widgetId,
        type: widgetType,
        props: resolveWidgetProps(definition, options),
        layout: {
          x: layoutItem.x ?? 0,
          y: layoutItem.y ?? 0,
          w: layoutItem.w ?? DEFAULT_WIDGET_LAYOUT.w,
          h: getDefaultWidgetHeight(widgetType),
          minW: getDefaultWidgetMinW(widgetType),
          minH: getDefaultWidgetMinH(widgetType, spacing),
        },
        spacing,
        policy: [],
        visibleWhen: '',
        disabledWhen: '',
      }

      updatePageFrameWidget(parentId, (parent) => ({
        ...parent,
        children: [...(parent.children ?? []), newWidget],
      }))
      selectFrameNode(widgetId)
    },
    [
      buildWidgetId,
      isWidgetPresetCompatible,
      resolveWidgetProps,
      updatePageFrameWidget,
      selectFrameNode,
    ]
  )

  return {
    handleDropWidget,
    handleInsertAdjacentWidget,
    handleMoveWidgetAdjacent,
    handleMoveWidgetToContainer,
    handleMoveWidgetToPageRoot,
    handleDropAppFrameWidget,
    handleDropPageFrameWidget,
  }
}
