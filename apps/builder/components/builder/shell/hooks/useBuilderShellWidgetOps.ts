/**
 * Композитор widget-операций BuilderShell.
 * Разбивает монолит на подхуки: CRUD, layout и DnD.
 */
import { useBuilderShellWidgetCrudOps } from './widget-ops/useBuilderShellWidgetCrudOps'
import { useBuilderShellWidgetDndOps } from './widget-ops/useBuilderShellWidgetDndOps'
import { useBuilderShellWidgetLayoutOps } from './widget-ops/useBuilderShellWidgetLayoutOps'
import type { UseBuilderShellWidgetOpsParams } from './widget-ops/types'

export type { UseBuilderShellWidgetOpsParams } from './widget-ops/types'

export const useBuilderShellWidgetOps = ({
  pages,
  activePage,
  activePageId,
  appFrameWidgets,
  activePageFrameWidgets,
  selectedWidget,
  selectedWidgetMode,
  setAppFrameWidgets,
  updatePageWidgetSlotById,
  updatePageFrameSlotById,
  updatePageLayoutSlotById,
  clearWidgetSelection,
  selectMainWidgetNode,
  selectFrameNode,
  resolveWidgetProps,
  buildWidgetId,
  isWidgetPresetCompatible,
}: UseBuilderShellWidgetOpsParams) => {
  const crudOps = useBuilderShellWidgetCrudOps({
    pages,
    activePage,
    activePageId,
    appFrameWidgets,
    activePageFrameWidgets,
    selectedWidget,
    selectedWidgetMode,
    setAppFrameWidgets,
    updatePageWidgetSlotById,
    updatePageFrameSlotById,
    clearWidgetSelection,
  })

  const layoutOps = useBuilderShellWidgetLayoutOps({
    pages,
    activePageId,
    updatePageWidgetSlotById,
    updateAppFrameWidget: crudOps.updateAppFrameWidget,
    updatePageFrameWidget: crudOps.updatePageFrameWidget,
    updateWidget: crudOps.updateWidget,
  })

  const dndOps = useBuilderShellWidgetDndOps({
    pages,
    activePageId,
    appFrameWidgets,
    setAppFrameWidgets,
    updatePageLayoutSlotById,
    updatePageWidgetSlotById,
    selectMainWidgetNode,
    selectFrameNode,
    resolveWidgetProps,
    buildWidgetId,
    isWidgetPresetCompatible,
    updateAppFrameWidget: crudOps.updateAppFrameWidget,
    updatePageFrameWidget: crudOps.updatePageFrameWidget,
    updateWidget: crudOps.updateWidget,
  })

  return {
    ...crudOps,
    ...layoutOps,
    ...dndOps,
  }
}
