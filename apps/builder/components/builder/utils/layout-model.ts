import type {
  BuilderAppLayout,
  BuilderMainFrame,
  BuilderPageFrames,
  BuilderPageLayout,
  BuilderWidgetInstance,
} from '../types'
import {
  createDefaultMainFrame,
  createEmptyAppLayout,
  createEmptyPageFrames,
} from '../types'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)

const normalizeWidgetList = (value: unknown): BuilderWidgetInstance[] =>
  Array.isArray(value) ? (value as BuilderWidgetInstance[]) : []

export const normalizeMainFrame = (value: unknown): BuilderMainFrame => {
  if (!isRecord(value)) {
    return createDefaultMainFrame()
  }
  return {
    ...createDefaultMainFrame(),
    ...value,
  }
}

export const normalizePageFrames = (
  value: unknown
): BuilderPageFrames => {
  if (!isRecord(value)) {
    return createEmptyPageFrames()
  }

  const splitPane = isRecord(value.splitPane)
    ? (value.splitPane as BuilderWidgetInstance)
    : undefined

  return {
    splitPane,
    drawers: normalizeWidgetList(value.drawers),
    modals: normalizeWidgetList(value.modals),
  }
}

export const resolvePageLayoutFromRecord = (
  layout: Record<string, unknown> | null | undefined
): BuilderPageLayout => {
  const rawLayout = isRecord(layout) ? layout : {}
  const nested = isRecord(rawLayout.pageLayout)
    ? (rawLayout.pageLayout as Record<string, unknown>)
    : null

  const mainRaw = nested?.main
  const widgetsRaw = nested?.widgets
  const framesRaw = nested?.frames

  return {
    main: normalizeMainFrame(mainRaw),
    widgets: normalizeWidgetList(widgetsRaw),
    frames: normalizePageFrames(framesRaw),
  }
}

export const writePageLayoutToRecord = (
  layout: Record<string, unknown> | null | undefined,
  pageLayout: BuilderPageLayout
): Record<string, unknown> => {
  const nextLayout: Record<string, unknown> = {
    ...(isRecord(layout) ? layout : {}),
    pageLayout,
  }

  // Remove legacy branches now that pageLayout is canonical.
  delete nextLayout.widgets
  delete nextLayout.pageGlobals
  delete nextLayout.pageComponent
  delete nextLayout.main
  delete nextLayout.frames

  return nextLayout
}

export const resolveAppLayoutFromUnknown = (
  rawAppLayout: unknown
): BuilderAppLayout => {
  if (isRecord(rawAppLayout)) {
    const header = isRecord(rawAppLayout.header)
      ? (rawAppLayout.header as BuilderWidgetInstance)
      : undefined
    const sidebar = isRecord(rawAppLayout.sidebar)
      ? (rawAppLayout.sidebar as BuilderWidgetInstance)
      : undefined
    return {
      ...createEmptyAppLayout(),
      ...(header ? { header } : {}),
      ...(sidebar ? { sidebar } : {}),
    }
  }

  return createEmptyAppLayout()
}
