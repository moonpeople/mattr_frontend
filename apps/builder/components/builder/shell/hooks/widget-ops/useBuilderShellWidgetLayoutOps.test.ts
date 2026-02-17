/**
 * Тесты layout-hook-а widget-ops слоя BuilderShell.
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

import { useBuilderShellWidgetLayoutOps } from './useBuilderShellWidgetLayoutOps'

const createWidget = (
  id: string,
  layout?: BuilderWidgetInstance['layout']
): BuilderWidgetInstance => ({
  id,
  type: 'Text',
  props: {},
  layout,
})

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

describe('useBuilderShellWidgetLayoutOps', () => {
  it('maps RGL layout payload to page widget layouts', () => {
    const page = createPage('page_1')
    const updatePageWidgetSlotById = vi.fn()

    const { result } = renderHook(() =>
      useBuilderShellWidgetLayoutOps({
        pages: [page],
        activePageId: page.id,
        updatePageWidgetSlotById,
        updateAppFrameWidget: vi.fn(),
        updatePageFrameWidget: vi.fn(),
        updateWidget: vi.fn(),
      })
    )

    act(() => {
      result.current.handleUpdateLayout([
        { i: 'text_1', x: 5, y: 6, w: 7, h: 8 } as Layout,
      ])
    })

    expect(updatePageWidgetSlotById).toHaveBeenCalledTimes(1)
    expect(updatePageWidgetSlotById.mock.calls[0]?.[0]).toBe('page_1')

    const updater = updatePageWidgetSlotById.mock.calls[0]?.[1] as (
      widgets: BuilderWidgetInstance[]
    ) => BuilderWidgetInstance[]
    const nextWidgets = updater([
      createWidget('text_1', { x: 0, y: 0, w: 1, h: 1, minW: 1, minH: 1 }),
      createWidget('text_2', { x: 1, y: 1, w: 2, h: 2, minW: 1, minH: 1 }),
    ])

    expect(nextWidgets[0]?.layout).toMatchObject({ x: 5, y: 6, w: 7, h: 8 })
    expect(nextWidgets[1]?.layout).toMatchObject({ x: 1, y: 1, w: 2, h: 2 })
  })

  it('updates app-frame widget layout through scope updater', () => {
    const page = createPage('page_1')
    const updateAppFrameWidget = vi.fn()

    const { result } = renderHook(() =>
      useBuilderShellWidgetLayoutOps({
        pages: [page],
        activePageId: page.id,
        updatePageWidgetSlotById: vi.fn(),
        updateAppFrameWidget,
        updatePageFrameWidget: vi.fn(),
        updateWidget: vi.fn(),
      })
    )

    act(() => {
      result.current.handleUpdateAppFrameWidgetLayout('frame_text', { x: 9, y: 10 })
    })

    expect(updateAppFrameWidget).toHaveBeenCalledTimes(1)
    expect(updateAppFrameWidget.mock.calls[0]?.[0]).toBe('frame_text')

    const updater = updateAppFrameWidget.mock.calls[0]?.[1] as (
      widget: BuilderWidgetInstance
    ) => BuilderWidgetInstance
    const nextWidget = updater(
      createWidget('frame_text', { x: 1, y: 2, w: 3, h: 4, minW: 1, minH: 1 })
    )

    expect(nextWidget.layout).toMatchObject({ x: 9, y: 10, w: 3, h: 4 })
  })
})
