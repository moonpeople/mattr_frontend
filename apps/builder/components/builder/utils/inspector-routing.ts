import type { BuilderSelectedNode } from '../types'
import type { BuilderFrameMode } from './frame-ops'

export type BuilderInspectorRoute =
  | 'overlay-widget'
  | 'frame-widget'
  | 'widget'
  | 'app'
  | 'main'
  | 'page'

export type ResolveInspectorRouteInput = {
  selectedNode: BuilderSelectedNode | null
  hasSelectedWidget: boolean
  hasSelectedDefinition: boolean
  isOverlayWidget: boolean
  overlayWidgetMode: BuilderFrameMode | null
}

export const resolveInspectorRoute = ({
  selectedNode,
  hasSelectedWidget,
  hasSelectedDefinition,
  isOverlayWidget,
  overlayWidgetMode,
}: ResolveInspectorRouteInput): BuilderInspectorRoute => {
  if (hasSelectedWidget && hasSelectedDefinition) {
    if (isOverlayWidget && overlayWidgetMode) {
      return 'overlay-widget'
    }
    if (selectedNode?.kind === 'frame') {
      return 'frame-widget'
    }
    return 'widget'
  }

  if (selectedNode?.kind === 'app') {
    return 'app'
  }
  if (selectedNode?.kind === 'main') {
    return 'main'
  }
  return 'page'
}
