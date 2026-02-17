/**
 * Тесты поведения orchestration-слоя взаимодействий canvas.
 */
import { act, renderHook } from '@testing-library/react'
import type { RefObject } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { BuilderWidgetInstance } from '../../types'
import { useCanvasInteractions } from './useCanvasInteractions'

const createRect = (left: number, top: number, width: number, height: number): DOMRect =>
  ({
    x: left,
    y: top,
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
    toJSON: () => ({}),
  }) as DOMRect

const createBaseParams = (
  overrides: Partial<Parameters<typeof useCanvasInteractions>[0]> = {}
): Parameters<typeof useCanvasInteractions>[0] => {
  const canvasRoot = document.createElement('div')
  const frameRoot = document.createElement('div')
  document.body.append(canvasRoot, frameRoot)
  Object.defineProperty(frameRoot, 'getBoundingClientRect', {
    value: () => createRect(0, 0, 1200, 700),
    configurable: true,
  })

  return {
    widgets: [] as BuilderWidgetInstance[],
    gridRowHeight: 24,
    canvasRootRef: { current: canvasRoot } as RefObject<HTMLDivElement>,
    frameRef: { current: frameRoot } as RefObject<HTMLDivElement>,
    isQuickAddWidgetSelectable: () => true,
    onInsertAdjacentWidget: vi.fn(),
    onMoveWidgetToContainer: vi.fn(),
    onMoveWidgetToPageRoot: vi.fn(),
    isExternalDragActive: false,
    externalDropTarget: null,
    internalDragActiveId: null,
    internalDropTarget: null,
    internalDropContainerTarget: null,
    internalPageRootDropLayout: null,
    internalDragSource: null,
    isPageRootDropActive: false,
    setIsExternalDragActive: vi.fn(),
    setExternalDropTarget: vi.fn(),
    setInternalDragActiveId: vi.fn(),
    setInternalDropTarget: vi.fn(),
    setInternalDropContainerTarget: vi.fn(),
    setInternalPageRootDropLayout: vi.fn(),
    setInternalDragSource: vi.fn(),
    setIsPageRootDropActive: vi.fn(),
    externalDragTimeoutRef: { current: null },
    internalDragPointerRef: { current: null },
    internalDropUpdateRafRef: { current: null },
    internalDropUpdateArgsRef: { current: null },
    beginGridInteraction: vi.fn(),
    resetInternalDragState: vi.fn(),
    ...overrides,
  }
}

describe('useCanvasInteractions', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    document.body.innerHTML = ''
  })

  it('clears external drag state', () => {
    const setIsExternalDragActive = vi.fn()
    const setExternalDropTarget = vi.fn()
    const params = createBaseParams({
      setIsExternalDragActive,
      setExternalDropTarget,
    })
    const { result } = renderHook(() => useCanvasInteractions(params))

    act(() => {
      result.current.clearExternalDragState()
    })

    expect(setIsExternalDragActive).toHaveBeenCalledWith(false)
    expect(setExternalDropTarget).toHaveBeenCalledWith(null)
  })

  it('updates frame width during resize lifecycle', () => {
    const params = createBaseParams()
    const { result } = renderHook(() => useCanvasInteractions(params))
    const preventDefault = vi.fn()
    const stopPropagation = vi.fn()

    act(() => {
      result.current.onFrameResizeMouseDown({
        clientX: 100,
        preventDefault,
        stopPropagation,
      } as unknown as React.MouseEvent<HTMLButtonElement>)
    })

    act(() => {
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 180 }))
    })

    expect(result.current.frameWidth).toBe(1280)

    act(() => {
      window.dispatchEvent(new MouseEvent('mouseup'))
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 260 }))
    })

    expect(result.current.frameWidth).toBe(1280)
  })

  it('moves widget into container target on drag stop', () => {
    const onMoveWidgetToContainer = vi.fn()
    const resetInternalDragState = vi.fn()
    const onFallback = vi.fn()
    const internalDragPointerRef = { current: { x: 20, y: 20 } }
    const params = createBaseParams({
      internalDragActiveId: 'widget_1',
      internalDragSource: {
        parentId: 'container_old',
        slot: 'left',
        layout: { x: 0, y: 0, w: 2, h: 2 },
      },
      internalDropContainerTarget: {
        parentId: 'container_new',
        slot: 'nested/footer',
        layout: { x: 2, y: 3, w: 4, h: 5 },
      },
      internalDragPointerRef,
      onMoveWidgetToContainer,
      resetInternalDragState,
    })
    const { result } = renderHook(() => useCanvasInteractions(params))

    act(() => {
      result.current.stopInternalGridDrag([], onFallback)
    })

    expect(onFallback).not.toHaveBeenCalled()
    expect(onMoveWidgetToContainer).toHaveBeenCalledWith(
      'widget_1',
      'container_new',
      'nested/footer',
      { x: 2, y: 3, w: 4, h: 5 }
    )
    expect(resetInternalDragState).toHaveBeenCalledTimes(1)
    expect(internalDragPointerRef.current).toBeNull()
  })

  it('moves widget from container back to page root on drag stop', () => {
    const onMoveWidgetToPageRoot = vi.fn()
    const onFallback = vi.fn()
    const resetInternalDragState = vi.fn()
    const canvasRoot = document.createElement('div')
    const pageRootZone = document.createElement('div')
    pageRootZone.setAttribute('data-builder-page-root-drop-zone', 'true')
    Object.defineProperty(pageRootZone, 'getBoundingClientRect', {
      value: () => createRect(0, 0, 1000, 800),
      configurable: true,
    })
    canvasRoot.append(pageRootZone)
    document.body.append(canvasRoot)

    const params = createBaseParams({
      canvasRootRef: { current: canvasRoot } as RefObject<HTMLDivElement>,
      internalDragActiveId: 'widget_1',
      internalDragSource: {
        parentId: 'container_old',
        slot: 'body',
        layout: { x: 0, y: 0, w: 2, h: 2 },
      },
      internalDropContainerTarget: null,
      internalPageRootDropLayout: { x: 3, y: 4, w: 5, h: 6 },
      internalDragPointerRef: { current: { x: 20, y: 20 } },
      onMoveWidgetToPageRoot,
      resetInternalDragState,
    })
    const { result } = renderHook(() => useCanvasInteractions(params))

    act(() => {
      result.current.stopInternalGridDrag([], onFallback)
    })

    expect(onFallback).not.toHaveBeenCalled()
    expect(onMoveWidgetToPageRoot).toHaveBeenCalledWith('widget_1', {
      x: 3,
      y: 4,
      w: 5,
      h: 6,
    })
    expect(resetInternalDragState).toHaveBeenCalledTimes(1)
  })

  it('builds preview styles using hook rowHeight', () => {
    const params = createBaseParams({ gridRowHeight: 16 })
    const { result } = renderHook(() => useCanvasInteractions(params))

    const style = result.current.buildPreviewStyle({ x: 1, y: 2, w: 3, h: 2 }, 12, 8)

    expect(style).toMatchObject({
      top: '48px',
      height: '40px',
    })
  })
})
