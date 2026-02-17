/**
 * Hook сборки props для BuilderInspectorPane (включая route-specific inspector блоки).
 */
import { useMemo } from 'react'
import type {
  Dispatch,
  ElementType,
  MutableRefObject,
  SetStateAction,
} from 'react'
import type { WidgetDefinition } from 'widgets/runtime'

import type { BuilderWidgetInstance } from '../../types'
import type { BuilderInspectorRoute } from '../../utils/inspector-routing'
import type { BuilderFrameMode } from '../../utils/frame-ops'
import type { BuilderInspectorPaneProps } from '../components/BuilderInspectorPane'

type OverlayInspectorProps = NonNullable<BuilderInspectorPaneProps['overlayInspectorProps']>
type FrameInspectorProps = NonNullable<BuilderInspectorPaneProps['frameInspectorProps']>
type WidgetInspectorProps = NonNullable<BuilderInspectorPaneProps['widgetInspectorProps']>

interface InspectorAddonPanelState {
  widgetId: string
  key: string
  label: string
}

interface InspectorAddonPanelSummary {
  key: string
  label: string
}

export interface UseBuilderShellInspectorPanePropsParams {
  isPreviewing: boolean
  selectedWidget: BuilderWidgetInstance | null
  selectedWidgetIcon: ElementType | null
  isRenamingWidget: boolean
  renameInputRef: MutableRefObject<HTMLInputElement | null>
  renameDraft: string
  setRenameDraft: (value: string) => void
  onCommitWidgetRename: () => void
  onCancelWidgetRename: () => void
  isAddonPanelActive: boolean
  activeAddonPanel: InspectorAddonPanelSummary | null
  setInspectorAddonPanel: Dispatch<SetStateAction<InspectorAddonPanelState | null>>
  onStartWidgetRename: () => void
  inspectorMenuOpen: boolean
  setInspectorMenuOpen: (open: boolean) => void
  selectedDefinitionLabel?: string
  hasClipboardWidget: boolean
  canDuplicateSelectedWidget: boolean
  canDeleteSelectedWidget: boolean
  onOpenStatePanel: () => void
  onCopyWidget: () => void
  onCutWidget: () => void
  onDuplicateWidget: () => void
  onResetWidgetState: () => void
  onDeleteWidget: () => void
  onCloseInspector: () => void
  route: BuilderInspectorRoute
  selectedDefinition?: WidgetDefinition
  selectedWidgetParent?: BuilderWidgetInstance | null
  search?: string
  overlayMode: OverlayInspectorProps['mode']
  overlayWidgetMode: BuilderFrameMode | null
  eventTargets?: WidgetInspectorProps['eventTargets']
  eventQueries?: WidgetInspectorProps['eventQueries']
  eventScripts?: WidgetInspectorProps['eventScripts']
  eventPages?: WidgetInspectorProps['eventPages']
  eventApps?: WidgetInspectorProps['eventApps']
  eventVariables?: WidgetInspectorProps['eventVariables']
  fxContextInfo?: WidgetInspectorProps['fxContextInfo']
  onUpdateProps: WidgetInspectorProps['onUpdateProps']
  onUpdateAccess: WidgetInspectorProps['onUpdateAccess']
  onUpdateSpacing: WidgetInspectorProps['onUpdateSpacing']
  onUpdateHidden: WidgetInspectorProps['onUpdateHidden']
  onUpdateChildProps: OverlayInspectorProps['onUpdateChildProps']
  onDeleteSelectedWidget: WidgetInspectorProps['onDelete']
  onActiveAddonPanelChange: WidgetInspectorProps['onActiveAddonPanelChange']
  appInspectorProps: BuilderInspectorPaneProps['appInspectorProps']
  pageComponentInspectorProps: BuilderInspectorPaneProps['pageComponentInspectorProps']
  pageInspectorProps: BuilderInspectorPaneProps['pageInspectorProps']
}

export const useBuilderShellInspectorPaneProps = ({
  isPreviewing,
  selectedWidget,
  selectedWidgetIcon,
  isRenamingWidget,
  renameInputRef,
  renameDraft,
  setRenameDraft,
  onCommitWidgetRename,
  onCancelWidgetRename,
  isAddonPanelActive,
  activeAddonPanel,
  setInspectorAddonPanel,
  onStartWidgetRename,
  inspectorMenuOpen,
  setInspectorMenuOpen,
  selectedDefinitionLabel,
  hasClipboardWidget,
  canDuplicateSelectedWidget,
  canDeleteSelectedWidget,
  onOpenStatePanel,
  onCopyWidget,
  onCutWidget,
  onDuplicateWidget,
  onResetWidgetState,
  onDeleteWidget,
  onCloseInspector,
  route,
  selectedDefinition,
  selectedWidgetParent,
  search,
  overlayMode,
  overlayWidgetMode,
  eventTargets,
  eventQueries,
  eventScripts,
  eventPages,
  eventApps,
  eventVariables,
  fxContextInfo,
  onUpdateProps,
  onUpdateAccess,
  onUpdateSpacing,
  onUpdateHidden,
  onUpdateChildProps,
  onDeleteSelectedWidget,
  onActiveAddonPanelChange,
  appInspectorProps,
  pageComponentInspectorProps,
  pageInspectorProps,
}: UseBuilderShellInspectorPanePropsParams): BuilderInspectorPaneProps => {
  return useMemo(() => {
    const overlayInspectorProps: BuilderInspectorPaneProps['overlayInspectorProps'] =
      route === 'overlay-widget' &&
      selectedWidget &&
      selectedDefinition &&
      overlayWidgetMode
        ? {
            widget: selectedWidget,
            definition: selectedDefinition,
            mode: overlayMode,
            widgetMode: overlayWidgetMode,
            eventTargets: eventTargets ?? [],
            eventQueries: eventQueries ?? [],
            eventScripts: eventScripts ?? [],
            eventPages: eventPages ?? [],
            eventApps: eventApps ?? [],
            eventVariables: eventVariables ?? [],
            onUpdateProps,
            onUpdateHidden,
            onUpdateChildProps,
            onDelete: onDeleteSelectedWidget,
          }
        : null

    const frameInspectorProps: BuilderInspectorPaneProps['frameInspectorProps'] =
      route === 'frame-widget' && selectedWidget && selectedDefinition
        ? {
            widget: selectedWidget,
            definition: selectedDefinition,
            search,
            eventTargets,
            eventQueries,
            eventScripts,
            eventPages,
            eventApps,
            eventVariables,
            fxContextInfo,
            onUpdateProps,
            onUpdateAccess,
            onUpdateSpacing,
            onUpdateHidden,
            onDelete: onDeleteSelectedWidget,
          }
        : null

    const widgetInspectorProps: BuilderInspectorPaneProps['widgetInspectorProps'] =
      route === 'widget' && selectedWidget && selectedDefinition
        ? {
            widget: selectedWidget,
            definition: selectedDefinition,
            parentWidget: selectedWidgetParent,
            search,
            eventTargets,
            eventQueries,
            eventScripts,
            eventPages,
            eventApps,
            eventVariables,
            fxContextInfo,
            activeAddonPanel: activeAddonPanel
              ? {
                  key: activeAddonPanel.key,
                  label: activeAddonPanel.label,
                }
              : null,
            onActiveAddonPanelChange,
            onUpdateProps,
            onUpdateAccess,
            onUpdateSpacing,
            onUpdateHidden,
            onDelete: onDeleteSelectedWidget,
          }
        : null

    return {
      isPreviewing,
      selectedWidget,
      selectedWidgetIcon,
      isRenamingWidget,
      renameInputRef,
      renameDraft,
      setRenameDraft,
      onCommitWidgetRename,
      onCancelWidgetRename,
      isAddonPanelActive,
      activeAddonPanelLabel: activeAddonPanel?.label ?? null,
      onClearAddonPanel: () => setInspectorAddonPanel(null),
      onStartWidgetRename,
      inspectorMenuOpen,
      setInspectorMenuOpen,
      selectedDefinitionLabel,
      hasClipboardWidget,
      canDuplicateSelectedWidget,
      canDeleteSelectedWidget,
      onOpenStatePanel,
      onCopyWidget,
      onCutWidget,
      onDuplicateWidget,
      onResetWidgetState,
      onDeleteWidget,
      onCloseInspector,
      route,
      overlayInspectorProps,
      frameInspectorProps,
      widgetInspectorProps,
      appInspectorProps,
      pageComponentInspectorProps,
      pageInspectorProps,
    }
  }, [
    activeAddonPanel,
    appInspectorProps,
    canDeleteSelectedWidget,
    canDuplicateSelectedWidget,
    eventApps,
    eventPages,
    eventQueries,
    eventScripts,
    eventTargets,
    eventVariables,
    fxContextInfo,
    hasClipboardWidget,
    inspectorMenuOpen,
    isAddonPanelActive,
    isPreviewing,
    isRenamingWidget,
    onActiveAddonPanelChange,
    onCancelWidgetRename,
    onCloseInspector,
    onCommitWidgetRename,
    onCopyWidget,
    onCutWidget,
    onDeleteSelectedWidget,
    onDeleteWidget,
    onDuplicateWidget,
    onOpenStatePanel,
    onResetWidgetState,
    onStartWidgetRename,
    onUpdateAccess,
    onUpdateChildProps,
    onUpdateHidden,
    onUpdateProps,
    onUpdateSpacing,
    overlayMode,
    overlayWidgetMode,
    pageComponentInspectorProps,
    pageInspectorProps,
    renameDraft,
    renameInputRef,
    route,
    search,
    selectedDefinition,
    selectedDefinitionLabel,
    selectedWidget,
    selectedWidgetIcon,
    selectedWidgetParent,
    setInspectorAddonPanel,
    setInspectorMenuOpen,
    setRenameDraft,
  ])
}
