/**
 * Тесты helper-функций layout selectors canvas.
 */
import { describe, expect, it } from 'vitest'

import type { BuilderWidgetInstance } from '../../types'
import { buildLayoutMap, collectWidgetIds } from './layoutSelectors'

const createWidget = (
  id: string,
  type: string,
  overrides: Partial<BuilderWidgetInstance> = {}
): BuilderWidgetInstance =>
  ({
    id,
    type,
    props: {},
    ...overrides,
  }) as BuilderWidgetInstance

describe('layoutSelectors', () => {
  it('collects widget ids recursively', () => {
    const widgets: BuilderWidgetInstance[] = [
      createWidget('parent', 'Container', {
        children: [
          createWidget('child_a', 'Text'),
          createWidget('child_b', 'Button', {
            children: [createWidget('leaf', 'Text')],
          }),
        ],
      }),
    ]

    expect(collectWidgetIds(widgets)).toEqual(new Set(['parent', 'child_a', 'child_b', 'leaf']))
  })

  it('builds normalized map for layouts and clamps width to columns', () => {
    const widgets: BuilderWidgetInstance[] = [
      createWidget('text_1', 'Text', {
        layout: { x: 3, y: 2, w: 20, h: 4, minW: 1, minH: 1 },
      }),
      createWidget('json_1', 'JsonEditor', {
        layout: { x: 0, y: 0, w: 3, h: 1, minW: 2, minH: 1 },
      }),
    ]

    const layoutMap = buildLayoutMap(widgets, 12, 'text_1')

    expect(layoutMap.size).toBe(2)
    expect(layoutMap.get('text_1')).toMatchObject({
      i: 'text_1',
      x: 3,
      y: 2,
      w: 12,
      h: 4,
    })
    expect(layoutMap.get('json_1')).toMatchObject({
      i: 'json_1',
      h: 40,
    })
  })
})
