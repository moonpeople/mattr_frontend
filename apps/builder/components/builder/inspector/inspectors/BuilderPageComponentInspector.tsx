/**
 * Инспектор main-компонента страницы: настройки page main области.
 */
import { useMemo, useState } from 'react'

import type { WidgetField } from 'widgets/runtime'
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input_Shadcn_,
  Separator,
  Switch,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'

import type { BuilderPage, BuilderPageLayout } from '../../types'
import CodeEditor from 'components/ui/CodeEditor/CodeEditor'
import {
  FX_BASE_CONTEXT,
  FxInput,
  buildCompletionMetadata,
  buildFxEditorLibs,
} from '../../components'
import { InspectorEmptyState } from '../shared'

// Inspektor page component: fon, padding, expand-to-fit.

interface BuilderPageComponentInspectorProps {
  page: BuilderPage | null
  onUpdateComponent: (patch: Partial<BuilderPageLayout['main']>) => void
}

type BuilderPageComponentInspectorContentProps = {
  page: BuilderPage
  onUpdateComponent: (patch: Partial<BuilderPageLayout['main']>) => void
}

const PADDING_FX_FIELD: WidgetField = {
  key: 'paddingFx',
  label: 'Padding',
  type: 'text',
  supportsFx: true,
  valueType: ['string', 'void'],
}

const DEFAULT_PAGE_PADDING = '8px 12px'

const SegmentedControl = ({
  value,
  options,
  onChange,
  disabled = false,
}: {
  value: string
  options: { label: string; value: string }[]
  onChange: (next: string) => void
  disabled?: boolean
}) => {
  return (
    <div
      className={`flex items-center rounded-md border border-foreground-muted/30 bg-surface-100 p-0.5 ${
        disabled ? 'pointer-events-none opacity-60' : ''
      }`}
      role="radiogroup"
    >
      {options.map((option) => {
        const isActive = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            className={`flex-1 rounded-sm px-2 h-5 flex items-center justify-center text-[11px] font-medium transition-colors box-border ${
              isActive
                ? 'border border-foreground-muted/30 bg-background text-foreground shadow-sm'
                : 'border border-transparent text-foreground-muted hover:text-foreground'
            }`}
            aria-pressed={isActive}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

const BuilderPageComponentInspectorContent = ({
  page,
  onUpdateComponent,
}: BuilderPageComponentInspectorContentProps) => {
  // Defolt dlya nastroyek komponenta stranitsy.
  const component = page.pageLayout.main ?? {
    expandToFit: false,
    background: '',
    paddingMode: 'normal',
    paddingFxEnabled: false,
    paddingFx: '',
  }
  const [fxEditorOpen, setFxEditorOpen] = useState(false)
  const fxEvalContext = useMemo(() => {
    return {
      ...FX_BASE_CONTEXT,
      retoolContext: {
        ...FX_BASE_CONTEXT.retoolContext,
        currentPage: page.name ?? '',
        pages: [page.name ?? ''],
      },
    }
  }, [page.name])
  const fxCompletionMetadata = useMemo(
    () => buildCompletionMetadata(fxEvalContext),
    [fxEvalContext]
  )
  const fxCompletionWords = useMemo(() => {
    return Object.keys(fxCompletionMetadata).sort()
  }, [fxCompletionMetadata])
  const fxEditorLibs = useMemo(
    () =>
      buildFxEditorLibs({
        widgetIds: [],
        queryNames: [],
        scriptNames: [],
        stateKeys: [],
      }),
    []
  )
  const handlePaddingFxToggle = (checked: boolean) => {
    if (checked) {
      const existingValue = component.paddingFx ?? ''
      const defaultValue =
        component.paddingMode === 'none' ? '' : DEFAULT_PAGE_PADDING
      onUpdateComponent({
        paddingFxEnabled: true,
        paddingFx: existingValue.trim().length > 0 ? existingValue : defaultValue,
      })
      return
    }
    onUpdateComponent({ paddingFxEnabled: false })
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="px-4 py-3">
        <div className="text-xs font-semibold">{page.name} Main</div>
        <div className="text-[11px] text-foreground-muted">Page component</div>
      </div>
      <Separator />
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-3">
        <div className="space-y-2">
          <div className="text-[11px] uppercase text-foreground-muted">Appearance</div>
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs text-foreground-muted">Expand content to fit</div>
            <Switch
              checked={Boolean(component.expandToFit)}
              onCheckedChange={(checked) => onUpdateComponent({ expandToFit: checked })}
              size="small"
            />
          </div>
          <div className="space-y-2">
            <div className="text-xs text-foreground-muted">Background</div>
            <Input_Shadcn_
              value={component.background ?? ''}
              onChange={(event) => onUpdateComponent({ background: event.target.value })}
              placeholder="#F6F6F6"
              className="h-7"
            />
          </div>
        </div>
        <Separator />
        <div className="space-y-2">
          <div className="text-[11px] uppercase text-foreground-muted">Spacing</div>
          <div className="flex items-center justify-between gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="cursor-help text-xs text-foreground-muted underline decoration-dotted underline-offset-4">
                  Padding
                </span>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs space-y-2 text-xs leading-relaxed">
                <div>Controls the padding between the container and its contents.</div>
                <div>
                  In fx mode, padding follows the CSS shorthand convention (top
                  right bottom left). Padding should be defined in pixels, and top
                  and bottom padding should add up to a multiple of 8px to ensure
                  proper alignment in the layout.
                </div>
                <div className="text-[10px] uppercase text-foreground-muted">Example</div>
                <div className="rounded-md bg-surface-200/60 px-2 py-1 font-mono text-[11px] text-foreground">
                  12px 8px
                </div>
              </TooltipContent>
            </Tooltip>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className={`rounded px-1.5 text-[10px] font-semibold uppercase transition-colors ${
                  component.paddingFxEnabled
                    ? 'bg-foreground/10 text-foreground'
                    : 'text-foreground-muted hover:bg-foreground/10 hover:text-foreground'
                }`}
                onClick={() => handlePaddingFxToggle(!component.paddingFxEnabled)}
              >
                fx
              </button>
              {component.paddingFxEnabled ? (
                <div className="min-w-[220px]">
                  <FxInput
                    field={PADDING_FX_FIELD}
                    value={component.paddingFx ?? ''}
                    editorId={`page-component-${page.id}-padding`}
                    control={null}
                    isFxEnabled
                    isFxActive
                    isInlineCodeEditorField
                    useInlineFx={false}
                    isMultiline={false}
                    onChange={(patch) =>
                      onUpdateComponent(patch as Partial<BuilderPageLayout['main']>)
                    }
                    onFxClick={() => setFxEditorOpen(true)}
                    fxEditorLibs={fxEditorLibs}
                    fxEvalContext={fxEvalContext}
                    fxCompletionWords={fxCompletionWords}
                    fxCompletionMetadata={fxCompletionMetadata}
                  />
                </div>
              ) : (
                <div className="min-w-[220px]">
                  <SegmentedControl
                    value={component.paddingMode ?? 'normal'}
                    options={[
                      { label: 'Normal', value: 'normal' },
                      { label: 'None', value: 'none' },
                    ]}
                    onChange={(value) =>
                      onUpdateComponent({ paddingMode: value as 'normal' | 'none' })
                    }
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Dialog open={fxEditorOpen} onOpenChange={(open) => !open && setFxEditorOpen(false)}>
        <DialogContent size="large" className="overflow-hidden p-0">
          <DialogHeader className="border-b" padding="small">
            <DialogTitle>FX · Padding</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 px-4 py-3">
            <div className="h-[260px] overflow-hidden rounded-md border border-foreground-muted/30 bg-surface-100">
              <CodeEditor
                id={`page-component-${page.id}-padding-modal`}
                language="javascript"
                value={component.paddingFx ?? ''}
                onInputChange={(nextValue) =>
                  onUpdateComponent({ paddingFx: nextValue ?? '' })
                }
                autofocus={false}
                className="h-full"
                hideLineNumbers
                highlightOnlyFx
                options={{
                  minimap: { enabled: false },
                  wordWrap: 'on',
                  scrollBeyondLastLine: false,
                  quickSuggestions: false,
                  suggestOnTriggerCharacters: false,
                  wordBasedSuggestions: 'off',
                  tabCompletion: 'on',
                  lineHeight: 18,
                }}
                extraLibs={fxEditorLibs}
                autoTriggerSuggestions
                completionWords={fxCompletionWords}
                completionMetadata={fxCompletionMetadata}
                customSuggestions={{ enabled: true, context: fxEvalContext }}
              />
            </div>
            <div className="text-[11px] text-foreground-muted">
              Use {'{{ }}'} to reference data and run expressions.
            </div>
          </div>
          <DialogFooter padding="small">
            <Button type="default" onClick={() => setFxEditorOpen(false)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export const BuilderPageComponentInspector = ({
  page,
  onUpdateComponent,
}: BuilderPageComponentInspectorProps) => {
  if (!page) {
    return (
      <InspectorEmptyState
        title="Select a page"
        description="Choose a page to configure its canvas settings."
      />
    )
  }

  return (
    <BuilderPageComponentInspectorContent
      page={page}
      onUpdateComponent={onUpdateComponent}
    />
  )
}
