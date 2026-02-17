/**
 * CRUD/visibility/access операции виджетов в BuilderShell.
 */
import { useCallback } from 'react'

import {
  createPageFramesFromWidgets,
  getPageFrameWidgets,
  resolveWidgetSpacing,
} from '../../../types'
import type { BuilderWidgetInstance, BuilderWidgetSpacing } from '../../../types'
import {
  executeByFrameMode,
  executeByWidgetMode,
} from '../../../utils/frame-ops'
import type { BuilderFrameMode, BuilderWidgetMode } from '../../../utils/frame-ops'
import {
  AUTO_HEIGHT_MIN_H,
  DEFAULT_WIDGET_LAYOUT,
  removeWidgetById,
  reorderWidgetInTree,
  updateWidgetById,
} from '../../layout-ops'
import { parseBoolean } from '../../selectors'

import type {
  BuilderWidgetUpdater,
  UseBuilderShellWidgetCrudOpsParams,
  WidgetCrudHandlers,
} from './types'

export const useBuilderShellWidgetCrudOps = ({
  pages,
  activePage,
  activePageId,
  appFrameWidgets,
  activePageFrameWidgets,
  selectedWidget,
  selectedWidgetMode,
  setAppFrameWidgets,
  updatePageWidgetSlotById,
  updatePageFrameSlotById,
  clearWidgetSelection,
}: UseBuilderShellWidgetCrudOpsParams): WidgetCrudHandlers => {
  const updateAppFrameWidget = useCallback(
    (widgetId: string, updater: BuilderWidgetUpdater) => {
      setAppFrameWidgets((prev) => updateWidgetById(prev, widgetId, updater))
    },
    [setAppFrameWidgets]
  )

  const updatePageFrameWidget = useCallback(
    (widgetId: string, updater: BuilderWidgetUpdater) => {
      const targetPageId = activePageId ?? activePage?.id ?? pages[0]?.id
      if (!targetPageId) {
        return
      }
      updatePageFrameSlotById(targetPageId, (frames) =>
        createPageFramesFromWidgets(
          updateWidgetById(getPageFrameWidgets(frames), widgetId, updater)
        )
      )
    },
    [activePage?.id, activePageId, pages, updatePageFrameSlotById]
  )

  const updateWidget = useCallback(
    (widgetId: string, updater: BuilderWidgetUpdater) => {
      const targetPageId = activePageId ?? pages[0]?.id
      if (!targetPageId) {
        return
      }
      updatePageWidgetSlotById(targetPageId, (widgets) =>
        updateWidgetById(widgets, widgetId, updater)
      )
    },
    [activePageId, pages, updatePageWidgetSlotById]
  )

  const updateSelectedWidget = useCallback(
    (updater: BuilderWidgetUpdater) => {
      if (!selectedWidget || !selectedWidgetMode) {
        return
      }
      executeByWidgetMode(selectedWidgetMode, {
        appFrame: () => updateAppFrameWidget(selectedWidget.id, updater),
        pageFrame: () => updatePageFrameWidget(selectedWidget.id, updater),
        page: () => updateWidget(selectedWidget.id, updater),
      })
    },
    [selectedWidget, selectedWidgetMode, updateAppFrameWidget, updatePageFrameWidget, updateWidget]
  )

  const handleUpdateProps = useCallback(
    (patch: Record<string, unknown>) => {
      if (!selectedWidget) {
        return
      }

      const updater = (widget: BuilderWidgetInstance) => ({
        ...widget,
        props: {
          ...widget.props,
          ...patch,
        },
      })

      updateSelectedWidget(updater)
    },
    [selectedWidget, updateSelectedWidget]
  )

  const handleUpdateWidgetPropsById = useCallback(
    (widgetId: string, patch: Record<string, unknown>) => {
      const updater = (widget: BuilderWidgetInstance) => ({
        ...widget,
        props: {
          ...widget.props,
          ...patch,
        },
      })

      if (activePageFrameWidgets.some((widget) => widget.id === widgetId)) {
        updatePageFrameWidget(widgetId, updater)
        return
      }
      if (appFrameWidgets.some((widget) => widget.id === widgetId)) {
        updateAppFrameWidget(widgetId, updater)
        return
      }

      updateWidget(widgetId, updater)
    },
    [
      activePageFrameWidgets,
      appFrameWidgets,
      updatePageFrameWidget,
      updateAppFrameWidget,
      updateWidget,
    ]
  )

  const handleUpdateAccess = useCallback(
    (patch: {
      policy?: string[]
      visibleWhen?: string
      disabledWhen?: string
    }) => {
      if (!selectedWidget) {
        return
      }

      const updater = (widget: BuilderWidgetInstance) => ({
        ...widget,
        ...patch,
      })

      updateSelectedWidget(updater)
    },
    [selectedWidget, updateSelectedWidget]
  )

  const handleUpdateSpacing = useCallback(
    (patch: BuilderWidgetSpacing) => {
      if (!selectedWidget) {
        return
      }

      const applySpacing = (widget: BuilderWidgetInstance) => {
        const nextSpacing = resolveWidgetSpacing(widget.type, {
          ...widget.spacing,
          ...patch,
        })
        const layout = widget.layout
        const adjustedLayout =
          layout && nextSpacing.heightMode === 'auto'
            ? { ...layout, minH: AUTO_HEIGHT_MIN_H }
            : layout && nextSpacing.heightMode === 'fixed'
              ? {
                  ...layout,
                  minH:
                    typeof layout.minH === 'number' && layout.minH > DEFAULT_WIDGET_LAYOUT.minH
                      ? layout.minH
                      : DEFAULT_WIDGET_LAYOUT.minH,
                }
              : layout

        return {
          ...widget,
          spacing: nextSpacing,
          layout: adjustedLayout,
        }
      }

      updateSelectedWidget(applySpacing)
    },
    [selectedWidget, updateSelectedWidget]
  )

  const handleUpdateHidden = useCallback(
    (hidden: boolean | string) => {
      if (!selectedWidget) {
        return
      }

      const updater = (widget: BuilderWidgetInstance) => ({
        ...widget,
        hidden,
      })

      updateSelectedWidget(updater)
    },
    [selectedWidget, updateSelectedWidget]
  )

  const handleToggleWidgetHidden = useCallback(
    (widgetId: string, mode: BuilderWidgetMode) => {
      executeByWidgetMode(mode, {
        appFrame: () =>
          updateAppFrameWidget(widgetId, (widget) => ({
            ...widget,
            hidden: !parseBoolean(widget.hidden, false),
          })),
        pageFrame: () =>
          updatePageFrameWidget(widgetId, (widget) => ({
            ...widget,
            hidden: !parseBoolean(widget.hidden, false),
          })),
        page: () =>
          updateWidget(widgetId, (widget) => ({
            ...widget,
            hidden: !parseBoolean(widget.hidden, false),
          })),
      })
    },
    [updateAppFrameWidget, updatePageFrameWidget, updateWidget]
  )

  const handleUpdateOverlayChildProps = useCallback(
    (
      parentId: string,
      childId: string,
      patch: Record<string, unknown>,
      mode: BuilderFrameMode
    ) => {
      const updateChildren = (widget: BuilderWidgetInstance) => ({
        ...widget,
        children: updateWidgetById(widget.children ?? [], childId, (child) => ({
          ...child,
          props: {
            ...child.props,
            ...patch,
          },
        })),
      })
      executeByFrameMode(mode, {
        appFrame: () => updateAppFrameWidget(parentId, updateChildren),
        pageFrame: () => updatePageFrameWidget(parentId, updateChildren),
      })
    },
    [updateAppFrameWidget, updatePageFrameWidget]
  )

  const handleSetFrameWidgetHidden = useCallback(
    (widgetId: string, hidden: boolean, mode: BuilderFrameMode) => {
      executeByFrameMode(mode, {
        appFrame: () =>
          updateAppFrameWidget(widgetId, (widget) => ({
            ...widget,
            hidden,
          })),
        pageFrame: () =>
          updatePageFrameWidget(widgetId, (widget) => ({
            ...widget,
            hidden,
          })),
      })
    },
    [updateAppFrameWidget, updatePageFrameWidget]
  )

  const handleDeleteWidget = useCallback(
    (widgetId: string, mode: BuilderWidgetMode) => {
      let deleted = false

      executeByWidgetMode(mode, {
        appFrame: () => {
          setAppFrameWidgets((prev) => removeWidgetById(prev, widgetId))
          deleted = true
        },
        pageFrame: () => {
          if (!activePageId) {
            return
          }
          updatePageFrameSlotById(activePageId, (frames) =>
            createPageFramesFromWidgets(removeWidgetById(getPageFrameWidgets(frames), widgetId))
          )
          deleted = true
        },
        page: () => {
          const targetPageId = activePageId ?? pages[0]?.id
          if (!targetPageId) {
            return
          }
          updatePageWidgetSlotById(targetPageId, (widgets) => removeWidgetById(widgets, widgetId))
          deleted = true
        },
      })

      if (deleted) {
        clearWidgetSelection()
      }
    },
    [
      activePageId,
      clearWidgetSelection,
      pages,
      setAppFrameWidgets,
      updatePageFrameSlotById,
      updatePageWidgetSlotById,
    ]
  )

  const handleReorderWidget = useCallback(
    (
      activeId: string,
      overId: string,
      parentId: string | null,
      mode: BuilderWidgetMode
    ) => {
      executeByWidgetMode(mode, {
        appFrame: () => {
          setAppFrameWidgets((prev) => reorderWidgetInTree(prev, activeId, overId, parentId))
        },
        pageFrame: () => {
          if (!activePageId) {
            return
          }
          updatePageFrameSlotById(activePageId, (frames) =>
            createPageFramesFromWidgets(
              reorderWidgetInTree(getPageFrameWidgets(frames), activeId, overId, parentId)
            )
          )
        },
        page: () => {
          const targetPageId = activePageId ?? pages[0]?.id
          if (!targetPageId) {
            return
          }
          updatePageWidgetSlotById(targetPageId, (widgets) =>
            reorderWidgetInTree(widgets, activeId, overId, parentId)
          )
        },
      })
    },
    [activePageId, pages, setAppFrameWidgets, updatePageFrameSlotById, updatePageWidgetSlotById]
  )

  return {
    updateAppFrameWidget,
    updatePageFrameWidget,
    updateWidget,
    handleUpdateProps,
    handleUpdateWidgetPropsById,
    handleUpdateAccess,
    handleUpdateSpacing,
    handleUpdateHidden,
    handleToggleWidgetHidden,
    handleUpdateOverlayChildProps,
    handleSetFrameWidgetHidden,
    handleDeleteWidget,
    handleReorderWidget,
  }
}
