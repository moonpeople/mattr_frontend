/**
 * Тесты selection hook-а BuilderShell.
 */
import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import {
  createDefaultMainFrame,
  createPageFramesFromWidgets,
  type BuilderPage,
  type BuilderWidgetInstance,
} from '../../types'
import { useBuilderShellSelection } from './useBuilderShellSelection'

const createWidget = (
  id: string,
  type: string,
  children?: BuilderWidgetInstance[]
): BuilderWidgetInstance => ({
  id,
  type,
  props: {},
  children,
})

const createPage = (id: string, frames: BuilderWidgetInstance[] = []): BuilderPage => ({
  id,
  name: id,
  layout: {},
  pageLayout: {
    main: createDefaultMainFrame(),
    widgets: [createWidget('mainText', 'Text')],
    frames: createPageFramesFromWidgets(frames),
  },
  menu: null,
  pageMeta: {
    title: id,
    browserTitle: id,
    url: id,
    searchParams: [],
    hashParams: [],
    shortcuts: [],
  },
})

describe('useBuilderShellSelection', () => {
  it('selects page/main/widget nodes with resolved page id', () => {
    const pageOne = createPage('page_1')
    const pageTwo = createPage('page_2')

    const { result } = renderHook(() =>
      useBuilderShellSelection({
        pages: [pageOne, pageTwo],
        appFrameWidgets: [],
      })
    )

    act(() => {
      result.current.selectPageNode('page_2')
    })

    expect(result.current.activePageId).toBe('page_2')
    expect(result.current.selectedNode).toEqual({ kind: 'page', pageId: 'page_2' })

    act(() => {
      result.current.selectMainNode()
    })

    expect(result.current.selectedNode).toEqual({ kind: 'main', pageId: 'page_2' })

    act(() => {
      result.current.selectMainWidgetNode('mainText')
    })

    expect(result.current.selectedNode).toEqual({
      kind: 'widget',
      pageId: 'page_2',
      scope: 'main',
      widgetId: 'mainText',
    })
  })

  it('routes frame selection to app/page scopes and clears stale addon panel', async () => {
    const appHeader = createWidget('header_1', 'GlobalHeader')
    const drawerChild = createWidget('drawerChild', 'Text')
    const pageDrawer = createWidget('drawer_1', 'GlobalDrawer', [drawerChild])

    const { result } = renderHook(() =>
      useBuilderShellSelection({
        pages: [createPage('page_1', [pageDrawer])],
        appFrameWidgets: [appHeader],
      })
    )

    act(() => {
      result.current.selectFrameNode('header_1')
    })

    expect(result.current.selectedNode).toEqual({
      kind: 'frame',
      pageId: 'page_1',
      scope: 'app',
      frameId: 'header_1',
    })

    act(() => {
      result.current.selectFrameNode('drawerChild')
    })

    expect(result.current.selectedNode).toEqual({
      kind: 'widget',
      pageId: 'page_1',
      scope: 'page-frame',
      widgetId: 'drawerChild',
    })

    act(() => {
      result.current.setInspectorAddonPanel({
        widgetId: 'drawerChild',
        key: 'caption',
        label: 'Caption',
      })
      result.current.selectMainNode()
    })

    await waitFor(() => {
      expect(result.current.inspectorAddonPanel).toBeNull()
    })
  })
})
