import { describe, expect, it } from 'vitest'

import {
  BUILDER_WIDGET_MIME,
  BUILDER_WIDGET_PRESET_MIME,
  isQuickAddWidgetSelectable,
  resolveBuilderWidgetDragPayload,
} from './quickadd-dnd'

const makeDataTransfer = ({
  types,
  values,
}: {
  types: string[]
  values: Record<string, string>
}) => ({
  types,
  getData: (type: string) => values[type] ?? '',
})

describe('resolveBuilderWidgetDragPayload', () => {
  it('returns null when no data transfer', () => {
    expect(resolveBuilderWidgetDragPayload(null)).toBeNull()
  })

  it('returns null when builder mime is missing', () => {
    const dataTransfer = makeDataTransfer({
      types: ['text/plain'],
      values: { 'text/plain': 'Text' },
    })
    expect(resolveBuilderWidgetDragPayload(dataTransfer)).toBeNull()
  })

  it('reads widget type and optional preset', () => {
    const dataTransfer = makeDataTransfer({
      types: [BUILDER_WIDGET_MIME, BUILDER_WIDGET_PRESET_MIME],
      values: {
        [BUILDER_WIDGET_MIME]: 'Select',
        [BUILDER_WIDGET_PRESET_MIME]: 'preset-1',
      },
    })

    expect(resolveBuilderWidgetDragPayload(dataTransfer)).toEqual({
      widgetType: 'Select',
      presetId: 'preset-1',
    })
  })

  it('falls back to text/plain for widget type when mime value is empty', () => {
    const dataTransfer = makeDataTransfer({
      types: [BUILDER_WIDGET_MIME, 'text/plain'],
      values: {
        [BUILDER_WIDGET_MIME]: '   ',
        'text/plain': 'Table',
      },
    })

    expect(resolveBuilderWidgetDragPayload(dataTransfer)).toEqual({
      widgetType: 'Table',
    })
  })
})

describe('isQuickAddWidgetSelectable', () => {
  const availableWidgetTypes = new Set(['Text', 'Select', 'Table', 'GlobalHeader'])
  const isFrameType = (type: string) => type.startsWith('Global')

  it('rejects empty/unknown widget type and frame types', () => {
    expect(
      isQuickAddWidgetSelectable({
        widgetType: '',
        availableWidgetTypes,
        isFrameType,
      })
    ).toBe(false)

    expect(
      isQuickAddWidgetSelectable({
        widgetType: 'Missing',
        availableWidgetTypes,
        isFrameType,
      })
    ).toBe(false)

    expect(
      isQuickAddWidgetSelectable({
        widgetType: 'GlobalHeader',
        availableWidgetTypes,
        isFrameType,
      })
    ).toBe(false)
  })

  it('accepts regular widgets without preset', () => {
    expect(
      isQuickAddWidgetSelectable({
        widgetType: 'Text',
        availableWidgetTypes,
        isFrameType,
      })
    ).toBe(true)
  })

  it('rejects preset when resolver cannot resolve preset type', () => {
    expect(
      isQuickAddWidgetSelectable({
        widgetType: 'Select',
        options: { presetId: 'preset-unknown' },
        availableWidgetTypes,
        isFrameType,
        resolvePresetWidgetType: () => undefined,
      })
    ).toBe(false)
  })

  it('rejects preset/widget mismatch and accepts match', () => {
    expect(
      isQuickAddWidgetSelectable({
        widgetType: 'Select',
        options: { presetId: 'preset-table' },
        availableWidgetTypes,
        isFrameType,
        resolvePresetWidgetType: () => 'Table',
      })
    ).toBe(false)

    expect(
      isQuickAddWidgetSelectable({
        widgetType: 'Select',
        options: { presetId: 'preset-select' },
        availableWidgetTypes,
        isFrameType,
        resolvePresetWidgetType: () => 'Select',
      })
    ).toBe(true)
  })
})
