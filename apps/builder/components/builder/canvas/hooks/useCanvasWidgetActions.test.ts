/**
 * Тесты runtime-обработчиков действий виджетов canvas.
 */
import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { BuilderWidgetInstance } from '../../types'
import { resolveHiddenValue, useCanvasWidgetActions } from './useCanvasWidgetActions'

const createWidget = (events: unknown): BuilderWidgetInstance =>
  ({
    id: 'widget_1',
    type: 'Button',
    props: { events },
  }) as BuilderWidgetInstance

describe('resolveHiddenValue', () => {
  it('supports boolean and string values', () => {
    expect(resolveHiddenValue(true)).toBe(true)
    expect(resolveHiddenValue(false)).toBe(false)
    expect(resolveHiddenValue('true')).toBe(true)
    expect(resolveHiddenValue('false')).toBe(false)
    expect(resolveHiddenValue(undefined)).toBe(true)
  })
})

describe('useCanvasWidgetActions', () => {
  it('routes setHidden to app frame scope', () => {
    const onSetFrameWidgetHidden = vi.fn()
    const { result } = renderHook(() =>
      useCanvasWidgetActions({
        frameWidgetIds: new Set(['frame_1']),
        pageFrameIds: new Set(),
        onSetFrameWidgetHidden,
      })
    )

    result.current.runWidgetActions(
      createWidget([{ event: 'click', type: 'setHidden', targetId: 'frame_1', hidden: false }]),
      'click'
    )

    expect(onSetFrameWidgetHidden).toHaveBeenCalledWith('frame_1', false, 'app-frame')
  })

  it('routes controlComponent action to page frame scope', () => {
    const onSetFrameWidgetHidden = vi.fn()
    const { result } = renderHook(() =>
      useCanvasWidgetActions({
        frameWidgetIds: new Set(),
        pageFrameIds: new Set(['frame_page_1']),
        onSetFrameWidgetHidden,
      })
    )

    result.current.runWidgetActions(
      createWidget([
        {
          event: 'onSelect',
          type: 'controlComponent',
          method: 'setHidden',
          componentId: 'frame_page_1',
          params: { hidden: 'true' },
        },
      ]),
      'onSelect'
    )

    expect(onSetFrameWidgetHidden).toHaveBeenCalledWith('frame_page_1', true, 'page-frame')
  })

  it('parses events from json string and ignores unrelated actions', () => {
    const onSetFrameWidgetHidden = vi.fn()
    const { result } = renderHook(() =>
      useCanvasWidgetActions({
        frameWidgetIds: new Set(['frame_1']),
        pageFrameIds: new Set(),
        onSetFrameWidgetHidden,
      })
    )

    result.current.runWidgetActions(
      createWidget(
        JSON.stringify([
          { event: 'click', type: 'widget', method: 'setValue', widgetId: 'frame_1' },
          { event: 'change', type: 'setHidden', targetId: 'frame_1', hidden: true },
        ])
      ),
      'click'
    )

    expect(onSetFrameWidgetHidden).not.toHaveBeenCalled()
  })
})

