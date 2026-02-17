/**
 * Чистые helper-модели, используемые frame-рендерерами canvas.
 */
import { type CSSProperties } from 'react'
import { getWidgetDefinition } from 'widgets/runtime'
import { resolveValue } from 'lib/builder/value-resolver'

import type { BuilderWidgetAddOptions, BuilderWidgetInstance } from '../../types'
import {
  resolvePagePaddingValue,
  resolveSpacingPadding,
  resolveWidgetSpacingModes,
} from '../../types'
import { resolveWidgetStyleScopeVars } from '../../widgetStyleOverrides'
import {
  getGlobalFrameBackgroundClass,
  getGlobalFramePaddingClass,
  normalizeSlotValue,
  parseBoolean,
  resolveGlobalFrameVisualConfig,
  resolveShowInEditor,
} from '../shared'
import type { Layout } from 'react-grid-layout'

export type CanvasFrameVariant =
  | 'header'
  | 'sidebar'
  | 'drawer'
  | 'modal'
  | 'split'
  | 'other'

type OverlayVariant = 'modal' | 'drawer'

type FrameGridMode = 'app-frame' | 'page-frame'

type FrameGridOptionHandlers = {
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
}

export const resolveFrameGridOptions = (
  mode: FrameGridMode,
  handlers: FrameGridOptionHandlers
) => ({
  onUpdateChildLayout:
    mode === 'page-frame'
      ? handlers.onUpdatePageFrameChildLayout
      : handlers.onUpdateAppFrameChildLayout,
  onDropWidget:
    mode === 'page-frame' ? handlers.onDropPageFrameWidget : handlers.onDropAppFrameWidget,
  onUpdateWidgetLayout:
    mode === 'page-frame'
      ? handlers.onUpdatePageFrameWidgetLayout
      : handlers.onUpdateAppFrameWidgetLayout,
})

type ResolveGlobalFrameContextParams = {
  widget: BuilderWidgetInstance
  variant: CanvasFrameVariant
  selectedFrameWidgetId?: string | null
  pageFrameIds: Set<string>
  evaluationContext?: Record<string, unknown>
}

export const resolveGlobalFrameContext = ({
  widget,
  variant,
  selectedFrameWidgetId,
  pageFrameIds,
  evaluationContext,
}: ResolveGlobalFrameContextParams) => {
  const definition = getWidgetDefinition(widget.type)
  const label = definition?.label ?? widget.type
  const isActive = selectedFrameWidgetId === widget.id
  const isHidden = parseBoolean(resolveValue(widget.hidden, evaluationContext ?? {}), false)
  const showInEditor = resolveShowInEditor(widget, evaluationContext)
  const hideInEditor = isHidden && !showInEditor
  const mode: FrameGridMode = pageFrameIds.has(widget.id) ? 'page-frame' : 'app-frame'
  const resolvedProps = resolveValue(widget.props ?? {}, evaluationContext ?? {})
  const rawProps = (resolvedProps && typeof resolvedProps === 'object'
    ? (resolvedProps as Record<string, unknown>)
    : undefined) as Record<string, unknown> | undefined
  const widgetStyleScopeVars = resolveWidgetStyleScopeVars(rawProps)
  const frameVisual = resolveGlobalFrameVisualConfig(rawProps)
  const frameSpacing = resolveWidgetSpacingModes(widget.type, widget.spacing, (expression) =>
    resolveValue(expression, evaluationContext ?? {})
  )
  const frameMargin = resolveSpacingPadding(frameSpacing, (expression) =>
    resolveValue(expression, evaluationContext ?? {})
  )
  const framePadding = resolveSpacingPadding(
    frameSpacing,
    (expression) => resolveValue(expression, evaluationContext ?? {}),
    'padding'
  )
  const frameHeaderPadding = resolveSpacingPadding(
    frameSpacing,
    (expression) => resolveValue(expression, evaluationContext ?? {}),
    'headerPadding'
  )
  const frameFooterPadding = resolveSpacingPadding(
    frameSpacing,
    (expression) => resolveValue(expression, evaluationContext ?? {}),
    'footerPadding'
  )
  const frameMarginStyle = { margin: frameMargin } as CSSProperties
  const frameContentPadding = resolvePagePaddingValue(
    {
      paddingMode: frameSpacing.marginMode === 'none' ? 'none' : 'normal',
      paddingFxEnabled: frameSpacing.marginFxEnabled,
      paddingFx: frameSpacing.marginFx,
    },
    (expression) => resolveValue(expression, evaluationContext ?? {})
  )
  const frameContentInsetStyle = { padding: frameContentPadding } as CSSProperties
  const sidebarContentInsetStyle = { padding: framePadding } as CSSProperties
  const baseClass = getGlobalFrameBackgroundClass(frameVisual.background)
  const borderClass = frameVisual.bordered ? 'border border-border' : 'border border-transparent'
  const contentPaddingClass = getGlobalFramePaddingClass(frameVisual.padding)
  const isInlineFrame = variant === 'header' || variant === 'sidebar' || variant === 'split'
  const isHeaderFrame = variant === 'header'
  const minHeightClass =
    variant === 'header'
      ? 'min-h-0'
      : variant === 'sidebar'
        ? 'min-h-full h-full'
        : 'min-h-[120px]'

  return {
    definition,
    label,
    isActive,
    isHidden,
    hideInEditor,
    mode,
    rawProps,
    widgetStyleScopeVars,
    frameVisual,
    frameMargin,
    framePadding,
    frameHeaderPadding,
    frameFooterPadding,
    frameMarginStyle,
    frameContentInsetStyle,
    sidebarContentInsetStyle,
    baseClass,
    borderClass,
    contentPaddingClass,
    isInlineFrame,
    isHeaderFrame,
    minHeightClass,
  }
}

export const selectFrameSlotChildren = (
  children: BuilderWidgetInstance[],
  slot: 'header' | 'body' | 'footer',
  includeUnassigned = false
) =>
  children.filter((child) => {
    const childSlot = normalizeSlotValue(
      (child.props as Record<string, unknown> | undefined)?.containerSlot
    )
    if (slot === 'body') {
      if (childSlot === 'body') {
        return true
      }
      return includeUnassigned ? childSlot.length === 0 : false
    }
    return childSlot === slot
  })

type OverlayProps = {
  title?: string
  showHeader?: boolean
  showFooter?: boolean
  showOverlay?: boolean
  closeOnOutsideClick?: boolean
  padding?: 'sm' | 'md' | 'lg'
  bordered?: boolean
  background?: 'surface' | 'muted' | 'transparent'
  width?: string
  size?: string
  expandToFit?: boolean
}

type ResolveOverlayFrameContextParams = {
  widget: BuilderWidgetInstance
  variant: OverlayVariant
  selectedFrameWidgetId?: string | null
  pageFrameIds: Set<string>
  evaluationContext?: Record<string, unknown>
}

export const resolveOverlayFrameContext = ({
  widget,
  variant,
  selectedFrameWidgetId,
  pageFrameIds,
  evaluationContext,
}: ResolveOverlayFrameContextParams) => {
  const definition = getWidgetDefinition(widget.type)
  const label = definition?.label ?? widget.type
  const isHidden = parseBoolean(resolveValue(widget.hidden, evaluationContext ?? {}), false)
  const resolvedOverlayProps = resolveValue(widget.props ?? {}, evaluationContext ?? {})
  const overlayProps = (resolvedOverlayProps && typeof resolvedOverlayProps === 'object'
    ? (resolvedOverlayProps as Record<string, unknown>)
    : undefined) as OverlayProps | undefined
  const overlayVisual = resolveGlobalFrameVisualConfig(overlayProps)
  const title = typeof overlayProps?.title === 'string' ? overlayProps.title : label
  const isActive = selectedFrameWidgetId === widget.id
  const mode: FrameGridMode = pageFrameIds.has(widget.id) ? 'page-frame' : 'app-frame'
  const sectionTypes =
    variant === 'drawer'
      ? { header: 'DrawerHeader', footer: 'DrawerFooter' }
      : { header: 'ModalHeader', footer: 'ModalFooter' }
  const headerWidget = widget.children?.find((child) => child.type === sectionTypes.header)
  const footerWidget = widget.children?.find((child) => child.type === sectionTypes.footer)
  const headerHidden = headerWidget
    ? parseBoolean(resolveValue(headerWidget.hidden, evaluationContext ?? {}), false)
    : false
  const footerHidden = footerWidget
    ? parseBoolean(resolveValue(footerWidget.hidden, evaluationContext ?? {}), false)
    : false
  const headerShowInEditor = headerWidget
    ? resolveShowInEditor(headerWidget, evaluationContext)
    : false
  const footerShowInEditor = footerWidget
    ? resolveShowInEditor(footerWidget, evaluationContext)
    : false
  const contentWidgets = (widget.children ?? []).filter(
    (child) => child.id !== headerWidget?.id && child.id !== footerWidget?.id
  )
  const showHeader = overlayProps?.showHeader !== false && (!headerHidden || headerShowInEditor)
  const showFooter = overlayProps?.showFooter !== false && (!footerHidden || footerShowInEditor)
  const showOverlay = overlayProps?.showOverlay !== false
  const closeOnOutsideClick = overlayProps?.closeOnOutsideClick !== false
  const overlayClass =
    variant === 'modal' ? 'items-center justify-center' : 'items-stretch justify-end'
  const drawerWidths: Record<string, number> = {
    small: 320,
    medium: 400,
    large: 480,
  }
  const modalSizes: Record<string, number> = {
    small: 480,
    medium: 640,
    large: 800,
  }
  const widthKey = overlayProps?.width ?? 'medium'
  const sizeKey = overlayProps?.size ?? 'medium'
  const drawerWidth = drawerWidths[widthKey] ?? drawerWidths.medium
  const modalWidth = modalSizes[sizeKey] ?? modalSizes.medium
  const expandToFit = overlayProps?.expandToFit === true
  const panelClass =
    variant === 'modal'
      ? expandToFit
        ? 'max-w-[90%] rounded-md h-auto max-h-[85%]'
        : 'max-w-[90%] rounded-md h-[70%] max-h-[80%] min-h-[240px]'
      : 'h-full max-w-[85%]'
  const panelBorderClass = overlayVisual.bordered
    ? variant === 'modal'
      ? 'border border-foreground-muted/30'
      : 'border-l border-foreground-muted/30'
    : variant === 'modal'
      ? 'border border-transparent'
      : 'border-l border-transparent'
  const panelStyle =
    variant === 'modal' ? { width: `${modalWidth}px` } : { width: `${drawerWidth}px` }

  return {
    definition,
    label,
    isHidden,
    overlayProps,
    overlayVisual,
    title,
    isActive,
    mode,
    headerWidget,
    footerWidget,
    headerHidden,
    footerHidden,
    contentWidgets,
    showHeader,
    showFooter,
    showOverlay,
    closeOnOutsideClick,
    overlayClass,
    panelClass,
    panelBorderClass,
    panelStyle,
    widgetStyleScopeVars: resolveWidgetStyleScopeVars(overlayProps),
  }
}
