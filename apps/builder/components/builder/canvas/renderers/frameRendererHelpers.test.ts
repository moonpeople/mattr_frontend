/**
 * Тесты helper-моделей frame-рендереров canvas.
 */
import { describe, expect, it, vi } from 'vitest'

import type { BuilderWidgetInstance } from '../../types'
import {
  resolveFrameGridOptions,
  resolveOverlayFrameContext,
  selectFrameSlotChildren,
} from './frameRendererHelpers'

const createWidget = (
  id: string,
  overrides: Partial<BuilderWidgetInstance> = {}
): BuilderWidgetInstance =>
  ({
    id,
    type: 'Container',
    props: {},
    ...overrides,
  }) as BuilderWidgetInstance

describe('frameRendererHelpers', () => {
  it('selects slot children and can include unassigned for body', () => {
    const children: BuilderWidgetInstance[] = [
      createWidget('header_1', { props: { containerSlot: 'header' } }),
      createWidget('body_1', { props: { containerSlot: 'body' } }),
      createWidget('body_2', { props: {} }),
      createWidget('footer_1', { props: { containerSlot: 'footer' } }),
    ]

    expect(selectFrameSlotChildren(children, 'header').map((item) => item.id)).toEqual([
      'header_1',
    ])
    expect(selectFrameSlotChildren(children, 'body').map((item) => item.id)).toEqual(['body_1'])
    expect(selectFrameSlotChildren(children, 'body', true).map((item) => item.id)).toEqual([
      'body_1',
      'body_2',
    ])
    expect(selectFrameSlotChildren(children, 'footer').map((item) => item.id)).toEqual([
      'footer_1',
    ])
  })

  it('resolves frame grid handlers by mode', () => {
    const appChild = vi.fn()
    const pageChild = vi.fn()
    const appDrop = vi.fn()
    const pageDrop = vi.fn()
    const appLayout = vi.fn()
    const pageLayout = vi.fn()

    const handlers = {
      onUpdateAppFrameChildLayout: appChild,
      onUpdatePageFrameChildLayout: pageChild,
      onDropAppFrameWidget: appDrop,
      onDropPageFrameWidget: pageDrop,
      onUpdateAppFrameWidgetLayout: appLayout,
      onUpdatePageFrameWidgetLayout: pageLayout,
    }

    expect(resolveFrameGridOptions('app-frame', handlers)).toMatchObject({
      onUpdateChildLayout: appChild,
      onDropWidget: appDrop,
      onUpdateWidgetLayout: appLayout,
    })
    expect(resolveFrameGridOptions('page-frame', handlers)).toMatchObject({
      onUpdateChildLayout: pageChild,
      onDropWidget: pageDrop,
      onUpdateWidgetLayout: pageLayout,
    })
  })

  it('builds overlay context with defaults and section extraction', () => {
    const widget = createWidget('modal_1', {
      type: 'GlobalModal',
      props: {},
      children: [
        createWidget('header', { type: 'ModalHeader' }),
        createWidget('body_a', { type: 'Text' }),
        createWidget('footer', { type: 'ModalFooter' }),
      ],
    })

    const context = resolveOverlayFrameContext({
      widget,
      variant: 'modal',
      selectedFrameWidgetId: 'modal_1',
      pageFrameIds: new Set(['modal_1']),
      evaluationContext: {},
    })

    expect(context.mode).toBe('page-frame')
    expect(context.isActive).toBe(true)
    expect(context.showHeader).toBe(true)
    expect(context.showFooter).toBe(true)
    expect(context.contentWidgets.map((item) => item.id)).toEqual(['body_a'])
    expect(context.panelStyle).toEqual({ width: '640px' })
  })

  it('respects overlay visibility/click props', () => {
    const widget = createWidget('drawer_1', {
      type: 'GlobalDrawer',
      props: {
        showOverlay: false,
        closeOnOutsideClick: false,
        width: 'large',
      },
    })

    const context = resolveOverlayFrameContext({
      widget,
      variant: 'drawer',
      selectedFrameWidgetId: null,
      pageFrameIds: new Set(),
      evaluationContext: {},
    })

    expect(context.showOverlay).toBe(false)
    expect(context.closeOnOutsideClick).toBe(false)
    expect(context.panelStyle).toEqual({ width: '480px' })
  })
})
