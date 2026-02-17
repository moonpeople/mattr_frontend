/**
 * Верхняя панель действий shell: сохранение, preview и publish.
 */
import { Button } from 'ui'

export interface BuilderHeaderActionsProps {
  draftStatus: string
  isSaving: boolean
  isPreviewDisabled: boolean
  isPublishDisabled: boolean
  isPublishing: boolean
  onSaveDraft: () => void
  onOpenPreview: () => void
  onOpenPublishDialog: () => void
}

export const BuilderHeaderActions = ({
  draftStatus,
  isSaving,
  isPreviewDisabled,
  isPublishDisabled,
  isPublishing,
  onSaveDraft,
  onOpenPreview,
  onOpenPublishDialog,
}: BuilderHeaderActionsProps) => {
  return (
    <div className="flex items-center gap-2">
      <Button type="default" size="tiny" className="h-6" onClick={onSaveDraft} loading={isSaving}>
        Save draft
      </Button>
      {draftStatus ? <span className="text-xs text-foreground-muted">{draftStatus}</span> : null}
      <Button
        type="default"
        size="tiny"
        className="h-6"
        onClick={onOpenPreview}
        disabled={isPreviewDisabled}
      >
        Preview
      </Button>
      <Button
        type="primary"
        size="tiny"
        className="h-6"
        onClick={onOpenPublishDialog}
        disabled={isPublishDisabled}
        loading={isPublishing}
      >
        Publish
      </Button>
    </div>
  )
}
