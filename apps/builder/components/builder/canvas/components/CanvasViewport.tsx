/**
 * Макет viewport canvas: компонует app-фреймы, контент страницы и overlay-секции.
 */
import type { ReactNode } from 'react'
import type { BuilderWidgetInstance } from '../../types'
import { CanvasAppFramesLayer } from '../layers/CanvasAppFramesLayer'
import { CanvasOverlayLayer } from '../layers/CanvasOverlayLayer'
import { CanvasPageLayer } from '../layers/CanvasPageLayer'

export type CanvasFrameVariant =
  | 'header'
  | 'sidebar'
  | 'drawer'
  | 'modal'
  | 'split'
  | 'other'

type OverlayVariant = 'drawer' | 'modal'

interface CanvasViewportProps {
  activeHeaderWidgets: BuilderWidgetInstance[]
  activeLeftSidebarWidgets: BuilderWidgetInstance[]
  activeRightSidebarWidgets: BuilderWidgetInstance[]
  activeSplitWidgets: BuilderWidgetInstance[]
  activeOtherOverlayWidgets: BuilderWidgetInstance[]
  visibleOverlayDrawers: BuilderWidgetInstance[]
  visibleOverlayModals: BuilderWidgetInstance[]
  renderGlobalContainer: (
    widget: BuilderWidgetInstance,
    variant: CanvasFrameVariant
  ) => ReactNode
  renderOverlayFrame: (
    widget: BuilderWidgetInstance,
    variant: OverlayVariant,
    index: number
  ) => ReactNode
  pageMainSection: ReactNode
}

export const CanvasViewport = ({
  activeHeaderWidgets,
  activeLeftSidebarWidgets,
  activeRightSidebarWidgets,
  activeSplitWidgets,
  activeOtherOverlayWidgets,
  visibleOverlayDrawers,
  visibleOverlayModals,
  renderGlobalContainer,
  renderOverlayFrame,
  pageMainSection,
}: CanvasViewportProps) => {
  const canvasState = {
    activeHeaderWidgets,
    activeLeftSidebarWidgets,
    activeRightSidebarWidgets,
    activeSplitWidgets,
    activeOtherOverlayWidgets,
    visibleOverlayDrawers,
    visibleOverlayModals,
    pageMainSection,
  }

  const canvasActions = {
    renderGlobalContainer,
    renderOverlayFrame,
  }

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col gap-0">
        <CanvasAppFramesLayer
          state={{
            activeHeaderWidgets: canvasState.activeHeaderWidgets,
            activeSplitWidgets: [],
            activeOtherOverlayWidgets: [],
          }}
          actions={{ renderGlobalContainer: canvasActions.renderGlobalContainer }}
        />
        <CanvasPageLayer
          state={{
            activeLeftSidebarWidgets: canvasState.activeLeftSidebarWidgets,
            activeRightSidebarWidgets: canvasState.activeRightSidebarWidgets,
            pageMainSection: canvasState.pageMainSection,
          }}
          actions={{ renderGlobalContainer: canvasActions.renderGlobalContainer }}
        />
      </div>

      <CanvasOverlayLayer
        state={{
          visibleOverlayDrawers: canvasState.visibleOverlayDrawers,
          visibleOverlayModals: canvasState.visibleOverlayModals,
        }}
        actions={{ renderOverlayFrame: canvasActions.renderOverlayFrame }}
      />

      <CanvasAppFramesLayer
        state={{
          activeHeaderWidgets: [],
          activeSplitWidgets: canvasState.activeSplitWidgets,
          activeOtherOverlayWidgets: canvasState.activeOtherOverlayWidgets,
        }}
        actions={{ renderGlobalContainer: canvasActions.renderGlobalContainer }}
      />
    </>
  )
}
