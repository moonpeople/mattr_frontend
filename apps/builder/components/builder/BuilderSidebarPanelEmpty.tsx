import type { ReactNode } from 'react'
import { X } from 'lucide-react'

import { Button, Separator } from 'ui'

// Заглушка для секций без контента.

type BuilderSidebarPanelEmptyProps = {
  title: string
  icon: ReactNode
  label: string
  onClose?: () => void
}

export const BuilderSidebarPanelEmpty = ({
  title,
  icon,
  label,
  onClose,
}: BuilderSidebarPanelEmptyProps) => {
  return (
    <div className="flex h-full flex-col">
      <div className="builder-panel-header flex items-center justify-between bg-surface-200 px-3 py-1.5">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md border border-foreground-muted/30 bg-surface-200">
            {icon}
          </div>
          <div className="text-xs font-medium">{title}</div>
        </div>
        <Button type="text" size="tiny" icon={<X size={14} />} onClick={() => onClose?.()} />
      </div>
      <Separator />
      <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center text-xs text-foreground-muted">
        <div className="text-sm font-medium text-foreground">{label}</div>
        <div>Panel UI will appear here.</div>
      </div>
    </div>
  )
}
