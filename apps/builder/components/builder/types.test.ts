import { describe, expect, it } from 'vitest'

import type { BuilderWidgetInstance } from './types'
import {
  appendPageFrame,
  canAddAppFrame,
  canAddPageFrame,
  createEmptyPageFrames,
} from './types'

const makeFrame = (type: BuilderWidgetInstance['type'], id: string): BuilderWidgetInstance => ({
  id,
  type,
  props: {},
  children: [],
})

describe('canAddAppFrame', () => {
  it('allows adding app-level header/sidebar once', () => {
    const emptyLayout = {}
    expect(canAddAppFrame('GlobalHeader', emptyLayout).allowed).toBe(true)
    expect(canAddAppFrame('GlobalSidebar', emptyLayout).allowed).toBe(true)
  })

  it('blocks duplicate app-level singleton frames', () => {
    const layout = {
      header: makeFrame('GlobalHeader', 'header1'),
      sidebar: makeFrame('GlobalSidebar', 'sidebar1'),
    }
    expect(canAddAppFrame('GlobalHeader', layout).allowed).toBe(false)
    expect(canAddAppFrame('GlobalSidebar', layout).allowed).toBe(false)
  })

  it('blocks non-app frames at app scope', () => {
    expect(canAddAppFrame('GlobalModal', {}).allowed).toBe(false)
    expect(canAddAppFrame('Text', {}).allowed).toBe(false)
  })
})

describe('canAddPageFrame', () => {
  it('enforces split-pane singleton on page scope', () => {
    const empty = createEmptyPageFrames()
    expect(canAddPageFrame('GlobalSplitPane', empty).allowed).toBe(true)

    const withSplit = appendPageFrame(empty, makeFrame('GlobalSplitPane', 'split1'))
    expect(canAddPageFrame('GlobalSplitPane', withSplit).allowed).toBe(false)
  })

  it('allows multiple drawers and modals on page scope', () => {
    let frames = createEmptyPageFrames()
    frames = appendPageFrame(frames, makeFrame('GlobalDrawer', 'drawer1'))
    frames = appendPageFrame(frames, makeFrame('GlobalModal', 'modal1'))

    expect(canAddPageFrame('GlobalDrawer', frames).allowed).toBe(true)
    expect(canAddPageFrame('GlobalModal', frames).allowed).toBe(true)
  })

  it('blocks non-page frames at page scope', () => {
    const frames = createEmptyPageFrames()
    expect(canAddPageFrame('GlobalHeader', frames).allowed).toBe(false)
    expect(canAddPageFrame('Text', frames).allowed).toBe(false)
  })
})

