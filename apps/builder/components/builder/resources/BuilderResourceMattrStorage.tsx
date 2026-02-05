import {
  Input_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  Select_Shadcn_,
} from 'ui'

type BuilderResourceMattrStorageProps = {
  config: Record<string, unknown>
  onChange: (config: Record<string, unknown>) => void
}

const ACTION_OPTIONS = [
  { value: 'list', label: 'Get a list of file metadata' },
  { value: 'get', label: 'Get file metadata' },
  { value: 'upload', label: 'Upload file' },
  { value: 'download', label: 'Download file' },
  { value: 'delete', label: 'Delete file' },
]

export const BuilderResourceMattrStorage = ({
  config,
  onChange,
}: BuilderResourceMattrStorageProps) => {
  const actionType = typeof config.actionType === 'string' ? config.actionType : ''
  const folderName = typeof config.folderName === 'string' ? config.folderName : ''
  const pageSize =
    typeof config.pageSize === 'number'
      ? String(config.pageSize)
      : typeof config.pageSize === 'string'
        ? config.pageSize
        : '100'
  const pageNumber =
    typeof config.pageNumber === 'number'
      ? String(config.pageNumber)
      : typeof config.pageNumber === 'string'
        ? config.pageNumber
        : '1'

  const handleUpdate = (partial: Record<string, unknown>) => {
    onChange({ ...config, ...partial })
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <div className="text-[11px] uppercase text-foreground-muted">Action type</div>
        <Select_Shadcn_ value={actionType} onValueChange={(value) => handleUpdate({ actionType: value })}>
          <SelectTrigger_Shadcn_ className="h-8 text-xs">
            <SelectValue_Shadcn_ placeholder="Select an action" />
          </SelectTrigger_Shadcn_>
          <SelectContent_Shadcn_>
            {ACTION_OPTIONS.map((option) => (
              <SelectItem_Shadcn_ key={option.value} value={option.value}>
                {option.label}
              </SelectItem_Shadcn_>
            ))}
          </SelectContent_Shadcn_>
        </Select_Shadcn_>
      </div>

      <div className="space-y-1">
        <div className="text-[11px] uppercase text-foreground-muted">Folder name</div>
        <div className="relative">
          <Input_Shadcn_
            placeholder="(all files)"
            value={folderName}
            onChange={(event) => handleUpdate({ folderName: event.target.value })}
            className="pr-10"
          />
          <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[11px] text-foreground-muted">
            fx
          </div>
        </div>
      </div>

      <div className="space-y-1">
        <div className="text-xs text-foreground-muted">
          Page Size: how many entries per page. Max 1000
        </div>
        <Input_Shadcn_
          type="number"
          value={pageSize}
          onChange={(event) => handleUpdate({ pageSize: event.target.value })}
        />
      </div>

      <div className="space-y-1">
        <div className="text-xs text-foreground-muted">Page Number: which page to show, starting from 1</div>
        <Input_Shadcn_
          type="number"
          value={pageNumber}
          onChange={(event) => handleUpdate({ pageNumber: event.target.value })}
        />
      </div>
    </div>
  )
}
