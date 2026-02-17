/**
 * Selection-hook BuilderShell: состояние выбора и callbacks выбора app/page/main/frame/widget.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'

import type { BuilderPage, BuilderSelectedNode, BuilderWidgetInstance } from '../../types'
import { getPageFrameWidgets, isFrameType } from '../../types'
import { resolvePageFramesState } from '../../utils/layout-slots'
import { findWidgetById } from '../layout-ops'

export interface UseBuilderShellSelectionParams {
  pages: BuilderPage[]
  appFrameWidgets: BuilderWidgetInstance[]
}

export const useBuilderShellSelection = ({
  pages,
  appFrameWidgets,
}: UseBuilderShellSelectionParams) => {
  const [activePageId, setActivePageId] = useState<string | null>(null)
  const [selectedNode, setSelectedNode] = useState<BuilderSelectedNode | null>(null)
  const [inspectorAddonPanel, setInspectorAddonPanel] = useState<{
    widgetId: string
    key: string
    label: string
  } | null>(null)

  const activePage = useMemo(
    () => pages.find((page) => page.id === activePageId) ?? pages[0],
    [pages, activePageId]
  )
  const activePageFrameWidgets = useMemo(
    () => getPageFrameWidgets(resolvePageFramesState(activePage)),
    [activePage]
  )

  const resolveCurrentPageId = useCallback(
    () => activePageId ?? activePage?.id ?? pages[0]?.id ?? null,
    [activePage?.id, activePageId, pages]
  )

  const clearWidgetSelection = useCallback(() => {
    const pageId = resolveCurrentPageId()
    if (!pageId) {
      setSelectedNode(null)
      return
    }
    setSelectedNode({ kind: 'page', pageId })
  }, [resolveCurrentPageId])

  const selectPageNode = useCallback((pageId: string) => {
    setActivePageId(pageId)
    setSelectedNode({ kind: 'page', pageId })
  }, [])

  const selectMainNode = useCallback(() => {
    const pageId = resolveCurrentPageId()
    if (!pageId) {
      return
    }
    setSelectedNode({ kind: 'main', pageId })
  }, [resolveCurrentPageId])

  const selectMainWidgetNode = useCallback(
    (widgetId: string) => {
      const pageId = resolveCurrentPageId()
      if (!pageId) {
        return
      }
      setSelectedNode({ kind: 'widget', pageId, scope: 'main', widgetId })
    },
    [resolveCurrentPageId]
  )

  const selectFrameNode = useCallback(
    (widgetId: string) => {
      const pageId = resolveCurrentPageId()
      if (!pageId) {
        return
      }
      const pageScopeWidget = findWidgetById(activePageFrameWidgets, widgetId)
      const appScopeWidget = findWidgetById(appFrameWidgets, widgetId)
      if (!pageScopeWidget && !appScopeWidget) {
        return
      }
      const scope = pageScopeWidget ? 'page' : 'app'
      const widget = pageScopeWidget ?? appScopeWidget
      if (!widget) {
        return
      }
      if (isFrameType(widget.type)) {
        setSelectedNode({ kind: 'frame', pageId, scope, frameId: widgetId })
        return
      }
      setSelectedNode({
        kind: 'widget',
        pageId,
        scope: scope === 'app' ? 'app-frame' : 'page-frame',
        widgetId,
      })
    },
    [activePageFrameWidgets, appFrameWidgets, resolveCurrentPageId]
  )

  useEffect(() => {
    if (!inspectorAddonPanel) {
      return
    }
    const selectedWidgetNodeId = selectedNode?.kind === 'widget' ? selectedNode.widgetId : null
    if (inspectorAddonPanel.widgetId !== selectedWidgetNodeId) {
      setInspectorAddonPanel(null)
    }
  }, [inspectorAddonPanel, selectedNode])

  return {
    activePage,
    activePageFrameWidgets,
    activePageId,
    setActivePageId,
    selectedNode,
    setSelectedNode,
    inspectorAddonPanel,
    setInspectorAddonPanel,
    resolveCurrentPageId,
    clearWidgetSelection,
    selectPageNode,
    selectMainNode,
    selectMainWidgetNode,
    selectFrameNode,
  }
}
