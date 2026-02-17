/**
 * Layer-компонент, отвечающий за рендер app-level frames.
 */
import type { ReactNode } from 'react'

import type { BuilderWidgetInstance } from '../../types'
import type { CanvasFrameVariant } from '../components/CanvasViewport'

type CanvasAppFramesState = {
  activeHeaderWidgets: BuilderWidgetInstance[]
  activeSplitWidgets: BuilderWidgetInstance[]
  activeOtherOverlayWidgets: BuilderWidgetInstance[]
}

type CanvasAppFramesActions = {
  renderGlobalContainer: (
    widget: BuilderWidgetInstance,
    variant: CanvasFrameVariant
  ) => ReactNode
}

interface CanvasAppFramesLayerProps {
  state: CanvasAppFramesState
  actions: CanvasAppFramesActions
}

export const CanvasAppFramesLayer = ({ state, actions }: CanvasAppFramesLayerProps) => {
  return (
    <>
      {state.activeHeaderWidgets.length > 0 && (
        <div className="space-y-3">
          {state.activeHeaderWidgets.map((widget) =>
            actions.renderGlobalContainer(widget, 'header')
          )}
        </div>
      )}

      {state.activeSplitWidgets.length > 0 && (
        <div className="space-y-3">
          {state.activeSplitWidgets.map((widget) =>
            actions.renderGlobalContainer(widget, 'split')
          )}
        </div>
      )}

      {state.activeOtherOverlayWidgets.length > 0 && (
        <div className="space-y-3">
          <div className="text-xs uppercase text-foreground-muted">Overlays</div>
          <div className="grid gap-3 md:grid-cols-2">
            {state.activeOtherOverlayWidgets.map((widget) =>
              actions.renderGlobalContainer(widget, 'other')
            )}
          </div>
        </div>
      )}
    </>
  )
}
