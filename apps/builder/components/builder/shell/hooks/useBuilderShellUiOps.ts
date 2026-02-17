/**
 * Hook UI-операций BuilderShell: обработчики инспектора и панелей sidebar/inspector.
 */
import { useCallback } from 'react'
import type { Dispatch, SetStateAction } from 'react'

import type {
  BuilderSection,
  BuilderSelectedNode,
  BuilderWidgetInstance,
} from '../../types'
import type { BuilderWidgetMode } from '../../utils/frame-ops'
import { findWidgetById } from '../layout-ops'

interface InspectorAddonPanel {
  widgetId: string
  key: string
  label: string
}

export interface UseBuilderShellUiOpsParams {
  activePageFrameWidgets: BuilderWidgetInstance[]
  appFrameWidgets: BuilderWidgetInstance[]
  selectedNode: BuilderSelectedNode | null
  selectedWidgetId: string | null
  selectedFrameWidgetId: string | null
  selectedWidgetMode: BuilderWidgetMode | null
  setShowSidebar: Dispatch<SetStateAction<boolean>>
  setActiveSection: Dispatch<SetStateAction<BuilderSection | null>>
  setShowInspector: Dispatch<SetStateAction<boolean>>
  setInspectorAddonPanel: Dispatch<SetStateAction<InspectorAddonPanel | null>>
  selectFrameNode: (widgetId: string) => void
  selectMainWidgetNode: (widgetId: string) => void
  handleDeleteWidget: (widgetId: string, mode: BuilderWidgetMode) => void
}

export const useBuilderShellUiOps = ({
  activePageFrameWidgets,
  appFrameWidgets,
  selectedNode,
  selectedWidgetId,
  selectedFrameWidgetId,
  selectedWidgetMode,
  setShowSidebar,
  setActiveSection,
  setShowInspector,
  setInspectorAddonPanel,
  selectFrameNode,
  selectMainWidgetNode,
  handleDeleteWidget,
}: UseBuilderShellUiOpsParams) => {
  const handleOpenInspectorPanel = useCallback(
    (widgetId: string, panel: { key: string; label: string }) => {
      const isFrameScopeWidget = Boolean(
        findWidgetById(activePageFrameWidgets, widgetId) || findWidgetById(appFrameWidgets, widgetId)
      )
      if (isFrameScopeWidget) {
        selectFrameNode(widgetId)
      } else {
        selectMainWidgetNode(widgetId)
      }
      setInspectorAddonPanel({ widgetId, key: panel.key, label: panel.label })
      setShowInspector(true)
    },
    [
      activePageFrameWidgets,
      appFrameWidgets,
      selectFrameNode,
      selectMainWidgetNode,
      setInspectorAddonPanel,
      setShowInspector,
    ]
  )

  const handleSelectSection = useCallback(
    (section: BuilderSection) => {
      setShowSidebar(true)
      setActiveSection(section)
    },
    [setActiveSection, setShowSidebar]
  )

  const handleCloseSidebar = useCallback(() => {
    setShowSidebar(false)
    setActiveSection(null)
  }, [setActiveSection, setShowSidebar])

  const handleShowInspector = useCallback(() => {
    setShowInspector(true)
  }, [setShowInspector])

  const handleHideInspector = useCallback(() => {
    setShowInspector(false)
  }, [setShowInspector])

  const handleOpenInspectorStatePanel = useCallback(() => {
    setActiveSection('state')
    setShowSidebar(true)
  }, [setActiveSection, setShowSidebar])

  const canDeleteSelectedWidget = Boolean(
    selectedWidgetMode && (selectedFrameWidgetId || selectedWidgetId)
  )

  const handleDeleteSelectedWidgetFromMenu = useCallback(() => {
    if (!selectedWidgetMode) {
      return
    }
    const targetId = selectedFrameWidgetId ?? selectedWidgetId
    if (!targetId) {
      return
    }
    handleDeleteWidget(targetId, selectedWidgetMode)
  }, [handleDeleteWidget, selectedFrameWidgetId, selectedWidgetId, selectedWidgetMode])

  const handleWidgetInspectorAddonPanelChange = useCallback(
    (panel: { key: string; label: string } | null) => {
      if (selectedNode?.kind !== 'widget') {
        setInspectorAddonPanel(null)
        return
      }
      setInspectorAddonPanel(panel ? { widgetId: selectedNode.widgetId, ...panel } : null)
    },
    [selectedNode, setInspectorAddonPanel]
  )

  return {
    canDeleteSelectedWidget,
    handleOpenInspectorPanel,
    handleSelectSection,
    handleCloseSidebar,
    handleShowInspector,
    handleHideInspector,
    handleOpenInspectorStatePanel,
    handleDeleteSelectedWidgetFromMenu,
    handleWidgetInspectorAddonPanelChange,
  }
}
