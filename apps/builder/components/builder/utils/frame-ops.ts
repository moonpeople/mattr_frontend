import type {
  BuilderAppLayout,
  BuilderPage,
  BuilderPageFrames,
  BuilderSelectedNode,
  BuilderWidgetInstance,
} from '../types'
import {
  appendPageFrame,
  canAddAppFrame,
  canAddPageFrame,
  createPageFramesFromWidgets,
  getPageFrameWidgets,
  isFrameType,
} from '../types'

export type BuilderWidgetMode = 'page' | 'app-frame' | 'page-frame'
export type BuilderFrameMode = 'app-frame' | 'page-frame'

export const resolveSelectedWidgetMode = (
  selectedNode: BuilderSelectedNode | null
): BuilderWidgetMode | null => {
  if (!selectedNode) {
    return null
  }
  if (selectedNode.kind === 'widget') {
    if (selectedNode.scope === 'main') {
      return 'page'
    }
    return selectedNode.scope === 'app-frame' ? 'app-frame' : 'page-frame'
  }
  if (selectedNode.kind === 'frame') {
    return selectedNode.scope === 'app' ? 'app-frame' : 'page-frame'
  }
  return null
}

export const resolveFrameMode = (
  mode: BuilderWidgetMode | null
): BuilderFrameMode | null => {
  if (mode === 'app-frame' || mode === 'page-frame') {
    return mode
  }
  return null
}

export const executeByWidgetMode = <T>(
  mode: BuilderWidgetMode,
  handlers: {
    page: () => T
    appFrame: () => T
    pageFrame: () => T
  }
): T => {
  if (mode === 'app-frame') {
    return handlers.appFrame()
  }
  if (mode === 'page-frame') {
    return handlers.pageFrame()
  }
  return handlers.page()
}

export const executeByFrameMode = <T>(
  mode: BuilderFrameMode,
  handlers: {
    appFrame: () => T
    pageFrame: () => T
  }
): T => {
  if (mode === 'page-frame') {
    return handlers.pageFrame()
  }
  return handlers.appFrame()
}

export const canDuplicateWidgetForMode = (input: {
  widget: BuilderWidgetInstance | null
  mode: BuilderWidgetMode | null
  appLayout: BuilderAppLayout
  targetPage: BuilderPage | null
}): boolean => {
  const { widget, mode, appLayout, targetPage } = input
  if (!widget || !mode) {
    return false
  }
  if (!isFrameType(widget.type)) {
    return true
  }
  if (mode === 'app-frame') {
    return canAddAppFrame(widget.type, appLayout).allowed
  }
  if (mode === 'page-frame') {
    if (!targetPage) {
      return false
    }
    return canAddPageFrame(widget.type, targetPage.pageLayout.frames).allowed
  }
  return true
}

export const addPageFrameWithValidation = (
  frames: BuilderPageFrames,
  frame: BuilderWidgetInstance
): { added: boolean; reason?: string; nextFrames: BuilderPageFrames } => {
  const validation = canAddPageFrame(frame.type, frames)
  if (!validation.allowed) {
    return {
      added: false,
      reason: validation.reason,
      nextFrames: frames,
    }
  }
  return {
    added: true,
    nextFrames: appendPageFrame(frames, frame),
  }
}

export const removePageFrameById = (
  frames: BuilderPageFrames,
  frameId: string
): BuilderPageFrames => {
  const nextSplitPane = frames.splitPane?.id === frameId ? undefined : frames.splitPane
  const nextDrawers = frames.drawers.filter((frame) => frame.id !== frameId)
  const nextModals = frames.modals.filter((frame) => frame.id !== frameId)

  const changed =
    nextSplitPane !== frames.splitPane ||
    nextDrawers.length !== frames.drawers.length ||
    nextModals.length !== frames.modals.length

  if (!changed) {
    return frames
  }

  return {
    splitPane: nextSplitPane,
    drawers: nextDrawers,
    modals: nextModals,
  }
}

export const movePageFrameById = (
  frames: BuilderPageFrames,
  frameId: string,
  targetIndex: number
): BuilderPageFrames => {
  const frameWidgets = getPageFrameWidgets(frames)
  const fromIndex = frameWidgets.findIndex((widget) => widget.id === frameId)
  if (fromIndex === -1) {
    return frames
  }

  const movingWidget = frameWidgets[fromIndex]
  // Split pane is singleton and cannot be reordered.
  if (movingWidget.type === 'GlobalSplitPane') {
    return frames
  }

  const bucket = movingWidget.type === 'GlobalDrawer' ? 'GlobalDrawer' : 'GlobalModal'
  const bucketIndexes = frameWidgets
    .map((widget, index) => ({ widget, index }))
    .filter(({ widget }) => widget.type === bucket)
    .map(({ index }) => index)

  const sourceBucketIndex = bucketIndexes.findIndex((index) => index === fromIndex)
  if (sourceBucketIndex === -1) {
    return frames
  }

  const clampedBucketIndex = Math.max(0, Math.min(targetIndex, bucketIndexes.length - 1))
  if (sourceBucketIndex === clampedBucketIndex) {
    return frames
  }

  const reordered = [...frameWidgets]
  const [moved] = reordered.splice(fromIndex, 1)
  const destinationIndex = bucketIndexes[clampedBucketIndex]
  reordered.splice(destinationIndex, 0, moved)

  return createPageFramesFromWidgets(reordered)
}
