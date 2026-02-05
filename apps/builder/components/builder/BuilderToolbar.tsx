import { Sparkles } from 'lucide-react'

import { Button } from 'ui'

// Toolbar buildera: perekluchenie razdelov i deistviya (grid/preview/publish).

interface BuilderToolbarProps {
  onOpenAi: () => void
  onTogglePreview: () => void
  isPreviewing?: boolean
  onSaveDraft: () => void
  isSaving?: boolean
  draftStatus?: string
  onPublish: () => void
  isPublishing?: boolean
}

export const BuilderToolbar = ({
  onOpenAi,
  onTogglePreview,
  isPreviewing = false,
  onSaveDraft,
  isSaving = false,
  draftStatus,
  onPublish,
  isPublishing = false,
}: BuilderToolbarProps) => {
  return (
    <div className="builder-toolbar flex items-center justify-end gap-2 border-b border-foreground-muted/30 bg-surface-200 px-3 py-2">
      <div className="flex items-center gap-2">
        <Button
          type="text"
          size="tiny"
          icon={<Sparkles size={16} />}
          onClick={onOpenAi}
          className="h-6 text-foreground-muted"
        >
          AI builder
        </Button>
        <Button
          type={isPreviewing ? 'default' : 'outline'}
          size="tiny"
          className="h-6"
          onClick={onTogglePreview}
        >
          {isPreviewing ? 'Back to edit' : 'Preview'}
        </Button>
        <Button type="default" size="tiny" className="h-6" onClick={onSaveDraft} loading={isSaving}>
          Save draft
        </Button>
        {draftStatus ? (
          <span className="text-xs text-foreground-muted">{draftStatus}</span>
        ) : null}
        <Button type="primary" size="tiny" className="h-6" onClick={onPublish} loading={isPublishing}>
          Publish
        </Button>
      </div>
    </div>
  )
}
