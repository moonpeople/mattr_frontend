/**
 * Композитор финального render-state BuilderShell: early view + header actions.
 */
import type { ComponentProps } from 'react'

import { BuilderAppsCatalogView } from '../components/BuilderAppsCatalogView'
import { useBuilderShellEarlyView } from './useBuilderShellEarlyView'
import { useBuilderShellHeaderActions } from './useBuilderShellHeaderActions'

export interface UseBuilderShellRenderStateParams {
  isAppsLoading: boolean
  isOrganizationsLoading: boolean
  organizationsCount: number
  appIdParam?: string | null
  activeAppId?: string
  projectRef?: string | null
  catalogProps: ComponentProps<typeof BuilderAppsCatalogView>
  headerRoot: HTMLElement | null
  draftStatus: string
  isSaving: boolean
  isPreviewDisabled: boolean
  isPublishDisabled: boolean
  isPublishing: boolean
  onSaveDraft: () => void
  onOpenPreview: () => void
  onOpenPublishDialog: () => void
}

export const useBuilderShellRenderState = ({
  isAppsLoading,
  isOrganizationsLoading,
  organizationsCount,
  appIdParam,
  activeAppId,
  projectRef,
  catalogProps,
  headerRoot,
  draftStatus,
  isSaving,
  isPreviewDisabled,
  isPublishDisabled,
  isPublishing,
  onSaveDraft,
  onOpenPreview,
  onOpenPublishDialog,
}: UseBuilderShellRenderStateParams) => {
  const earlyView = useBuilderShellEarlyView({
    isAppsLoading,
    isOrganizationsLoading,
    organizationsCount,
    appIdParam,
    activeAppId,
    projectRef,
    catalogProps,
  })

  const headerActions = useBuilderShellHeaderActions({
    root: headerRoot,
    draftStatus,
    isSaving,
    isPreviewDisabled,
    isPublishDisabled,
    isPublishing,
    onSaveDraft,
    onOpenPreview,
    onOpenPublishDialog,
  })

  return {
    earlyView,
    headerActions,
  }
}
