/**
 * Обертка карточки canvas: рендерит один виджет с выделением, quick-add и drag-элементами.
 */
import {
  useRef,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from 'react'
import { type Layout } from 'react-grid-layout'
import { Database, GripVertical, Plus } from 'lucide-react'
import type { WidgetDefinition } from 'widgets/runtime'
import { cn } from 'ui'
import { resolveValue } from 'lib/builder/value-resolver'

import type { BuilderWidgetInstance } from '../../types'
import {
  resolveSpacingPadding,
  resolveWidgetSpacingModes,
} from '../../types'
import { buildSelfContext } from '../../self-context'
import { resolveWidgetStyleScopeVars } from '../../widgetStyleOverrides'
import {
  CANVAS_STATE_KEYS,
  CANVAS_VALUE_WIDGET_TYPES,
  CONNECT_DATA_WIDGET_TYPES,
  DRAG_HANDLE_SELECTOR,
  DRAG_HOLD_DELAY_MS,
  INTERACTIVE_TARGET_SELECTOR,
  parseBoolean,
  resolveShowInEditor,
  shouldPlaceBadgeBelow,
} from '../shared'
import { useCanvasCardAutoHeight } from '../hooks/useCanvasCardAutoHeight'
import { useCanvasCardPressToDrag } from '../hooks/useCanvasCardPressToDrag'

export const CanvasCard = ({
  widget,
  definition,
  isSelected,
  onSelect,
  onQuickAdd,
  enableQuickAddControls = true,
  dropIndicator,
  layout,
  gridRowHeight,
  gridMargin,
  onAutoHeight,
  childContent,
  renderChildContent,
  depth,
  onRunActions,
  evaluationContext,
  onOpenInspectorPanel,
  showQuickAdd,
  quickAddPosition,
  quickAddContent,
  iconLibrary,
  onUpdateWidgetProps,
}: {
  widget: BuilderWidgetInstance
  definition: WidgetDefinition
  isSelected: boolean
  onSelect: () => void
  onQuickAdd: (position: 'above' | 'below') => void
  enableQuickAddControls?: boolean
  dropIndicator?: 'above' | 'below'
  layout: Layout
  gridRowHeight: number
  gridMargin: number
  onAutoHeight: (nextHeight: number) => void
  childContent: ReactNode
  renderChildContent?: (params?: { slot?: string; includeUnassigned?: boolean }) => ReactNode
  depth: number
  onRunActions?: (eventName: string, payload?: Record<string, unknown>) => void
  evaluationContext?: Record<string, unknown>
  onOpenInspectorPanel?: (widgetId: string, panel: { key: string; label: string }) => void
  showQuickAdd: boolean
  quickAddPosition?: 'above' | 'below'
  quickAddContent?: ReactNode
  iconLibrary?: string
  onUpdateWidgetProps?: (widgetId: string, patch: Record<string, unknown>) => void
}) => {
  const contentRef = useRef<HTMLDivElement | null>(null)
  const spacing = resolveWidgetSpacingModes(widget.type, widget.spacing, (expression) =>
    resolveValue(expression, {})
  )
  const fillHeight =
    (widget.type === 'JsonEditor' && spacing.heightMode === 'fixed') ||
    widget.type === 'Sidebar'
  const isHidden = parseBoolean(resolveValue(widget.hidden, evaluationContext ?? {}), false)
  const showInEditor = resolveShowInEditor(widget, evaluationContext)
  const hideInEditor = isHidden && !showInEditor

  useCanvasCardAutoHeight({
    enabled: spacing.heightMode === 'auto',
    contentRef,
    layoutHeight: layout.h,
    gridRowHeight,
    gridMargin,
    onAutoHeight,
  })

  const { handlePressStart, handlePressMove, handlePressEnd } = useCanvasCardPressToDrag({
    dragHandleSelector: DRAG_HANDLE_SELECTOR,
    interactiveTargetSelector: INTERACTIVE_TARGET_SELECTOR,
    holdDelayMs: DRAG_HOLD_DELAY_MS,
  })

  const childPreview =
    childContent && !definition.supportsChildren ? (
      <div
        className={cn('mt-3 p-2', depth > 0 ? 'bg-surface-200/50' : 'bg-surface-100')}
      >
        {childContent}
      </div>
    ) : null
  const showConnectData = isSelected && CONNECT_DATA_WIDGET_TYPES.has(definition.type)
  const marginPadding = resolveSpacingPadding(spacing, (expression) =>
    resolveValue(expression, {})
  )

  return (
    <div
      role="button"
      tabIndex={0}
      data-builder-widget-id={widget.id}
      onClick={(event) => {
        event.stopPropagation()
        onSelect()
      }}
      onMouseDown={handlePressStart}
      onMouseMove={handlePressMove}
      onMouseUp={handlePressEnd}
      onMouseLeave={handlePressEnd}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onSelect()
        }
      }}
      className={cn(
        'builder-chrome group relative h-full w-full cursor-grab transition',
        hideInEditor ? 'hidden' : null,
        !hideInEditor && isHidden ? 'opacity-60' : null
      )}
    >
      {isSelected && (
        <span className="pointer-events-none absolute inset-0 border border-dashed border-brand-500" />
      )}
      {dropIndicator && (
        <span
          className={cn(
            'pointer-events-none absolute left-0 right-0 z-20 h-0.5 bg-brand-500',
            dropIndicator === 'above' ? '-top-px' : '-bottom-px'
          )}
        />
      )}
      {isSelected && (
        <>
          {enableQuickAddControls && (
            <>
              <button
                type="button"
                className="absolute left-1/2 top-0 flex h-4 w-4 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-brand-600 text-white shadow-md transition hover:bg-brand-500"
                onClick={(event) => {
                  event.stopPropagation()
                  onQuickAdd('above')
                }}
              >
                <Plus size={12} />
              </button>
              <button
                type="button"
                className="absolute left-1/2 bottom-0 flex h-4 w-4 -translate-x-1/2 translate-y-1/2 items-center justify-center rounded-full bg-brand-600 text-white shadow-md transition hover:bg-brand-500"
                onClick={(event) => {
                  event.stopPropagation()
                  onQuickAdd('below')
                }}
              >
                <Plus size={12} />
              </button>
            </>
          )}
          <div
            className={cn(
              'absolute left-0 flex items-center gap-1',
              shouldPlaceBadgeBelow(widget) ? '-bottom-4' : '-top-4'
            )}
          >
            <div className="builder-drag-handle flex h-4 items-center gap-1 rounded-sm bg-brand-500 pr-2 text-[9px] font-medium text-white shadow-sm">
              <GripVertical className="h-3 w-3 text-white/80" />
              <span className=" flex">{widget.id}</span>
            </div>
            {showConnectData && (
              <span className="flex items-center gap-1 rounded-md bg-emerald-500 px-2 py-1 text-xs font-semibold text-white shadow-sm">
                <Database className="h-3 w-3 text-white/80" />
                <span>Connect data</span>
              </span>
            )}
          </div>
        </>
      )}
      <div
        ref={contentRef}
        style={{ padding: marginPadding }}
        className={cn(fillHeight ? 'h-full' : null)}
      >
        <div className={cn('builder-app-theme-scope', fillHeight ? 'h-full' : null)}>
          <div
            className={cn('app-theme-scope', fillHeight ? 'h-full' : null)}
            style={resolveWidgetStyleScopeVars(widget.props)}
          >
            {(() => {
              const canvasSetState =
                onUpdateWidgetProps && CANVAS_VALUE_WIDGET_TYPES.has(widget.type)
                  ? (patch: Record<string, unknown>) => {
                      const filtered = Object.fromEntries(
                        Object.entries(patch).filter(([key]) => CANVAS_STATE_KEYS.has(key))
                      )
                      if (Object.keys(filtered).length === 0) {
                        return
                      }
                      onUpdateWidgetProps(widget.id, filtered)
                    }
                  : undefined
              try {
                const renderWidget = (
                  props: Record<string, unknown>,
                  context: Parameters<typeof definition.render>[1]
                ) => definition.render(props, context)
                return renderWidget(widget.props, {
                  mode: 'canvas',
                  widgetId: widget.id,
                  iconLibrary,
                  runActions: onRunActions,
                  setState: canvasSetState,
                  evaluationContext: {
                    ...(evaluationContext ?? {}),
                    self: buildSelfContext({
                      widget,
                      definition,
                      spacing: resolveWidgetSpacingModes(
                        widget.type,
                        widget.spacing,
                        evaluationContext
                          ? (expression) => resolveValue(expression, evaluationContext)
                          : undefined
                      ),
                      widgetValues:
                        (evaluationContext as Record<string, unknown> | undefined)?.widgets as
                          | Record<string, Record<string, unknown>>
                          | undefined,
                    }),
                  },
                  openInspectorPanel: onOpenInspectorPanel
                    ? (panel) => onOpenInspectorPanel(widget.id, panel)
                    : undefined,
                  children: childContent,
                  renderChildren: renderChildContent,
                })
              } catch (error) {
                const message =
                  error instanceof Error
                    ? error.message
                    : typeof error === 'string'
                      ? error
                      : 'Unknown render error'
                return (
                  <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                    Widget render error: {definition.type}
                    <div className="mt-1 text-[11px] text-destructive/80">{message}</div>
                  </div>
                )
              }
            })()}
          </div>
          {childPreview}
        </div>
      </div>
      {showQuickAdd && quickAddContent && (
        <div
          className={cn(
            'absolute left-1/2 z-50 w-72 -translate-x-1/2',
            quickAddPosition === 'above' ? 'bottom-full mb-3' : 'top-full mt-3'
          )}
          onClick={(event) => event.stopPropagation()}
        >
          {quickAddContent}
        </div>
      )}
    </div>
  )
}
