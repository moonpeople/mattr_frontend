/**
 * Hook операций редактирования виджетов BuilderShell: rename/copy/cut/duplicate/reset-state.
 */
import { useCallback } from 'react'
import type { Dispatch, SetStateAction } from 'react'

import { getWidgetDefinition } from 'widgets/runtime'

import type {
  BuilderAppLayout,
  BuilderPage,
  BuilderPageFrames,
  BuilderWidgetInstance,
} from '../../types'
import {
  createPageFramesFromWidgets,
  getPageFrameWidgets,
} from '../../types'
import {
  applyPageFrames,
  applyPageWidgets,
  resolvePageFramesState,
  resolvePageWidgetsState,
} from '../../utils/layout-slots'
import {
  canDuplicateWidgetForMode,
  type BuilderWidgetMode,
} from '../../utils/frame-ops'
import {
  insertAdjacentWidget,
  updateWidgetById,
} from '../layout-ops'
import {
  cloneWidgetData,
  cloneWidgetTree,
  ensureUniqueWidgetId,
  normalizeWidgetIdInput,
  RESET_STATE_KEYS,
  updateEventRefsInTree,
} from '../widget-tree-utils'

type SelectedDefinition = NonNullable<ReturnType<typeof getWidgetDefinition>>

interface WidgetClipboard {
  widget: BuilderWidgetInstance
  mode: 'copy' | 'cut'
}

interface InspectorAddonPanel {
  widgetId: string
  key: string
  label: string
}

export interface UseBuilderShellWidgetEditOpsParams {
  selectedWidget: BuilderWidgetInstance | null
  selectedWidgetMode: BuilderWidgetMode | null
  selectedDefinition?: SelectedDefinition
  renameDraft: string
  activePageId: string | null
  pages: BuilderPage[]
  appLayout: BuilderAppLayout
  targetPageForFrameOps: BuilderPage | null
  setPages: Dispatch<SetStateAction<BuilderPage[]>>
  setAppFrameWidgets: (updater: SetStateAction<BuilderWidgetInstance[]>) => void
  setInspectorAddonPanel: Dispatch<SetStateAction<InspectorAddonPanel | null>>
  setWidgetClipboard: Dispatch<SetStateAction<WidgetClipboard | null>>
  setIsRenamingWidget: Dispatch<SetStateAction<boolean>>
  setRenameDraft: Dispatch<SetStateAction<string>>
  selectFrameNode: (widgetId: string) => void
  selectMainWidgetNode: (widgetId: string) => void
  updatePageFrameSlotById: (
    targetPageId: string,
    updater: (frames: BuilderPageFrames) => BuilderPageFrames
  ) => void
  updatePageWidgetSlotById: (
    targetPageId: string,
    updater: (widgets: BuilderWidgetInstance[]) => BuilderWidgetInstance[]
  ) => void
  updateAppFrameWidget: (
    widgetId: string,
    updater: (widget: BuilderWidgetInstance) => BuilderWidgetInstance
  ) => void
  updatePageFrameWidget: (
    widgetId: string,
    updater: (widget: BuilderWidgetInstance) => BuilderWidgetInstance
  ) => void
  updateWidget: (
    widgetId: string,
    updater: (widget: BuilderWidgetInstance) => BuilderWidgetInstance
  ) => void
  handleDeleteWidget: (widgetId: string, mode: BuilderWidgetMode) => void
  getExistingWidgetIds: () => Set<string>
}

export const useBuilderShellWidgetEditOps = ({
  selectedWidget,
  selectedWidgetMode,
  selectedDefinition,
  renameDraft,
  activePageId,
  pages,
  appLayout,
  targetPageForFrameOps,
  setPages,
  setAppFrameWidgets,
  setInspectorAddonPanel,
  setWidgetClipboard,
  setIsRenamingWidget,
  setRenameDraft,
  selectFrameNode,
  selectMainWidgetNode,
  updatePageFrameSlotById,
  updatePageWidgetSlotById,
  updateAppFrameWidget,
  updatePageFrameWidget,
  updateWidget,
  handleDeleteWidget,
  getExistingWidgetIds,
}: UseBuilderShellWidgetEditOpsParams) => {
  const startWidgetRename = useCallback(() => {
    if (!selectedWidget) {
      return
    }
    setRenameDraft(selectedWidget.id)
    setIsRenamingWidget(true)
  }, [selectedWidget, setRenameDraft, setIsRenamingWidget])

  const cancelWidgetRename = useCallback(() => {
    setIsRenamingWidget(false)
    setRenameDraft(selectedWidget?.id ?? '')
  }, [selectedWidget?.id, setRenameDraft, setIsRenamingWidget])

  const renameWidgetId = useCallback(
    (widgetId: string, nextId: string, mode: BuilderWidgetMode) => {
      if (widgetId === nextId) {
        return
      }
      if (mode === 'app-frame') {
        setAppFrameWidgets((prev) => {
          const updatedGlobals = updateEventRefsInTree(
            updateWidgetById(prev, widgetId, (widget) => ({ ...widget, id: nextId })),
            widgetId,
            nextId
          )
          setPages((pagesPrev) =>
            pagesPrev.map((page) => {
              const nextWidgets = updateEventRefsInTree(resolvePageWidgetsState(page), widgetId, nextId)
              const nextFrames = createPageFramesFromWidgets(
                updateEventRefsInTree(getPageFrameWidgets(resolvePageFramesState(page)), widgetId, nextId)
              )
              const pageWithWidgets = applyPageWidgets(page, nextWidgets)
              return applyPageFrames(pageWithWidgets, nextFrames)
            })
          )
          return updatedGlobals
        })
        selectFrameNode(nextId)
      } else if (mode === 'page-frame') {
        if (!activePageId) {
          return
        }
        setPages((prev) =>
          prev.map((page) => {
            const nextWidgets = updateEventRefsInTree(resolvePageWidgetsState(page), widgetId, nextId)
            const frameWidgets = getPageFrameWidgets(resolvePageFramesState(page))
            const renamedFrameWidgets =
              page.id === activePageId
                ? updateWidgetById(frameWidgets, widgetId, (widget) => ({
                    ...widget,
                    id: nextId,
                  }))
                : frameWidgets
            const nextFrames = createPageFramesFromWidgets(
              updateEventRefsInTree(renamedFrameWidgets, widgetId, nextId)
            )
            return applyPageFrames(applyPageWidgets(page, nextWidgets), nextFrames)
          })
        )
        selectFrameNode(nextId)
      } else {
        const targetPageId = activePageId ?? pages[0]?.id
        if (!targetPageId) {
          return
        }
        setPages((prev) =>
          prev.map((page) => {
            const nextFrames = createPageFramesFromWidgets(
              updateEventRefsInTree(getPageFrameWidgets(resolvePageFramesState(page)), widgetId, nextId)
            )
            const pageWithFrames = applyPageFrames(page, nextFrames)
            const sourceWidgets = resolvePageWidgetsState(page)
            if (page.id !== targetPageId) {
              return applyPageWidgets(
                pageWithFrames,
                updateEventRefsInTree(sourceWidgets, widgetId, nextId)
              )
            }
            const updatedWidgets = updateEventRefsInTree(
              updateWidgetById(sourceWidgets, widgetId, (widget) => ({
                ...widget,
                id: nextId,
              })),
              widgetId,
              nextId
            )
            return applyPageWidgets(pageWithFrames, updatedWidgets)
          })
        )
        selectMainWidgetNode(nextId)
      }

      setAppFrameWidgets((prev) => updateEventRefsInTree(prev, widgetId, nextId))
      setInspectorAddonPanel((prev) =>
        prev && prev.widgetId === widgetId ? { ...prev, widgetId: nextId } : prev
      )
    },
    [
      activePageId,
      pages,
      selectFrameNode,
      selectMainWidgetNode,
      setAppFrameWidgets,
      setInspectorAddonPanel,
      setPages,
    ]
  )

  const commitWidgetRename = useCallback(() => {
    if (!selectedWidget || !selectedWidgetMode) {
      cancelWidgetRename()
      return
    }
    const existingIds = getExistingWidgetIds()
    existingIds.delete(selectedWidget.id)
    const normalized = normalizeWidgetIdInput(renameDraft)
    const nextId = ensureUniqueWidgetId(normalized, existingIds)
    renameWidgetId(selectedWidget.id, nextId, selectedWidgetMode)
    setIsRenamingWidget(false)
  }, [
    cancelWidgetRename,
    getExistingWidgetIds,
    renameDraft,
    renameWidgetId,
    selectedWidget,
    selectedWidgetMode,
    setIsRenamingWidget,
  ])

  const handleCopyWidget = useCallback(() => {
    if (!selectedWidget) {
      return
    }
    setWidgetClipboard({ widget: cloneWidgetData(selectedWidget), mode: 'copy' })
  }, [selectedWidget, setWidgetClipboard])

  const handleCutWidget = useCallback(() => {
    if (!selectedWidget || !selectedWidgetMode) {
      return
    }
    setWidgetClipboard({ widget: cloneWidgetData(selectedWidget), mode: 'cut' })
    handleDeleteWidget(selectedWidget.id, selectedWidgetMode)
  }, [handleDeleteWidget, selectedWidget, selectedWidgetMode, setWidgetClipboard])

  const handleDuplicateWidget = useCallback(() => {
    if (!selectedWidget || !selectedWidgetMode) {
      return
    }
    if (
      !canDuplicateWidgetForMode({
        widget: selectedWidget,
        mode: selectedWidgetMode,
        appLayout,
        targetPage: targetPageForFrameOps,
      })
    ) {
      return
    }
    const existingIds = getExistingWidgetIds()
    const clonedWidget = cloneWidgetTree(selectedWidget, existingIds)

    if (selectedWidgetMode === 'app-frame') {
      setAppFrameWidgets((prev) => {
        const [nextGlobals, inserted] = insertAdjacentWidget(
          prev,
          selectedWidget.id,
          'below',
          clonedWidget
        )
        if (!inserted) {
          return prev
        }
        return nextGlobals
      })
      selectFrameNode(clonedWidget.id)
      return
    }

    if (selectedWidgetMode === 'page-frame') {
      if (!activePageId) {
        return
      }
      updatePageFrameSlotById(activePageId, (frames) => {
        const [nextGlobals, inserted] = insertAdjacentWidget(
          getPageFrameWidgets(frames),
          selectedWidget.id,
          'below',
          clonedWidget
        )
        return inserted ? createPageFramesFromWidgets(nextGlobals) : frames
      })
      selectFrameNode(clonedWidget.id)
      return
    }

    const targetPageId = activePageId ?? pages[0]?.id
    if (!targetPageId) {
      return
    }
    updatePageWidgetSlotById(targetPageId, (widgets) => {
      const [nextWidgets, inserted] = insertAdjacentWidget(
        widgets,
        selectedWidget.id,
        'below',
        clonedWidget
      )
      return inserted ? nextWidgets : widgets
    })
    selectMainWidgetNode(clonedWidget.id)
  }, [
    activePageId,
    appLayout,
    getExistingWidgetIds,
    pages,
    selectFrameNode,
    selectMainWidgetNode,
    selectedWidget,
    selectedWidgetMode,
    setAppFrameWidgets,
    targetPageForFrameOps,
    updatePageFrameSlotById,
    updatePageWidgetSlotById,
  ])

  const handleResetWidgetState = useCallback(() => {
    if (!selectedWidget || !selectedDefinition || !selectedWidgetMode) {
      return
    }
    const defaultProps = selectedDefinition.defaultProps ?? {}
    const resetPatch = Object.keys(defaultProps).reduce<Record<string, unknown>>((acc, key) => {
      if (RESET_STATE_KEYS.has(key)) {
        acc[key] = defaultProps[key]
      }
      return acc
    }, {})
    if (Object.keys(resetPatch).length === 0) {
      return
    }
    if (selectedWidgetMode === 'app-frame') {
      updateAppFrameWidget(selectedWidget.id, (widget) => ({
        ...widget,
        props: { ...widget.props, ...resetPatch },
      }))
      return
    }
    if (selectedWidgetMode === 'page-frame') {
      updatePageFrameWidget(selectedWidget.id, (widget) => ({
        ...widget,
        props: { ...widget.props, ...resetPatch },
      }))
      return
    }
    updateWidget(selectedWidget.id, (widget) => ({
      ...widget,
      props: { ...widget.props, ...resetPatch },
    }))
  }, [
    selectedDefinition,
    selectedWidget,
    selectedWidgetMode,
    updateAppFrameWidget,
    updatePageFrameWidget,
    updateWidget,
  ])

  return {
    startWidgetRename,
    cancelWidgetRename,
    commitWidgetRename,
    handleCopyWidget,
    handleCutWidget,
    handleDuplicateWidget,
    handleResetWidgetState,
  }
}
