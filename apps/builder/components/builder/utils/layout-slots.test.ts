import { describe, expect, it } from 'vitest'

import type { BuilderPage, BuilderWidgetInstance } from '../types'
import { createDefaultMainFrame, createEmptyPageFrames } from '../types'
import {
  applyPageFrames,
  applyPageMain,
  applyPageWidgets,
  resolvePageFramesState,
  resolvePageMainState,
  resolvePageWidgetsState,
  updatePageById,
} from './layout-slots'

const makeWidget = (id: string, type: BuilderWidgetInstance['type'] = 'Text'): BuilderWidgetInstance => ({
  id,
  type,
  props: {},
})

const makePage = (): BuilderPage => ({
  id: 'page-1',
  name: 'Page 1',
  layout: {
    widgets: [{ id: 'legacy-widget' }],
    pageGlobals: [{ id: 'legacy-frame' }],
    pageComponent: { foo: 'bar' },
    main: { expandToFit: true },
    frames: { drawers: [], modals: [] },
  },
  pageLayout: {
    main: {
      expandToFit: true,
      background: '#fff',
      paddingMode: 'normal',
      paddingFxEnabled: false,
      paddingFx: '',
    },
    widgets: [makeWidget('w1')],
    frames: {
      splitPane: makeWidget('split-1', 'GlobalSplitPane'),
      drawers: [makeWidget('drawer-1', 'GlobalDrawer')],
      modals: [],
    },
  },
})

describe('layout slots helpers', () => {
  it('returns defaults when page is missing', () => {
    expect(resolvePageWidgetsState(undefined)).toEqual([])
    expect(resolvePageMainState(undefined)).toEqual(createDefaultMainFrame())
    expect(resolvePageFramesState(undefined)).toEqual(createEmptyPageFrames())
  })

  it('applyPageWidgets updates only widgets slot', () => {
    const page = makePage()
    const nextWidgets = [makeWidget('w2')]
    const nextPage = applyPageWidgets(page, nextWidgets)

    expect(nextPage.pageLayout.widgets).toEqual(nextWidgets)
    expect(nextPage.pageLayout.main).toEqual(page.pageLayout.main)
    expect(nextPage.pageLayout.frames).toEqual(page.pageLayout.frames)
  })

  it('applyPageFrames updates only frames slot', () => {
    const page = makePage()
    const nextFrames = {
      splitPane: makeWidget('split-2', 'GlobalSplitPane'),
      drawers: [makeWidget('drawer-2', 'GlobalDrawer')],
      modals: [makeWidget('modal-1', 'GlobalModal')],
    }
    const nextPage = applyPageFrames(page, nextFrames)

    expect(nextPage.pageLayout.frames).toEqual(nextFrames)
    expect(nextPage.pageLayout.main).toEqual(page.pageLayout.main)
    expect(nextPage.pageLayout.widgets).toEqual(page.pageLayout.widgets)
  })

  it('applyPageMain updates only main slot', () => {
    const page = makePage()
    const nextMain = {
      ...page.pageLayout.main,
      expandToFit: false,
      paddingMode: 'none' as const,
    }
    const nextPage = applyPageMain(page, nextMain)

    expect(nextPage.pageLayout.main).toEqual(nextMain)
    expect(nextPage.pageLayout.widgets).toEqual(page.pageLayout.widgets)
    expect(nextPage.pageLayout.frames).toEqual(page.pageLayout.frames)
  })

  it('applyPage* writes canonical pageLayout and strips legacy layout keys', () => {
    const page = makePage()
    const nextPage = applyPageWidgets(page, [makeWidget('w3')])
    const nextLayout = nextPage.layout as Record<string, unknown>

    expect(nextLayout.pageLayout).toEqual(nextPage.pageLayout)
    expect(nextLayout.widgets).toBeUndefined()
    expect(nextLayout.pageGlobals).toBeUndefined()
    expect(nextLayout.pageComponent).toBeUndefined()
    expect(nextLayout.main).toBeUndefined()
    expect(nextLayout.frames).toBeUndefined()
  })
})

describe('updatePageById', () => {
  it('updates only requested page', () => {
    const pageA = makePage()
    const pageB: BuilderPage = {
      ...makePage(),
      id: 'page-2',
      name: 'Page 2',
    }
    const pages = [pageA, pageB]
    const next = updatePageById(pages, 'page-2', (page) => ({
      ...page,
      name: 'Updated',
    }))

    expect(next[0].name).toBe('Page 1')
    expect(next[1].name).toBe('Updated')
  })
})
