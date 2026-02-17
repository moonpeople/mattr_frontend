/**
 * Hook сборки action-props для BuilderSidebar и BuilderCanvas.
 */
import { useMemo } from 'react'
import type { ComponentProps } from 'react'

import { BuilderSidebar } from '../../BuilderSidebar'
import { BuilderCanvas } from '../../canvas'

type SidebarActionProps = Pick<
  ComponentProps<typeof BuilderSidebar>,
  | 'onAddAppFrameWidget'
  | 'onSetRootScreen'
  | 'onSelectPage'
  | 'onSelectWidget'
  | 'onSelectFrameWidget'
  | 'onSelectPageMain'
  | 'onAddPageFrameWidget'
  | 'onToggleWidgetHidden'
  | 'onReorderWidget'
  | 'onAddWidgetAtRoot'
  | 'isWidgetSelectable'
  | 'onAddPage'
  | 'onDeletePage'
  | 'onAddWidget'
  | 'onQueryRun'
  | 'onSelectCodeItem'
  | 'onAddCodeItem'
  | 'onMoveCodeItem'
  | 'onAppNameChange'
  | 'onClose'
>

type CanvasActionProps = Pick<
  ComponentProps<typeof BuilderCanvas>,
  | 'onSelectWidget'
  | 'onOpenInspectorPanel'
  | 'onSelectFrameWidget'
  | 'onSelectPageMain'
  | 'onSelectApp'
  | 'onClearSelection'
  | 'onUpdateLayout'
  | 'onUpdateWidgetLayout'
  | 'onUpdateChildLayout'
  | 'onUpdateAppFrameChildLayout'
  | 'onUpdatePageFrameChildLayout'
  | 'onDropWidget'
  | 'onDropAppFrameWidget'
  | 'onDropPageFrameWidget'
  | 'onInsertAdjacentWidget'
  | 'onMoveWidgetAdjacent'
  | 'onMoveWidgetToContainer'
  | 'onMoveWidgetToPageRoot'
  | 'onUpdateAppFrameWidgetLayout'
  | 'onUpdatePageFrameWidgetLayout'
  | 'onUpdateWidgetProps'
  | 'onSetFrameWidgetHidden'
>

export type BuilderShellSidebarActionProps = SidebarActionProps
export type BuilderShellCanvasActionProps = CanvasActionProps

export interface UseBuilderShellActionPropsParams {
  onAddAppFrameWidget: NonNullable<SidebarActionProps['onAddAppFrameWidget']>
  onSetRootScreen: NonNullable<SidebarActionProps['onSetRootScreen']>
  onSelectPage: SidebarActionProps['onSelectPage']
  onSelectWidget: SidebarActionProps['onSelectWidget']
  onSelectFrameWidget: SidebarActionProps['onSelectFrameWidget']
  onSelectPageMain: SidebarActionProps['onSelectPageMain']
  onAddPageFrameWidget: NonNullable<SidebarActionProps['onAddPageFrameWidget']>
  onToggleWidgetHidden: SidebarActionProps['onToggleWidgetHidden']
  onReorderWidget: SidebarActionProps['onReorderWidget']
  onAddWidgetAtRoot: SidebarActionProps['onAddWidgetAtRoot']
  isWidgetSelectable: SidebarActionProps['isWidgetSelectable']
  onAddPage: SidebarActionProps['onAddPage']
  onDeletePage: SidebarActionProps['onDeletePage']
  onAddWidget: SidebarActionProps['onAddWidget']
  onQueryRun: SidebarActionProps['onQueryRun']
  onSelectCodeItem: SidebarActionProps['onSelectCodeItem']
  onAddCodeItem: SidebarActionProps['onAddCodeItem']
  onMoveCodeItem: SidebarActionProps['onMoveCodeItem']
  onAppNameChange: SidebarActionProps['onAppNameChange']
  onCloseSidebar: NonNullable<SidebarActionProps['onClose']>
  onOpenInspectorPanel: CanvasActionProps['onOpenInspectorPanel']
  onSelectApp: NonNullable<CanvasActionProps['onSelectApp']>
  onUpdateLayout: CanvasActionProps['onUpdateLayout']
  onUpdateWidgetLayout: CanvasActionProps['onUpdateWidgetLayout']
  onUpdateChildLayout: CanvasActionProps['onUpdateChildLayout']
  onUpdateAppFrameChildLayout: CanvasActionProps['onUpdateAppFrameChildLayout']
  onUpdatePageFrameChildLayout: CanvasActionProps['onUpdatePageFrameChildLayout']
  onDropWidget: CanvasActionProps['onDropWidget']
  onDropAppFrameWidget: CanvasActionProps['onDropAppFrameWidget']
  onDropPageFrameWidget: CanvasActionProps['onDropPageFrameWidget']
  onInsertAdjacentWidget: CanvasActionProps['onInsertAdjacentWidget']
  onMoveWidgetAdjacent: CanvasActionProps['onMoveWidgetAdjacent']
  onMoveWidgetToContainer: CanvasActionProps['onMoveWidgetToContainer']
  onMoveWidgetToPageRoot: CanvasActionProps['onMoveWidgetToPageRoot']
  onUpdateAppFrameWidgetLayout: CanvasActionProps['onUpdateAppFrameWidgetLayout']
  onUpdatePageFrameWidgetLayout: CanvasActionProps['onUpdatePageFrameWidgetLayout']
  onUpdateWidgetProps: CanvasActionProps['onUpdateWidgetProps']
  onSetFrameWidgetHidden: CanvasActionProps['onSetFrameWidgetHidden']
}

export const useBuilderShellActionProps = ({
  onAddAppFrameWidget,
  onSetRootScreen,
  onSelectPage,
  onSelectWidget,
  onSelectFrameWidget,
  onSelectPageMain,
  onAddPageFrameWidget,
  onToggleWidgetHidden,
  onReorderWidget,
  onAddWidgetAtRoot,
  isWidgetSelectable,
  onAddPage,
  onDeletePage,
  onAddWidget,
  onQueryRun,
  onSelectCodeItem,
  onAddCodeItem,
  onMoveCodeItem,
  onAppNameChange,
  onCloseSidebar,
  onOpenInspectorPanel,
  onSelectApp,
  onUpdateLayout,
  onUpdateWidgetLayout,
  onUpdateChildLayout,
  onUpdateAppFrameChildLayout,
  onUpdatePageFrameChildLayout,
  onDropWidget,
  onDropAppFrameWidget,
  onDropPageFrameWidget,
  onInsertAdjacentWidget,
  onMoveWidgetAdjacent,
  onMoveWidgetToContainer,
  onMoveWidgetToPageRoot,
  onUpdateAppFrameWidgetLayout,
  onUpdatePageFrameWidgetLayout,
  onUpdateWidgetProps,
  onSetFrameWidgetHidden,
}: UseBuilderShellActionPropsParams) => {
  const sidebarActionProps = useMemo<SidebarActionProps>(
    () => ({
      onAddAppFrameWidget,
      onSetRootScreen,
      onSelectPage,
      onSelectWidget,
      onSelectFrameWidget,
      onSelectPageMain,
      onAddPageFrameWidget,
      onToggleWidgetHidden,
      onReorderWidget,
      onAddWidgetAtRoot,
      isWidgetSelectable,
      onAddPage,
      onDeletePage,
      onAddWidget,
      onQueryRun,
      onSelectCodeItem,
      onAddCodeItem,
      onMoveCodeItem,
      onAppNameChange,
      onClose: onCloseSidebar,
    }),
    [
      isWidgetSelectable,
      onAddAppFrameWidget,
      onAddCodeItem,
      onAddPage,
      onAddPageFrameWidget,
      onAddWidget,
      onAddWidgetAtRoot,
      onAppNameChange,
      onCloseSidebar,
      onDeletePage,
      onMoveCodeItem,
      onQueryRun,
      onReorderWidget,
      onSelectCodeItem,
      onSelectFrameWidget,
      onSelectPage,
      onSelectPageMain,
      onSelectWidget,
      onSetRootScreen,
      onToggleWidgetHidden,
    ]
  )

  const canvasActionProps = useMemo<CanvasActionProps>(
    () => ({
      onSelectWidget,
      onOpenInspectorPanel,
      onSelectFrameWidget,
      onSelectPageMain,
      onSelectApp,
      onClearSelection: onSelectApp,
      onUpdateLayout,
      onUpdateWidgetLayout,
      onUpdateChildLayout,
      onUpdateAppFrameChildLayout,
      onUpdatePageFrameChildLayout,
      onDropWidget,
      onDropAppFrameWidget,
      onDropPageFrameWidget,
      onInsertAdjacentWidget,
      onMoveWidgetAdjacent,
      onMoveWidgetToContainer,
      onMoveWidgetToPageRoot,
      onUpdateAppFrameWidgetLayout,
      onUpdatePageFrameWidgetLayout,
      onUpdateWidgetProps,
      onSetFrameWidgetHidden,
    }),
    [
      onDropAppFrameWidget,
      onDropPageFrameWidget,
      onDropWidget,
      onInsertAdjacentWidget,
      onMoveWidgetAdjacent,
      onMoveWidgetToContainer,
      onMoveWidgetToPageRoot,
      onOpenInspectorPanel,
      onSelectApp,
      onSelectFrameWidget,
      onSelectPageMain,
      onSelectWidget,
      onSetFrameWidgetHidden,
      onUpdateAppFrameChildLayout,
      onUpdateAppFrameWidgetLayout,
      onUpdateChildLayout,
      onUpdateLayout,
      onUpdatePageFrameChildLayout,
      onUpdatePageFrameWidgetLayout,
      onUpdateWidgetLayout,
      onUpdateWidgetProps,
    ]
  )

  return {
    sidebarActionProps,
    canvasActionProps,
  }
}
