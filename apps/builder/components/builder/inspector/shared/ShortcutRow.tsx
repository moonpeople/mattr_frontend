/**
 * Строка быстрых действий/шорткатов в inspector.
 */
import { Trash2 } from 'lucide-react'

import { Button, Input_Shadcn_ } from 'ui'

export type ShortcutValue = {
  name: string
  shortcut: string
  action: string
}

type ShortcutRowProps = {
  shortcut: ShortcutValue
  onChange: (patch: Partial<ShortcutValue>) => void
  onRemove: () => void
}

export const ShortcutRow = ({ shortcut, onChange, onRemove }: ShortcutRowProps) => {
  return (
    <div className="space-y-2 rounded-md border border-foreground-muted/30 bg-surface-100 p-2">
      <div className="flex items-center justify-between">
        <div className="text-[10px] uppercase text-foreground-muted">Shortcut</div>
        <Button type="text" size="tiny" icon={<Trash2 size={14} />} onClick={onRemove} />
      </div>
      <div className="space-y-2">
        <div className="text-xs text-foreground-muted">Name</div>
        <Input_Shadcn_
          value={shortcut.name}
          onChange={(event) => onChange({ name: event.target.value })}
          placeholder="Open palette"
          className="h-7"
        />
      </div>
      <div className="space-y-2">
        <div className="text-xs text-foreground-muted">Shortcut</div>
        <Input_Shadcn_
          value={shortcut.shortcut}
          onChange={(event) => onChange({ shortcut: event.target.value })}
          placeholder="Cmd+K"
          className="h-7"
        />
      </div>
      <div className="space-y-2">
        <div className="text-xs text-foreground-muted">Action</div>
        <Input_Shadcn_
          value={shortcut.action}
          onChange={(event) => onChange({ action: event.target.value })}
          placeholder="runQuery('getUsers')"
          className="h-7"
        />
      </div>
    </div>
  )
}
