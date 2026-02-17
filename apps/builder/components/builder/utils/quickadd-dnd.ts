import type { BuilderWidgetAddOptions } from '../types'

export const BUILDER_WIDGET_MIME = 'application/x-builder-widget'
export const BUILDER_WIDGET_PRESET_MIME = 'application/x-builder-widget-preset'

export type BuilderDragPayload = {
  widgetType: string
  presetId?: string
}

type DataTransferLike = {
  types?: string[] | ArrayLike<string>
  getData: (type: string) => string
}

export const resolveBuilderWidgetDragPayload = (
  dataTransfer: DataTransferLike | null
): BuilderDragPayload | null => {
  if (!dataTransfer) {
    return null
  }
  const types = Array.from(dataTransfer.types ?? [])
  if (!types.includes(BUILDER_WIDGET_MIME)) {
    return null
  }

  const widgetType =
    dataTransfer.getData(BUILDER_WIDGET_MIME).trim() ||
    dataTransfer.getData('text/plain').trim()
  if (!widgetType) {
    return null
  }

  const presetId = dataTransfer.getData(BUILDER_WIDGET_PRESET_MIME).trim()
  return {
    widgetType,
    ...(presetId ? { presetId } : {}),
  }
}

export const isQuickAddWidgetSelectable = ({
  widgetType,
  options,
  availableWidgetTypes,
  isFrameType,
  resolvePresetWidgetType,
}: {
  widgetType: string
  options?: BuilderWidgetAddOptions
  availableWidgetTypes: ReadonlySet<string>
  isFrameType: (type: string) => boolean
  resolvePresetWidgetType?: (presetId: string) => string | undefined
}): boolean => {
  if (!widgetType || !availableWidgetTypes.has(widgetType)) {
    return false
  }
  if (isFrameType(widgetType)) {
    return false
  }

  const presetId = options?.presetId?.trim()
  if (!presetId) {
    return true
  }

  const presetWidgetType = resolvePresetWidgetType?.(presetId)
  if (!presetWidgetType) {
    return false
  }
  return presetWidgetType === widgetType
}
