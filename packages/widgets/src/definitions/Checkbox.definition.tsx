import { Checkbox_Shadcn_ } from 'ui'

import { normalizeString } from '../helpers'
import { createWidgetDefinition } from '../types'

export type CheckboxProps = {
  label: string
  checked: boolean
  value?: boolean
  valid?: boolean
  invalid?: boolean
  validationMessage?: string
  helperText: string
  disabled: boolean
  required?: boolean
  events: string
}

const parseBoolean = (value: unknown, fallback = false) => {
  if (typeof value === 'boolean') {
    return value
  }
  if (typeof value === 'number') {
    return value !== 0
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (['true', '1', 'yes', 'y'].includes(normalized)) {
      return true
    }
    if (['false', '0', 'no', 'n'].includes(normalized)) {
      return false
    }
  }
  return fallback
}

const resolveValidation = (checked: boolean, required: boolean) => {
  if (!required) {
    return { invalid: false, message: '' }
  }
  if (checked) {
    return { invalid: false, message: '' }
  }
  return { invalid: true, message: 'Required' }
}

export const CheckboxDefinition = createWidgetDefinition<CheckboxProps>({
  type: 'Checkbox',
  label: 'Checkbox',
  category: 'inputs',
  description: 'Boolean checkbox',
  defaultProps: {
    label: 'Label',
    checked: false,
    value: false,
    valid: true,
    invalid: false,
    validationMessage: '',
    helperText: '',
    disabled: false,
    required: false,
    events: '[]',
  },
  render: (props, context) => {
    const checked = parseBoolean(context?.state?.value ?? context?.state?.checked ?? props.value ?? props.checked)
    const required = parseBoolean(props.required)
    const validation = resolveValidation(checked, required)
    const helperText = normalizeString(props.helperText)
    const helperMessage = validation.invalid ? validation.message : helperText

    const commitValue = (nextChecked: boolean) => {
      const nextValidation = resolveValidation(nextChecked, required)
      const patch = {
        checked: nextChecked,
        value: nextChecked,
        invalid: nextValidation.invalid,
        valid: !nextValidation.invalid,
        validationMessage: nextValidation.message,
      }
      context?.setState?.(patch)
      if (context?.mode !== 'canvas') {
        context?.runActions?.('change', { value: nextChecked, checked: nextChecked })
      }
    }

    return (
      <div className="space-y-1">
        <label className="flex items-start gap-2 text-sm text-foreground">
          <Checkbox_Shadcn_
            checked={checked}
            disabled={props.disabled}
            aria-invalid={validation.invalid}
            onCheckedChange={(nextChecked) => {
              commitValue(nextChecked === true)
            }}
          />
          <span>{props.label}</span>
        </label>
        {helperMessage ? (
          <div className={`text-xs ${validation.invalid ? 'text-destructive' : 'text-muted-foreground'}`}>
            {helperMessage}
          </div>
        ) : null}
      </div>
    )
  },
})
