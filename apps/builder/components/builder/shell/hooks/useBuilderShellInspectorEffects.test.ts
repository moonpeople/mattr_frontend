/**
 * Тесты inspector-effects hook-а BuilderShell.
 */
import { fireEvent, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { BuilderSelectedNode } from '../../types'
import type { BuilderWidgetMode } from '../../utils/frame-ops'
import { useBuilderShellInspectorEffects } from './useBuilderShellInspectorEffects'

const createParams = (overrides: Partial<{
  selectedWidgetId: string | null
  selectedFrameWidgetId: string | null
  selectedWidgetMode: BuilderWidgetMode | null
  selectedPageMain: boolean
  selectedNode: BuilderSelectedNode | null
  isPreviewing: boolean
  selectedWidgetCurrentId: string | null
  isRenamingWidget: boolean
  isInspectorSearchEnabled: boolean
}> = {}) => {
  const deleteWidget = vi.fn()
  const setIsRenamingWidget = vi.fn()
  const setRenameDraft = vi.fn()
  const setInspectorSearch = vi.fn()

  return {
    params: {
      selectedWidgetId: null,
      selectedFrameWidgetId: null,
      selectedWidgetMode: null,
      selectedPageMain: false,
      selectedNode: null,
      isPreviewing: false,
      selectedWidgetCurrentId: null,
      isRenamingWidget: false,
      renameInputRef: { current: null },
      setIsRenamingWidget,
      setRenameDraft,
      isInspectorSearchEnabled: true,
      setInspectorSearch,
      deleteWidget,
      ...overrides,
    },
    deleteWidget,
    setIsRenamingWidget,
    setRenameDraft,
    setInspectorSearch,
  }
}

describe('useBuilderShellInspectorEffects', () => {
  it('resets rename state when selected widget id changes', () => {
    const { params, setIsRenamingWidget, setRenameDraft } = createParams({
      selectedWidgetCurrentId: 'widget_1',
    })

    renderHook(() => useBuilderShellInspectorEffects(params))

    expect(setIsRenamingWidget).toHaveBeenCalledWith(false)
    expect(setRenameDraft).toHaveBeenCalledWith('widget_1')
  })

  it('clears inspector search when widget inspector is not available', () => {
    const { params, setInspectorSearch } = createParams({
      isInspectorSearchEnabled: false,
    })

    renderHook(() => useBuilderShellInspectorEffects(params))

    expect(setInspectorSearch).toHaveBeenCalledWith('')
  })

  it('handles delete hotkey only for valid widget selection and non-input target', () => {
    const { params, deleteWidget } = createParams({
      selectedWidgetId: 'widget_1',
      selectedWidgetMode: 'page',
    })

    renderHook(() => useBuilderShellInspectorEffects(params))

    const input = document.createElement('input')
    document.body.appendChild(input)
    fireEvent.keyDown(input, { key: 'Delete' })
    expect(deleteWidget).not.toHaveBeenCalled()

    fireEvent.keyDown(window, { key: 'Delete' })
    expect(deleteWidget).toHaveBeenCalledWith('widget_1', 'page')

    input.remove()
  })
})
