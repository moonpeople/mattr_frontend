/**
 * Диалог публикации runtime-сборки приложения.
 */
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle as DialogTitleText,
} from 'ui'

export interface BuilderPublishDialogProps {
  open: boolean
  isPublishing: boolean
  isPublishDisabled: boolean
  onOpenChange: (open: boolean) => void
  onConfirmPublish: () => void
}

export const BuilderPublishDialog = ({
  open,
  isPublishing,
  isPublishDisabled,
  onOpenChange,
  onConfirmPublish,
}: BuilderPublishDialogProps) => {
  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (isPublishing) {
          return
        }
        onOpenChange(nextOpen)
      }}
    >
      <DialogContent size="small">
        <DialogHeader>
          <DialogTitleText>Publish app</DialogTitleText>
          <DialogDescription>
            Publish the latest draft to make it available on the runtime URL.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="default" onClick={() => onOpenChange(false)} disabled={isPublishing}>
            Cancel
          </Button>
          <Button
            type="primary"
            onClick={onConfirmPublish}
            loading={isPublishing}
            disabled={isPublishDisabled}
          >
            Publish
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
