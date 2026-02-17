/**
 * Правая панель shell: header inspector-а, меню действий и routing по типам инспекторов.
 */
import type {
  ComponentProps,
  ElementType,
  MutableRefObject,
} from 'react'
import { BookOpen, MoreHorizontal, X } from 'lucide-react'

import type { BuilderWidgetInstance } from '../../types'
import type { BuilderInspectorRoute } from '../../utils/inspector-routing'
import {
  Button,
  Input_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
} from 'ui'

import {
  BuilderInspector,
  BuilderFrameInspector,
  BuilderOverlayInspector,
  BuilderPageComponentInspector,
  BuilderAppInspector,
  BuilderPageInspector,
} from '../../inspector'

export interface BuilderInspectorPaneProps {
  isPreviewing: boolean
  selectedWidget: BuilderWidgetInstance | null
  selectedWidgetIcon: ElementType | null
  isRenamingWidget: boolean
  renameInputRef: MutableRefObject<HTMLInputElement | null>
  renameDraft: string
  setRenameDraft: (value: string) => void
  onCommitWidgetRename: () => void
  onCancelWidgetRename: () => void
  isAddonPanelActive: boolean
  activeAddonPanelLabel?: string | null
  onClearAddonPanel: () => void
  onStartWidgetRename: () => void
  inspectorMenuOpen: boolean
  setInspectorMenuOpen: (open: boolean) => void
  selectedDefinitionLabel?: string
  hasClipboardWidget: boolean
  canDuplicateSelectedWidget: boolean
  canDeleteSelectedWidget: boolean
  onOpenStatePanel: () => void
  onCopyWidget: () => void
  onCutWidget: () => void
  onDuplicateWidget: () => void
  onResetWidgetState: () => void
  onDeleteWidget: () => void
  onCloseInspector: () => void
  route: BuilderInspectorRoute
  overlayInspectorProps?: ComponentProps<typeof BuilderOverlayInspector> | null
  frameInspectorProps?: ComponentProps<typeof BuilderFrameInspector> | null
  widgetInspectorProps?: ComponentProps<typeof BuilderInspector> | null
  appInspectorProps: ComponentProps<typeof BuilderAppInspector>
  pageComponentInspectorProps: ComponentProps<typeof BuilderPageComponentInspector>
  pageInspectorProps: ComponentProps<typeof BuilderPageInspector>
}

export const BuilderInspectorPane = ({
  isPreviewing,
  selectedWidget,
  selectedWidgetIcon: SelectedWidgetIcon,
  isRenamingWidget,
  renameInputRef,
  renameDraft,
  setRenameDraft,
  onCommitWidgetRename,
  onCancelWidgetRename,
  isAddonPanelActive,
  activeAddonPanelLabel,
  onClearAddonPanel,
  onStartWidgetRename,
  inspectorMenuOpen,
  setInspectorMenuOpen,
  selectedDefinitionLabel,
  hasClipboardWidget,
  canDuplicateSelectedWidget,
  canDeleteSelectedWidget,
  onOpenStatePanel,
  onCopyWidget,
  onCutWidget,
  onDuplicateWidget,
  onResetWidgetState,
  onDeleteWidget,
  onCloseInspector,
  route,
  overlayInspectorProps,
  frameInspectorProps,
  widgetInspectorProps,
  appInspectorProps,
  pageComponentInspectorProps,
  pageInspectorProps,
}: BuilderInspectorPaneProps) => {
  return (
    <div className="builder-panel h-full border-l border-foreground-muted/30 bg-surface-100">
      {!isPreviewing && (
        <>
          <div className="builder-panel-header flex h-9 items-center justify-between border-b border-foreground-muted/30 bg-surface-200 px-3 text-[11px] font-semibold">
            <div className="flex min-w-0 items-center gap-2">
              {selectedWidget && SelectedWidgetIcon ? (
                <div className="flex h-6 w-6 items-center justify-center rounded-md border border-foreground-muted/30 bg-surface-100">
                  <SelectedWidgetIcon size={14} className="text-foreground-muted" />
                </div>
              ) : (
                <span>Inspector</span>
              )}
              {selectedWidget && (
                <>
                  {isRenamingWidget ? (
                    <Input_Shadcn_
                      ref={renameInputRef}
                      value={renameDraft}
                      onChange={(event) => setRenameDraft(event.target.value)}
                      onBlur={onCommitWidgetRename}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault()
                          onCommitWidgetRename()
                        }
                        if (event.key === 'Escape') {
                          event.preventDefault()
                          onCancelWidgetRename()
                        }
                      }}
                      className="h-6 min-w-[120px] max-w-[180px] px-2 text-[11px]"
                    />
                  ) : (
                    <>
                      {isAddonPanelActive ? (
                        <div className="flex min-w-0 items-center gap-1 text-[11px] font-semibold">
                          <button
                            type="button"
                            className="min-w-0 truncate text-foreground hover:text-foreground"
                            onClick={onClearAddonPanel}
                          >
                            {selectedWidget.id}
                          </button>
                          <span className="text-foreground-muted">{'>'}</span>
                          <span className="min-w-0 truncate">{activeAddonPanelLabel}</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="min-w-0 truncate text-[11px] font-semibold text-foreground hover:text-foreground"
                          onClick={onStartWidgetRename}
                        >
                          {selectedWidget.id}
                        </button>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Popover_Shadcn_ open={inspectorMenuOpen} onOpenChange={setInspectorMenuOpen}>
                <PopoverTrigger_Shadcn_ asChild>
                  <Button
                    type="text"
                    size="tiny"
                    icon={<MoreHorizontal size={14} />}
                    className="text-foreground-muted px-1"
                  />
                </PopoverTrigger_Shadcn_>
                <PopoverContent_Shadcn_ className="w-60 p-2" align="end" side="bottom">
                  <div className="flex items-center justify-between border-b border-foreground-muted/20 px-1 pb-2">
                    <span className="text-[12px] font-medium text-foreground">
                      {selectedDefinitionLabel ?? 'Inspector'}
                    </span>
                    <Button
                      type="text"
                      size="tiny"
                      icon={<BookOpen size={14} />}
                      className="px-1 text-foreground-muted"
                      disabled
                      aria-label="Open documentation"
                    />
                  </div>
                  <div className="pt-2 space-y-1">
                    <button
                      type="button"
                      className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs text-foreground hover:bg-surface-200"
                      onClick={() => {
                        onOpenStatePanel()
                        setInspectorMenuOpen(false)
                      }}
                    >
                      <span>View state</span>
                    </button>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs text-foreground-muted/60"
                      disabled
                      data-has-clipboard={hasClipboardWidget ? 'true' : 'false'}
                    >
                      <span>Prompt Assist (Beta)</span>
                    </button>
                    <div className="my-1 h-px bg-foreground-muted/20" />
                    <button
                      type="button"
                      className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs text-foreground hover:bg-surface-200"
                      disabled={!selectedWidget}
                      onClick={() => {
                        onCopyWidget()
                        setInspectorMenuOpen(false)
                      }}
                    >
                      <span>Copy</span>
                      <span className="text-[10px] text-foreground-muted">Cmd+C</span>
                    </button>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs text-foreground hover:bg-surface-200"
                      disabled={!selectedWidget}
                      onClick={() => {
                        onCutWidget()
                        setInspectorMenuOpen(false)
                      }}
                    >
                      <span>Cut</span>
                      <span className="text-[10px] text-foreground-muted">Cmd+X</span>
                    </button>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs text-foreground hover:bg-surface-200"
                      disabled={!canDuplicateSelectedWidget}
                      onClick={() => {
                        onDuplicateWidget()
                        setInspectorMenuOpen(false)
                      }}
                    >
                      <span>Duplicate</span>
                      <span className="text-[10px] text-foreground-muted">Cmd+D</span>
                    </button>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs text-foreground-muted/60"
                      disabled
                    >
                      <span>Paste below</span>
                      <span className="text-[10px] text-foreground-muted">Cmd+V</span>
                    </button>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs text-foreground hover:bg-surface-200"
                      disabled={!selectedWidget}
                      onClick={() => {
                        onStartWidgetRename()
                        setInspectorMenuOpen(false)
                      }}
                    >
                      <span>Rename</span>
                    </button>
                    <div className="my-1 h-px bg-foreground-muted/20" />
                    <button
                      type="button"
                      className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs text-foreground-muted/60"
                      disabled
                    >
                      <span>Export to module</span>
                    </button>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs text-foreground-muted/60"
                      disabled
                    >
                      <span>Switch to ...</span>
                    </button>
                    <div className="my-1 h-px bg-foreground-muted/20" />
                    <button
                      type="button"
                      className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs text-foreground hover:bg-surface-200"
                      disabled={!selectedWidget}
                      onClick={() => {
                        onResetWidgetState()
                        setInspectorMenuOpen(false)
                      }}
                    >
                      <span>Reset state</span>
                    </button>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs text-destructive-500 hover:bg-destructive-500/10"
                      disabled={!canDeleteSelectedWidget}
                      onClick={() => {
                        onDeleteWidget()
                        setInspectorMenuOpen(false)
                      }}
                    >
                      <span>Delete</span>
                    </button>
                  </div>
                </PopoverContent_Shadcn_>
              </Popover_Shadcn_>
              <Button
                className="px-1"
                type="text"
                size="tiny"
                icon={<X size={14} />}
                onClick={onCloseInspector}
              />
            </div>
          </div>
          <div className="h-[calc(100%-64px)]">
            {route === 'overlay-widget' && overlayInspectorProps ? (
              <BuilderOverlayInspector {...overlayInspectorProps} />
            ) : route === 'frame-widget' && frameInspectorProps ? (
              <BuilderFrameInspector {...frameInspectorProps} />
            ) : route === 'widget' && widgetInspectorProps ? (
              <BuilderInspector {...widgetInspectorProps} />
            ) : route === 'app' ? (
              <BuilderAppInspector {...appInspectorProps} />
            ) : route === 'main' ? (
              <BuilderPageComponentInspector {...pageComponentInspectorProps} />
            ) : (
              <BuilderPageInspector {...pageInspectorProps} />
            )}
          </div>
        </>
      )}
    </div>
  )
}
