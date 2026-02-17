/**
 * Тесты CRUD-hook-а widget-ops слоя BuilderShell.
 */
import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import {
  createDefaultMainFrame,
  createEmptyPageFrames,
  type BuilderPage,
  type BuilderWidgetInstance,
} from '../../../types'

import { useBuilderShellWidgetCrudOps } from './useBuilderShellWidgetCrudOps'

const createWidget = (
  id: string,
  type = 'Text',
  props: Record<string, unknown> = {}
): BuilderWidgetInstance => ({
  id,
  type,
  props,
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

describe('useBuilderShellWidgetCrudOps', () => {
  it('updates selected page widget props via updatePageWidgetSlotById', () => {
    const page = createPage('page_1')
    const selectedWidget = createWidget('text_1', 'Text', { label: 'Old' })

    const setAppFrameWidgets = vi.fn()
    const updatePageWidgetSlotById = vi.fn()
    const updatePageFrameSlotById = vi.fn()

    const { result } = renderHook(() =>
      useBuilderShellWidgetCrudOps({
        pages: [page],
        activePage: page,
        activePageId: page.id,
        appFrameWidgets: [],
        activePageFrameWidgets: [],
        selectedWidget,
        selectedWidgetMode: 'page',
        setAppFrameWidgets,
        updatePageWidgetSlotById,
        updatePageFrameSlotById,
        clearWidgetSelection: vi.fn(),
      })
    )

    act(() => {
      result.current.handleUpdateProps({ label: 'New label', required: true })
    })

    expect(updatePageWidgetSlotById).toHaveBeenCalledTimes(1)
    expect(updatePageWidgetSlotById.mock.calls[0]?.[0]).toBe('page_1')

    const updater = updatePageWidgetSlotById.mock.calls[0]?.[1] as (
      widgets: BuilderWidgetInstance[]
    ) => BuilderWidgetInstance[]
    const nextWidgets = updater([selectedWidget])

    expect(nextWidgets[0]?.props).toMatchObject({
      label: 'New label',
      required: true,
    })
  })

  it('deletes page widget and clears selection', () => {
    const page = createPage('page_1')
    const clearWidgetSelection = vi.fn()

    const setAppFrameWidgets = vi.fn()
    const updatePageWidgetSlotById = vi.fn()
    const updatePageFrameSlotById = vi.fn()

    const { result } = renderHook(() =>
      useBuilderShellWidgetCrudOps({
        pages: [page],
        activePage: page,
        activePageId: page.id,
        appFrameWidgets: [],
        activePageFrameWidgets: [],
        selectedWidget: null,
        selectedWidgetMode: null,
        setAppFrameWidgets,
        updatePageWidgetSlotById,
        updatePageFrameSlotById,
        clearWidgetSelection,
      })
    )

    act(() => {
      result.current.handleDeleteWidget('text_1', 'page')
    })

    expect(updatePageWidgetSlotById).toHaveBeenCalledTimes(1)
    expect(updatePageWidgetSlotById.mock.calls[0]?.[0]).toBe('page_1')

    const updater = updatePageWidgetSlotById.mock.calls[0]?.[1] as (
      widgets: BuilderWidgetInstance[]
    ) => BuilderWidgetInstance[]
    const nextWidgets = updater([createWidget('text_1'), createWidget('text_2')])

    expect(nextWidgets.map((widget) => widget.id)).toEqual(['text_2'])
    expect(clearWidgetSelection).toHaveBeenCalledTimes(1)
  })
})
