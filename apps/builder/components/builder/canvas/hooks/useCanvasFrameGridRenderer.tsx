/**
 * Hook рендера grid для контейнеров frame уровня app/page.
 */
import { type ReactNode } from 'react'
import type { Layout } from 'react-grid-layout'
import type { WidgetDefinition } from 'widgets/runtime'
import { getWidgetDefinition } from 'widgets/runtime'

import { EmptyStateAddComponentPopover } from '../components/EmptyStateAddComponentPopover'
import { CanvasCard } from '../components/CanvasCard'
import type { AdjacentDropTarget } from '../engines/dropTargetEngine'
import {
  buildContainerDropOptions,
  type RenderCanvasGridConfig,
} from './useCanvasGridRendererBase'
import type { BuilderWidgetAddOptions, BuilderWidgetInstance } from '../../types'
import { resolveBuilderWidgetDragPayload } from '../../utils/quickadd-dnd'
import {
  DEFAULT_ITEM,
  GRID_COLUMNS,
  getDefaultItemHeight,
  getEventDataTransfer,
  normalizeSlotValue,
} from '../shared'

type IsQuickAddWidgetSelectable = (
  widgetType: string,
  options?: BuilderWidgetAddOptions
) => boolean

export type RenderGlobalGrid = (
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

interface UseCanvasFrameGridRendererParams {
  selectedFrameWidgetId?: string | null
  iconLibrary?: string
  evaluationContext?: Record<string, unknown>
  gridRowHeight: number
  gridMargin: number
  showGrid: boolean
  isExternalDragActive: boolean
  externalDropTarget: AdjacentDropTarget
  isInternalDragActive: boolean
  internalDropTarget: AdjacentDropTarget
  renderCanvasGrid: (config: RenderCanvasGridConfig) => ReactNode
  clearExternalDragState: () => void
  commonWidgets: WidgetDefinition[]
  groupedWidgets: [string, WidgetDefinition[]][]
  presetGroups: Parameters<typeof EmptyStateAddComponentPopover>[0]['presetGroups']
  isQuickAddWidgetSelectable: IsQuickAddWidgetSelectable
  search: string
  setSearch: (value: string) => void
  onUpdateAppFrameChildLayout?: (parentId: string, layout: Layout[]) => void
  onUpdateAppFrameWidgetLayout?: (widgetId: string, patch: Partial<Layout>) => void
  onDropAppFrameWidget?: (
    widgetType: string,
    layout: Layout,
    parentId: string,
    options?: BuilderWidgetAddOptions
  ) => void
  onSelectFrameWidget?: (widgetId: string) => void
  onOpenInspectorPanel?: (widgetId: string, panel: { key: string; label: string }) => void
  onUpdateWidgetProps?: (widgetId: string, patch: Record<string, unknown>) => void
  onRunWidgetActions: (
    widget: BuilderWidgetInstance,
    eventName: string,
    payload?: Record<string, unknown>
  ) => void
}

export const useCanvasFrameGridRenderer = ({
  selectedFrameWidgetId,
  iconLibrary,
  evaluationContext,
  gridRowHeight,
  gridMargin,
  showGrid,
  isExternalDragActive,
  externalDropTarget,
  isInternalDragActive,
  internalDropTarget,
  renderCanvasGrid,
  clearExternalDragState,
  commonWidgets,
  groupedWidgets,
  presetGroups,
  isQuickAddWidgetSelectable,
  search,
  setSearch,
  onUpdateAppFrameChildLayout,
  onUpdateAppFrameWidgetLayout,
  onDropAppFrameWidget,
  onSelectFrameWidget,
  onOpenInspectorPanel,
  onUpdateWidgetProps,
  onRunWidgetActions,
}: UseCanvasFrameGridRendererParams) => {
  const renderGlobalGrid: RenderGlobalGrid = (
    items,
    parentId,
    minHeightClass = 'min-h-[120px]',
    options
  ) => {
    const columns = options?.columns ?? GRID_COLUMNS
    const updateChildLayout = options?.onUpdateChildLayout ?? onUpdateAppFrameChildLayout
    const dropWidget = options?.onDropWidget ?? onDropAppFrameWidget
    const updateWidgetLayout = options?.onUpdateWidgetLayout ?? onUpdateAppFrameWidgetLayout
    const fillHeight = options?.fillHeight ?? false
    const showEmptyState = options?.showEmptyState ?? true
    const showAddPopoverOnEmpty = options?.showAddPopoverOnEmpty ?? false
    const parentSlot = normalizeSlotValue(options?.parentSlot)
    const minRows = Number.isFinite(options?.minRows)
      ? Math.max(1, Math.floor(options?.minRows as number))
      : null
    const minHeightPx =
      minRows !== null ? minRows * gridRowHeight + (minRows - 1) * gridMargin : null
    const emptyStateContent =
      showEmptyState ? (
        <div className="absolute inset-0 flex items-center justify-center">
          {showAddPopoverOnEmpty ? (
            <EmptyStateAddComponentPopover
              commonWidgets={commonWidgets}
              presetGroups={presetGroups}
              groupedWidgets={groupedWidgets}
              search={search}
              onSearchChange={setSearch}
              isWidgetSelectable={isQuickAddWidgetSelectable}
              onSelect={(widgetType, addOptions) => {
                if (!isQuickAddWidgetSelectable(widgetType, addOptions)) {
                  return
                }
                const dropOptions = buildContainerDropOptions({
                  presetId: addOptions?.presetId,
                  parentSlot,
                  props: addOptions?.props,
                })
                dropWidget?.(
                  widgetType,
                  {
                    i: '__add_from_popover__',
                    x: 0,
                    y: 0,
                    w: Math.max(1, Math.min(DEFAULT_ITEM.w, columns)),
                    h: getDefaultItemHeight(widgetType),
                  },
                  parentId,
                  dropOptions
                )
              }}
            />
          ) : (
            <div className="pointer-events-none flex flex-col items-center justify-center gap-2 text-center text-xs text-foreground-muted">
              <div className="text-sm font-medium text-foreground">Drop components here</div>
              <div>Drag widgets from the left panel.</div>
            </div>
          )}
        </div>
      ) : null

    return renderCanvasGrid({
      items,
      activeWidgetId: selectedFrameWidgetId,
      columns,
      marginValue: gridMargin,
      minHeightClass,
      fillHeight,
      wrapperStyle: {
        ...(fillHeight ? { height: '100%' } : null),
        ...(minHeightPx !== null ? { minHeight: `${minHeightPx}px` } : null),
      },
      showGridLines: showGrid,
      lineColor: 'var(--builder-grid-line-muted, rgba(148,163,184,0.2))',
      parentId,
      parentSlot,
      isDroppable: !externalDropTarget,
      emptyState: emptyStateContent,
      onDragLayoutCommit: (layout) => updateChildLayout?.(parentId, layout),
      onResizeLayoutCommit: (layout) => updateChildLayout?.(parentId, layout),
      onDrop: (layout, resolvedLayoutItem, event) => {
        const dataTransfer = getEventDataTransfer(event)
        const dragPayload = resolveBuilderWidgetDragPayload(dataTransfer)
        if (
          !dragPayload ||
          !isQuickAddWidgetSelectable(dragPayload.widgetType, {
            ...(dragPayload.presetId ? { presetId: dragPayload.presetId } : {}),
          })
        ) {
          return
        }
        updateChildLayout?.(parentId, layout)
        dropWidget?.(
          dragPayload.widgetType,
          resolvedLayoutItem,
          parentId,
          buildContainerDropOptions({
            presetId: dragPayload.presetId,
            parentSlot,
          })
        )
        clearExternalDragState()
      },
      renderItem: (widget, layout, itemMarginValue) => {
        const definition = getWidgetDefinition(widget.type)
        if (!definition) {
          return null
        }
        return (
          <div
            key={widget.id}
            className="group h-full"
            data-selected={selectedFrameWidgetId === widget.id ? 'true' : 'false'}
            style={selectedFrameWidgetId === widget.id ? { zIndex: 5 } : undefined}
          >
            <CanvasCard
              widget={widget}
              definition={definition}
              isSelected={selectedFrameWidgetId === widget.id}
              iconLibrary={iconLibrary}
              onSelect={() => onSelectFrameWidget?.(widget.id)}
              onQuickAdd={(position) => {
                void position
              }}
              enableQuickAddControls={false}
              dropIndicator={
                isInternalDragActive && internalDropTarget?.widgetId === widget.id
                  ? internalDropTarget.position
                  : isExternalDragActive && externalDropTarget?.widgetId === widget.id
                    ? externalDropTarget.position
                    : undefined
              }
              layout={layout}
              gridRowHeight={gridRowHeight}
              gridMargin={itemMarginValue}
              onAutoHeight={(nextHeight) =>
                updateWidgetLayout?.(widget.id, { h: nextHeight, minH: 1 })
              }
              childContent={null}
              depth={1}
              onRunActions={(eventName, payload) =>
                onRunWidgetActions(widget, eventName, payload)
              }
              evaluationContext={evaluationContext}
              onUpdateWidgetProps={onUpdateWidgetProps}
              onOpenInspectorPanel={onOpenInspectorPanel}
              showQuickAdd={false}
              quickAddContent={null}
            />
          </div>
        )
      },
    })
  }

  return { renderGlobalGrid }
}
