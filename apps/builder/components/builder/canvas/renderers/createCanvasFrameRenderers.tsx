/**
 * Фабрика рендереров, создающая frame/overlay render callbacks для canvas.
 */
import { type CSSProperties, type ReactNode } from 'react'
import { X } from 'lucide-react'
import type { Layout } from 'react-grid-layout'
import { buildSidebarThemeVars, resolveSidebarPanelConfig } from 'widgets/runtime'
import { cn } from 'ui'

import type { BuilderWidgetAddOptions, BuilderWidgetInstance } from '../../types'
import {
  getGlobalFrameBackgroundClass,
  getGlobalFramePaddingClass,
  GRID_COLUMNS,
} from '../shared'
import {
  resolveFrameGridOptions,
  resolveGlobalFrameContext,
  resolveOverlayFrameContext,
  selectFrameSlotChildren,
  type CanvasFrameVariant,
} from './frameRendererHelpers'

export type { CanvasFrameVariant } from './frameRendererHelpers'

type RenderGlobalGrid = (
  items: BuilderWidgetInstance[],
  parentId: string,
  minHeightClass?: string,
  options?: {
    onUpdateChildLayout?: (parentId: string, layout: Layout[]) => void
    onDropWidget?: (
      widgetType: string,
      layout: Layout,
      parentId: string,
      options?: BuilderWidgetAddOptions
    ) => void
    onUpdateWidgetLayout?: (widgetId: string, patch: Partial<Layout>) => void
    fillHeight?: boolean
    columns?: number
    showEmptyState?: boolean
    minRows?: number
    parentSlot?: string
    showAddPopoverOnEmpty?: boolean
  }
) => ReactNode

type FrameHideMode = 'app-frame' | 'page-frame'

interface CreateCanvasFrameRenderersParams {
  selectedFrameWidgetId?: string | null
  pageFrameIds: Set<string>
  evaluationContext?: Record<string, unknown>
  onSelectFrameWidget?: (widgetId: string) => void
  onSetFrameWidgetHidden?: (
    widgetId: string,
    hidden: boolean,
    mode: FrameHideMode
  ) => void
  onUpdateAppFrameChildLayout?: (parentId: string, layout: Layout[]) => void
  onUpdatePageFrameChildLayout?: (parentId: string, layout: Layout[]) => void
  onDropAppFrameWidget?: (
    widgetType: string,
    layout: Layout,
    parentId: string,
    options?: BuilderWidgetAddOptions
  ) => void
  onDropPageFrameWidget?: (
    widgetType: string,
    layout: Layout,
    parentId: string,
    options?: BuilderWidgetAddOptions
  ) => void
  onUpdateAppFrameWidgetLayout?: (widgetId: string, patch: Partial<Layout>) => void
  onUpdatePageFrameWidgetLayout?: (widgetId: string, patch: Partial<Layout>) => void
  renderGlobalGrid: RenderGlobalGrid
}

export const createCanvasFrameRenderers = ({
  selectedFrameWidgetId,
  pageFrameIds,
  evaluationContext,
  onSelectFrameWidget,
  onSetFrameWidgetHidden,
  onUpdateAppFrameChildLayout,
  onUpdatePageFrameChildLayout,
  onDropAppFrameWidget,
  onDropPageFrameWidget,
  onUpdateAppFrameWidgetLayout,
  onUpdatePageFrameWidgetLayout,
  renderGlobalGrid,
}: CreateCanvasFrameRenderersParams) => {
  const frameGridHandlers = {
    onUpdateAppFrameChildLayout,
    onUpdatePageFrameChildLayout,
    onDropAppFrameWidget,
    onDropPageFrameWidget,
    onUpdateAppFrameWidgetLayout,
    onUpdatePageFrameWidgetLayout,
  }

  const renderGlobalContainer = (
    widget: BuilderWidgetInstance,
    variant: CanvasFrameVariant
  ) => {
    const frameContext = resolveGlobalFrameContext({
      widget,
      variant,
      selectedFrameWidgetId,
      pageFrameIds,
      evaluationContext,
    })

    if (frameContext.hideInEditor) {
      return null
    }

    const gridOptions = resolveFrameGridOptions(frameContext.mode, frameGridHandlers)

    if (variant === 'sidebar') {
      const config = resolveSidebarPanelConfig(frameContext.rawProps)
      const sidebarChildren = widget.children ?? []
      const headerChildren = selectFrameSlotChildren(sidebarChildren, 'header')
      const bodyChildren = selectFrameSlotChildren(sidebarChildren, 'body', true)
      const footerChildren = selectFrameSlotChildren(sidebarChildren, 'footer')
      const sidebarEdgeBorderClass = config.bordered
        ? config.side === 'right'
          ? 'border-l border-sidebar-border'
          : 'border-r border-sidebar-border'
        : 'border-none'

      return (
        <div
          key={widget.id}
          className={cn(
            'relative h-full min-h-0 shrink-0 overflow-visible transition',
            frameContext.isHidden ? 'opacity-60' : null,
            frameContext.isActive ? 'shadow-sm' : null
          )}
          style={{
            width: `${config.panelWidth}px`,
            minWidth: `${config.panelWidth}px`,
            maxWidth: `${config.panelWidth}px`,
          }}
          onClick={(event) => {
            event.stopPropagation()
            onSelectFrameWidget?.(widget.id)
          }}
          data-builder-widget-id={widget.id}
          data-builder-widget-type={widget.type}
        >
          {frameContext.isActive && (
            <span className="pointer-events-none absolute inset-0 z-10 border border-dashed border-brand-500" />
          )}
          {frameContext.isActive && (
            <span className="absolute left-0 top-0 z-10 bg-brand-500 px-1 py-0 text-[9px] font-semibold uppercase text-white shadow-sm">
              {frameContext.label}
            </span>
          )}
          <div
            className={cn(
              'flex h-full min-h-0 flex-col bg-sidebar text-sidebar-foreground',
              sidebarEdgeBorderClass
            )}
            style={
              {
                ...(frameContext.widgetStyleScopeVars ?? {}),
                ...buildSidebarThemeVars(config),
              } as CSSProperties
            }
          >
            {config.showHeader ? (
              <div
                className="border-b border-sidebar-border"
                style={{ padding: frameContext.frameHeaderPadding }}
              >
                {renderGlobalGrid(headerChildren, widget.id, 'min-h-0', {
                  ...gridOptions,
                  columns: 1,
                  showEmptyState: true,
                  minRows: 5,
                  parentSlot: 'header',
                  showAddPopoverOnEmpty: true,
                })}
              </div>
            ) : null}
            <div className="min-h-0 flex-1" style={frameContext.sidebarContentInsetStyle}>
              <div className="h-full min-h-0">
                {renderGlobalGrid(bodyChildren, widget.id, 'min-h-full h-full', {
                  ...gridOptions,
                  fillHeight: true,
                  columns: 1,
                  parentSlot: 'body',
                  showAddPopoverOnEmpty: true,
                })}
              </div>
            </div>
            {config.showFooter ? (
              <div
                className="border-t border-sidebar-border text-xs text-sidebar-foreground/70"
                style={{ padding: frameContext.frameFooterPadding }}
              >
                {renderGlobalGrid(footerChildren, widget.id, 'min-h-0', {
                  ...gridOptions,
                  columns: 1,
                  showEmptyState: true,
                  minRows: 5,
                  parentSlot: 'footer',
                  showAddPopoverOnEmpty: true,
                })}
              </div>
            ) : null}
          </div>
        </div>
      )
    }

    if (frameContext.isInlineFrame) {
      const inlineStyle = (
        frameContext.isHeaderFrame
          ? { '--radius': '0px', ...(frameContext.widgetStyleScopeVars ?? {}) }
          : (frameContext.widgetStyleScopeVars ?? {})
      ) as CSSProperties
      const headerBorderClass = frameContext.frameVisual.bordered
        ? 'border-b border-border'
        : 'border-b border-transparent'
      const containerStyle = (frameContext.isHeaderFrame
        ? inlineStyle
        : { ...frameContext.frameMarginStyle, ...inlineStyle }) as CSSProperties
      const contentStyle = frameContext.isHeaderFrame
        ? frameContext.frameContentInsetStyle
        : undefined
      const contentClassName = frameContext.isHeaderFrame
        ? undefined
        : frameContext.contentPaddingClass

      return (
        <div
          key={widget.id}
          className={cn(
            'relative transition',
            frameContext.isHeaderFrame ? 'flex flex-col rounded-[var(--radius)]' : 'rounded-lg',
            frameContext.baseClass,
            frameContext.isHeaderFrame ? headerBorderClass : frameContext.borderClass,
            frameContext.isHidden ? 'opacity-60' : null,
            frameContext.isActive ? 'shadow-sm' : null
          )}
          style={containerStyle}
          onClick={(event) => {
            event.stopPropagation()
            onSelectFrameWidget?.(widget.id)
          }}
          data-builder-widget-id={widget.id}
        >
          {frameContext.isActive && (
            <span className="pointer-events-none absolute inset-0 border border-dashed border-brand-500" />
          )}
          {frameContext.isActive && (
            <span className="absolute left-0 top-0 bg-brand-500 px-0.5 py-0 text-[9px] font-semibold uppercase text-white shadow-sm">
              {frameContext.label}
            </span>
          )}
          <div className={contentClassName} style={contentStyle}>
            {renderGlobalGrid(widget.children ?? [], widget.id, frameContext.minHeightClass, {
              ...gridOptions,
              fillHeight: false,
              columns: GRID_COLUMNS,
              minRows: frameContext.isHeaderFrame ? 5 : undefined,
              showAddPopoverOnEmpty: frameContext.isHeaderFrame,
            })}
          </div>
        </div>
      )
    }

    return (
      <div
        key={widget.id}
        className={cn(
          'relative p-3 shadow-sm transition',
          frameContext.baseClass,
          frameContext.borderClass,
          frameContext.isHidden ? 'opacity-60' : null,
          frameContext.isActive ? 'shadow-md' : null
        )}
        style={{ ...frameContext.frameMarginStyle, ...(frameContext.widgetStyleScopeVars ?? {}) }}
        onClick={(event) => {
          event.stopPropagation()
          onSelectFrameWidget?.(widget.id)
        }}
        data-builder-widget-id={widget.id}
      >
        {frameContext.isActive && (
          <span className="pointer-events-none absolute inset-0 border border-dashed border-brand-500" />
        )}
        <div className="flex items-center justify-between text-xs uppercase text-foreground-muted">
          <span>{frameContext.label}</span>
          <span>{widget.id}</span>
        </div>
        <div className="mt-3 p-2">
          {renderGlobalGrid(widget.children ?? [], widget.id, undefined, {
            ...gridOptions,
          })}
        </div>
      </div>
    )
  }

  const renderOverlayFrame = (
    widget: BuilderWidgetInstance,
    variant: 'modal' | 'drawer',
    index: number
  ) => {
    const overlayContext = resolveOverlayFrameContext({
      widget,
      variant,
      selectedFrameWidgetId,
      pageFrameIds,
      evaluationContext,
    })

    const gridOptions = resolveFrameGridOptions(overlayContext.mode, frameGridHandlers)
    const contentGrid = renderGlobalGrid(
      overlayContext.contentWidgets,
      widget.id,
      'min-h-[160px] h-full',
      {
        ...gridOptions,
        fillHeight: true,
        columns: GRID_COLUMNS,
      }
    )

    const renderFrameSection = (
      section: BuilderWidgetInstance,
      position: 'header' | 'footer',
      hidden: boolean
    ) => {
      const sectionProps = section.props as
        | { showSeparator?: boolean; padding?: 'normal' | 'none' }
        | undefined
      const paddingClass = sectionProps?.padding === 'none' ? 'p-0' : 'px-3 py-2'
      const showSeparator = sectionProps?.showSeparator !== false
      const separatorClass = showSeparator
        ? position === 'header'
          ? 'border-b border-foreground-muted/30'
          : 'border-t border-foreground-muted/30'
        : null
      const isSectionActive = selectedFrameWidgetId === section.id
      return (
        <div
          className={cn('relative', paddingClass, separatorClass, hidden ? 'opacity-60' : null)}
          onClick={(event) => {
            event.stopPropagation()
            onSelectFrameWidget?.(section.id)
          }}
          data-builder-widget-id={section.id}
        >
          {isSectionActive && (
            <span className="pointer-events-none absolute inset-0 border border-dashed border-brand-500" />
          )}
          {renderGlobalGrid(section.children ?? [], section.id, 'min-h-[32px]', {
            ...gridOptions,
            fillHeight: false,
            columns: GRID_COLUMNS,
            showEmptyState: false,
          })}
        </div>
      )
    }

    return (
      <div
        key={widget.id}
        className={cn(
          'absolute inset-0 flex',
          overlayContext.overlayClass,
          overlayContext.isHidden ? 'opacity-60' : null
        )}
        style={{ zIndex: 30 + index }}
      >
        {(overlayContext.showOverlay || overlayContext.closeOnOutsideClick) && (
          <div
            className={cn(
              'absolute inset-0',
              overlayContext.showOverlay ? 'bg-foreground/10' : 'bg-transparent'
            )}
            onClick={(event) => {
              event.stopPropagation()
              if (!overlayContext.closeOnOutsideClick) {
                return
              }
              onSetFrameWidgetHidden?.(
                widget.id,
                true,
                overlayContext.mode
              )
            }}
          />
        )}
        <div
          className={cn(
            'relative flex min-h-0 flex-col shadow-lg',
            overlayContext.panelClass,
            overlayContext.panelBorderClass,
            getGlobalFrameBackgroundClass(overlayContext.overlayVisual.background)
          )}
          style={{
            ...overlayContext.panelStyle,
            ...(overlayContext.widgetStyleScopeVars ?? {}),
          }}
          onClick={(event) => {
            event.stopPropagation()
            onSelectFrameWidget?.(widget.id)
          }}
          data-builder-widget-id={widget.id}
        >
          {overlayContext.isActive && (
            <span className="pointer-events-none absolute inset-0 border border-dashed border-brand-500" />
          )}
          {overlayContext.headerWidget && overlayContext.showHeader
            ? renderFrameSection(
                overlayContext.headerWidget,
                'header',
                overlayContext.headerHidden
              )
            : overlayContext.showHeader && (
                <div className="flex items-center justify-between border-b border-foreground-muted/30 px-3 py-2 text-[11px] uppercase text-foreground-muted">
                  <span className="truncate text-foreground">{overlayContext.title}</span>
                  <div className="flex items-center gap-2 text-foreground-muted">
                    <span>{overlayContext.label}</span>
                    <button
                      type="button"
                      className="flex h-5 w-5 items-center justify-center rounded-sm transition hover:bg-foreground/10 hover:text-foreground"
                      aria-label="Close"
                      onClick={(event) => {
                        event.stopPropagation()
                        onSetFrameWidgetHidden?.(
                          widget.id,
                          true,
                          overlayContext.mode
                        )
                      }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                </div>
              )}
          <div
            className={cn('min-h-0 flex-1', getGlobalFramePaddingClass(overlayContext.overlayVisual.padding))}
          >
            {contentGrid}
          </div>
          {overlayContext.footerWidget && overlayContext.showFooter
            ? renderFrameSection(
                overlayContext.footerWidget,
                'footer',
                overlayContext.footerHidden
              )
            : null}
        </div>
      </div>
    )
  }

  return { renderGlobalContainer, renderOverlayFrame }
}
