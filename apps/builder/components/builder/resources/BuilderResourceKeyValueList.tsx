import { Plus, X } from 'lucide-react'

import { Button, Input_Shadcn_, cn } from 'ui'

export type KeyValueItem = { key: string; value: string }

export const normalizeKeyValueItems = (value: unknown): KeyValueItem[] => {
  if (!value) {
    return []
  }
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === 'object' && item !== null) {
          const record = item as Record<string, unknown>
          return {
            key: typeof record.key === 'string' ? record.key : '',
            value: typeof record.value === 'string' ? record.value : '',
          }
        }
        return { key: '', value: '' }
      })
      .filter((item) => item.key || item.value)
  }
  if (typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).map(([key, rawValue]) => ({
      key,
      value: rawValue == null ? '' : String(rawValue),
    }))
  }
  return []
}

export const buildKeyValueObject = (items: KeyValueItem[]) =>
  items.reduce<Record<string, string>>((acc, item) => {
    if (!item.key.trim()) {
      return acc
    }
    acc[item.key.trim()] = item.value
    return acc
  }, {})

type BuilderResourceKeyValueListProps = {
  label: string
  items: KeyValueItem[]
  onChange: (items: KeyValueItem[]) => void
  emptyText?: string
}

export const BuilderResourceKeyValueList = ({
  label,
  items,
  onChange,
  emptyText = 'No entries yet',
}: BuilderResourceKeyValueListProps) => {
  const handleAdd = () => {
    onChange([...items, { key: '', value: '' }])
  }

  const handleUpdate = (index: number, field: 'key' | 'value', value: string) => {
    const next = items.map((item, idx) =>
      idx === index ? { ...item, [field]: value } : item
    )
    onChange(next)
  }

  const handleRemove = (index: number) => {
    onChange(items.filter((_, idx) => idx !== index))
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-[11px] uppercase text-foreground-muted">
        <span>{label}</span>
        <Button type="text" size="tiny" icon={<Plus size={12} />} onClick={handleAdd} />
      </div>
      {items.length === 0 ? (
        <div className="text-xs text-foreground-muted">{emptyText}</div>
      ) : (
        <div className="space-y-2">
          {items.map((item, index) => (
            <div key={`${label}-${index}`} className="grid grid-cols-[1fr_1fr_auto] gap-2">
              <Input_Shadcn_
                placeholder="key"
                value={item.key}
                onChange={(event) => handleUpdate(index, 'key', event.target.value)}
                className={cn('h-8 text-xs', !item.key && !item.value ? 'text-foreground-muted' : '')}
              />
              <Input_Shadcn_
                placeholder="value"
                value={item.value}
                onChange={(event) => handleUpdate(index, 'value', event.target.value)}
                className="h-8 text-xs"
              />
              <Button
                type="text"
                size="tiny"
                icon={<X size={12} />}
                onClick={() => handleRemove(index)}
                className="h-8 w-8"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
