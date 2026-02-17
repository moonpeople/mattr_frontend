/**
 * Portal-обёртка для header actions shell, чтобы не держать createPortal в BuilderShell.
 */
import { createPortal } from 'react-dom'

import {
  BuilderHeaderActions,
  type BuilderHeaderActionsProps,
} from './BuilderHeaderActions'

export interface BuilderShellHeaderActionsPortalProps
  extends BuilderHeaderActionsProps {
  root: HTMLElement | null
}

export const BuilderShellHeaderActionsPortal = ({
  root,
  ...actionsProps
}: BuilderShellHeaderActionsPortalProps) => {
  if (!root) {
    return null
  }

  return createPortal(<BuilderHeaderActions {...actionsProps} />, root)
}
