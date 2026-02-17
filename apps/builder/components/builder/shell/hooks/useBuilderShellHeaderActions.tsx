/**
 * Hook-композитор header actions портала для BuilderShellView.
 */
import { useMemo } from 'react'

import {
  BuilderShellHeaderActionsPortal,
  type BuilderShellHeaderActionsPortalProps,
} from '../components/BuilderShellHeaderActionsPortal'

export interface UseBuilderShellHeaderActionsParams
  extends BuilderShellHeaderActionsPortalProps {}

export const useBuilderShellHeaderActions = ({
  root,
  draftStatus,
  isSaving,
  isPreviewDisabled,
  isPublishDisabled,
  isPublishing,
  onSaveDraft,
  onOpenPreview,
  onOpenPublishDialog,
}: UseBuilderShellHeaderActionsParams) =>
  useMemo(
    () => (
      <BuilderShellHeaderActionsPortal
        root={root}
        draftStatus={draftStatus}
        isSaving={isSaving}
        isPreviewDisabled={isPreviewDisabled}
        isPublishDisabled={isPublishDisabled}
        isPublishing={isPublishing}
        onSaveDraft={onSaveDraft}
        onOpenPreview={onOpenPreview}
        onOpenPublishDialog={onOpenPublishDialog}
      />
    ),
    [
      root,
      draftStatus,
      isSaving,
      isPreviewDisabled,
      isPublishDisabled,
      isPublishing,
      onSaveDraft,
      onOpenPreview,
      onOpenPublishDialog,
    ]
  )
