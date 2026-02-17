/**
 * Тесты утилит дерева виджетов BuilderShell.
 */
import { describe, expect, it } from 'vitest'

import {
  buildWidgetIdFromSet,
  cloneWidgetTree,
  collectExistingWidgetIds,
  ensureUniqueWidgetId,
  normalizeWidgetIdInput,
  updateEventRefsInTree,
} from './widget-tree-utils'

import {
  createDefaultMainFrame,
  createEmptyPageFrames,
  type BuilderPage,
  type BuilderWidgetInstance,
} from '../types'

const createPage = (
  id: string,
  widgets: BuilderWidgetInstance[] = [],
  frames: BuilderWidgetInstance[] = []
): BuilderPage => ({
  id,
  name: id,
  layout: {},
  pageLayout: {
    main: createDefaultMainFrame(),
    widgets,
    frames: {
      ...createEmptyPageFrames(),
      drawers: frames,
    },
  },
  menu: null,
  pageMeta: {},
})

describe('widget-tree-utils', () => {
  it('collects widget ids from main/app/frame trees', () => {
    const mainWidget: BuilderWidgetInstance = { id: 'main_1', type: 'Text', props: {} }
    const frameWidget: BuilderWidgetInstance = { id: 'drawer_1', type: 'GlobalDrawer', props: {} }
    const appFrameWidget: BuilderWidgetInstance = {
      id: 'header_1',
      type: 'GlobalHeader',
      props: {},
    }
    const ids = collectExistingWidgetIds(
      [createPage('page_1', [mainWidget], [frameWidget])],
      [appFrameWidget]
    )

    expect(ids.has('main_1')).toBe(true)
    expect(ids.has('drawer_1')).toBe(true)
    expect(ids.has('header_1')).toBe(true)
  })

  it('normalizes and uniquifies widget id input', () => {
    const normalized = normalizeWidgetIdInput('  123 USER name  ')
    expect(normalized).toBe('widget123USERName')

    const existing = new Set<string>(['widget', 'widget1'])
    const unique = ensureUniqueWidgetId('widget', existing)
    expect(unique).toBe('widget2')
  })

  it('clones tree with new ids and rewrites event refs', () => {
    const source: BuilderWidgetInstance = {
      id: 'button_1',
      type: 'Button',
      props: {
        events: [
          {
            event: 'click',
            pluginId: 'button_1',
            params: { widgetId: 'button_1' },
          },
        ],
      },
      children: [{ id: 'text_1', type: 'Text', props: {} }],
    }
    const ids = new Set<string>(['button_1', 'text_1'])
    const cloned = cloneWidgetTree(source, ids, buildWidgetIdFromSet)

    expect(cloned.id).toBe('button1')
    expect(cloned.children?.[0].id).toBe('text1')

    const updated = updateEventRefsInTree([source], 'button_1', 'button1')
    const events = (updated[0].props.events as Array<Record<string, unknown>>) ?? []
    expect(events[0].pluginId).toBe('button1')
    expect((events[0].params as Record<string, unknown>).widgetId).toBe('button1')
  })
})
