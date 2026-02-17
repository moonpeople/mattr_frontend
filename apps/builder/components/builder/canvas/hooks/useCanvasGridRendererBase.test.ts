/**
 * Тесты общих helper-функций базового grid-рендера canvas.
 */
import { describe, expect, it } from 'vitest'

import { buildContainerDropOptions } from './useCanvasGridRendererBase'

describe('buildContainerDropOptions', () => {
  it('returns undefined when nothing to pass', () => {
    expect(buildContainerDropOptions()).toBeUndefined()
    expect(buildContainerDropOptions({ parentSlot: '   ' })).toBeUndefined()
  })

  it('keeps preset and injects normalized container slot', () => {
    expect(
      buildContainerDropOptions({
        presetId: 'preset_user',
        parentSlot: ' Header ',
      })
    ).toEqual({
      presetId: 'preset_user',
      props: {
        containerSlot: 'header',
      },
    })
  })

  it('merges slot into existing props for quick-add in slot containers', () => {
    expect(
      buildContainerDropOptions({
        parentSlot: 'footer',
        props: { source: 'users' },
      })
    ).toEqual({
      props: {
        source: 'users',
        containerSlot: 'footer',
      },
    })
  })
})

