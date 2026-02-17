/**
 * Вычисляет активные frame-секции (header/sidebar/split/overlays) из frame-виджетов.
 */
import { useMemo } from 'react'
import { resolveSidebarPanelConfig } from 'widgets/runtime'
import { resolveValue } from 'lib/builder/value-resolver'

import type { BuilderWidgetInstance } from '../../types'
import { parseBoolean, resolveShowInEditor } from '../shared'

type FrameSections = Record<
  'header' | 'sidebar' | 'drawer' | 'modal' | 'split' | 'other',
  BuilderWidgetInstance[]
>

const EMPTY_SECTIONS: FrameSections = {
  header: [],
  sidebar: [],
  drawer: [],
  modal: [],
  split: [],
  other: [],
}

const createEmptySections = (): FrameSections => ({
  header: [],
  sidebar: [],
  drawer: [],
  modal: [],
  split: [],
  other: [],
})

export const useCanvasFrameSections = (
  appFrameWidgets: BuilderWidgetInstance[],
  pageFrameWidgets: BuilderWidgetInstance[],
  evaluationContext?: Record<string, unknown>
) => {
  const appSections = useMemo(() => {
    if (!appFrameWidgets.length) {
      return EMPTY_SECTIONS
    }
    const sections = createEmptySections()
    appFrameWidgets.forEach((widget) => {
      if (widget.type === 'GlobalHeader') {
        sections.header.push(widget)
      } else if (widget.type === 'GlobalSidebar') {
        sections.sidebar.push(widget)
      } else {
        sections.other.push(widget)
      }
    })
    return sections
  }, [appFrameWidgets])

  const pageSections = useMemo(() => {
    if (!pageFrameWidgets.length) {
      return EMPTY_SECTIONS
    }
    const sections = createEmptySections()
    pageFrameWidgets.forEach((widget) => {
      if (widget.type === 'GlobalDrawer') {
        sections.drawer.push(widget)
      } else if (widget.type === 'GlobalModal') {
        sections.modal.push(widget)
      } else if (widget.type === 'GlobalSplitPane') {
        sections.split.push(widget)
      } else {
        sections.other.push(widget)
      }
    })
    return sections
  }, [pageFrameWidgets])

  const [activeLeftSidebarWidgets, activeRightSidebarWidgets] = useMemo(() => {
    const left: BuilderWidgetInstance[] = []
    const right: BuilderWidgetInstance[] = []
    appSections.sidebar.forEach((widget) => {
      const resolved = resolveValue(widget.props ?? {}, evaluationContext ?? {})
      const props = (resolved && typeof resolved === 'object'
        ? (resolved as Record<string, unknown>)
        : undefined) as Record<string, unknown> | undefined
      const config = resolveSidebarPanelConfig(props)
      if (config.side === 'right') {
        right.push(widget)
      } else {
        left.push(widget)
      }
    })
    return [left, right]
  }, [appSections.sidebar, evaluationContext])

  const visibleOverlayDrawers = useMemo(
    () =>
      pageSections.drawer.filter((widget) => {
        const isHidden = parseBoolean(resolveValue(widget.hidden, evaluationContext ?? {}), false)
        const showInEditor = resolveShowInEditor(widget, evaluationContext)
        return !isHidden || showInEditor
      }),
    [pageSections.drawer, evaluationContext]
  )

  const visibleOverlayModals = useMemo(
    () =>
      pageSections.modal.filter((widget) => {
        const isHidden = parseBoolean(resolveValue(widget.hidden, evaluationContext ?? {}), false)
        const showInEditor = resolveShowInEditor(widget, evaluationContext)
        return !isHidden || showInEditor
      }),
    [pageSections.modal, evaluationContext]
  )

  const frameWidgetIds = useMemo(
    () => new Set(appFrameWidgets.map((widget) => widget.id)),
    [appFrameWidgets]
  )
  const pageFrameIds = useMemo(
    () => new Set(pageFrameWidgets.map((widget) => widget.id)),
    [pageFrameWidgets]
  )

  return {
    activeHeaderWidgets: appSections.header,
    activeLeftSidebarWidgets,
    activeRightSidebarWidgets,
    activeSplitWidgets: pageSections.split,
    activeOverlayDrawers: pageSections.drawer,
    activeOverlayModals: pageSections.modal,
    activeOtherOverlayWidgets: pageSections.other,
    visibleOverlayDrawers,
    visibleOverlayModals,
    frameWidgetIds,
    pageFrameIds,
  }
}
