/**
 * Layer-компонент, отвечающий за рендер overlay frames (drawers/modals).
 */
import type { ReactNode } from 'react'

import type { BuilderWidgetInstance } from '../../types'

type OverlayVariant = 'drawer' | 'modal'

type CanvasOverlayState = {
  visibleOverlayDrawers: BuilderWidgetInstance[]
  visibleOverlayModals: BuilderWidgetInstance[]
}

type CanvasOverlayActions = {
  renderOverlayFrame: (
    widget: BuilderWidgetInstance,
    variant: OverlayVariant,
    index: number
  ) => ReactNode
}

interface CanvasOverlayLayerProps {
  state: CanvasOverlayState
  actions: CanvasOverlayActions
}

export const CanvasOverlayLayer = ({ state, actions }: CanvasOverlayLayerProps) => {
  if (state.visibleOverlayDrawers.length === 0 && state.visibleOverlayModals.length === 0) {
    return null
  }

  return (
    <div className="absolute inset-0 z-20">
      {state.visibleOverlayDrawers.map((widget, index) =>
        actions.renderOverlayFrame(widget, 'drawer', index)
      )}
      {state.visibleOverlayModals.map((widget, index) =>
        actions.renderOverlayFrame(widget, 'modal', index + state.visibleOverlayDrawers.length)
      )}
    </div>
  )
}
