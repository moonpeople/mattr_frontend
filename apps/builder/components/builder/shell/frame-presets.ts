/**
 * Preset-утилиты для системных frame-виджетов (header/sidebar/drawer/modal).
 */
import { getWidgetDefinition } from 'widgets/runtime'

import type { BuilderWidgetInstance } from '../types'
import { resolveWidgetSpacing } from '../types'
import { applySpacingToLayout, DEFAULT_WIDGET_LAYOUT } from './layout-ops'

interface BuildWidgetInstanceParams {
  widgetType: string
  layout: BuilderWidgetInstance['layout']
  props?: Record<string, unknown>
  existingIds: Set<string>
  buildWidgetId: (widgetType: string, existingIds?: Set<string>) => string
}

const buildWidgetInstance = ({
  widgetType,
  layout,
  props,
  existingIds,
  buildWidgetId,
}: BuildWidgetInstanceParams): BuilderWidgetInstance | null => {
  const definition = getWidgetDefinition(widgetType)
  if (!definition || !layout) {
    return null
  }
  const spacing = resolveWidgetSpacing(widgetType)
  const layoutWithSpacing = applySpacingToLayout(layout, spacing)
  return {
    id: buildWidgetId(widgetType, existingIds),
    type: widgetType,
    props: { ...definition.defaultProps, ...(props ?? {}) },
    layout: layoutWithSpacing ?? layout,
    spacing,
    policy: [],
    visibleWhen: '',
    disabledWhen: '',
  }
}

export interface BuildGlobalPresetChildrenParams {
  type: string
  parentId: string
  existingIds: Set<string>
  buildWidgetId: (widgetType: string, existingIds?: Set<string>) => string
}

export const buildGlobalPresetChildren = ({
  type,
  parentId,
  existingIds,
  buildWidgetId,
}: BuildGlobalPresetChildrenParams): BuilderWidgetInstance[] => {
  const children: BuilderWidgetInstance[] = []
  const baseLayout = (
    x: number,
    y: number,
    w: number,
    h: number
  ): BuilderWidgetInstance['layout'] => ({
    x,
    y,
    w,
    h,
    minW: DEFAULT_WIDGET_LAYOUT.minW,
    minH: DEFAULT_WIDGET_LAYOUT.minH,
  })
  const compactLayout = (
    x: number,
    y: number,
    w: number,
    h: number
  ): BuilderWidgetInstance['layout'] => ({
    x,
    y,
    w,
    h,
    minW: 1,
    minH: 1,
  })
  const buildCloseEvents = (targetId?: string) => {
    if (!targetId) {
      return []
    }
    return [
      {
        event: 'click',
        type: 'widget',
        method: 'setHidden',
        pluginId: targetId,
        params: { hidden: true },
        waitType: 'debounce',
        waitMs: '0',
      },
    ]
  }

  if (type === 'GlobalHeader') {
    const logo = buildWidgetInstance({
      widgetType: 'Image',
      layout: baseLayout(0, 0, 2, 4),
      props: { alt: 'Logo' },
      existingIds,
      buildWidgetId,
    })
    const nav = buildWidgetInstance({
      widgetType: 'Navigation',
      layout: baseLayout(2, 0, 8, 4),
      props: { variant: 'horizontal', showPath: false },
      existingIds,
      buildWidgetId,
    })
    if (logo) {
      children.push(logo)
    }
    if (nav) {
      children.push(nav)
    }
    return children
  }

  if (type === 'GlobalSidebar') {
    const logo = buildWidgetInstance({
      widgetType: 'Image',
      layout: baseLayout(0, 0, 12, 5),
      props: { alt: 'Logo' },
      existingIds,
      buildWidgetId,
    })
    const nav = buildWidgetInstance({
      widgetType: 'Navigation',
      layout: baseLayout(0, 5, 12, 18),
      props: { variant: 'vertical', showPath: false },
      existingIds,
      buildWidgetId,
    })
    const avatar = buildWidgetInstance({
      widgetType: 'Avatar',
      layout: baseLayout(0, 23, 12, 5),
      existingIds,
      buildWidgetId,
    })
    if (logo) {
      children.push(logo)
    }
    if (nav) {
      children.push(nav)
    }
    if (avatar) {
      children.push(avatar)
    }
    return children
  }

  if (type === 'GlobalDrawer' || type === 'GlobalModal') {
    const headerType = type === 'GlobalDrawer' ? 'DrawerHeader' : 'ModalHeader'
    const footerType = type === 'GlobalDrawer' ? 'DrawerFooter' : 'ModalFooter'
    const titleType = type === 'GlobalDrawer' ? 'DrawerTitle' : 'ModalTitle'
    const closeType =
      type === 'GlobalDrawer' ? 'DrawerCloseButton' : 'ModalCloseButton'
    const header = buildWidgetInstance({
      widgetType: headerType,
      layout: baseLayout(0, 0, 12, 3),
      props: { showSeparator: true, padding: 'normal' },
      existingIds,
      buildWidgetId,
    })
    const footer = buildWidgetInstance({
      widgetType: footerType,
      layout: baseLayout(0, 0, 12, 3),
      props: { showSeparator: true, padding: 'normal' },
      existingIds,
      buildWidgetId,
    })
    if (header) {
      const title = buildWidgetInstance({
        widgetType: titleType,
        layout: compactLayout(0, 0, 9, 2),
        existingIds,
        buildWidgetId,
      })
      const close = buildWidgetInstance({
        widgetType: closeType,
        layout: compactLayout(9, 0, 3, 2),
        props: { events: buildCloseEvents(parentId) },
        existingIds,
        buildWidgetId,
      })
      header.children = [title, close].filter(Boolean) as BuilderWidgetInstance[]
      children.push(header)
    }
    if (footer) {
      children.push(footer)
    }
    return children
  }

  return children
}
