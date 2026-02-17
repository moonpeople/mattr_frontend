/**
 * Hook page grid-рендера для основных виджетов canvas и adjacent quick-add вставки.
 */
import { useMemo, type ReactNode } from 'react'
import type { Layout } from 'react-grid-layout'
import type { WidgetDefinition } from 'widgets/runtime'
import { getWidgetDefinition } from 'widgets/runtime'

import { QuickAddMenu } from '../../components/QuickAddMenu'
import type { BuilderWidgetAddOptions, BuilderWidgetInstance } from '../../types'
import { resolveBuilderWidgetDragPayload } from '../../utils/quickadd-dnd'
import { CanvasCard } from '../components/CanvasCard'
import {
  shouldInsertAdjacentWidgetInGridDrop,
  type AdjacentDropTarget,
} from '../engines/dropTargetEngine'
import { collectWidgetIds } from '../selectors/layoutSelectors'
import {
  buildContainerDropOptions,
  type RenderCanvasGridConfig,
} from './useCanvasGridRendererBase'
import {
  GRID_COLUMNS,
  getEventDataTransfer,
  normalizeSlotValue,
} from '../shared'

type QuickAddState = {
  widgetId: string
  position: 'above' | 'below'
} | null

type IsQuickAddWidgetSelectable = (
  widgetType: string,
  options?: BuilderWidgetAddOptions
) => boolean

export type RenderGrid = (
  items: BuilderWidgetInstance[],
  depth: number,
  parentId?: string,
  showEmptyState?: boolean,
  parentSlot?: string
) => ReactNode

interface UseCanvasPageGridRendererParams {
  widgets: BuilderWidgetInstance[]
  selectedWidgetId: string | null
  gridRowHeight: number
  gridMargin: number
  showGrid: boolean
  isGridInteractionActive: boolean
  isExternalDragActive: boolean
  externalDropTarget: AdjacentDropTarget
  isInternalDragActive: boolean
  internalDropTarget: AdjacentDropTarget
  internalPageRootDropLayout: Partial<Layout> | null
  isPageRootDropActive: boolean
  iconLibrary?: string
  evaluationContext?: Record<string, unknown>
  commonWidgets: WidgetDefinition[]
  groupedWidgets: [string, WidgetDefinition[]][]
  presetGroups: Parameters<typeof QuickAddMenu>[0]['presetGroups']
  isQuickAddWidgetSelectable: IsQuickAddWidgetSelectable
  quickAdd: QuickAddState
  search: string
  setSearch: (value: string) => void
  menuRef: React.RefObject<HTMLDivElement | null>
  toggleQuickAdd: (widgetId: string, position: 'above' | 'below') => void
  closeQuickAdd: () => void
  renderCanvasGrid: (config: RenderCanvasGridConfig) => ReactNode
  clearExternalDragState: () => void
  onUpdateLayout: (layout: Layout[]) => void
  onUpdateChildLayout: (parentId: string, layout: Layout[]) => void
  onUpdateWidgetLayout: (widgetId: string, patch: Partial<Layout>) => void
  onDropWidget: (
    widgetType: string,
    layout: Layout,
    parentId?: string,
    options?: BuilderWidgetAddOptions
  ) => void
  onInsertAdjacentWidget: (
    targetWidgetId: string,
    position: 'above' | 'below',
    widgetType: string,
    options?: BuilderWidgetAddOptions
  ) => void
  onSelectWidget: (widgetId: string) => void
  onOpenInspectorPanel?: (widgetId: string, panel: { key: string; label: string }) => void
  onUpdateWidgetProps?: (widgetId: string, patch: Record<string, unknown>) => void
  onRunWidgetActions: (
    widget: BuilderWidgetInstance,
    eventName: string,
    payload?: Record<string, unknown>
  ) => void
}

export const useCanvasPageGridRenderer = ({
  widgets,
  selectedWidgetId,
  gridRowHeight,
  gridMargin,
  showGrid,
  isGridInteractionActive,
  isExternalDragActive,
  externalDropTarget,
  isInternalDragActive,
  internalDropTarget,
  internalPageRootDropLayout,
  isPageRootDropActive,
  iconLibrary,
  evaluationContext,
  commonWidgets,
  groupedWidgets,
  presetGroups,
  isQuickAddWidgetSelectable,
  quickAdd,
  search,
  setSearch,
  menuRef,
  toggleQuickAdd,
  closeQuickAdd,
  renderCanvasGrid,
  clearExternalDragState,
  onUpdateLayout,
  onUpdateChildLayout,
  onUpdateWidgetLayout,
  onDropWidget,
  onInsertAdjacentWidget,
  onSelectWidget,
  onOpenInspectorPanel,
  onUpdateWidgetProps,
  onRunWidgetActions,
}: UseCanvasPageGridRendererParams) => {
  const pageWidgetIds = useMemo(() => collectWidgetIds(widgets), [widgets])

  const renderGrid: RenderGrid = (
    items,
    depth,
    parentId,
    showEmptyState = false,
    parentSlot
  ) => {
    const marginValue = depth > 0 ? Math.max(4, Math.round(gridMargin / 2)) : gridMargin
    const minHeightClass = depth > 0 ? 'min-h-[120px]' : 'min-h-[160px]'
    return renderCanvasGrid({
      items,
      activeWidgetId: selectedWidgetId,
      columns: GRID_COLUMNS,
      marginValue,
      minHeightClass,
      wrapperClassName: depth === 0 ? 'h-full' : undefined,
      wrapperStyle: depth === 0 ? { minHeight: '100%', height: '100%' } : undefined,
      showGridLines:
        showGrid &&
        (depth > 0 || isGridInteractionActive || isExternalDragActive || isInternalDragActive),
      lineColor:
        depth > 0
          ? 'var(--builder-grid-line-muted, rgba(148,163,184,0.16))'
          : 'var(--builder-grid-line, rgba(148,163,184,0.28))',
      parentId,
      parentSlot,
      pageRootDropZone: depth === 0,
      showPageRootDropPreview: depth === 0 && isPageRootDropActive,
      pageRootDropLayout: internalPageRootDropLayout,
      isDroppable: parentId ? true : !externalDropTarget,
      emptyState: showEmptyState ? (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 text-center text-sm text-foreground-muted">
          <div className="text-base font-medium text-foreground">Drop widgets here</div>
          <div>Pick a widget from the left panel to start building.</div>
        </div>
      ) : null,
      onDragLayoutCommit: (layout) => {
        if (depth === 0) {
          onUpdateLayout(layout)
        } else if (parentId) {
          onUpdateChildLayout(parentId, layout)
        }
      },
      onResizeLayoutCommit: (layout) => {
        if (depth === 0) {
          onUpdateLayout(layout)
        } else if (parentId) {
          onUpdateChildLayout(parentId, layout)
        }
      },
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
        if (
          shouldInsertAdjacentWidgetInGridDrop({
            parentId,
            parentSlot,
            externalDropTarget,
            pageWidgetIds,
          })
        ) {
          onInsertAdjacentWidget(
            externalDropTarget.widgetId,
            externalDropTarget.position,
            dragPayload.widgetType,
            dragPayload.presetId ? { presetId: dragPayload.presetId } : undefined
          )
          clearExternalDragState()
          return
        }
        if (depth === 0) {
          onUpdateLayout(layout)
          onDropWidget(
            dragPayload.widgetType,
            resolvedLayoutItem,
            undefined,
            dragPayload.presetId ? { presetId: dragPayload.presetId } : undefined
          )
          clearExternalDragState()
          return
        }
        if (parentId) {
          const addOptions = buildContainerDropOptions({
            presetId: dragPayload.presetId,
            parentSlot,
          })
          onUpdateChildLayout(parentId, layout)
          onDropWidget(dragPayload.widgetType, resolvedLayoutItem, parentId, addOptions)
          clearExternalDragState()
        }
      },
      renderItem: (widget, layout, itemMarginValue) => {
        const definition = getWidgetDefinition(widget.type)
        if (!definition) {
          return null
        }
        const supportsChildren = Boolean(definition.supportsChildren)
        const childWidgets = widget.children ?? []
        const renderChildContent = supportsChildren
          ? (params?: { slot?: string; includeUnassigned?: boolean }) => {
              const requestedSlot = normalizeSlotValue(params?.slot)
              const includeUnassigned = params?.includeUnassigned === true
              const filteredChildren = requestedSlot
                ? childWidgets.filter((child) => {
                    const childSlot = normalizeSlotValue(
                      (child.props as Record<string, unknown> | undefined)?.containerSlot
                    )
                    if (childSlot === requestedSlot) {
                      return true
                    }
                    return includeUnassigned ? childSlot.length === 0 : false
                  })
                : childWidgets
              return renderGrid(
                filteredChildren,
                depth + 1,
                widget.id,
                true,
                requestedSlot || undefined
              )
            }
          : undefined
        const usesSlotChildren =
          widget.type === 'TabbedContainer' || widget.type === 'SteppedContainer'
        const childContent = renderChildContent && !usesSlotChildren ? renderChildContent() : null
        const isSelected = selectedWidgetId === widget.id

        return (
          <div
            key={widget.id}
            className="group h-full"
            data-selected={isSelected ? 'true' : 'false'}
            style={isSelected ? { zIndex: 5 } : undefined}
          >
            <CanvasCard
              widget={widget}
              definition={definition}
              isSelected={isSelected}
              iconLibrary={iconLibrary}
              onSelect={() => onSelectWidget(widget.id)}
              onQuickAdd={(position) => toggleQuickAdd(widget.id, position)}
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
                onUpdateWidgetLayout(widget.id, { h: nextHeight, minH: 1 })
              }
              childContent={childContent}
              renderChildContent={renderChildContent}
              depth={depth}
              onRunActions={(eventName, payload) =>
                onRunWidgetActions(widget, eventName, payload)
              }
              evaluationContext={evaluationContext}
              onUpdateWidgetProps={onUpdateWidgetProps}
              onOpenInspectorPanel={onOpenInspectorPanel}
              showQuickAdd={quickAdd?.widgetId === widget.id}
              quickAddPosition={quickAdd?.position}
              quickAddContent={
                quickAdd?.widgetId === widget.id ? (
                  <div ref={menuRef}>
                    <QuickAddMenu
                      commonWidgets={commonWidgets}
                      presetGroups={presetGroups}
                      groupedWidgets={groupedWidgets}
                      search={search}
                      onSearchChange={setSearch}
                      isWidgetSelectable={isQuickAddWidgetSelectable}
                      onSelect={(widgetType, options) => {
                        onInsertAdjacentWidget(widget.id, quickAdd.position, widgetType, options)
                        closeQuickAdd()
                      }}
                    />
                  </div>
                ) : null
              }
            />
          </div>
        )
      },
    })
  }

  return { renderGrid }
}
