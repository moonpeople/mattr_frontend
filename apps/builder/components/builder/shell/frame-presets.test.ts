/**
 * Тесты preset-утилит системных frame-виджетов.
 */
import { describe, expect, it } from 'vitest'

import { buildGlobalPresetChildren } from './frame-presets'
import { buildWidgetIdFromSet } from './widget-tree-utils'

describe('frame-presets', () => {
  it('builds header preset children', () => {
    const ids = new Set<string>()
    const children = buildGlobalPresetChildren({
      type: 'GlobalHeader',
      parentId: 'header1',
      existingIds: ids,
      buildWidgetId: buildWidgetIdFromSet,
    })

    expect(children.map((item) => item.type)).toEqual(['Image', 'Navigation'])
  })

  it('builds drawer preset with close button bound to parent id', () => {
    const ids = new Set<string>()
    const children = buildGlobalPresetChildren({
      type: 'GlobalDrawer',
      parentId: 'drawer42',
      existingIds: ids,
      buildWidgetId: buildWidgetIdFromSet,
    })

    expect(children.map((item) => item.type)).toEqual(['DrawerHeader', 'DrawerFooter'])
    const header = children[0]
    const closeButton = header.children?.find((child) => child.type === 'DrawerCloseButton')
    const events = closeButton?.props?.events as Array<Record<string, unknown>>
    expect(Array.isArray(events)).toBe(true)
    expect(events?.[0]?.pluginId).toBe('drawer42')
  })

  it('returns empty array for unsupported frame type', () => {
    const children = buildGlobalPresetChildren({
      type: 'GlobalSplitPane',
      parentId: 'split1',
      existingIds: new Set<string>(),
      buildWidgetId: buildWidgetIdFromSet,
    })
    expect(children).toEqual([])
  })
})
