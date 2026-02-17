/**
 * Производные данные выбранного узла: widget/frame/main + inspector route/overlay.
 */
import { useMemo } from 'react'

import { getWidgetDefinition } from 'widgets/runtime'

import { getWidgetIcon } from '../../BuilderSidebarItems'
import type { BuilderSelectedNode, BuilderWidgetInstance } from '../../types'
import { resolveFrameMode, resolveSelectedWidgetMode } from '../../utils/frame-ops'
import { resolveInspectorRoute } from '../../utils/inspector-routing'
import { findWidgetById, findWidgetParentById } from '../layout-ops'

export interface UseBuilderShellSelectedWidgetStateParams {
  selectedNode: BuilderSelectedNode | null
  activePageWidgets: BuilderWidgetInstance[]
  appFrameWidgets: BuilderWidgetInstance[]
  activePageFrameWidgets: BuilderWidgetInstance[]
  inspectorAddonPanel: {
    widgetId: string
    key: string
    label: string
  } | null
}

export const useBuilderShellSelectedWidgetState = ({
  selectedNode,
  activePageWidgets,
  appFrameWidgets,
  activePageFrameWidgets,
  inspectorAddonPanel,
}: UseBuilderShellSelectedWidgetStateParams) => {
  const selectedWidgetId =
    selectedNode?.kind === 'widget' && selectedNode.scope === 'main'
      ? selectedNode.widgetId
      : null
  const selectedFrameWidgetId =
    selectedNode?.kind === 'frame'
      ? selectedNode.frameId
      : selectedNode?.kind === 'widget' && selectedNode.scope !== 'main'
        ? selectedNode.widgetId
        : null
  const selectedPageMain = selectedNode?.kind === 'main'
  const selectedWidgetMode = resolveSelectedWidgetMode(selectedNode)

  const selectedWidget = useMemo(() => {
    if (!selectedNode) {
      return null
    }
    if (selectedNode.kind === 'widget') {
      if (selectedNode.scope === 'main') {
        return findWidgetById(activePageWidgets, selectedNode.widgetId)
      }
      if (selectedNode.scope === 'app-frame') {
        return findWidgetById(appFrameWidgets, selectedNode.widgetId)
      }
      return findWidgetById(activePageFrameWidgets, selectedNode.widgetId)
    }
    if (selectedNode.kind === 'frame') {
      return selectedNode.scope === 'app'
        ? findWidgetById(appFrameWidgets, selectedNode.frameId)
        : findWidgetById(activePageFrameWidgets, selectedNode.frameId)
    }
    return null
  }, [activePageFrameWidgets, activePageWidgets, appFrameWidgets, selectedNode])

  const selectedWidgetParent = useMemo(() => {
    if (!selectedNode || selectedNode.kind !== 'widget') {
      return null
    }
    if (selectedNode.scope === 'main') {
      return findWidgetParentById(activePageWidgets, selectedNode.widgetId)
    }
    if (selectedNode.scope === 'app-frame') {
      return findWidgetParentById(appFrameWidgets, selectedNode.widgetId)
    }
    return findWidgetParentById(activePageFrameWidgets, selectedNode.widgetId)
  }, [
    activePageFrameWidgets,
    activePageWidgets,
    appFrameWidgets,
    selectedNode,
  ])

  const selectedWidgetIcon = selectedWidget ? getWidgetIcon(selectedWidget.type) : null
  const selectedDefinition = selectedWidget ? getWidgetDefinition(selectedWidget.type) : undefined
  const activeAddonPanel =
    inspectorAddonPanel &&
    selectedNode?.kind === 'widget' &&
    inspectorAddonPanel.widgetId === selectedNode.widgetId
      ? inspectorAddonPanel
      : null
  const isAddonPanelActive = Boolean(activeAddonPanel && selectedWidget)
  const isOverlayWidget =
    selectedWidget?.type === 'GlobalDrawer' || selectedWidget?.type === 'GlobalModal'
  const overlayMode: 'drawer' | 'modal' =
    selectedWidget?.type === 'GlobalDrawer' ? 'drawer' : 'modal'
  const overlayWidgetMode = resolveFrameMode(selectedWidgetMode)
  const inspectorRoute = resolveInspectorRoute({
    selectedNode,
    hasSelectedWidget: Boolean(selectedWidget),
    hasSelectedDefinition: Boolean(selectedDefinition),
    isOverlayWidget,
    overlayWidgetMode,
  })
  const isInspectorSearchEnabled = Boolean(selectedWidget && selectedDefinition)

  return {
    selectedWidgetId,
    selectedFrameWidgetId,
    selectedPageMain,
    selectedWidgetMode,
    selectedWidget,
    selectedWidgetParent,
    selectedWidgetIcon,
    selectedDefinition,
    activeAddonPanel,
    isAddonPanelActive,
    overlayMode,
    overlayWidgetMode,
    inspectorRoute,
    isInspectorSearchEnabled,
  }
}
