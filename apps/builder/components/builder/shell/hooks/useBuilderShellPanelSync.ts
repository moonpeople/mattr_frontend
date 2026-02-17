/**
 * Panel-sync hook BuilderShell: синхронизирует ресайз-панели с UI-флагами shell.
 */
import { useEffect } from 'react'
import type { MutableRefObject } from 'react'

import type { ImperativePanelHandle } from 'ui'

export interface UseBuilderShellPanelSyncParams {
  showSidebar: boolean
  inspectorOpen: boolean
  isSettingsSection: boolean
  sidebarPanelRef: MutableRefObject<ImperativePanelHandle | null>
  inspectorPanelRef: MutableRefObject<ImperativePanelHandle | null>
  sidebarPreviousSizeRef: MutableRefObject<number | null>
}

export const useBuilderShellPanelSync = ({
  showSidebar,
  inspectorOpen,
  isSettingsSection,
  sidebarPanelRef,
  inspectorPanelRef,
  sidebarPreviousSizeRef,
}: UseBuilderShellPanelSyncParams) => {
  // Держим ресайз-панели синхронными с флагами видимости.
  useEffect(() => {
    if (showSidebar) {
      sidebarPanelRef.current?.expand()
    } else {
      sidebarPanelRef.current?.collapse()
    }
  }, [showSidebar, sidebarPanelRef])

  useEffect(() => {
    if (inspectorOpen) {
      inspectorPanelRef.current?.expand()
    } else {
      inspectorPanelRef.current?.collapse()
    }
  }, [inspectorOpen, inspectorPanelRef])

  useEffect(() => {
    if (!showSidebar) {
      return
    }
    const panel = sidebarPanelRef.current
    if (!panel) {
      return
    }
    if (isSettingsSection) {
      if (sidebarPreviousSizeRef.current === null) {
        sidebarPreviousSizeRef.current = panel.getSize()
      }
      panel.resize(40)
      panel.expand()
      return
    }
    if (sidebarPreviousSizeRef.current !== null) {
      panel.resize(sidebarPreviousSizeRef.current)
      sidebarPreviousSizeRef.current = null
    }
  }, [isSettingsSection, showSidebar, sidebarPanelRef, sidebarPreviousSizeRef])
}
