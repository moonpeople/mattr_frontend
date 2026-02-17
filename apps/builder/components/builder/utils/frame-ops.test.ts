import { describe, expect, it } from 'vitest'

import type { BuilderPage, BuilderWidgetInstance } from '../types'
import {
  createDefaultMainFrame,
  createEmptyPageFrames,
} from '../types'
import {
  addPageFrameWithValidation,
  canDuplicateWidgetForMode,
  movePageFrameById,
  removePageFrameById,
  resolveSelectedWidgetMode,
} from './frame-ops'

const makeWidget = (id: string, type: BuilderWidgetInstance['type']): BuilderWidgetInstance => ({
  id,
  type,
  props: {},
  children: [],
})

const makePage = (frames = createEmptyPageFrames()): BuilderPage => ({
  id: 'page-1',
  name: 'Page 1',
  pageLayout: {
    main: createDefaultMainFrame(),
    widgets: [],
    frames,
  },
})

describe('resolveSelectedWidgetMode', () => {
  it('maps selected node to widget mode', () => {
    expect(resolveSelectedWidgetMode(null)).toBeNull()
    expect(
      resolveSelectedWidgetMode({ kind: 'widget', pageId: 'p1', scope: 'main', widgetId: 'w1' })
    ).toBe('page')
    expect(
      resolveSelectedWidgetMode({ kind: 'widget', pageId: 'p1', scope: 'app-frame', widgetId: 'w1' })
    ).toBe('app-frame')
    expect(
      resolveSelectedWidgetMode({ kind: 'widget', pageId: 'p1', scope: 'page-frame', widgetId: 'w1' })
    ).toBe('page-frame')
    expect(
      resolveSelectedWidgetMode({ kind: 'frame', pageId: 'p1', scope: 'app', frameId: 'f1' })
    ).toBe('app-frame')
    expect(
      resolveSelectedWidgetMode({ kind: 'frame', pageId: 'p1', scope: 'page', frameId: 'f1' })
    ).toBe('page-frame')
    expect(resolveSelectedWidgetMode({ kind: 'app' })).toBeNull()
    expect(resolveSelectedWidgetMode({ kind: 'page', pageId: 'p1' })).toBeNull()
    expect(resolveSelectedWidgetMode({ kind: 'main', pageId: 'p1' })).toBeNull()
  })
})

describe('canDuplicateWidgetForMode', () => {
  it('blocks duplicate singleton app frame', () => {
    const header = makeWidget('header1', 'GlobalHeader')
    const page = makePage()
    expect(
      canDuplicateWidgetForMode({
        widget: header,
        mode: 'app-frame',
        appLayout: { header },
        targetPage: page,
      })
    ).toBe(false)
  })

  it('blocks duplicate split pane on page scope', () => {
    const splitPane = makeWidget('split1', 'GlobalSplitPane')
    const page = makePage({ splitPane, drawers: [], modals: [] })

    expect(
      canDuplicateWidgetForMode({
        widget: splitPane,
        mode: 'page-frame',
        appLayout: {},
        targetPage: page,
      })
    ).toBe(false)
  })

  it('allows non-frame widgets', () => {
    const text = makeWidget('text1', 'Text')
    const page = makePage()
    expect(
      canDuplicateWidgetForMode({
        widget: text,
        mode: 'page',
        appLayout: {},
        targetPage: page,
      })
    ).toBe(true)
  })
})

describe('page frame operations', () => {
  it('adds frame only when scope/cardinality allow it', () => {
    const emptyFrames = createEmptyPageFrames()
    const splitPane = makeWidget('split1', 'GlobalSplitPane')
    const secondSplit = makeWidget('split2', 'GlobalSplitPane')

    const firstAdd = addPageFrameWithValidation(emptyFrames, splitPane)
    expect(firstAdd.added).toBe(true)
    expect(firstAdd.nextFrames.splitPane?.id).toBe('split1')

    const secondAdd = addPageFrameWithValidation(firstAdd.nextFrames, secondSplit)
    expect(secondAdd.added).toBe(false)
    expect(secondAdd.nextFrames.splitPane?.id).toBe('split1')
  })

  it('removes split pane/drawer/modal by id', () => {
    const frames = {
      splitPane: makeWidget('split1', 'GlobalSplitPane'),
      drawers: [makeWidget('drawer1', 'GlobalDrawer')],
      modals: [makeWidget('modal1', 'GlobalModal')],
    }

    const withoutDrawer = removePageFrameById(frames, 'drawer1')
    expect(withoutDrawer.drawers).toHaveLength(0)

    const withoutModal = removePageFrameById(withoutDrawer, 'modal1')
    expect(withoutModal.modals).toHaveLength(0)

    const withoutSplit = removePageFrameById(withoutModal, 'split1')
    expect(withoutSplit.splitPane).toBeUndefined()
  })

  it('reorders frames within their type bucket', () => {
    const frames = {
      splitPane: makeWidget('split1', 'GlobalSplitPane'),
      drawers: [makeWidget('drawer1', 'GlobalDrawer'), makeWidget('drawer2', 'GlobalDrawer')],
      modals: [makeWidget('modal1', 'GlobalModal'), makeWidget('modal2', 'GlobalModal')],
    }

    const movedDrawer = movePageFrameById(frames, 'drawer1', 1)
    expect(movedDrawer.drawers.map((frame) => frame.id)).toEqual(['drawer2', 'drawer1'])

    const movedModal = movePageFrameById(movedDrawer, 'modal2', 0)
    expect(movedModal.modals.map((frame) => frame.id)).toEqual(['modal2', 'modal1'])
  })
})
