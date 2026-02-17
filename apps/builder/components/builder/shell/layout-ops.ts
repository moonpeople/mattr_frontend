/**
 * Layout/tree операции BuilderShell: чистые функции для layout-модели, DnD/move/reorder и policy key сборки.
 */
import type { Layout } from 'react-grid-layout'

import type { BuilderPageRecord } from 'data/builder/builder-pages'

import { buildIndexedName } from '../BuilderCodeUtils'
import type {
  BuilderAppMeta,
  BuilderMenuItem,
  BuilderPage,
  BuilderPageFrames,
  BuilderPageLayout,
  BuilderWidgetInstance,
  BuilderWidgetSpacing,
} from '../types'
import {
  createDefaultMainFrame,
  getPageFrameWidgets,
  isFrameType,
  resolveWidgetSpacing,
} from '../types'
import {
  resolvePageFramesState,
  resolvePageWidgetsState,
} from '../utils/layout-slots'
import {
  resolvePageLayoutFromRecord,
  writePageLayoutToRecord,
} from '../utils/layout-model'
import { slugifyWithFallback } from '../utils/slugify'

export const resolvePageWidgets = (
  page: BuilderPageRecord,
  existing?: BuilderWidgetInstance[]
): BuilderWidgetInstance[] => {
  if (existing && existing.length > 0) {
    return existing.map(applyWidgetDefaults)
  }

  const pageLayout = resolvePageLayoutFromRecord(page.layout)
  return pageLayout.widgets.map(applyWidgetDefaults)
}

export const resolvePageMeta = (page: BuilderPageRecord): BuilderPage['pageMeta'] => {
  const layoutMeta = (page.layout as { pageMeta?: BuilderPage['pageMeta'] } | undefined)?.pageMeta
  const fallbackTitle = page.name ?? 'Page'
  const fallbackUrl = slugifyWithFallback(fallbackTitle, 'page')
  return {
    title: layoutMeta?.title ?? fallbackTitle,
    browserTitle: layoutMeta?.browserTitle ?? fallbackTitle,
    url: layoutMeta?.url ?? fallbackUrl,
    searchParams: layoutMeta?.searchParams ?? [],
    hashParams: layoutMeta?.hashParams ?? [],
    shortcuts: layoutMeta?.shortcuts ?? [],
  }
}

export const resolvePageMain = (page: BuilderPageRecord): BuilderPageLayout['main'] => {
  const layoutMain = resolvePageLayoutFromRecord(page.layout).main
  return {
    ...createDefaultMainFrame(),
    ...(layoutMain ?? {}),
  }
}

export const resolveAppMeta = (
  page: { layout?: Record<string, unknown> } | undefined,
  appName: string | undefined
): BuilderAppMeta => {
  const layoutMeta = page
    ? ((page.layout as { appMeta?: BuilderAppMeta } | undefined)?.appMeta ?? null)
    : null
  const fallbackTitle = appName ?? 'App'
  const fallbackUrl = slugifyWithFallback(fallbackTitle, 'page')
  return {
    browserTitle: layoutMeta?.browserTitle ?? fallbackTitle,
    url: layoutMeta?.url ?? fallbackUrl,
    shortcuts: layoutMeta?.shortcuts ?? [],
    persistUrlParams: layoutMeta?.persistUrlParams ?? false,
    maxWidth: layoutMeta?.maxWidth ?? '100%',
  }
}

export const resolvePageFrames = (page: BuilderPageRecord): BuilderPageFrames => {
  const layoutFrames = resolvePageLayoutFromRecord(page.layout).frames
  return {
    splitPane: layoutFrames.splitPane ? applyWidgetDefaults(layoutFrames.splitPane) : undefined,
    drawers: layoutFrames.drawers.map(applyWidgetDefaults),
    modals: layoutFrames.modals.map(applyWidgetDefaults),
  }
}

export const resolvePageLayout = (
  page: BuilderPageRecord,
  existingWidgets?: BuilderWidgetInstance[]
): BuilderPageLayout => {
  const widgets = resolvePageWidgets(page, existingWidgets)
  return {
    main: resolvePageMain(page),
    widgets,
    frames: resolvePageFrames(page),
  }
}

export const buildPageModel = (
  page: BuilderPageRecord,
  existingWidgets?: BuilderWidgetInstance[]
): Pick<BuilderPage, 'pageLayout' | 'layout'> => {
  const pageLayout = resolvePageLayout(page, existingWidgets)
  return {
    layout: writePageLayoutToRecord(page.layout, pageLayout),
    pageLayout,
  }
}

export const createGlobalId = (
  type: string,
  globals: BuilderWidgetInstance[],
  existingIds?: Set<string>
) => {
  const prefixMap: Record<string, string> = {
    GlobalHeader: 'header',
    GlobalSidebar: 'sidebar',
    GlobalDrawer: 'drawer',
    GlobalModal: 'modal',
    GlobalSplitPane: 'splitPane',
  }
  const prefix = prefixMap[type] ?? type.toLowerCase()
  if (existingIds) {
    return buildIndexedName(prefix, existingIds)
  }
  const count = globals.filter((widget) => widget.type === type).length + 1
  return `${prefix}${count}`
}

export const GRID_COLUMNS = 12
export const DEFAULT_WIDGET_LAYOUT = {
  w: 4,
  h: 6,
  minW: 2,
  minH: 3,
}
export const ONE_COLUMN_WIDGET_TYPES = new Set([
  'Button',
  'OutlineButton',
  'CloseButton',
  'ButtonGroup',
  'DropdownButton',
  'Link',
  'LinkList',
  'SplitButton',
  'ToggleButton',
  'ToggleLink',
])
export const AUTO_HEIGHT_MIN_H = 1
export const DEFAULT_WIDGET_HEIGHT_BY_TYPE: Record<string, number> = {
  JsonEditor: 40,
  Sidebar: 40,
}

export const getDefaultWidgetHeight = (widgetType: string) =>
  DEFAULT_WIDGET_HEIGHT_BY_TYPE[widgetType] ?? DEFAULT_WIDGET_LAYOUT.h

export const getDefaultWidgetMinW = (widgetType?: string) =>
  widgetType && ONE_COLUMN_WIDGET_TYPES.has(widgetType) ? 1 : DEFAULT_WIDGET_LAYOUT.minW

export const getDefaultWidgetMinH = (widgetType?: string, spacing?: BuilderWidgetSpacing) => {
  if (widgetType === 'Sidebar') {
    return getDefaultWidgetHeight(widgetType)
  }
  return spacing?.heightMode === 'auto' ? AUTO_HEIGHT_MIN_H : DEFAULT_WIDGET_LAYOUT.minH
}

export const applySpacingToLayout = (
  layout: BuilderWidgetInstance['layout'],
  spacing: BuilderWidgetSpacing
) => {
  if (!layout) {
    return layout
  }
  if (spacing.heightMode === 'auto') {
    return {
      ...layout,
      minH: AUTO_HEIGHT_MIN_H,
    }
  }
  return layout
}

export const getDefaultWidgetLayout = (
  widgets: BuilderWidgetInstance[],
  widgetType?: string,
  columns = GRID_COLUMNS
) => {
  const columnSpan = DEFAULT_WIDGET_LAYOUT.w
  const safeColumns = Math.max(1, columns)
  const columnsPerRow = Math.max(1, Math.floor(safeColumns / columnSpan))
  const index = widgets.length
  const x = Math.min((index % columnsPerRow) * columnSpan, Math.max(0, safeColumns - 1))
  const w = Math.max(1, Math.min(DEFAULT_WIDGET_LAYOUT.w, safeColumns))
  const y = widgets.reduce((maxBottom, widget, widgetIndex) => {
    const fallbackX = (widgetIndex % columnsPerRow) * columnSpan
    const fallbackY = Math.floor(widgetIndex / columnsPerRow) * DEFAULT_WIDGET_LAYOUT.h
    const layout = widget.layout
    const left = layout?.x ?? fallbackX
    const top = layout?.y ?? fallbackY
    const width = layout?.w ?? DEFAULT_WIDGET_LAYOUT.w
    const height = layout?.h ?? getDefaultWidgetHeight(widget.type)
    const right = left + width
    const overlapsX = left < x + w && right > x
    if (!overlapsX) {
      return maxBottom
    }
    const bottom = top + height
    return bottom > maxBottom ? bottom : maxBottom
  }, 0)

  return {
    x,
    y,
    w: DEFAULT_WIDGET_LAYOUT.w,
    h: widgetType ? getDefaultWidgetHeight(widgetType) : DEFAULT_WIDGET_LAYOUT.h,
    minW: getDefaultWidgetMinW(widgetType),
    minH: getDefaultWidgetMinH(widgetType),
  }
}

export const resolveWidgetLayout = (
  widget: BuilderWidgetInstance,
  widgets: BuilderWidgetInstance[]
) => {
  const fallback = getDefaultWidgetLayout(widgets, widget.type)
  const layout = widget.layout ?? fallback
  const maxW = 'maxW' in layout ? layout.maxW : undefined
  const maxH = 'maxH' in layout ? layout.maxH : undefined
  return {
    x: layout.x ?? fallback.x,
    y: layout.y ?? fallback.y,
    w: layout.w ?? fallback.w,
    h: layout.h ?? fallback.h,
    minW: layout.minW ?? fallback.minW,
    minH: layout.minH ?? fallback.minH,
    maxW,
    maxH,
  }
}

export const applyWidgetDefaults = (widget: BuilderWidgetInstance): BuilderWidgetInstance => {
  const legacyHeightMode = widget.spacing?.heightMode
  let spacing = resolveWidgetSpacing(widget.type, widget.spacing)

  // Retool parity: JSON Editor is fixed-height and resizable via RGL only.
  // We enforce `fixed` to avoid legacy auto-height widgets collapsing to 1 row.
  if (widget.type === 'JsonEditor') {
    spacing = {
      ...spacing,
      heightMode: 'fixed',
      heightFxEnabled: false,
      heightFx: '',
    }
  }

  let layout = widget.layout ? applySpacingToLayout(widget.layout, spacing) : widget.layout

  if (layout && ONE_COLUMN_WIDGET_TYPES.has(widget.type)) {
    layout = {
      ...layout,
      minW: 1,
    }
  }

  if (widget.type === 'JsonEditor' && layout) {
    const defaultH = getDefaultWidgetHeight(widget.type)
    const wasLegacyAuto = (legacyHeightMode ?? 'auto') !== 'fixed'
    const isLegacyDefaultHeight = layout.h === DEFAULT_WIDGET_LAYOUT.h
    const isCollapsed = layout.h === 1
    const nextH =
      wasLegacyAuto && (isLegacyDefaultHeight || isCollapsed)
        ? defaultH
        : (layout.h ?? defaultH)

    layout = {
      ...layout,
      h: nextH,
      minH: layout.minH ?? DEFAULT_WIDGET_LAYOUT.minH,
    }
  }

  if (widget.type === 'Sidebar' && layout) {
    const defaultH = getDefaultWidgetHeight(widget.type)
    const isLegacyDefaultHeight = layout.h === DEFAULT_WIDGET_LAYOUT.h || layout.h === 1
    layout = {
      ...layout,
      h: isLegacyDefaultHeight ? defaultH : (layout.h ?? defaultH),
      minH: Math.max(layout.minH ?? defaultH, defaultH),
    }
  }
  const children = widget.children?.map(applyWidgetDefaults)

  return {
    ...widget,
    spacing,
    layout,
    children,
  }
}

export const findWidgetById = (
  widgets: BuilderWidgetInstance[],
  widgetId: string
): BuilderWidgetInstance | null => {
  for (const widget of widgets) {
    if (widget.id === widgetId) {
      return widget
    }
    if (widget.children && widget.children.length > 0) {
      const match = findWidgetById(widget.children, widgetId)
      if (match) {
        return match
      }
    }
  }
  return null
}

export const findWidgetParentById = (
  widgets: BuilderWidgetInstance[],
  widgetId: string,
  parent: BuilderWidgetInstance | null = null
): BuilderWidgetInstance | null => {
  for (const widget of widgets) {
    if (widget.id === widgetId) {
      return parent
    }
    if (widget.children && widget.children.length > 0) {
      const match = findWidgetParentById(widget.children, widgetId, widget)
      if (match) {
        return match
      }
    }
  }
  return null
}

export const flattenWidgets = (
  widgets: BuilderWidgetInstance[]
): BuilderWidgetInstance[] => {
  return widgets.flatMap((widget) => [
    widget,
    ...(widget.children ? flattenWidgets(widget.children) : []),
  ])
}

export const updateWidgetById = (
  widgets: BuilderWidgetInstance[],
  widgetId: string,
  updater: (widget: BuilderWidgetInstance) => BuilderWidgetInstance
): BuilderWidgetInstance[] => {
  return widgets.map((widget) => {
    if (widget.id === widgetId) {
      return updater(widget)
    }
    if (widget.children && widget.children.length > 0) {
      return {
        ...widget,
        children: updateWidgetById(widget.children, widgetId, updater),
      }
    }
    return widget
  })
}

export const removeWidgetById = (
  widgets: BuilderWidgetInstance[],
  widgetId: string
): BuilderWidgetInstance[] => {
  return widgets.flatMap((widget) => {
    if (widget.id === widgetId) {
      return []
    }
    if (widget.children && widget.children.length > 0) {
      const nextChildren = removeWidgetById(widget.children, widgetId)
      return [
        {
          ...widget,
          children: nextChildren.length > 0 ? nextChildren : undefined,
        },
      ]
    }
    return [widget]
  })
}

export const addChildWidget = (
  widgets: BuilderWidgetInstance[],
  parentId: string,
  child: BuilderWidgetInstance
): BuilderWidgetInstance[] => {
  return widgets.map((widget) => {
    if (widget.id === parentId) {
      const existingChildren = widget.children ? [...widget.children] : []
      return {
        ...widget,
        children: [...existingChildren, child],
      }
    }
    if (widget.children && widget.children.length > 0) {
      return {
        ...widget,
        children: addChildWidget(widget.children, parentId, child),
      }
    }
    return widget
  })
}

export const insertAdjacentWidget = (
  widgets: BuilderWidgetInstance[],
  targetId: string,
  position: 'above' | 'below',
  newWidget: BuilderWidgetInstance
): [BuilderWidgetInstance[], boolean] => {
  let inserted = false
  let insertedLayout: BuilderWidgetInstance['layout'] | null = null

  const nextWidgets = widgets.flatMap((widget) => {
    if (widget.id === targetId) {
      inserted = true
      const targetLayout = resolveWidgetLayout(widget, widgets)
      const baseX = targetLayout.x
      const baseY = targetLayout.y
      const baseW = targetLayout.w
      const baseH = targetLayout.h
      const spacing = resolveWidgetSpacing(newWidget.type, newWidget.spacing)
      const sourceLayout = newWidget.layout
      const defaultH = getDefaultWidgetHeight(newWidget.type)
      const nextH = sourceLayout?.h ?? defaultH
      const newY = position === 'above' ? Math.max(0, baseY - nextH) : baseY + baseH
      const widgetWithLayout: BuilderWidgetInstance = {
        ...newWidget,
        layout: {
          x: baseX,
          y: newY,
          w: sourceLayout?.w ?? baseW,
          h: nextH,
          minW: sourceLayout?.minW ?? getDefaultWidgetMinW(newWidget.type),
          minH: sourceLayout?.minH ?? getDefaultWidgetMinH(newWidget.type, spacing),
          maxW: sourceLayout?.maxW,
          maxH: sourceLayout?.maxH,
        },
        spacing,
      }
      widgetWithLayout.layout = applySpacingToLayout(widgetWithLayout.layout, spacing)
      insertedLayout = widgetWithLayout.layout

      return position === 'above' ? [widgetWithLayout, widget] : [widget, widgetWithLayout]
    }

    if (widget.children && widget.children.length > 0) {
      const [nextChildren, childInserted] = insertAdjacentWidget(
        widget.children,
        targetId,
        position,
        newWidget
      )
      if (childInserted) {
        inserted = true
        return [{ ...widget, children: nextChildren }]
      }
    }

    return [widget]
  })

  if (inserted && insertedLayout) {
    return [
      shiftWidgetsForInsert(nextWidgets, newWidget.id, targetId, insertedLayout),
      true,
    ]
  }

  return [nextWidgets, inserted]
}

export const shiftWidgetsForInsert = (
  widgets: BuilderWidgetInstance[],
  insertedId: string,
  targetId: string,
  insertedLayout: BuilderWidgetInstance['layout']
): BuilderWidgetInstance[] => {
  if (!insertedLayout) {
    return widgets
  }

  const insertedTop = insertedLayout.y ?? 0
  const insertedHeight = insertedLayout.h ?? DEFAULT_WIDGET_LAYOUT.h
  const insertedBottom = insertedTop + insertedHeight
  const insertedLeft = insertedLayout.x ?? 0
  const insertedRight = insertedLeft + (insertedLayout.w ?? DEFAULT_WIDGET_LAYOUT.w)

  return widgets.map((widget) => {
    if (widget.id === insertedId || widget.id === targetId) {
      return widget
    }

    const layout = resolveWidgetLayout(widget, widgets)
    const widgetLeft = layout.x
    const widgetRight = layout.x + layout.w
    const overlapsX = widgetLeft < insertedRight && widgetRight > insertedLeft
    const isBelow = layout.y >= insertedBottom

    if (overlapsX && isBelow) {
      return {
        ...widget,
        layout: {
          ...layout,
          y: layout.y + insertedHeight,
        },
      }
    }

    return widget
  })
}

export const shiftWidgetsForRemove = (
  widgets: BuilderWidgetInstance[],
  removedLayout: BuilderWidgetInstance['layout']
): BuilderWidgetInstance[] => {
  if (!removedLayout) {
    return widgets
  }

  const removedTop = removedLayout.y ?? 0
  const removedHeight = removedLayout.h ?? DEFAULT_WIDGET_LAYOUT.h
  const removedBottom = removedTop + removedHeight
  const removedLeft = removedLayout.x ?? 0
  const removedRight = removedLeft + (removedLayout.w ?? DEFAULT_WIDGET_LAYOUT.w)

  return widgets.map((widget) => {
    const layout = resolveWidgetLayout(widget, widgets)
    const widgetLeft = layout.x
    const widgetRight = layout.x + layout.w
    const overlapsX = widgetLeft < removedRight && widgetRight > removedLeft
    const isBelow = layout.y >= removedBottom

    if (overlapsX && isBelow) {
      return {
        ...widget,
        layout: {
          ...layout,
          y: Math.max(0, layout.y - removedHeight),
        },
      }
    }

    if (widget.children && widget.children.length > 0) {
      return {
        ...widget,
        children: shiftWidgetsForRemove(widget.children, removedLayout),
      }
    }

    return widget
  })
}

export const moveWidgetAdjacent = (
  widgets: BuilderWidgetInstance[],
  activeId: string,
  targetId: string,
  position: 'above' | 'below'
) => {
  if (activeId === targetId) {
    return widgets
  }
  const activeWidget = findWidgetById(widgets, activeId)
  const targetWidget = findWidgetById(widgets, targetId)
  if (!activeWidget) {
    return widgets
  }
  if (!targetWidget) {
    return widgets
  }
  const sourceColumns = resolveWidgetColumnsInTree(widgets, activeId)
  const targetColumns = resolveWidgetColumnsInTree(widgets, targetId)
  const targetParent = findWidgetParentById(widgets, targetId)
  const targetSiblings = targetParent?.children ?? widgets
  const targetBaseLayout = getDefaultWidgetLayout(targetSiblings, activeWidget.type, targetColumns)
  const activeLayout = resolveWidgetLayout(activeWidget, widgets)
  const nextProps = withMultiColumnLayoutMemory(
    activeWidget.props as Record<string, unknown> | undefined,
    activeLayout,
    sourceColumns,
    targetColumns
  )
  const { w: nextW, minW: nextMinW, maxW: nextMaxW } = resolveTransferWidth({
    props: nextProps,
    activeLayout,
    baseLayout: targetBaseLayout,
    sourceColumns,
    targetColumns,
    widgetType: activeWidget.type,
  })
  const without = removeWidgetById(widgets, activeId)
  const collapsed = shiftWidgetsForRemove(without, activeLayout)
  const movedLayout = {
    ...activeLayout,
    w: nextW,
    minW: nextMinW,
    maxW: nextMaxW,
  }
  const [nextWidgets, inserted] = insertAdjacentWidget(
    collapsed,
    targetId,
    position,
    {
      ...activeWidget,
      props: nextProps,
      layout: clampLayoutToColumns(movedLayout, targetColumns),
    }
  )
  return inserted ? nextWidgets : widgets
}

export const moveWidgetToContainer = (
  widgets: BuilderWidgetInstance[],
  activeId: string,
  parentId: string,
  slot?: string,
  targetLayout?: Partial<Layout>
) => {
  if (activeId === parentId) {
    return widgets
  }

  const activeWidget = findWidgetById(widgets, activeId)
  const parentWidget = findWidgetById(widgets, parentId)
  if (!activeWidget || !parentWidget) {
    return widgets
  }

  const parentInActiveSubtree = Boolean(findWidgetById(activeWidget.children ?? [], parentId))
  if (parentInActiveSubtree) {
    return widgets
  }

  const activeLayout = resolveWidgetLayout(activeWidget, widgets)
  const spacing = resolveWidgetSpacing(activeWidget.type, activeWidget.spacing)
  const sourceColumns = resolveWidgetColumnsInTree(widgets, activeId)
  const withoutActive = removeWidgetById(widgets, activeId)
  const nextParent = findWidgetById(withoutActive, parentId)
  if (!nextParent) {
    return widgets
  }

  const targetColumns = resolveContainerColumns(nextParent)
  const baseLayout = getDefaultWidgetLayout(
    nextParent.children ?? [],
    activeWidget.type,
    targetColumns
  )
  const nextSlot = typeof slot === 'string' ? slot.trim() : ''
  const nextProps = { ...(activeWidget.props ?? {}) } as Record<string, unknown>
  if (nextSlot) {
    nextProps.containerSlot = nextSlot
  } else if ('containerSlot' in nextProps) {
    delete nextProps.containerSlot
  }
  const propsWithMemory = withMultiColumnLayoutMemory(
    nextProps,
    activeLayout,
    sourceColumns,
    targetColumns
  )
  const { w: nextW, minW: nextMinW, maxW: nextMaxW } = resolveTransferWidth({
    props: propsWithMemory,
    activeLayout,
    baseLayout,
    targetLayout,
    sourceColumns,
    targetColumns,
    widgetType: activeWidget.type,
  })

  const movedWidget: BuilderWidgetInstance = {
    ...activeWidget,
    props: propsWithMemory,
    spacing,
    layout: clampLayoutToColumns(
      applySpacingToLayout(
        {
          ...baseLayout,
          x: targetLayout?.x ?? baseLayout.x,
          y: targetLayout?.y ?? baseLayout.y,
          w: nextW,
          h:
            targetLayout?.h ??
            activeLayout.h ??
            getDefaultWidgetHeight(activeWidget.type),
          minW: nextMinW,
          minH:
            targetLayout?.minH ??
            activeLayout.minH ??
            getDefaultWidgetMinH(activeWidget.type, spacing),
          maxW: nextMaxW,
          maxH: activeLayout.maxH,
        },
        spacing
      ),
      targetColumns
    ),
  }

  return addChildWidget(withoutActive, parentId, movedWidget)
}

export type WidgetScope = 'page' | 'appFrame' | 'pageFrame'

export type ScopedMoveInput = {
  pageWidgets: BuilderWidgetInstance[]
  pageFrameWidgets: BuilderWidgetInstance[]
  appFrameWidgets: BuilderWidgetInstance[]
}

export type ScopedMoveResult = ScopedMoveInput & {
  moved: boolean
  appFrameWidgetsChanged: boolean
  targetScope: WidgetScope | null
}

export const resolveWidgetScope = (
  widgetId: string,
  trees: ScopedMoveInput
): WidgetScope | null => {
  if (findWidgetById(trees.pageWidgets, widgetId)) {
    return 'page'
  }
  if (findWidgetById(trees.pageFrameWidgets, widgetId)) {
    return 'pageFrame'
  }
  if (findWidgetById(trees.appFrameWidgets, widgetId)) {
    return 'appFrame'
  }
  return null
}

export const getTreeForScope = (
  scope: WidgetScope,
  trees: ScopedMoveInput
): BuilderWidgetInstance[] => {
  if (scope === 'page') {
    return trees.pageWidgets
  }
  if (scope === 'pageFrame') {
    return trees.pageFrameWidgets
  }
  return trees.appFrameWidgets
}

export const setTreeForScope = (
  scope: WidgetScope,
  widgets: BuilderWidgetInstance[],
  trees: ScopedMoveInput
): ScopedMoveInput => {
  if (scope === 'page') {
    return {
      ...trees,
      pageWidgets: widgets,
    }
  }
  if (scope === 'pageFrame') {
    return {
      ...trees,
      pageFrameWidgets: widgets,
    }
  }
  return {
    ...trees,
    appFrameWidgets: widgets,
  }
}

export const withContainerSlot = (
  props: Record<string, unknown> | undefined,
  slot?: string
): Record<string, unknown> => {
  const nextSlot = typeof slot === 'string' ? slot.trim() : ''
  const nextProps = { ...(props ?? {}) }
  if (nextSlot) {
    nextProps.containerSlot = nextSlot
  } else if ('containerSlot' in nextProps) {
    delete nextProps.containerSlot
  }
  return nextProps
}

export const MULTI_COLUMN_LAYOUT_MEMORY_PROP = '__builderPrevMultiColumnLayout'

export type MultiColumnLayoutMemory = {
  w: number
  minW?: number
  maxW?: number
}

export const getMultiColumnLayoutMemory = (
  props: Record<string, unknown> | undefined
): MultiColumnLayoutMemory | null => {
  const raw = props?.[MULTI_COLUMN_LAYOUT_MEMORY_PROP]
  if (!raw || typeof raw !== 'object') {
    return null
  }
  const record = raw as Record<string, unknown>
  const parsedW = Number(record.w)
  if (!Number.isFinite(parsedW) || parsedW <= 1) {
    return null
  }
  const parsedMinW = Number(record.minW)
  const parsedMaxW = Number(record.maxW)
  return {
    w: parsedW,
    minW: Number.isFinite(parsedMinW) ? parsedMinW : undefined,
    maxW: Number.isFinite(parsedMaxW) ? parsedMaxW : undefined,
  }
}

export const withMultiColumnLayoutMemory = (
  props: Record<string, unknown> | undefined,
  layout: ReturnType<typeof resolveWidgetLayout>,
  sourceColumns: number,
  targetColumns: number
): Record<string, unknown> => {
  const nextProps = { ...(props ?? {}) }
  if (sourceColumns > 1 && targetColumns === 1) {
    nextProps[MULTI_COLUMN_LAYOUT_MEMORY_PROP] = {
      w: layout.w,
      minW: layout.minW,
      maxW: layout.maxW,
    } satisfies MultiColumnLayoutMemory
  }
  return nextProps
}

export const resolveTransferWidth = (input: {
  props: Record<string, unknown> | undefined
  activeLayout: ReturnType<typeof resolveWidgetLayout>
  baseLayout: ReturnType<typeof getDefaultWidgetLayout>
  targetLayout?: Partial<Layout>
  sourceColumns: number
  targetColumns: number
  widgetType: string
}): { w: number; minW: number; maxW: number | undefined } => {
  const { props, activeLayout, baseLayout, targetLayout, sourceColumns, targetColumns, widgetType } =
    input
  const restoringFromSingleColumn = shouldResetWidthOnColumnIncrease(sourceColumns, targetColumns)
  const fallbackMinW = baseLayout.minW ?? getDefaultWidgetMinW(widgetType)
  const targetW = typeof targetLayout?.w === 'number' ? targetLayout.w : undefined
  const targetMinW = typeof targetLayout?.minW === 'number' ? targetLayout.minW : undefined

  if (restoringFromSingleColumn) {
    const saved = getMultiColumnLayoutMemory(props)
    const restoredW = targetW && targetW > 1 ? targetW : undefined
    const restoredMinW = targetMinW && targetMinW > 1 ? targetMinW : undefined
    return {
      w: restoredW ?? saved?.w ?? baseLayout.w,
      minW: restoredMinW ?? saved?.minW ?? fallbackMinW,
      maxW: saved?.maxW ?? activeLayout.maxW,
    }
  }

  return {
    w: targetW ?? activeLayout.w ?? baseLayout.w,
    minW: targetMinW ?? activeLayout.minW ?? fallbackMinW,
    maxW: activeLayout.maxW,
  }
}

export const resolveContainerColumns = (parentWidget: BuilderWidgetInstance): number => {
  if (parentWidget.type === 'GlobalSidebar' || parentWidget.type === 'Sidebar') {
    return 1
  }
  return GRID_COLUMNS
}

export const resolveWidgetColumnsInTree = (
  widgets: BuilderWidgetInstance[],
  widgetId: string,
  rootColumns = GRID_COLUMNS
): number => {
  const parentWidget = findWidgetParentById(widgets, widgetId)
  if (!parentWidget) {
    return Math.max(1, rootColumns)
  }
  return resolveContainerColumns(parentWidget)
}

export const shouldResetWidthOnColumnIncrease = (sourceColumns: number, targetColumns: number) =>
  sourceColumns === 1 && targetColumns > 1

export const clampLayoutToColumns = (
  layout: BuilderWidgetInstance['layout'],
  columns: number
): BuilderWidgetInstance['layout'] => {
  if (!layout) {
    return layout
  }
  const safeColumns = Math.max(1, columns)
  const nextW = Math.max(1, Math.min(layout.w ?? DEFAULT_WIDGET_LAYOUT.w, safeColumns))
  const nextX = Math.max(0, Math.min(layout.x ?? 0, safeColumns - nextW))
  const nextMinW = Math.max(1, Math.min(layout.minW ?? nextW, nextW))
  const nextMaxW =
    typeof layout.maxW === 'number'
      ? Math.max(nextMinW, Math.min(layout.maxW, safeColumns))
      : undefined
  return {
    ...layout,
    x: nextX,
    w: nextW,
    minW: nextMinW,
    maxW: nextMaxW,
  }
}

export const moveWidgetToContainerAcrossScopes = (
  input: ScopedMoveInput & {
    activeId: string
    parentId: string
    slot?: string
    targetLayout?: Partial<Layout>
  }
): ScopedMoveResult => {
  const { activeId, parentId, slot, targetLayout, ...trees } = input
  const sourceScope = resolveWidgetScope(activeId, trees)
  const targetScope = resolveWidgetScope(parentId, trees)

  if (!sourceScope || !targetScope || activeId === parentId) {
    return {
      ...trees,
      moved: false,
      appFrameWidgetsChanged: false,
      targetScope: null,
    }
  }

  if (sourceScope === targetScope) {
    const sourceTree = getTreeForScope(sourceScope, trees)
    const nextTree = moveWidgetToContainer(
      sourceTree,
      activeId,
      parentId,
      slot,
      targetLayout
    )
    if (nextTree === sourceTree) {
      return {
        ...trees,
        moved: false,
        appFrameWidgetsChanged: false,
        targetScope: null,
      }
    }
    const nextTrees = setTreeForScope(sourceScope, nextTree, trees)
    return {
      ...nextTrees,
      moved: true,
      appFrameWidgetsChanged: sourceScope === 'appFrame',
      targetScope,
    }
  }

  const sourceTree = getTreeForScope(sourceScope, trees)
  const targetTree = getTreeForScope(targetScope, trees)
  const activeWidget = findWidgetById(sourceTree, activeId)
  const parentWidget = findWidgetById(targetTree, parentId)

  if (!activeWidget || !parentWidget) {
    return {
      ...trees,
      moved: false,
      appFrameWidgetsChanged: false,
      targetScope: null,
    }
  }
  if (isFrameType(activeWidget.type)) {
    return {
      ...trees,
      moved: false,
      appFrameWidgetsChanged: false,
      targetScope: null,
    }
  }

  if (findWidgetById(activeWidget.children ?? [], parentId)) {
    return {
      ...trees,
      moved: false,
      appFrameWidgetsChanged: false,
      targetScope: null,
    }
  }

  const activeLayout = resolveWidgetLayout(activeWidget, sourceTree)
  const spacing = resolveWidgetSpacing(activeWidget.type, activeWidget.spacing)
  const sourceColumns = resolveWidgetColumnsInTree(sourceTree, activeId)
  const targetColumns = resolveContainerColumns(parentWidget)
  const baseLayout = getDefaultWidgetLayout(
    parentWidget.children ?? [],
    activeWidget.type,
    targetColumns
  )
  const propsWithSlot = withContainerSlot(
    activeWidget.props as Record<string, unknown> | undefined,
    slot
  )
  const propsWithMemory = withMultiColumnLayoutMemory(
    propsWithSlot,
    activeLayout,
    sourceColumns,
    targetColumns
  )
  const { w: nextW, minW: nextMinW, maxW: nextMaxW } = resolveTransferWidth({
    props: propsWithMemory,
    activeLayout,
    baseLayout,
    targetLayout,
    sourceColumns,
    targetColumns,
    widgetType: activeWidget.type,
  })
  const movedWidget: BuilderWidgetInstance = {
    ...activeWidget,
    props: propsWithMemory,
    spacing,
    layout: clampLayoutToColumns(
      applySpacingToLayout(
        {
          ...baseLayout,
          x: targetLayout?.x ?? baseLayout.x,
          y: targetLayout?.y ?? baseLayout.y,
          w: nextW,
          h:
            targetLayout?.h ??
            activeLayout.h ??
            getDefaultWidgetHeight(activeWidget.type),
          minW: nextMinW,
          minH:
            targetLayout?.minH ??
            activeLayout.minH ??
            getDefaultWidgetMinH(activeWidget.type, spacing),
          maxW: nextMaxW,
          maxH: activeLayout.maxH,
        },
        spacing
      ),
      targetColumns
    ),
  }

  const nextSourceTree = removeWidgetById(sourceTree, activeId)
  const nextTargetTree = addChildWidget(targetTree, parentId, movedWidget)
  const afterSource = setTreeForScope(sourceScope, nextSourceTree, trees)
  const nextTrees = setTreeForScope(targetScope, nextTargetTree, afterSource)

  return {
    ...nextTrees,
    moved: true,
    appFrameWidgetsChanged: sourceScope === 'appFrame' || targetScope === 'appFrame',
    targetScope,
  }
}

export const moveWidgetAdjacentAcrossScopes = (
  input: ScopedMoveInput & {
    activeId: string
    targetId: string
    position: 'above' | 'below'
  }
): ScopedMoveResult => {
  const { activeId, targetId, position, ...trees } = input
  const sourceScope = resolveWidgetScope(activeId, trees)
  const targetScope = resolveWidgetScope(targetId, trees)

  if (!sourceScope || !targetScope || activeId === targetId) {
    return {
      ...trees,
      moved: false,
      appFrameWidgetsChanged: false,
      targetScope: null,
    }
  }

  if (sourceScope === targetScope) {
    const sourceTree = getTreeForScope(sourceScope, trees)
    const nextTree = moveWidgetAdjacent(sourceTree, activeId, targetId, position)
    if (nextTree === sourceTree) {
      return {
        ...trees,
        moved: false,
        appFrameWidgetsChanged: false,
        targetScope: null,
      }
    }
    const nextTrees = setTreeForScope(sourceScope, nextTree, trees)
    return {
      ...nextTrees,
      moved: true,
      appFrameWidgetsChanged: sourceScope === 'appFrame',
      targetScope,
    }
  }

  const sourceTree = getTreeForScope(sourceScope, trees)
  const targetTree = getTreeForScope(targetScope, trees)
  const activeWidget = findWidgetById(sourceTree, activeId)
  const targetWidget = findWidgetById(targetTree, targetId)

  if (!activeWidget || !targetWidget) {
    return {
      ...trees,
      moved: false,
      appFrameWidgetsChanged: false,
      targetScope: null,
    }
  }
  if (isFrameType(activeWidget.type)) {
    return {
      ...trees,
      moved: false,
      appFrameWidgetsChanged: false,
      targetScope: null,
    }
  }

  const targetParent = findWidgetParentById(targetTree, targetId)
  const targetColumns = targetParent ? resolveContainerColumns(targetParent) : GRID_COLUMNS
  const sourceColumns = resolveWidgetColumnsInTree(sourceTree, activeId)
  const targetSiblings = targetParent?.children ?? targetTree
  const targetBaseLayout = getDefaultWidgetLayout(targetSiblings, activeWidget.type, targetColumns)
  const activeLayout = resolveWidgetLayout(activeWidget, sourceTree)
  const targetSlotRaw = (
    targetWidget.props as Record<string, unknown> | undefined
  )?.containerSlot
  const targetSlot = typeof targetSlotRaw === 'string' ? targetSlotRaw : undefined
  const propsWithSlot = withContainerSlot(
    activeWidget.props as Record<string, unknown> | undefined,
    targetSlot
  )
  const propsWithMemory = withMultiColumnLayoutMemory(
    propsWithSlot,
    activeLayout,
    sourceColumns,
    targetColumns
  )
  const { w: nextW, minW: nextMinW, maxW: nextMaxW } = resolveTransferWidth({
    props: propsWithMemory,
    activeLayout,
    baseLayout: targetBaseLayout,
    sourceColumns,
    targetColumns,
    widgetType: activeWidget.type,
  })
  const movedLayout = {
    ...activeLayout,
    w: nextW,
    minW: nextMinW,
    maxW: nextMaxW,
  }
  const movedWidget: BuilderWidgetInstance = {
    ...activeWidget,
    props: propsWithMemory,
    layout: clampLayoutToColumns(movedLayout, targetColumns),
  }

  const collapsedSourceTree = shiftWidgetsForRemove(
    removeWidgetById(sourceTree, activeId),
    activeLayout
  )
  const [nextTargetTree, inserted] = insertAdjacentWidget(
    targetTree,
    targetId,
    position,
    movedWidget
  )
  if (!inserted) {
    return {
      ...trees,
      moved: false,
      appFrameWidgetsChanged: false,
      targetScope: null,
    }
  }

  const afterSource = setTreeForScope(sourceScope, collapsedSourceTree, trees)
  const nextTrees = setTreeForScope(targetScope, nextTargetTree, afterSource)

  return {
    ...nextTrees,
    moved: true,
    appFrameWidgetsChanged: sourceScope === 'appFrame' || targetScope === 'appFrame',
    targetScope,
  }
}

export const moveWidgetToPageRootAcrossScopes = (
  input: ScopedMoveInput & {
    activeId: string
    targetLayout?: Partial<Layout>
  }
): ScopedMoveResult => {
  const { activeId, targetLayout, ...trees } = input
  const sourceScope = resolveWidgetScope(activeId, trees)
  if (!sourceScope) {
    return {
      ...trees,
      moved: false,
      appFrameWidgetsChanged: false,
      targetScope: null,
    }
  }

  const sourceTree = getTreeForScope(sourceScope, trees)
  const activeWidget = findWidgetById(sourceTree, activeId)
  if (!activeWidget) {
    return {
      ...trees,
      moved: false,
      appFrameWidgetsChanged: false,
      targetScope: null,
    }
  }
  if (isFrameType(activeWidget.type)) {
    return {
      ...trees,
      moved: false,
      appFrameWidgetsChanged: false,
      targetScope: null,
    }
  }

  if (sourceScope === 'page' && !findWidgetParentById(trees.pageWidgets, activeId)) {
    return {
      ...trees,
      moved: false,
      appFrameWidgetsChanged: false,
      targetScope: null,
    }
  }

  const activeLayout = resolveWidgetLayout(activeWidget, sourceTree)
  const spacing = resolveWidgetSpacing(activeWidget.type, activeWidget.spacing)
  const sourceColumns = resolveWidgetColumnsInTree(sourceTree, activeId)
  const sourceWithoutActive = removeWidgetById(sourceTree, activeId)
  const treesAfterSource =
    sourceScope === 'page'
      ? { ...trees, pageWidgets: sourceWithoutActive }
      : setTreeForScope(sourceScope, sourceWithoutActive, trees)
  const pageWidgetsBase = treesAfterSource.pageWidgets
  const baseLayout = getDefaultWidgetLayout(pageWidgetsBase, activeWidget.type)
  const propsWithSlot = withContainerSlot(
    activeWidget.props as Record<string, unknown> | undefined,
    undefined
  )
  const propsWithMemory = withMultiColumnLayoutMemory(
    propsWithSlot,
    activeLayout,
    sourceColumns,
    GRID_COLUMNS
  )
  const { w: nextW, minW: nextMinW, maxW: nextMaxW } = resolveTransferWidth({
    props: propsWithMemory,
    activeLayout,
    baseLayout,
    targetLayout,
    sourceColumns,
    targetColumns: GRID_COLUMNS,
    widgetType: activeWidget.type,
  })
  const movedWidget: BuilderWidgetInstance = {
    ...activeWidget,
    props: propsWithMemory,
    spacing,
    layout: clampLayoutToColumns(
      applySpacingToLayout(
        {
          ...baseLayout,
          x: targetLayout?.x ?? baseLayout.x,
          y: targetLayout?.y ?? baseLayout.y,
          w: nextW,
          h:
            targetLayout?.h ??
            activeLayout.h ??
            getDefaultWidgetHeight(activeWidget.type),
          minW: nextMinW,
          minH:
            targetLayout?.minH ??
            activeLayout.minH ??
            getDefaultWidgetMinH(activeWidget.type, spacing),
          maxW: nextMaxW,
          maxH: activeLayout.maxH,
        },
        spacing
      ),
      GRID_COLUMNS
    ),
  }
  const nextPageWidgets = [...pageWidgetsBase, movedWidget]

  return {
    ...treesAfterSource,
    pageWidgets: nextPageWidgets,
    moved: true,
    appFrameWidgetsChanged: sourceScope === 'appFrame',
    targetScope: 'page',
  }
}

export const reorderWidgetInList = (
  widgets: BuilderWidgetInstance[],
  activeId: string,
  overId: string
) => {
  const fromIndex = widgets.findIndex((widget) => widget.id === activeId)
  const toIndex = widgets.findIndex((widget) => widget.id === overId)
  if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
    return widgets
  }
  const nextWidgets = [...widgets]
  const [moved] = nextWidgets.splice(fromIndex, 1)
  nextWidgets.splice(toIndex, 0, moved)
  return nextWidgets
}

export const reorderWidgetInTree = (
  widgets: BuilderWidgetInstance[],
  activeId: string,
  overId: string,
  parentId: string | null
) => {
  if (!parentId) {
    return reorderWidgetInList(widgets, activeId, overId)
  }

  return updateWidgetById(widgets, parentId, (parent) => {
    if (!parent.children || parent.children.length === 0) {
      return parent
    }
    return {
      ...parent,
      children: reorderWidgetInList(parent.children, activeId, overId),
    }
  })
}

export const collectPolicyKeys = (
  pages: BuilderPage[],
  appFrameWidgets: BuilderWidgetInstance[]
) => {
  const keys = new Set<string>()

  collectWidgetPolicyKeys(appFrameWidgets, keys)
  pages.forEach((page) => {
    collectWidgetPolicyKeys(getPageFrameWidgets(resolvePageFramesState(page)), keys)
    collectWidgetPolicyKeys(resolvePageWidgetsState(page), keys)
    collectMenuKeys(page.menu?.items ?? [], keys)
  })

  return Array.from(keys)
}

export const collectWidgetPolicyKeys = (widgets: BuilderWidgetInstance[], keys: Set<string>) => {
  widgets.forEach((widget) => {
    addPolicyKeys(widget.policy, keys)
    if (widget.children && widget.children.length > 0) {
      collectWidgetPolicyKeys(widget.children, keys)
    }
  })
}

export const addPolicyKeys = (policy: string[] | string | undefined, keys: Set<string>) => {
  if (Array.isArray(policy)) {
    policy
      .map((entry) => entry.trim())
      .filter(Boolean)
      .forEach((entry) => keys.add(entry))
    return
  }

  if (typeof policy === 'string') {
    const trimmed = policy.trim()
    if (trimmed) {
      keys.add(trimmed)
    }
  }
}

export const collectMenuKeys = (items: BuilderMenuItem[], keys: Set<string>) => {
  items.forEach((item) => {
    addPolicyKeys(item.policy, keys)
    if (item.items && item.items.length > 0) {
      collectMenuKeys(item.items, keys)
    }
  })
}
