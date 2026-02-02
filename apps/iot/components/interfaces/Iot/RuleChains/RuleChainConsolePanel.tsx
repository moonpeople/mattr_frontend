import { RefObject } from 'react'

import { Button, Input, ResizablePanel, Textarea, type ImperativePanelHandle } from 'ui'
import { X } from 'lucide-react'

type ConsoleTab = 'console' | 'errors' | 'output' | 'metadata'

type RuleChainConsolePanelProps = {
  consolePanelRef: RefObject<ImperativePanelHandle>
  consoleTab: ConsoleTab
  consoleCollapsed: boolean
  onConsoleTabChange: (value: ConsoleTab) => void
  onCollapse: () => void
  onExpand: () => void
  onRequestCollapse: () => void
  metadataErrorText?: string | null
  metadataVersion: string
  onMetadataVersionChange: (value: string) => void
  metadataText: string
  onMetadataTextChange: (value: string) => void
  metadataTextError: string | null
  isMetadataLoading: boolean
  onSaveMetadata: () => void
  isSavingMetadata: boolean
  consoleLines: string[]
  errorLines: string[]
  outputLines: string[]
}

const RuleChainConsolePanel = ({
  consolePanelRef,
  consoleTab,
  consoleCollapsed,
  onConsoleTabChange,
  onCollapse,
  onExpand,
  onRequestCollapse,
  metadataErrorText,
  metadataVersion,
  onMetadataVersionChange,
  metadataText,
  onMetadataTextChange,
  metadataTextError,
  isMetadataLoading,
  onSaveMetadata,
  isSavingMetadata,
  consoleLines,
  errorLines,
  outputLines,
}: RuleChainConsolePanelProps) => {
  const tabButtonClass = (tab: ConsoleTab) =>
    `h-5 text-[10px] rounded-none hover:text-foreground ${
      consoleTab === tab ? 'text-foreground font-semibold' : 'text-foreground-muted'
    }`

  return (
    <ResizablePanel
      ref={consolePanelRef}
      defaultSize={30}
      minSize={consoleCollapsed ? 0 : 20}
      collapsible
      collapsedSize={0}
      onCollapse={onCollapse}
      onExpand={onExpand}
      className="min-h-0"
    >
      <div className="flex h-full min-h-0 flex-col border-t border-foreground-muted/30 bg-surface-200">
        <div className="flex h-6 items-center justify-between gap-2 overflow-x-auto px-3">
          <div className="flex items-center gap-0">
            <Button
              type="text"
              size="tiny"
              className={tabButtonClass('console')}
              onClick={() => onConsoleTabChange('console')}
            >
              Console
            </Button>
            <Button
              type="text"
              size="tiny"
              className={tabButtonClass('errors')}
              onClick={() => onConsoleTabChange('errors')}
            >
              Errors
            </Button>
            <Button
              type="text"
              size="tiny"
              className={tabButtonClass('output')}
              onClick={() => onConsoleTabChange('output')}
            >
              Output
            </Button>
            <Button
              type="text"
              size="tiny"
              className={tabButtonClass('metadata')}
              onClick={() => onConsoleTabChange('metadata')}
            >
              Metadata
            </Button>
          </div>
          {!consoleCollapsed && (
            <Button
              type="text"
              size="tiny"
              className="h-5 px-1"
              icon={<X size={12} />}
              onClick={onRequestCollapse}
            />
          )}
        </div>
        {!consoleCollapsed && (
          <>
            {consoleTab === 'console' && (
              <div className="flex-1 min-h-0">
                <div className="h-full overflow-y-auto bg-surface-100 px-4 py-3 text-xs text-foreground-light">
                  {consoleLines.length === 0 ? (
                    'No console output yet.'
                  ) : (
                    <pre className="whitespace-pre-wrap break-words">{consoleLines.join('\n\n')}</pre>
                  )}
                </div>
              </div>
            )}
            {consoleTab === 'errors' && (
              <div className="flex-1 min-h-0">
                <div className="h-full overflow-y-auto bg-surface-100 px-4 py-3 text-xs text-foreground-light">
                  {errorLines.length === 0 ? (
                    'No errors recorded.'
                  ) : (
                    <pre className="whitespace-pre-wrap break-words text-destructive-600">
                      {errorLines.join('\n\n')}
                    </pre>
                  )}
                </div>
              </div>
            )}
            {consoleTab === 'output' && (
              <div className="flex-1 min-h-0">
                <div className="h-full overflow-y-auto bg-surface-100 px-4 py-3 text-xs text-foreground-light">
                  {outputLines.length === 0 ? (
                    'No output yet.'
                  ) : (
                    <pre className="whitespace-pre-wrap break-words">
                      {outputLines.join('\n\n')}
                    </pre>
                  )}
                </div>
              </div>
            )}
            {consoleTab === 'metadata' && (
              <div className="flex-1 min-h-0">
                <div className="h-full overflow-y-auto bg-surface-100 px-4 py-3">
                  <div className="space-y-4">
                    {metadataErrorText && (
                      <p className="text-sm text-destructive-600">{metadataErrorText}</p>
                    )}
                    <Input
                      id="rule-chain-metadata-version"
                      label="Version"
                      type="number"
                      value={metadataVersion}
                      onChange={(event) => onMetadataVersionChange(event.target.value)}
                    />
                    <Textarea
                      id="rule-chain-metadata"
                      className="input-mono"
                      value={metadataText}
                      onChange={(event) => onMetadataTextChange(event.target.value)}
                      rows={14}
                    />
                    {metadataTextError && (
                      <p className="text-xs text-destructive-600">{metadataTextError}</p>
                    )}
                    <div className="flex items-center justify-between gap-2">
                      {isMetadataLoading ? (
                        <p className="text-sm text-foreground-light">Loading metadata...</p>
                      ) : (
                        <span className="text-xs text-foreground-light">
                          Update JSON directly or use the flow editor.
                        </span>
                      )}
                      <Button type="primary" onClick={onSaveMetadata} disabled={isSavingMetadata}>
                        Save metadata
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </ResizablePanel>
  )
}

export default RuleChainConsolePanel
