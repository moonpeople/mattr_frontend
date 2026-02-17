/**
 * Рендер runtime-дерева виджетов: строит вложенное дерево UI-компонентов из builder schema.
 */
import type { CSSProperties, ReactNode } from 'react'
import RGL, { WidthProvider } from 'react-grid-layout'

import { getWidgetDefinition } from 'widgets/runtime'

import { evaluateCondition } from 'lib/builder/expressions'
import { resolveValue } from 'lib/builder/value-resolver'

import type { BuilderWidgetInstance } from '../types'
import { resolveSpacingPadding, resolveWidgetSpacingModes } from '../types'
import { buildSelfContext } from '../self-context'
import { resolveWidgetStyleScopeVars } from '../widgetStyleOverrides'

import { GRID_COLUMNS, isWidgetVisible, normalizeLayout, parseBoolean } from './utils'

const ReactGridLayout = WidthProvider(RGL)

export type RenderWidgetTreeOptions = {
  widgets: BuilderWidgetInstance[]
  depth?: number
  gridRowHeight: number
  gridMargin: number
  activePolicies: Record<string, boolean>
  runtimeContext: Record<string, unknown>
  widgetState: Record<string, Record<string, unknown>>
  onUpdateState: (widgetId: string, patch: Record<string, unknown>) => void
  onRunActions: (widget: BuilderWidgetInstance, eventName: string, payload?: Record<string, unknown>) => void
  chrome?: boolean
  iconLibrary?: string
}

const normalizeSlotValue = (value: unknown) => {
  if (typeof value !== 'string') {
    return ''
  }
  return value.trim().toLowerCase()
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)

const renderWidgetItems = (
  widgets: BuilderWidgetInstance[],
  depth: number,
  options: RenderWidgetTreeOptions
): JSX.Element[] => {
  const {
    activePolicies,
    runtimeContext,
    widgetState,
    onUpdateState,
    onRunActions,
    iconLibrary,
    chrome = true,
  } = options

  return widgets.flatMap((widget) => {
    const definition = getWidgetDefinition(widget.type)
    if (!definition) {
      return [
        <div
          key={widget.id}
          className="rounded-md border border-dashed border-foreground-muted/40 bg-surface-100 px-4 py-6 text-sm text-foreground-muted"
        >
          Unknown widget: {widget.type}
        </div>,
      ]
    }

    const rawProps = {
      ...(definition.defaultProps ?? {}),
      ...(widget.props ?? {}),
      ...(widgetState[widget.id] ?? {}),
    }
    const widgetValues = (runtimeContext.widgets ?? {}) as Record<string, Record<string, unknown>>
    const baseSpacing = resolveWidgetSpacingModes(widget.type, widget.spacing)
    const spacingTempContext = {
      ...runtimeContext,
      self: buildSelfContext({
        widget,
        definition,
        spacing: baseSpacing,
        widgetValues,
      }),
    }
    const spacing = resolveWidgetSpacingModes(widget.type, widget.spacing, (expression) =>
      resolveValue(expression, spacingTempContext)
    )
    const widgetContext = {
      ...runtimeContext,
      self: buildSelfContext({
        widget,
        definition,
        spacing,
        widgetValues,
      }),
    }

    const resolvedProps = resolveValue(rawProps, widgetContext)
    const resolvedPropsRecord = isRecord(resolvedProps) ? resolvedProps : undefined
    const fillHeight =
      (widget.type === 'JsonEditor' && spacing.heightMode === 'fixed') ||
      widget.type === 'Sidebar'
    const maintainSpaceWhenHidden = parseBoolean(
      resolvedPropsRecord?.maintainSpaceWhenHidden ?? widget.props?.maintainSpaceWhenHidden
    )
    if (
      !isWidgetVisible(widget, activePolicies, widgetContext, widgetState, {
        includeHidden: maintainSpaceWhenHidden,
      })
    ) {
      return []
    }
    const disabledOverride = widgetState[widget.id]?.disabled
    const isDisabled =
      typeof disabledOverride === 'boolean'
        ? disabledOverride
        : evaluateCondition(widget.disabledWhen, activePolicies) === true
    const paddingValue = resolveSpacingPadding(spacing, (expression) =>
      resolveValue(expression, widgetContext)
    )
    const contentPaddingValue = resolveSpacingPadding(
      spacing,
      (expression) => resolveValue(expression, widgetContext),
      'padding'
    )
    const widgetStyleScopeVars = resolveWidgetStyleScopeVars(resolvedPropsRecord)
    const widgetContentStyle: CSSProperties | undefined =
      widget.type === 'Sidebar'
        ? {
            ...(widgetStyleScopeVars ?? {}),
            padding: contentPaddingValue,
          }
        : widgetStyleScopeVars
    const hiddenOverride = widgetState[widget.id]?.hidden
    const baseHidden = parseBoolean(resolveValue(widget.hidden, widgetContext), false)
    const isHidden = parseBoolean(hiddenOverride, baseHidden)
    const hiddenClass =
      isHidden && maintainSpaceWhenHidden ? 'invisible pointer-events-none' : ''

    const childWidgets = widget.children ?? []
    const renderChildren = (params?: { slot?: string; includeUnassigned?: boolean }) => {
      if (childWidgets.length === 0) {
        return undefined
      }
      const requestedSlot = normalizeSlotValue(params?.slot)
      const includeUnassigned = params?.includeUnassigned === true
      const filteredChildren = requestedSlot
        ? childWidgets.filter((child) => {
            const childSlot = normalizeSlotValue((child.props as Record<string, unknown> | undefined)?.containerSlot)
            if (childSlot === requestedSlot) {
              return true
            }
            return includeUnassigned ? childSlot.length === 0 : false
          })
        : childWidgets
      if (filteredChildren.length === 0) {
        return undefined
      }
      return chrome ? (
        <div
          className={
            depth > 0
              ? 'mt-3 rounded-md border border-dashed border-foreground-muted/40 p-3'
              : 'mt-4 rounded-md border border-dashed border-foreground-muted/40 p-3'
          }
        >
          {renderWidgetTreeInternal(filteredChildren, depth + 1, options)}
        </div>
      ) : (
        renderWidgetTreeInternal(filteredChildren, depth + 1, options)
      )
    }
    const childContent = renderChildren()

    let content: ReactNode
    try {
      content = definition.render((resolvedPropsRecord ?? {}) as Record<string, unknown>, {
        mode: 'preview',
        widgetId: widget.id,
        iconLibrary,
        state: widgetState[widget.id],
        setState: (patch) => onUpdateState(widget.id, patch),
        runActions: (eventName, payload) => onRunActions(widget, eventName, payload),
        evaluationContext: widgetContext,
        children: childContent,
        renderChildren,
      })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : typeof error === 'string' ? error : 'Unknown render error'
      content = (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          Widget render error: {definition.type}
          <div className="mt-1 text-[11px] text-destructive/80">{message}</div>
        </div>
      )
    }

    if (!chrome) {
      return [
        <div
          key={widget.id}
          data-builder-preview-widget-id={widget.id}
          style={{ padding: paddingValue }}
          className={`${fillHeight ? 'h-full' : ''} ${isDisabled ? 'pointer-events-none opacity-60' : ''} ${hiddenClass}`}
        >
          <div
            className={`${fillHeight ? 'app-theme-scope h-full' : 'app-theme-scope'}`}
            style={widgetContentStyle}
          >
            {content}
          </div>
        </div>,
      ]
    }

    return [
      <div
        key={widget.id}
        data-builder-preview-widget-id={widget.id}
        style={{ padding: paddingValue }}
        className={`rounded-md border border-foreground-muted/30 bg-surface-100 shadow-sm ${
          isDisabled ? 'pointer-events-none opacity-60' : ''
        } ${depth > 0 ? 'bg-surface-100/70' : ''} ${hiddenClass} ${fillHeight ? 'flex h-full flex-col' : ''}`}
      >
        <div
          className={
            depth > 0
              ? 'text-[10px] uppercase text-foreground-muted'
              : 'text-xs uppercase text-foreground-muted'
          }
        >
          {definition.label}
        </div>
        <div
          className={
            fillHeight
              ? `min-h-0 flex-1 ${depth > 0 ? 'mt-2' : 'mt-3'}`
              : depth > 0
                ? 'mt-2'
                : 'mt-3'
          }
        >
          <div
            className={`${fillHeight ? 'app-theme-scope h-full' : 'app-theme-scope'}`}
            style={widgetContentStyle}
          >
            {content}
          </div>
        </div>
      </div>,
    ]
  })
}

const renderWidgetTreeInternal = (
  widgets: BuilderWidgetInstance[],
  depth: number,
  options: RenderWidgetTreeOptions
): ReactNode => {
  const { activePolicies, runtimeContext, widgetState, gridRowHeight, gridMargin } = options
  const visibleWidgets = widgets.filter((widget) =>
    isWidgetVisible(widget, activePolicies, runtimeContext, widgetState, {
      includeHidden: parseBoolean(widget.props?.maintainSpaceWhenHidden),
    })
  )
  if (visibleWidgets.length === 0) {
    return null
  }

  const layout = visibleWidgets.map((widget, index) => normalizeLayout(widget, index))
  const marginValue = depth > 0 ? Math.max(4, Math.round(gridMargin / 2)) : gridMargin
  const margin: [number, number] = [marginValue, marginValue]
  const items = renderWidgetItems(visibleWidgets, depth, options)
  if (items.length === 0) {
    return null
  }

  return (
    <ReactGridLayout
      layout={layout}
      cols={GRID_COLUMNS}
      rowHeight={gridRowHeight}
      margin={margin}
      containerPadding={[0, 0]}
      compactType={null}
      isDraggable={false}
      isResizable={false}
    >
      {items}
    </ReactGridLayout>
  )
}

export const renderWidgetTree = (options: RenderWidgetTreeOptions): ReactNode =>
  renderWidgetTreeInternal(options.widgets, options.depth ?? 0, options)
