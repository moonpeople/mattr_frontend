/**
 * Тесты helper-функций drop-target engine и правил adjacent drop.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  areAdjacentDropTargetsEqual,
  buildDropPreviewStyle,
  isPointInsideCanvasChildDropZone,
  isValidContainerDropZone,
  resolveAdjacentDropTargetFromPoint,
  resolveDropLayoutInZone,
  resolveDropZoneFromPoint,
  shouldInsertAdjacentWidgetInGridDrop,
} from './dropTargetEngine'

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

const setRect = (element: HTMLElement, rect: DOMRect) => {
  Object.defineProperty(element, 'getBoundingClientRect', {
    value: () => rect,
    configurable: true,
  })
}

describe('dropTargetEngine', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    document.body.innerHTML = ''
  })

  it('validates container zones against parent id and recursion', () => {
    const zone = document.createElement('div')
    zone.setAttribute('data-builder-parent-id', 'container_a')

    const activeRoot = document.createElement('div')
    const parentRoot = document.createElement('div')
    activeRoot.append(parentRoot)

    expect(
      isValidContainerDropZone({
        zone,
        activeId: 'container_a',
        activeRoot: null,
        resolveWidgetRootById: () => null,
      })
    ).toBe(false)

    expect(
      isValidContainerDropZone({
        zone,
        activeId: 'widget_1',
        activeRoot,
        resolveWidgetRootById: () => parentRoot,
      })
    ).toBe(false)
  })

  it('resolves preferred drop zone under pointer', () => {
    const canvasRoot = document.createElement('div')
    document.body.append(canvasRoot)

    const pageRootZone = document.createElement('div')
    pageRootZone.setAttribute('data-builder-page-root-drop-zone', 'true')
    setRect(pageRootZone, createRect(0, 0, 800, 600))

    const containerZone = document.createElement('div')
    containerZone.setAttribute('data-builder-child-drop-zone', 'true')
    containerZone.setAttribute('data-builder-parent-id', 'container_a')
    setRect(containerZone, createRect(10, 10, 300, 300))

    canvasRoot.append(pageRootZone, containerZone)
    Object.defineProperty(document, 'elementsFromPoint', {
      value: vi.fn(() => [containerZone, pageRootZone]),
      configurable: true,
    })

    const zone = resolveDropZoneFromPoint({
      canvasRoot,
      x: 100,
      y: 100,
      activeId: 'widget_1',
      activeRoot: null,
      resolveWidgetRootById: () => null,
    })

    expect(zone?.kind).toBe('container')
    expect(zone?.parentId).toBe('container_a')
  })

  it('resolves drop layout inside a zone using row/column metrics', () => {
    const zone = document.createElement('div')
    zone.setAttribute('data-builder-grid-columns', '12')
    zone.setAttribute('data-builder-grid-margin', '8')
    setRect(zone, createRect(0, 0, 1200, 600))

    const layout = resolveDropLayoutInZone({
      zone,
      x: 300,
      y: 140,
      rowHeight: 20,
      sourceLayout: { w: 4, h: 5 },
    })

    expect(layout).toMatchObject({
      x: 2,
      y: 5,
      w: 4,
      h: 5,
    })
  })

  it('builds preview style for drop overlays', () => {
    const style = buildDropPreviewStyle({ x: 1, y: 2, w: 3, h: 2 }, 12, 8, 20)

    expect(style).toMatchObject({
      left: 'calc(((100% - 88px) / 12) * 1 + 8px)',
      top: '56px',
      width: 'calc(((100% - 88px) / 12) * 3 + 16px)',
      height: '48px',
    })
  })

  it('resolves adjacent drop target from pointer position', () => {
    const canvasRoot = document.createElement('div')
    const widget = document.createElement('div')
    widget.setAttribute('data-builder-widget-id', 'widget_1')
    setRect(widget, createRect(10, 10, 200, 100))
    canvasRoot.append(widget)
    document.body.append(canvasRoot)
    Object.defineProperty(document, 'elementFromPoint', {
      value: vi.fn(() => widget),
      configurable: true,
    })

    const above = resolveAdjacentDropTargetFromPoint({
      canvasRoot,
      x: 40,
      y: 30,
      pageWidgetIds: new Set(['widget_1']),
    })
    const below = resolveAdjacentDropTargetFromPoint({
      canvasRoot,
      x: 40,
      y: 90,
      pageWidgetIds: new Set(['widget_1']),
    })

    expect(above).toEqual({ widgetId: 'widget_1', position: 'above' })
    expect(below).toEqual({ widgetId: 'widget_1', position: 'below' })
    expect(areAdjacentDropTargetsEqual(above, above)).toBe(true)
    expect(areAdjacentDropTargetsEqual(above, below)).toBe(false)
  })

  it('ignores adjacent target when pointer is inside child drop zone', () => {
    const canvasRoot = document.createElement('div')
    const zone = document.createElement('div')
    const zoneChild = document.createElement('span')
    zone.setAttribute('data-builder-child-drop-zone', 'true')
    zone.append(zoneChild)
    canvasRoot.append(zone)
    document.body.append(canvasRoot)
    Object.defineProperty(document, 'elementFromPoint', {
      value: vi.fn(() => zoneChild),
      configurable: true,
    })

    expect(
      isPointInsideCanvasChildDropZone({
        canvasRoot,
        x: 20,
        y: 20,
      })
    ).toBe(true)
    expect(
      resolveAdjacentDropTargetFromPoint({
        canvasRoot,
        x: 20,
        y: 20,
        pageWidgetIds: new Set(['widget_1']),
      })
    ).toBeNull()
  })

  it('allows adjacent insertion only for page-root drops', () => {
    const target = { widgetId: 'widget_1', position: 'above' as const }
    const pageWidgetIds = new Set(['widget_1'])

    expect(
      shouldInsertAdjacentWidgetInGridDrop({
        parentId: 'container_1',
        parentSlot: undefined,
        externalDropTarget: target,
        pageWidgetIds,
      })
    ).toBe(false)
    expect(
      shouldInsertAdjacentWidgetInGridDrop({
        parentId: undefined,
        parentSlot: 'main',
        externalDropTarget: target,
        pageWidgetIds,
      })
    ).toBe(false)
    expect(
      shouldInsertAdjacentWidgetInGridDrop({
        parentId: undefined,
        parentSlot: undefined,
        externalDropTarget: null,
        pageWidgetIds,
      })
    ).toBe(false)
    expect(
      shouldInsertAdjacentWidgetInGridDrop({
        parentId: undefined,
        parentSlot: undefined,
        externalDropTarget: target,
        pageWidgetIds,
      })
    ).toBe(true)
  })
})
