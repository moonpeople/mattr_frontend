/**
 * Общие типы для декомпозиции widget-операций BuilderShell.
 */
import type { SetStateAction } from 'react'
import type { Layout } from 'react-grid-layout'

import type { getWidgetDefinition } from 'widgets/runtime'

import type {
  BuilderPage,
  BuilderPageFrames,
  BuilderWidgetAddOptions,
  BuilderWidgetInstance,
  BuilderWidgetSpacing,
} from '../../../types'
import type { BuilderFrameMode, BuilderWidgetMode } from '../../../utils/frame-ops'

export type BuilderWidgetUpdater = (
  widget: BuilderWidgetInstance
) => BuilderWidgetInstance

export type WidgetDefinition = NonNullable<ReturnType<typeof getWidgetDefinition>>

export interface WidgetScopeUpdateOps {
  updateAppFrameWidget: (
    widgetId: string,
    updater: BuilderWidgetUpdater
  ) => void
  updatePageFrameWidget: (
    widgetId: string,
    updater: BuilderWidgetUpdater
  ) => void
  updateWidget: (widgetId: string, updater: BuilderWidgetUpdater) => void
}

export interface UseBuilderShellWidgetCrudOpsParams {
  pages: BuilderPage[]
  activePage: BuilderPage | undefined
  activePageId: string | null
  appFrameWidgets: BuilderWidgetInstance[]
  activePageFrameWidgets: BuilderWidgetInstance[]
  selectedWidget: BuilderWidgetInstance | null
  selectedWidgetMode: BuilderWidgetMode | null
  setAppFrameWidgets: (updater: SetStateAction<BuilderWidgetInstance[]>) => void
  updatePageWidgetSlotById: (
    targetPageId: string,
    updater: (widgets: BuilderWidgetInstance[]) => BuilderWidgetInstance[]
  ) => void
  updatePageFrameSlotById: (
    targetPageId: string,
    updater: (frames: BuilderPageFrames) => BuilderPageFrames
  ) => void
  clearWidgetSelection: () => void
}

export interface UseBuilderShellWidgetLayoutOpsParams extends WidgetScopeUpdateOps {
  pages: BuilderPage[]
  activePageId: string | null
  updatePageWidgetSlotById: (
    targetPageId: string,
    updater: (widgets: BuilderWidgetInstance[]) => BuilderWidgetInstance[]
  ) => void
}

export interface UseBuilderShellWidgetDndOpsParams extends WidgetScopeUpdateOps {
  pages: BuilderPage[]
  activePageId: string | null
  appFrameWidgets: BuilderWidgetInstance[]
  setAppFrameWidgets: (updater: SetStateAction<BuilderWidgetInstance[]>) => void
  updatePageLayoutSlotById: (
    targetPageId: string,
    updater: (page: BuilderPage) => BuilderPage
  ) => void
  updatePageWidgetSlotById: (
    targetPageId: string,
    updater: (widgets: BuilderWidgetInstance[]) => BuilderWidgetInstance[]
  ) => void
  selectMainWidgetNode: (widgetId: string) => void
  selectFrameNode: (widgetId: string) => void
  resolveWidgetProps: (
    definition: WidgetDefinition,
    options?: BuilderWidgetAddOptions
  ) => Record<string, unknown>
  buildWidgetId: (widgetType: string) => string
  isWidgetPresetCompatible: (
    widgetType: string,
    options?: BuilderWidgetAddOptions
  ) => boolean
}

export interface UseBuilderShellWidgetOpsParams {
  pages: BuilderPage[]
  activePage: BuilderPage | undefined
  activePageId: string | null
  appFrameWidgets: BuilderWidgetInstance[]
  activePageFrameWidgets: BuilderWidgetInstance[]
  selectedWidget: BuilderWidgetInstance | null
  selectedWidgetMode: BuilderWidgetMode | null
  setAppFrameWidgets: (updater: SetStateAction<BuilderWidgetInstance[]>) => void
  updatePageWidgetSlotById: (
    targetPageId: string,
    updater: (widgets: BuilderWidgetInstance[]) => BuilderWidgetInstance[]
  ) => void
  updatePageFrameSlotById: (
    targetPageId: string,
    updater: (frames: BuilderPageFrames) => BuilderPageFrames
  ) => void
  updatePageLayoutSlotById: (
    targetPageId: string,
    updater: (page: BuilderPage) => BuilderPage
  ) => void
  clearWidgetSelection: () => void
  selectMainWidgetNode: (widgetId: string) => void
  selectFrameNode: (widgetId: string) => void
  resolveWidgetProps: (
    definition: WidgetDefinition,
    options?: BuilderWidgetAddOptions
  ) => Record<string, unknown>
  buildWidgetId: (widgetType: string) => string
  isWidgetPresetCompatible: (
    widgetType: string,
    options?: BuilderWidgetAddOptions
  ) => boolean
}

export interface WidgetCrudHandlers extends WidgetScopeUpdateOps {
  handleUpdateProps: (patch: Record<string, unknown>) => void
  handleUpdateWidgetPropsById: (
    widgetId: string,
    patch: Record<string, unknown>
  ) => void
  handleUpdateAccess: (patch: {
    policy?: string[]
    visibleWhen?: string
    disabledWhen?: string
  }) => void
  handleUpdateSpacing: (patch: BuilderWidgetSpacing) => void
  handleUpdateHidden: (hidden: boolean | string) => void
  handleToggleWidgetHidden: (
    widgetId: string,
    mode: BuilderWidgetMode
  ) => void
  handleUpdateOverlayChildProps: (
    parentId: string,
    childId: string,
    patch: Record<string, unknown>,
    mode: BuilderFrameMode
  ) => void
  handleSetFrameWidgetHidden: (
    widgetId: string,
    hidden: boolean,
    mode: BuilderFrameMode
  ) => void
  handleDeleteWidget: (widgetId: string, mode: BuilderWidgetMode) => void
  handleReorderWidget: (
    activeId: string,
    overId: string,
    parentId: string | null,
    mode: BuilderWidgetMode
  ) => void
}

export interface WidgetLayoutHandlers {
  handleUpdateLayout: (layout: Layout[]) => void
  handleUpdateWidgetLayout: (widgetId: string, patch: Partial<Layout>) => void
  handleUpdateChildLayout: (parentId: string, layout: Layout[]) => void
  handleUpdateAppFrameChildLayout: (parentId: string, layout: Layout[]) => void
  handleUpdatePageFrameChildLayout: (
    parentId: string,
    layout: Layout[]
  ) => void
  handleUpdateAppFrameWidgetLayout: (
    widgetId: string,
    patch: Partial<Layout>
  ) => void
  handleUpdatePageFrameWidgetLayout: (
    widgetId: string,
    patch: Partial<Layout>
  ) => void
}

export interface WidgetDndHandlers {
  handleDropWidget: (
    widgetType: string,
    layoutItem: Layout,
    parentId?: string,
    options?: BuilderWidgetAddOptions
  ) => void
  handleInsertAdjacentWidget: (
    targetWidgetId: string,
    position: 'above' | 'below',
    widgetType: string,
    options?: BuilderWidgetAddOptions
  ) => void
  handleMoveWidgetAdjacent: (
    activeWidgetId: string,
    targetWidgetId: string,
    position: 'above' | 'below'
  ) => void
  handleMoveWidgetToContainer: (
    activeWidgetId: string,
    parentId: string,
    slot?: string,
    targetLayout?: Partial<Layout>
  ) => void
  handleMoveWidgetToPageRoot: (
    activeWidgetId: string,
    targetLayout?: Partial<Layout>
  ) => void
  handleDropAppFrameWidget: (
    widgetType: string,
    layoutItem: Layout,
    parentId: string,
    options?: BuilderWidgetAddOptions
  ) => void
  handleDropPageFrameWidget: (
    widgetType: string,
    layoutItem: Layout,
    parentId: string,
    options?: BuilderWidgetAddOptions
  ) => void
}
