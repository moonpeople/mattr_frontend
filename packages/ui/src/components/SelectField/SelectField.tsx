'use client'

import type { CSSProperties, ReactNode } from 'react'

import { cn } from '../../lib/utils/cn'
import {
  Select as Select_Shadcn_,
  SelectContent as SelectContent_Shadcn_,
  SelectItem as SelectItem_Shadcn_,
  SelectTrigger as SelectTrigger_Shadcn_,
  SelectValue as SelectValue_Shadcn_,
} from '../shadcn/ui/select'

type SelectFieldProps = {
  id?: string
  name?: string
  type?: string
  label?: ReactNode
  labelOptional?: string
  descriptionText?: ReactNode
  error?: string
  className?: string
  buttonClassName?: string
  icon?: ReactNode
  layout?: 'horizontal' | 'vertical'
  style?: CSSProperties
  reveal?: boolean
  actions?: ReactNode
  validation?: (value: any) => void
  optionsWidth?: number
  value?: string | number
  defaultValue?: string | number
  onChange?: (value: string) => void
  disabled?: boolean
  size?: 'tiny' | 'small' | 'medium' | 'large' | 'xlarge'
  children: ReactNode
}

type SelectFieldOptionProps = {
  id?: string
  value: string | number
  label?: ReactNode
  disabled?: boolean
  children?: ReactNode
  className?: string
  addOnBefore?: ({ active, selected }: { active: boolean; selected: boolean }) => ReactNode
}

const SelectFieldOption = ({
  value,
  label,
  disabled,
  children,
  className,
  addOnBefore,
}: SelectFieldOptionProps) => {
  return (
    <SelectItem_Shadcn_
      value={String(value)}
      disabled={disabled}
      className={cn('text-xs', className)}
    >
      <span className="flex items-center gap-2">
        {addOnBefore ? addOnBefore({ active: false, selected: false }) : null}
        {children ?? label ?? value}
      </span>
    </SelectItem_Shadcn_>
  )
}

type SelectFieldComponent = ((props: SelectFieldProps) => JSX.Element) & {
  Option: typeof SelectFieldOption
}

const SelectField: SelectFieldComponent = ({
  label,
  labelOptional,
  descriptionText,
  error,
  className,
  buttonClassName,
  style,
  actions,
  optionsWidth,
  value,
  defaultValue,
  onChange,
  disabled,
  size = 'small',
  children,
}: SelectFieldProps) => {
  const placeholder =
    typeof label === 'string' ? `Select ${label.toLowerCase()}` : 'Select option'
  const stringValue = value === undefined || value === null ? undefined : String(value)
  const stringDefault =
    defaultValue === undefined || defaultValue === null ? undefined : String(defaultValue)

  return (
    <div className={cn('space-y-1', className)} style={style}>
      {(label || actions) && (
        <div className="flex items-center justify-between gap-2">
          {label && <p className="text-xs text-foreground-light">{label}</p>}
          {labelOptional && (
            <span className="text-xs text-foreground-muted">{labelOptional}</span>
          )}
          {actions}
        </div>
      )}
      <Select_Shadcn_
        value={stringValue}
        defaultValue={stringDefault}
        onValueChange={onChange}
        disabled={disabled}
      >
        <SelectTrigger_Shadcn_
          size={size === 'tiny' ? 'tiny' : 'small'}
          className={buttonClassName}
        >
          <SelectValue_Shadcn_ placeholder={placeholder} />
        </SelectTrigger_Shadcn_>
        <SelectContent_Shadcn_ style={optionsWidth ? { width: optionsWidth } : undefined}>
          {children}
        </SelectContent_Shadcn_>
      </Select_Shadcn_>
      {descriptionText && (
        <div className="text-xs text-foreground-light">{descriptionText}</div>
      )}
      {error && <p className="text-xs text-destructive-600">{error}</p>}
    </div>
  )
}

SelectField.Option = SelectFieldOption

export default SelectField
