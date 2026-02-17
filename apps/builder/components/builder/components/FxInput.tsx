import { useState, type ReactNode } from 'react'
import { Code2, ExternalLink } from 'lucide-react'

import type { WidgetField } from 'widgets/runtime'
import CodeEditor, { type CodeEditorContentSize } from 'components/ui/CodeEditor/CodeEditor'

type FxToggleButtonProps = {
  active: boolean
  onClick: () => void
}

const HOVER_FX_BOOLEAN_FIELDS = new Set([
  'showClearButton',
  'labelHide',
  'labelWrap',
  'showSeparators',
  'showClear',
  'showStepper',
  'hideValidationMessage',
  'showPasswordToggle',
  'maintainSpaceWhenHidden',
  'alwaysShowInEditMode',
  'showOnDesktop',
  'showOnMobile',
])

const FxToggleButton = ({ active, onClick }: FxToggleButtonProps) => {
  return (
    <button
      type="button"
      className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase transition-colors ${
        active
          ? 'bg-foreground/10 text-foreground'
          : 'text-foreground-muted hover:bg-foreground/10 hover:text-foreground'
      }`}
      onClick={onClick}
    >
      fx
    </button>
  )
}

type InlineFxControlProps = {
  control: ReactNode
  isFxEnabled: boolean
  isMultiline: boolean
  onFxClick: () => void
  ariaLabel?: string
  helper?: ReactNode
}

const InlineFxControl = ({
  control,
  isFxEnabled,
  isMultiline,
  onFxClick,
  ariaLabel,
  helper,
}: InlineFxControlProps) => {
  const [isFocused, setIsFocused] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const showIcon = isFxEnabled || (isFocused && isHovered)

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocusCapture={() => setIsFocused(true)}
      onBlurCapture={(event) => {
        const nextTarget = event.relatedTarget as Node | null
        if (nextTarget && event.currentTarget.contains(nextTarget)) {
          return
        }
        setIsFocused(false)
      }}
    >
      {control}
      <button
        type="button"
        onClick={onFxClick}
        className={`absolute right-0.5 ${
          isMultiline ? 'top-0' : 'top-0.5 '
        } flex h-5 w-5 items-center justify-center rounded border border-foreground-muted/30 bg-surface-100 text-foreground-muted transition-opacity ${
          showIcon ? 'opacity-100' : 'pointer-events-none opacity-0'
        } hover:text-foreground`}
        aria-label={ariaLabel ?? 'Open FX editor'}
      >
        <ExternalLink size={12} />
      </button>
      {helper && (
        <div
          className={`absolute left-0 right-0 top-full z-20 mt-1 transition-opacity ${
            isFocused ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
        >
          {helper}
        </div>
      )}
    </div>
  )
}

type FxInputProps = {
  field: WidgetField
  value: unknown
  editorId: string
  control: ReactNode
  inlineControl?: ReactNode
  isFxEnabled: boolean
  isFxActive: boolean
  isInlineCodeEditorField: boolean
  useInlineFx: boolean
  isMultiline: boolean
  onChange: (patch: Record<string, unknown>) => void
  onFxClick: () => void
  onToggleFxMode?: (field: WidgetField, value: unknown) => void
  onInlineEditorSize?: (fieldKey: string, metrics: CodeEditorContentSize) => void
  fxEditorLibs?: string[]
  fxEvalContext?: Record<string, unknown>
  fxCompletionWords?: string[]
  fxCompletionMetadata?: Record<
    string,
    { kind?: string; detail?: string; documentation?: string; appendDot?: boolean }
  >
  iconOptions?: { label: string; value: string }[]
  renderIcon?: (value: string) => ReactNode
  hintExpression?: ReactNode
  hintTemplate?: ReactNode
}

export const FxInput = ({
  field,
  value,
  editorId,
  control,
  inlineControl,
  isFxEnabled,
  isFxActive,
  isInlineCodeEditorField,
  useInlineFx,
  isMultiline,
  onChange,
  onFxClick,
  onToggleFxMode,
  onInlineEditorSize,
  fxEditorLibs,
  fxEvalContext,
  fxCompletionWords,
  fxCompletionMetadata,
  iconOptions,
  renderIcon,
  hintExpression,
  hintTemplate,
}: FxInputProps) => {
  const customSuggestions = {
    enabled: true,
    context: fxEvalContext,
    iconOptions,
    renderIcon,
  }
  if (field.type === 'boolean') {
    const showToggle = Boolean(onToggleFxMode)
    const useHoverFxLayout = HOVER_FX_BOOLEAN_FIELDS.has(field.key)

    if (useHoverFxLayout) {
      if (isFxActive) {
        if (!showToggle) {
          return (
            <div
              className="flex h-6 w-full items-center overflow-hidden rounded-md border border-foreground-muted/30 bg-surface-100 focus-within:border-brand-500 focus-within:ring-1 focus-within:ring-brand-500/40"
              onKeyDown={(event) => {
                if (event.key === 'Backspace' || event.key === 'Delete') {
                  event.stopPropagation()
                }
              }}
            >
              <CodeEditor
                id={`${editorId}-inline`}
                language="javascript"
                value={typeof value === 'string' ? value : String(value ?? '')}
                onInputChange={(nextValue) =>
                  onChange({ [field.key]: nextValue ?? '' })
                }
                autofocus={false}
                className="h-[18px] w-full"
                hideLineNumbers
                highlightOnlyFx={false}
                options={{
                  minimap: { enabled: false },
                  wordWrap: 'off',
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  quickSuggestions: false,
                  suggestOnTriggerCharacters: false,
                  wordBasedSuggestions: 'off',
                  tabCompletion: 'on',
                  fontSize: 12,
                  lineHeight: 18,
                  lineNumbers: 'off',
                  glyphMargin: false,
                  lineNumbersMinChars: 0,
                  lineDecorationsWidth: 4,
                  folding: false,
                  renderLineHighlight: 'none',
                  overviewRulerLanes: 0,
                  hideCursorInOverviewRuler: true,
                  overviewRulerBorder: false,
                  scrollbar: {
                    vertical: 'hidden',
                    horizontal: 'hidden',
                    verticalScrollbarSize: 0,
                    horizontalScrollbarSize: 0,
                  },
                  padding: { top: 0, bottom: 0 },
                }}
                extraLibs={fxEditorLibs}
                disableTopPadding
                insertNewlineOnCtrlEnter
                autoTriggerSuggestions
                completionWords={fxCompletionWords}
                completionMetadata={fxCompletionMetadata}
                customSuggestions={customSuggestions}
              />
            </div>
          )
        }

        return (
          <div
            className="flex h-6 w-full items-center overflow-hidden rounded-md border border-foreground-muted/30 bg-surface-100 focus-within:border-brand-500 focus-within:ring-1 focus-within:ring-brand-500/40"
            onKeyDown={(event) => {
              if (event.key === 'Backspace' || event.key === 'Delete') {
                event.stopPropagation()
              }
            }}
          >
            <CodeEditor
              id={`${editorId}-inline`}
              language="javascript"
              value={typeof value === 'string' ? value : String(value ?? '')}
              onInputChange={(nextValue) =>
                onChange({ [field.key]: nextValue ?? '' })
              }
              autofocus={false}
              className="h-[18px] w-full"
              hideLineNumbers
              highlightOnlyFx={false}
              options={{
                minimap: { enabled: false },
                wordWrap: 'off',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                quickSuggestions: false,
                suggestOnTriggerCharacters: false,
                wordBasedSuggestions: 'off',
                tabCompletion: 'on',
                fontSize: 12,
                lineHeight: 18,
                lineNumbers: 'off',
                glyphMargin: false,
                lineNumbersMinChars: 0,
                lineDecorationsWidth: 4,
                folding: false,
                renderLineHighlight: 'none',
                overviewRulerLanes: 0,
                hideCursorInOverviewRuler: true,
                overviewRulerBorder: false,
                scrollbar: {
                  vertical: 'hidden',
                  horizontal: 'hidden',
                  verticalScrollbarSize: 0,
                  horizontalScrollbarSize: 0,
                },
                padding: { top: 0, bottom: 0 },
              }}
              extraLibs={fxEditorLibs}
              disableTopPadding
              insertNewlineOnCtrlEnter
              autoTriggerSuggestions
                completionWords={fxCompletionWords}
                completionMetadata={fxCompletionMetadata}
                customSuggestions={customSuggestions}
              />
            </div>
          )
        }

      return (
        <div className="flex items-center justify-end">
          <div className="flex items-center gap-2">
            {showToggle && (
              <div className="pointer-events-none opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100">
                <FxToggleButton active={false} onClick={() => onToggleFxMode?.(field, value)} />
              </div>
            )}
            {control}
          </div>
        </div>
      )
    }

    if (isFxActive) {
      const showToggleInline = Boolean(onToggleFxMode)
      return (
        <div className={`flex items-center ${showToggleInline ? 'gap-2' : ''}`}>
          {showToggleInline && (
            <FxToggleButton
              active
              onClick={() => onToggleFxMode?.(field, value)}
            />
          )}
          <div className={`${showToggleInline ? 'min-w-0 flex-1' : 'w-full'}`}>
            <InlineFxControl
              control={
                <div
                  className="flex h-6 w-full items-center overflow-hidden rounded-md border border-foreground-muted/30 bg-surface-100 focus-within:border-brand-500 focus-within:ring-1 focus-within:ring-brand-500/40"
                  onKeyDown={(event) => {
                    if (event.key === 'Backspace' || event.key === 'Delete') {
                      event.stopPropagation()
                    }
                  }}
                >
                  <CodeEditor
                    id={`${editorId}-inline`}
                    language="javascript"
                    value={typeof value === 'string' ? value : String(value ?? '')}
                    onInputChange={(nextValue) =>
                      onChange({ [field.key]: nextValue ?? '' })
                    }
                    autofocus={false}
                    className="h-[18px] w-full"
                    hideLineNumbers
                    highlightOnlyFx={false}
                    options={{
                      minimap: { enabled: false },
                      wordWrap: 'off',
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                      quickSuggestions: false,
                      suggestOnTriggerCharacters: false,
                      wordBasedSuggestions: 'off',
                      tabCompletion: 'on',
                      fontSize: 12,
                      lineHeight: 18,
                      lineNumbers: 'off',
                      glyphMargin: false,
                      lineNumbersMinChars: 0,
                      lineDecorationsWidth: 4,
                      folding: false,
                      renderLineHighlight: 'none',
                      overviewRulerLanes: 0,
                      hideCursorInOverviewRuler: true,
                      overviewRulerBorder: false,
                      scrollbar: {
                        vertical: 'hidden',
                        horizontal: 'hidden',
                        verticalScrollbarSize: 0,
                        horizontalScrollbarSize: 0,
                      },
                      padding: { top: 0, bottom: 0 },
                    }}
                    extraLibs={fxEditorLibs}
                    disableTopPadding
                    insertNewlineOnCtrlEnter
                    autoTriggerSuggestions
                    completionWords={fxCompletionWords}
                    completionMetadata={fxCompletionMetadata}
                    customSuggestions={{ enabled: true, context: fxEvalContext }}
                  />
                </div>
              }
              isFxEnabled={isFxActive}
              isMultiline={false}
              onFxClick={onFxClick}
              ariaLabel={`Open FX editor for ${field.label}`}
              helper={hintExpression}
            />
          </div>
        </div>
      )
    }

    const swapOrder = ['showClearButton', 'labelHide', 'labelWrap'].includes(field.key)
    return (
      <div
        className={`flex items-center gap-2 ${
          swapOrder ? 'justify-end' : 'justify-between'
        }`}
      >
        {swapOrder ? (
          <>
            <FxToggleButton
              active={false}
              onClick={() => onToggleFxMode?.(field, value)}
            />
            {control}
          </>
        ) : (
          <>
            {control}
            <FxToggleButton
              active={false}
              onClick={() => onToggleFxMode?.(field, value)}
            />
          </>
        )}
      </div>
    )
  }

  if (field.type === 'select') {
    if (isFxActive) {
      return (
        <div
          className="flex h-6 w-full items-center overflow-hidden rounded-md border border-foreground-muted/30 bg-surface-100 focus-within:border-brand-500 focus-within:ring-1 focus-within:ring-brand-500/40"
          onKeyDown={(event) => {
            if (event.key === 'Backspace' || event.key === 'Delete') {
              event.stopPropagation()
            }
          }}
        >
          <CodeEditor
            id={`${editorId}-inline`}
            language="javascript"
            value={typeof value === 'string' ? value : String(value ?? '')}
            onInputChange={(nextValue) =>
              onChange({ [field.key]: nextValue ?? '' })
            }
            autofocus={false}
            className="h-[18px] w-full"
            hideLineNumbers
            highlightOnlyFx={false}
            options={{
              minimap: { enabled: false },
              wordWrap: 'off',
              scrollBeyondLastLine: false,
              automaticLayout: true,
              quickSuggestions: false,
              suggestOnTriggerCharacters: false,
              wordBasedSuggestions: 'off',
              tabCompletion: 'on',
              fontSize: 12,
              lineHeight: 18,
              lineNumbers: 'off',
              glyphMargin: false,
              lineNumbersMinChars: 0,
              lineDecorationsWidth: 4,
              folding: false,
              renderLineHighlight: 'none',
              overviewRulerLanes: 0,
              hideCursorInOverviewRuler: true,
              overviewRulerBorder: false,
              scrollbar: {
                vertical: 'hidden',
                horizontal: 'hidden',
                verticalScrollbarSize: 0,
                horizontalScrollbarSize: 0,
              },
              padding: { top: 0, bottom: 0 },
            }}
            extraLibs={fxEditorLibs}
            disableTopPadding
            insertNewlineOnCtrlEnter
            autoTriggerSuggestions
            completionWords={fxCompletionWords}
            completionMetadata={fxCompletionMetadata}
            customSuggestions={customSuggestions}
          />
        </div>
      )
    }

    return control
  }

  if (isInlineCodeEditorField) {
    const isExpandedEditor = typeof value === 'string' && value.includes('\n')
    return (
      <InlineFxControl
        control={
          <div
            className={`overflow-hidden rounded-md border border-foreground-muted/30 bg-surface-100 focus-within:border-brand-500 focus-within:ring-1 focus-within:ring-brand-500/40 ${
              isExpandedEditor ? 'h-[84px]' : 'flex h-6 items-center'
            }`}
            onKeyDown={(event) => {
              if (event.key === 'Backspace' || event.key === 'Delete') {
                event.stopPropagation()
              }
            }}
          >
            <CodeEditor
              id={`${editorId}-inline`}
              language="javascript"
              value={typeof value === 'string' ? value : String(value ?? '')}
              onInputChange={(nextValue) =>
                onChange({ [field.key]: nextValue ?? '' })
              }
              onContentSizeChange={(metrics) =>
                onInlineEditorSize?.(field.key, metrics)
              }
              autofocus={false}
              className={isExpandedEditor ? 'h-full' : 'h-[18px] w-full'}
              hideLineNumbers
              highlightOnlyFx
              options={{
                minimap: { enabled: false },
                wordWrap: isExpandedEditor ? 'on' : 'off',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                quickSuggestions: false,
                suggestOnTriggerCharacters: false,
                wordBasedSuggestions: 'off',
                tabCompletion: 'on',
                fontSize: 12,
                lineHeight: 18,
                lineNumbers: 'off',
                glyphMargin: false,
                lineNumbersMinChars: 0,
                lineDecorationsWidth: 4,
                folding: false,
                renderLineHighlight: 'none',
                overviewRulerLanes: 0,
                hideCursorInOverviewRuler: true,
                overviewRulerBorder: false,
                scrollbar: {
                  vertical: 'hidden',
                  horizontal: 'hidden',
                  verticalScrollbarSize: 0,
                  horizontalScrollbarSize: 0,
                },
                padding: { top: 0, bottom: 0 },
              }}
              extraLibs={fxEditorLibs}
              disableTopPadding
              insertNewlineOnCtrlEnter
              autoTriggerSuggestions
                completionWords={fxCompletionWords}
                completionMetadata={fxCompletionMetadata}
                customSuggestions={customSuggestions}
              />
            </div>
          }
        isFxEnabled={isFxActive}
        isMultiline={false}
        onFxClick={onFxClick}
        ariaLabel={`Open FX editor for ${field.label}`}
        helper={hintTemplate}
      />
    )
  }

  if (useInlineFx) {
    return (
      <InlineFxControl
        control={inlineControl ?? control}
        isFxEnabled={isFxEnabled}
        isMultiline={isMultiline}
        onFxClick={onFxClick}
        ariaLabel={`Open FX editor for ${field.label}`}
      />
    )
  }

  return (
    <div className={`flex gap-2 ${isMultiline ? 'items-start' : 'items-center'}`}>
      <div className="min-w-0 flex-1">
        {control}
      </div>
      <div className={isMultiline ? 'mt-1' : ''}>
        <FxToggleButton active={isFxEnabled} onClick={onFxClick} />
      </div>
    </div>
  )
}
