/**
 * Dialog/state-hook BuilderShell: управляет режимами preview и модалками shell-уровня.
 */
import { useState } from 'react'

export const useBuilderShellDialogs = () => {
  const [isPreviewing, setIsPreviewing] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isPublishDialogOpen, setIsPublishDialogOpen] = useState(false)

  return {
    isPreviewing,
    setIsPreviewing,
    isCreateOpen,
    setIsCreateOpen,
    isPublishDialogOpen,
    setIsPublishDialogOpen,
  }
}
