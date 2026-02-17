import { describe, expect, it } from 'vitest'

import { resolveInspectorRoute } from './inspector-routing'

describe('resolveInspectorRoute', () => {
  it('routes to overlay inspector for overlay widget', () => {
    const route = resolveInspectorRoute({
      selectedNode: { kind: 'frame', pageId: 'p1', scope: 'page', frameId: 'drawer1' },
      hasSelectedWidget: true,
      hasSelectedDefinition: true,
      isOverlayWidget: true,
      overlayWidgetMode: 'page-frame',
    })
    expect(route).toBe('overlay-widget')
  })

  it('routes to frame inspector for non-overlay selected frame', () => {
    const route = resolveInspectorRoute({
      selectedNode: { kind: 'frame', pageId: 'p1', scope: 'app', frameId: 'header1' },
      hasSelectedWidget: true,
      hasSelectedDefinition: true,
      isOverlayWidget: false,
      overlayWidgetMode: null,
    })
    expect(route).toBe('frame-widget')
  })

  it('routes to widget inspector for regular widget selection', () => {
    const route = resolveInspectorRoute({
      selectedNode: { kind: 'widget', pageId: 'p1', scope: 'main', widgetId: 'text1' },
      hasSelectedWidget: true,
      hasSelectedDefinition: true,
      isOverlayWidget: false,
      overlayWidgetMode: null,
    })
    expect(route).toBe('widget')
  })

  it('routes to app inspector when app node selected', () => {
    const route = resolveInspectorRoute({
      selectedNode: { kind: 'app' },
      hasSelectedWidget: false,
      hasSelectedDefinition: false,
      isOverlayWidget: false,
      overlayWidgetMode: null,
    })
    expect(route).toBe('app')
  })

  it('routes to main inspector when main node selected', () => {
    const route = resolveInspectorRoute({
      selectedNode: { kind: 'main', pageId: 'p1' },
      hasSelectedWidget: false,
      hasSelectedDefinition: false,
      isOverlayWidget: false,
      overlayWidgetMode: null,
    })
    expect(route).toBe('main')
  })

  it('falls back to page inspector', () => {
    const route = resolveInspectorRoute({
      selectedNode: { kind: 'page', pageId: 'p1' },
      hasSelectedWidget: false,
      hasSelectedDefinition: false,
      isOverlayWidget: false,
      overlayWidgetMode: null,
    })
    expect(route).toBe('page')
  })
})
