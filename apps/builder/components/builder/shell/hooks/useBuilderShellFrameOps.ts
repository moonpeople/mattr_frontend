/**
 * Hook frame-операций BuilderShell: валидация selectable и добавление app/page frame виджетов.
 */
import type { SetStateAction } from 'react'
import { useCallback } from 'react'

import { getWidgetDefinition } from 'widgets/runtime'

import type {
  BuilderAppLayout,
  BuilderPage,
  BuilderPageFrames,
  BuilderWidgetInstance,
} from '../../types'
import {
  appendPageFrame,
  canAddAppFrame,
  canAddPageFrame,
  createAppLayoutFromWidgets,
  getAppLayoutWidgets,
  getPageFrameWidgets,
  isAppFrameType,
  isPageFrameType,
  resolveWidgetSpacing,
  upsertAppFrame,
} from '../../types'
import { resolvePageFramesState } from '../../utils/layout-slots'
import { createGlobalId } from '../layout-ops'
import { buildGlobalPresetChildren } from '../frame-presets'

export interface UseBuilderShellFrameOpsParams {
  appLayout: BuilderAppLayout
  activePageFrames: BuilderPageFrames
  activePage?: BuilderPage
  activePageId: string | null
  pages: BuilderPage[]
  appFrameWidgets: BuilderWidgetInstance[]
  setAppFrameWidgets: (updater: SetStateAction<BuilderWidgetInstance[]>) => void
  updatePageFrameSlotById: (
    targetPageId: string,
    updater: (frames: BuilderPageFrames) => BuilderPageFrames
  ) => void
  setActivePageId: (pageId: string | null) => void
  getExistingWidgetIds: () => Set<string>
  buildWidgetId: (widgetType: string, existingIds?: Set<string>) => string
}

export const useBuilderShellFrameOps = ({
  appLayout,
  activePageFrames,
  activePage,
  activePageId,
  pages,
  appFrameWidgets,
  setAppFrameWidgets,
  updatePageFrameSlotById,
  setActivePageId,
  getExistingWidgetIds,
  buildWidgetId,
}: UseBuilderShellFrameOpsParams) => {
  const isSidebarWidgetSelectable = useCallback(
    (widgetType: string) => {
      if (isAppFrameType(widgetType)) {
        return canAddAppFrame(widgetType, appLayout).allowed
      }
      if (isPageFrameType(widgetType)) {
        if (pages.length === 0) {
          return false
        }
        return canAddPageFrame(widgetType, activePageFrames).allowed
      }
      return true
    },
    [activePageFrames, appLayout, pages.length]
  )

  const handleAddAppFrameComponent = (type: string) => {
    if (isPageFrameType(type)) {
      handleAddPageFrameComponent(type)
      return
    }
    if (!isAppFrameType(type)) {
      return
    }
    const addCheck = canAddAppFrame(type, appLayout)
    if (!addCheck.allowed) {
      return
    }
    const definition = getWidgetDefinition(type)
    setAppFrameWidgets((prev) => {
      const pageFrames = pages.flatMap((page) => getPageFrameWidgets(resolvePageFramesState(page)))
      const existingIds = getExistingWidgetIds()
      const nextId = createGlobalId(type, [...prev, ...pageFrames], existingIds)
      existingIds.add(nextId)
      const presetChildren = buildGlobalPresetChildren({
        type,
        parentId: nextId,
        existingIds,
        buildWidgetId,
      })
      const newWidget: BuilderWidgetInstance = {
        id: nextId,
        type,
        props: { ...(definition?.defaultProps ?? {}) },
        layout: undefined,
        spacing: resolveWidgetSpacing(type),
        policy: [],
        visibleWhen: '',
        disabledWhen: '',
        children: presetChildren,
      }
      const nextLayout = upsertAppFrame(createAppLayoutFromWidgets(prev), newWidget)
      return getAppLayoutWidgets(nextLayout)
    })
  }

  const handleAddPageFrameComponent = (type: string) => {
    const normalizedType =
      type === 'Sidebar'
        ? 'GlobalSidebar'
        : type === 'Header'
          ? 'GlobalHeader'
          : type
    if (isAppFrameType(normalizedType)) {
      handleAddAppFrameComponent(normalizedType)
      return
    }
    if (!isPageFrameType(normalizedType)) {
      return
    }
    const targetPageId = activePageId ?? activePage?.id ?? pages[0]?.id
    if (!targetPageId) {
      return
    }
    const activeFrames =
      activePage?.id === targetPageId
        ? resolvePageFramesState(activePage)
        : resolvePageFramesState(pages.find((page) => page.id === targetPageId))
    const addCheck = canAddPageFrame(normalizedType, activeFrames)
    if (!addCheck.allowed) {
      return
    }
    const definition = getWidgetDefinition(normalizedType)
    updatePageFrameSlotById(targetPageId, (pageFrames) => {
      const existingIds = getExistingWidgetIds()
      const nextId = createGlobalId(
        normalizedType,
        [...getPageFrameWidgets(pageFrames), ...appFrameWidgets],
        existingIds
      )
      existingIds.add(nextId)
      const presetChildren = buildGlobalPresetChildren({
        type: normalizedType,
        parentId: nextId,
        existingIds,
        buildWidgetId,
      })
      const newWidget: BuilderWidgetInstance = {
        id: nextId,
        type: normalizedType,
        props: { ...(definition?.defaultProps ?? {}) },
        layout: undefined,
        spacing: resolveWidgetSpacing(normalizedType),
        policy: [],
        visibleWhen: '',
        disabledWhen: '',
        children: presetChildren,
      }
      return appendPageFrame(pageFrames, newWidget)
    })
    if (!activePageId) {
      setActivePageId(targetPageId)
    }
  }

  return {
    isSidebarWidgetSelectable,
    handleAddAppFrameComponent,
    handleAddPageFrameComponent,
  }
}
