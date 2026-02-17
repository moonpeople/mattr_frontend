/**
 * Тесты dnd-hook-а widget-ops слоя BuilderShell.
 */
import { act, renderHook } from '@testing-library/react'
import type { Layout } from 'react-grid-layout'
import { describe, expect, it, vi } from 'vitest'

import {
  createDefaultMainFrame,
  createEmptyPageFrames,
  type BuilderPage,
  type BuilderWidgetInstance,
} from '../../../types'

import { useBuilderShellWidgetDndOps } from './useBuilderShellWidgetDndOps'

const createPage = (id = 'page_1'): BuilderPage => ({
  id,
  name: id,
  layout: {},
  pageLayout: {
    main: createDefaultMainFrame(),
    widgets: [],
    frames: createEmptyPageFrames(),
  },
  menu: null,
  pageMeta: {},
})

const createFrameParent = (id = 'drawer_1'): BuilderWidgetInstance => ({
  id,
  type: 'GlobalDrawer',
  props: {},
  children: [],
})

describe('useBuilderShellWidgetDndOps', () => {
  it('drops page widget and selects it in main scope', () => {
    const page = createPage('page_1')

    const updatePageWidgetSlotById = vi.fn()
    const selectMainWidgetNode = vi.fn()
    const resolveWidgetProps = vi.fn(() => ({ label: 'Dropped Text' }))

    const { result } = renderHook(() =>
      useBuilderShellWidgetDndOps({
        pages: [page],
        activePageId: page.id,
        appFrameWidgets: [],
        setAppFrameWidgets: vi.fn(),
        updatePageLayoutSlotById: vi.fn(),
        updatePageWidgetSlotById,
        selectMainWidgetNode,
        selectFrameNode: vi.fn(),
        resolveWidgetProps,
        buildWidgetId: () => 'text_1',
        isWidgetPresetCompatible: () => true,
        updateAppFrameWidget: vi.fn(),
        updatePageFrameWidget: vi.fn(),
        updateWidget: vi.fn(),
      })
    )

    act(() => {
      result.current.handleDropWidget(
        'Text',
        { i: 'text_1', x: 1, y: 2, w: 3, h: 4 } as Layout,
        undefined,
        { props: { label: 'Ignored by resolveWidgetProps mock' } }
      )
    })

    expect(updatePageWidgetSlotById).toHaveBeenCalledTimes(1)
    expect(updatePageWidgetSlotById.mock.calls[0]?.[0]).toBe('page_1')

    const updater = updatePageWidgetSlotById.mock.calls[0]?.[1] as (
      widgets: BuilderWidgetInstance[]
    ) => BuilderWidgetInstance[]
    const nextWidgets = updater([])

    expect(nextWidgets).toHaveLength(1)
    expect(nextWidgets[0]).toMatchObject({
      id: 'text_1',
      type: 'Text',
      props: { label: 'Dropped Text' },
    })
    expect(selectMainWidgetNode).toHaveBeenCalledWith('text_1')
    expect(resolveWidgetProps).toHaveBeenCalledTimes(1)
  })

  it('skips drop when preset is incompatible', () => {
    const page = createPage('page_1')
    const updatePageWidgetSlotById = vi.fn()

    const { result } = renderHook(() =>
      useBuilderShellWidgetDndOps({
        pages: [page],
        activePageId: page.id,
        appFrameWidgets: [],
        setAppFrameWidgets: vi.fn(),
        updatePageLayoutSlotById: vi.fn(),
        updatePageWidgetSlotById,
        selectMainWidgetNode: vi.fn(),
        selectFrameNode: vi.fn(),
        resolveWidgetProps: vi.fn(() => ({})),
        buildWidgetId: () => 'text_1',
        isWidgetPresetCompatible: () => false,
        updateAppFrameWidget: vi.fn(),
        updatePageFrameWidget: vi.fn(),
        updateWidget: vi.fn(),
      })
    )

    act(() => {
      result.current.handleDropWidget('Text', { i: 'text_1', x: 0, y: 0, w: 2, h: 2 } as Layout)
    })

    expect(updatePageWidgetSlotById).not.toHaveBeenCalled()
  })

  it('drops child into app-frame container and selects frame child', () => {
    const page = createPage('page_1')
    const updateAppFrameWidget = vi.fn()
    const selectFrameNode = vi.fn()

    const { result } = renderHook(() =>
      useBuilderShellWidgetDndOps({
        pages: [page],
        activePageId: page.id,
        appFrameWidgets: [],
        setAppFrameWidgets: vi.fn(),
        updatePageLayoutSlotById: vi.fn(),
        updatePageWidgetSlotById: vi.fn(),
        selectMainWidgetNode: vi.fn(),
        selectFrameNode,
        resolveWidgetProps: vi.fn(() => ({ variant: 'default' })),
        buildWidgetId: () => 'frame_text_1',
        isWidgetPresetCompatible: () => true,
        updateAppFrameWidget,
        updatePageFrameWidget: vi.fn(),
        updateWidget: vi.fn(),
      })
    )

    act(() => {
      result.current.handleDropAppFrameWidget(
        'Text',
        { i: 'frame_text_1', x: 0, y: 0, w: 3, h: 2 } as Layout,
        'drawer_1'
      )
    })

    expect(updateAppFrameWidget).toHaveBeenCalledTimes(1)
    expect(updateAppFrameWidget.mock.calls[0]?.[0]).toBe('drawer_1')

    const updater = updateAppFrameWidget.mock.calls[0]?.[1] as (
      widget: BuilderWidgetInstance
    ) => BuilderWidgetInstance
    const nextParent = updater(createFrameParent('drawer_1'))

    expect(nextParent.children).toHaveLength(1)
    expect(nextParent.children?.[0]).toMatchObject({
      id: 'frame_text_1',
      type: 'Text',
      props: { variant: 'default' },
    })
    expect(selectFrameNode).toHaveBeenCalledWith('frame_text_1')
  })
})
