/**
 * Общая оболочка RGL-рендера, используемая page и frame grid-рендерами.
 */
import { type CSSProperties, type ReactNode } from 'react'
import RGL, { WidthProvider, type Layout } from 'react-grid-layout'
import { cn } from 'ui'

import { renderBuilderResizeHandle } from '../resize-handles'
import type { BuilderWidgetAddOptions, BuilderWidgetInstance } from '../../types'
import type { AdjacentDropTarget } from '../engines/dropTargetEngine'
import { buildLayoutMap } from '../selectors/layoutSelectors'
import {
  buildGridBackgroundStyle,
  DEFAULT_ITEM,
  DRAG_CANCEL_SELECTOR,
  DRAG_HANDLE_SELECTOR,
  normalizeSlotValue,
  resolveGridDropLayoutFromEvent,
} from '../shared'

const ReactGridLayout = WidthProvider(RGL)

export type ContainerDropTarget = {
  parentId: string
  slot?: string
  layout?: Partial<Layout>
} | null

type BuildContainerDropOptionsParams = {
  presetId?: string
  parentSlot?: string
  props?: Record<string, unknown>
}

export const buildContainerDropOptions = (
  params?: BuildContainerDropOptionsParams
): BuilderWidgetAddOptions | undefined => {
  const presetId = params?.presetId?.trim()
  const parentSlot = normalizeSlotValue(params?.parentSlot)
  const baseProps = params?.props ? { ...params.props } : undefined
  const resolvedProps =
    parentSlot.length > 0
      ? {
          ...(baseProps ?? {}),
          containerSlot: parentSlot,
        }
      : baseProps

  if (!presetId && !resolvedProps) {
    return undefined
  }

  return {
    ...(presetId ? { presetId } : {}),
    ...(resolvedProps ? { props: resolvedProps } : {}),
  }
}

interface UseCanvasGridRendererBaseParams {
  gridRowHeight: number
  allowOverlapActive: boolean
  preventCollisionActive: boolean
  isExternalDragActive: boolean
  externalDropTarget: AdjacentDropTarget
  isInternalDragActive: boolean
  internalDropContainerTarget: ContainerDropTarget
  buildPreviewStyle: (
    layout: Partial<Layout> | null,
    columns: number,
    margin: number
  ) => CSSProperties | null
  startInternalGridDrag: (
    oldItem: Layout,
    parentId?: string,
    parentSlot?: string,
    event?: unknown
  ) => void
  updateInternalGridDrag: (oldItem: Layout, event?: unknown) => void
  stopInternalGridDrag: (layout: Layout[], onFallback: () => void, event?: unknown) => void
  beginGridInteraction: () => void
  endGridInteraction: () => void
}

export type RenderCanvasGridConfig = {
  items: BuilderWidgetInstance[]
  activeWidgetId?: string | null
  columns: number
  marginValue: number
  minHeightClass: string
  wrapperClassName?: string
  wrapperStyle?: CSSProperties
  fillHeight?: boolean
  showGridLines: boolean
  lineColor: string
  parentId?: string
  parentSlot?: string
  pageRootDropZone?: boolean
  showPageRootDropPreview?: boolean
  pageRootDropLayout?: Partial<Layout> | null
  isDroppable: boolean
  emptyState?: ReactNode
  onDragLayoutCommit: (layout: Layout[]) => void
  onResizeLayoutCommit?: (layout: Layout[]) => void
  onDrop: (layout: Layout[], resolvedLayoutItem: Layout, event: unknown) => void
  renderItem: (widget: BuilderWidgetInstance, layout: Layout, marginValue: number) => ReactNode
}

export const useCanvasGridRendererBase = ({
  gridRowHeight,
  allowOverlapActive,
  preventCollisionActive,
  isExternalDragActive,
  externalDropTarget,
  isInternalDragActive,
  internalDropContainerTarget,
  buildPreviewStyle,
  startInternalGridDrag,
  updateInternalGridDrag,
  stopInternalGridDrag,
  beginGridInteraction,
  endGridInteraction,
}: UseCanvasGridRendererBaseParams) => {
  const createGridInteractionHandlers = (params: {
    parentId?: string
    parentSlot?: string
    onDragLayoutCommit: (layout: Layout[]) => void
    onResizeLayoutCommit?: (layout: Layout[]) => void
  }) => {
    const onResizeCommit = params.onResizeLayoutCommit ?? params.onDragLayoutCommit
    return {
      onDragStart: (
        _layout: Layout[],
        oldItem: Layout,
        _newItem: Layout,
        _placeholder: Layout,
        event: unknown
      ) => {
        startInternalGridDrag(oldItem, params.parentId, params.parentSlot, event)
      },
      onDrag: (
        _layout: Layout[],
        oldItem: Layout,
        _newItem: Layout,
        _placeholder: Layout,
        event: unknown
      ) => {
        updateInternalGridDrag(oldItem, event)
      },
      onResizeStart: beginGridInteraction,
      onDragStop: (
        layout: Layout[],
        _oldItem: Layout,
        _newItem: Layout,
        _placeholder: Layout,
        event: unknown
      ) => {
        stopInternalGridDrag(layout, () => params.onDragLayoutCommit(layout), event)
      },
      onResizeStop: (layout: Layout[]) => {
        onResizeCommit(layout)
        endGridInteraction()
      },
    }
  }

  const renderCanvasGrid = ({
    items,
    activeWidgetId,
    columns,
    marginValue,
    minHeightClass,
    wrapperClassName,
    wrapperStyle,
    fillHeight = false,
    showGridLines,
    lineColor,
    parentId,
    parentSlot,
    pageRootDropZone = false,
    showPageRootDropPreview = false,
    pageRootDropLayout = null,
    isDroppable,
    emptyState,
    onDragLayoutCommit,
    onResizeLayoutCommit,
    onDrop,
    renderItem,
  }: RenderCanvasGridConfig): ReactNode => {
    const normalizedParentSlot = normalizeSlotValue(parentSlot)
    const layoutMap = buildLayoutMap(items, columns, activeWidgetId)
    const gridLayout = Array.from(layoutMap.values())
    const margin: [number, number] = [marginValue, marginValue]
    const gridStyle = buildGridBackgroundStyle({
      show: showGridLines,
      columns,
      margin: marginValue,
      rowHeight: gridRowHeight,
      lineColor,
    })
    const isContainerDropTarget =
      isInternalDragActive &&
      internalDropContainerTarget?.parentId === parentId &&
      normalizeSlotValue(internalDropContainerTarget?.slot) === normalizedParentSlot
    const containerDropPreviewStyle = buildPreviewStyle(
      isContainerDropTarget ? (internalDropContainerTarget?.layout ?? null) : null,
      columns,
      marginValue
    )
    const pageRootDropPreviewStyle = buildPreviewStyle(
      showPageRootDropPreview ? pageRootDropLayout : null,
      columns,
      marginValue
    )
    const combinedWrapperStyle = {
      ...(gridStyle ?? {}),
      ...(wrapperStyle ?? {}),
    } as CSSProperties
    const gridInteractionHandlers = createGridInteractionHandlers({
      parentId,
      parentSlot: normalizedParentSlot || undefined,
      onDragLayoutCommit,
      onResizeLayoutCommit,
    })

    return (
      <div
        className={cn(
          'relative',
          minHeightClass,
          fillHeight ? 'h-full overflow-visible' : null,
          wrapperClassName
        )}
        style={combinedWrapperStyle}
        data-builder-page-root-drop-zone={pageRootDropZone ? 'true' : undefined}
        data-builder-child-drop-zone={parentId ? 'true' : undefined}
        data-builder-slot-drop-zone={normalizedParentSlot ? 'true' : undefined}
        data-builder-parent-id={parentId}
        data-builder-parent-slot={normalizedParentSlot || undefined}
        data-builder-grid-columns={columns}
        data-builder-grid-margin={marginValue}
      >
        {containerDropPreviewStyle ? (
          <span
            className="pointer-events-none absolute z-20 rounded-sm border border-dashed border-brand-600/90 bg-brand-500/20"
            style={containerDropPreviewStyle}
          />
        ) : null}
        {pageRootDropPreviewStyle ? (
          <span
            className="pointer-events-none absolute z-20 rounded-sm border border-dashed border-brand-600/90 bg-brand-500/20"
            style={pageRootDropPreviewStyle}
          />
        ) : null}
        {items.length === 0 ? emptyState : null}
        <ReactGridLayout
          layout={gridLayout}
          cols={columns}
          rowHeight={gridRowHeight}
          margin={margin}
          containerPadding={[0, 0]}
          compactType={null}
          preventCollision={preventCollisionActive}
          allowOverlap={allowOverlapActive}
          isDraggable
          isResizable
          isDroppable={isDroppable}
          draggableHandle={DRAG_HANDLE_SELECTOR}
          draggableCancel={DRAG_CANCEL_SELECTOR}
          resizeHandle={renderBuilderResizeHandle}
          className={cn(minHeightClass, fillHeight ? 'h-full overflow-visible' : null)}
          autoSize={!fillHeight}
          style={fillHeight ? { height: '100%' } : undefined}
          droppingItem={
            isExternalDragActive && !externalDropTarget
              ? { i: '__dropping__', ...DEFAULT_ITEM }
              : undefined
          }
          {...gridInteractionHandlers}
          onDrop={(layout, layoutItem, event) => {
            const resolvedLayoutItem =
              layoutItem ??
              resolveGridDropLayoutFromEvent(event, {
                columns,
                margin: marginValue,
                rowHeight: gridRowHeight,
                defaultItem: DEFAULT_ITEM,
              })
            if (!resolvedLayoutItem) {
              return
            }
            onDrop(layout, resolvedLayoutItem, event)
          }}
        >
          {items.map((widget) => {
            const layout = layoutMap.get(widget.id)
            if (!layout) {
              return null
            }
            return renderItem(widget, layout, marginValue)
          })}
        </ReactGridLayout>
      </div>
    )
  }

  return {
    renderCanvasGrid,
  }
}
