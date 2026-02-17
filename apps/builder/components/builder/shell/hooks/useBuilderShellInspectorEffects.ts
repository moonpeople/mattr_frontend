/**
 * Inspector-effects hook BuilderShell: rename/search/focus и keyboard delete.
 */
import { useEffect } from 'react'
import type {
  Dispatch,
  MutableRefObject,
  SetStateAction,
} from 'react'

import type { BuilderSelectedNode } from '../../types'
import type { BuilderWidgetMode } from '../../utils/frame-ops'

export interface UseBuilderShellInspectorEffectsParams {
  selectedWidgetId: string | null
  selectedFrameWidgetId: string | null
  selectedWidgetMode: BuilderWidgetMode | null
  selectedPageMain: boolean
  selectedNode: BuilderSelectedNode | null
  isPreviewing: boolean
  selectedWidgetCurrentId: string | null
  isRenamingWidget: boolean
  renameInputRef: MutableRefObject<HTMLInputElement | null>
  setIsRenamingWidget: Dispatch<SetStateAction<boolean>>
  setRenameDraft: Dispatch<SetStateAction<string>>
  isInspectorSearchEnabled: boolean
  setInspectorSearch: Dispatch<SetStateAction<string>>
  deleteWidget: (widgetId: string, mode: BuilderWidgetMode) => void
}

export const useBuilderShellInspectorEffects = ({
  selectedWidgetId,
  selectedFrameWidgetId,
  selectedWidgetMode,
  selectedPageMain,
  selectedNode,
  isPreviewing,
  selectedWidgetCurrentId,
  isRenamingWidget,
  renameInputRef,
  setIsRenamingWidget,
  setRenameDraft,
  isInspectorSearchEnabled,
  setInspectorSearch,
  deleteWidget,
}: UseBuilderShellInspectorEffectsParams) => {
  useEffect(() => {
    setIsRenamingWidget(false)
    setRenameDraft(selectedWidgetCurrentId ?? '')
  }, [selectedWidgetCurrentId, setIsRenamingWidget, setRenameDraft])

  useEffect(() => {
    if (!isRenamingWidget) {
      return
    }
    const frame = window.requestAnimationFrame(() => {
      renameInputRef.current?.focus()
      renameInputRef.current?.select()
    })
    return () => window.cancelAnimationFrame(frame)
  }, [isRenamingWidget, renameInputRef])

  useEffect(() => {
    if (!isInspectorSearchEnabled) {
      setInspectorSearch('')
    }
  }, [isInspectorSearchEnabled, setInspectorSearch])

  useEffect(() => {
    if (typeof document === 'undefined') {
      return
    }
    if (!selectedNode || selectedNode.kind === 'app' || selectedNode.kind === 'page') {
      return
    }
    const activeElement = document.activeElement as HTMLElement | null
    if (!activeElement) {
      return
    }
    if (
      activeElement.tagName === 'INPUT' ||
      activeElement.tagName === 'TEXTAREA' ||
      activeElement.tagName === 'SELECT' ||
      activeElement.isContentEditable
    ) {
      activeElement.blur()
    }
  }, [selectedNode])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isPreviewing || selectedPageMain) {
        return
      }
      if (event.key !== 'Backspace' && event.key !== 'Delete') {
        return
      }
      const target = event.target as HTMLElement | null
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return
      }
      if (!selectedWidgetMode) {
        return
      }
      const targetId = selectedFrameWidgetId ?? selectedWidgetId
      if (!targetId) {
        return
      }
      event.preventDefault()
      deleteWidget(targetId, selectedWidgetMode)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    isPreviewing,
    selectedPageMain,
    selectedWidgetId,
    selectedFrameWidgetId,
    selectedWidgetMode,
    deleteWidget,
  ])
}
