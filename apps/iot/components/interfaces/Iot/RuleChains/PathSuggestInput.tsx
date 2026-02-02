import { useMemo } from 'react'
import { List } from 'lucide-react'

import {
  Input_Shadcn_,
  Popover_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
} from 'ui'

type PathSuggestion = {
  label: string
  value: string
}

type PathSuggestInputProps = {
  value: string
  onValueChange: (value: string) => void
  suggestions?: PathSuggestion[]
  placeholder?: string
  disabled?: boolean
  size?: 'tiny' | 'small' | 'medium' | 'large'
  className?: string
}

const MAX_SUGGESTIONS = 8

const PathSuggestInput = ({
  value,
  onValueChange,
  suggestions = [],
  placeholder,
  disabled,
  size = 'small',
  className,
}: PathSuggestInputProps) => {
  const filteredSuggestions = useMemo(() => {
    if (!suggestions.length) return []
    const query = value.trim()
    const filtered = query
      ? suggestions.filter((item) => item.value.toLowerCase().includes(query.toLowerCase()))
      : suggestions
    return filtered.slice(0, MAX_SUGGESTIONS)
  }, [suggestions, value])

  const showSuggestions = filteredSuggestions.length > 0

  return (
    <div className={className}>
      <div className="relative">
        <Input_Shadcn_
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          placeholder={placeholder}
          size={size}
          disabled={disabled}
          className={showSuggestions ? 'pr-9' : undefined}
        />
        {showSuggestions && (
          <Popover_Shadcn_>
            <PopoverTrigger_Shadcn_ asChild>
              <button
                type="button"
                className="absolute right-0 top-1/2 -translate-y-1/2 rounded border border-muted bg-foreground/5 p-1 text-foreground-lighter hover:text-foreground"
                aria-label="Show suggestions"
                disabled={disabled}
              >
                <List size={14} />
              </button>
            </PopoverTrigger_Shadcn_>
            <PopoverContent_Shadcn_
              align="end"
              side="bottom"
              className="w-72 p-0"
              portal
            >
              <div className="max-h-56 overflow-auto py-1">
                {filteredSuggestions.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    className="flex w-full items-center justify-between px-3 py-1.5 text-left text-xs text-foreground hover:bg-surface-200"
                    onClick={() => onValueChange(item.value)}
                  >
                    <span className="truncate">{item.label}</span>
                  </button>
                ))}
              </div>
            </PopoverContent_Shadcn_>
          </Popover_Shadcn_>
        )}
      </div>
    </div>
  )
}

export default PathSuggestInput
