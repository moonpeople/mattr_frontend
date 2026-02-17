/**
 * Layer-компонент, отвечающий за рендер main-секции страницы.
 */
import type { ReactNode } from 'react'
import { cn } from 'ui'

import type { BuilderWidgetInstance } from '../../types'
import type { CanvasFrameVariant } from '../components/CanvasViewport'

type CanvasPageState = {
  activeLeftSidebarWidgets: BuilderWidgetInstance[]
  activeRightSidebarWidgets: BuilderWidgetInstance[]
  pageMainSection: ReactNode
}

type CanvasPageActions = {
  renderGlobalContainer: (
    widget: BuilderWidgetInstance,
    variant: CanvasFrameVariant
  ) => ReactNode
}

interface CanvasPageLayerProps {
  state: CanvasPageState
  actions: CanvasPageActions
}

export const CanvasPageLayer = ({ state, actions }: CanvasPageLayerProps) => {
  return (
    <div className="flex h-full min-h-[320px] flex-1 gap-0">
      {state.activeLeftSidebarWidgets.length > 0 && (
        <div
          className={cn(
            'order-first flex h-full min-h-0 w-auto flex-col gap-3 self-stretch overflow-visible'
          )}
        >
          {state.activeLeftSidebarWidgets.map((widget) =>
            actions.renderGlobalContainer(widget, 'sidebar')
          )}
        </div>
      )}

      {state.pageMainSection}

      {state.activeRightSidebarWidgets.length > 0 && (
        <div
          className={cn(
            'order-last flex h-full min-h-0 w-auto flex-col gap-3 self-stretch overflow-visible'
          )}
        >
          {state.activeRightSidebarWidgets.map((widget) =>
            actions.renderGlobalContainer(widget, 'sidebar')
          )}
        </div>
      )}
    </div>
  )
}
