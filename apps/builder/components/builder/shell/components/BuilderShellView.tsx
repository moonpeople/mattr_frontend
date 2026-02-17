/**
 * Presentational view shell: layout секций builder (sidebar/workspace/inspector).
 */
import type {
  ComponentProps,
  MutableRefObject,
  ReactNode,
} from 'react'

import { Button, ImperativePanelHandle, ResizableHandle, ResizablePanel, ResizablePanelGroup } from 'ui'

import { BuilderCanvas } from '../../canvas'
import { BuilderCodeOutputPanel } from '../../BuilderCodeOutputPanel'
import { BuilderCodeTabs } from '../../BuilderCodeTabs'
import { BuilderCodeWorkspace } from '../../BuilderCodeWorkspace'
import { BuilderPreview } from '../../BuilderPreview'
import { BuilderSidebar } from '../../BuilderSidebar'
import { BuilderSectionMenu } from '../../BuilderSectionMenu'
import { type BuilderSection } from '../../types'
import { BuilderPublishDialog } from './BuilderPublishDialog'
import {
  BuilderInspectorPane,
  type BuilderInspectorPaneProps,
} from './BuilderInspectorPane'

export interface BuilderShellViewProps {
  headerActions: ReactNode
  activeSection: BuilderSection | null
  onSelectSection: (section: BuilderSection) => void
  sidebarPanelRef: MutableRefObject<ImperativePanelHandle | null>
  isSettingsSection: boolean
  showSidebar: boolean
  sidebarProps: ComponentProps<typeof BuilderSidebar>
  isPreviewing: boolean
  isCodeMode: boolean
  isCodeTabActive: boolean
  codeTabsProps: ComponentProps<typeof BuilderCodeTabs>
  previewProps: ComponentProps<typeof BuilderPreview>
  codeWorkspaceProps: ComponentProps<typeof BuilderCodeWorkspace>
  canvasProps: ComponentProps<typeof BuilderCanvas>
  showInspector: boolean
  onShowInspector: () => void
  inspectorOpen: boolean
  inspectorPanelRef: MutableRefObject<ImperativePanelHandle | null>
  codeOutputProps: ComponentProps<typeof BuilderCodeOutputPanel>
  inspectorPaneProps: BuilderInspectorPaneProps
  publishDialogProps: ComponentProps<typeof BuilderPublishDialog>
}

export const BuilderShellView = ({
  headerActions,
  activeSection,
  onSelectSection,
  sidebarPanelRef,
  isSettingsSection,
  showSidebar,
  sidebarProps,
  isPreviewing,
  isCodeMode,
  isCodeTabActive,
  codeTabsProps,
  previewProps,
  codeWorkspaceProps,
  canvasProps,
  showInspector,
  onShowInspector,
  inspectorOpen,
  inspectorPanelRef,
  codeOutputProps,
  inspectorPaneProps,
  publishDialogProps,
}: BuilderShellViewProps) => {
  return (
    <div className="builder-shell flex h-full min-h-0 min-w-0">
      {headerActions}
      <BuilderSectionMenu
        activeSection={activeSection}
        onSelectSection={onSelectSection}
      />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <ResizablePanelGroup direction="horizontal" className="min-h-0 min-w-0 flex-1">
          <ResizablePanel
            ref={sidebarPanelRef}
            defaultSize={isSettingsSection ? 40 : 15}
            minSize={isSettingsSection ? 40 : 15}
            maxSize={isSettingsSection ? 40 : 32}
            collapsible
            collapsedSize={0}
            className={showSidebar ? 'min-w-[240px]' : 'min-w-0'}
          >
            {activeSection ? <BuilderSidebar {...sidebarProps} /> : null}
          </ResizablePanel>
          <ResizableHandle
            withHandle
            className={
              showSidebar && !isSettingsSection ? undefined : 'opacity-0 pointer-events-none'
            }
          />
          <ResizablePanel defaultSize={56} minSize={40} className="min-w-0">
            <div className="flex h-full flex-col">
              {!isPreviewing && isCodeMode && <BuilderCodeTabs {...codeTabsProps} />}
              <div className="relative flex-1 min-h-0">
                {isPreviewing ? (
                  <BuilderPreview {...previewProps} />
                ) : isCodeMode && isCodeTabActive ? (
                  <BuilderCodeWorkspace {...codeWorkspaceProps} />
                ) : (
                  <BuilderCanvas {...canvasProps} />
                )}
                {!isPreviewing && !showInspector && (!isCodeMode || !isCodeTabActive) && (
                  <div className="absolute right-4 top-4 z-10">
                    <Button type="default" size="tiny" onClick={onShowInspector}>
                      Inspector
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </ResizablePanel>
          <ResizableHandle
            withHandle
            className={inspectorOpen ? undefined : 'opacity-0 pointer-events-none'}
          />
          <ResizablePanel
            ref={inspectorPanelRef}
            defaultSize={20}
            minSize={18}
            maxSize={34}
            collapsible
            collapsedSize={0}
          >
            {isCodeTabActive ? (
              <BuilderCodeOutputPanel {...codeOutputProps} />
            ) : (
              <BuilderInspectorPane {...inspectorPaneProps} />
            )}
          </ResizablePanel>
        </ResizablePanelGroup>
        <BuilderPublishDialog {...publishDialogProps} />
      </div>
    </div>
  )
}
