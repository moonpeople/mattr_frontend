/**
 * Сегментированный radio-group для inspector-контролов переключения режимов.
 */
import { useId, type CSSProperties } from 'react'

import type { WidgetFieldOption } from 'widgets/runtime'
import { RadioGroup_Shadcn_, RadioGroupItem_Shadcn_ } from 'ui'

type SegmentedRadioGroupProps = {
  options: WidgetFieldOption[]
  value: string
  onValueChange: (next: string) => void
  disabled?: boolean
}

export const SegmentedRadioGroup = ({
  options,
  value,
  onValueChange,
  disabled,
}: SegmentedRadioGroupProps) => {
  const id = useId()
  const safeOptions = options.length > 0 ? options : [{ label: '', value: '' }]
  const selectedValue =
    safeOptions.find((option) => option.value === value)?.value ?? safeOptions[0].value
  const selectedIndex = Math.max(
    0,
    safeOptions.findIndex((option) => option.value === selectedValue)
  )

  return (
    <div
      className={`inline-flex h-6 w-full rounded-md bg-surface-300 p-0.5 ${
        disabled ? 'pointer-events-none opacity-60' : ''
      }`}
    >
      <RadioGroup_Shadcn_
        value={selectedValue}
        onValueChange={(next) => next && onValueChange(next)}
        className="bg-surface-300 group rounded-md relative inline-grid w-full items-center gap-0 font-medium text-[11px] after:absolute after:inset-y-0 after:left-0 after:w-[calc(100%/var(--segment-count))] after:rounded-sm after:bg-background after:shadow-xs after:transition-[transform,box-shadow] after:duration-300 after:ease-[cubic-bezier(0.16,1,0.3,1)] after:content-[''] after:translate-x-[calc(100%*var(--segment-index))]"
        style={
          {
            gridTemplateColumns: `repeat(${safeOptions.length}, minmax(0, 1fr))`,
            '--segment-count': safeOptions.length,
            '--segment-index': selectedIndex,
          } as CSSProperties
        }
      >
        {safeOptions.map((option, index) => (
          <label
            key={option.value || `${index}-${option.label}`}
            className="relative z-10 inline-flex h-full cursor-pointer select-none items-center justify-center whitespace-nowrap px-2 text-xs"
          >
            <RadioGroupItem_Shadcn_
              className="peer sr-only"
              id={`${id}-${index}`}
              value={option.value}
              disabled={disabled}
            />
            <span className="text-foreground-muted peer-data-[state=checked]:text-foreground">
              {option.label}
            </span>
          </label>
        ))}
      </RadioGroup_Shadcn_>
    </div>
  )
}
