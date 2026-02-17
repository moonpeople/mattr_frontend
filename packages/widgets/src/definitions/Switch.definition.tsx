import { Switch, cn } from 'ui'

import { normalizeString } from '../helpers'
import { createWidgetDefinition } from '../types'
import { normalizeSelectLabelVariant } from './select-utils'

export type SwitchProps = {
  label: string
  labelVariant?: string
  checked: boolean
  value?: boolean
  labelOn?: string
  labelOff?: string
  helperText: string
  disabled: boolean
  required?: boolean
  valid?: boolean
  invalid?: boolean
  validationMessage?: string
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
  if (!required || checked) {
    return { invalid: false, message: '' }
  }
  return { invalid: true, message: 'Required' }
}

export const SwitchDefinition = createWidgetDefinition<SwitchProps>({
  type: 'Switch',
  label: 'Switch',
  category: 'inputs',
  description: 'Toggle input',
  defaultProps: {
    label: 'Enable feature',
    labelVariant: 'default',
    checked: false,
    value: false,
    labelOn: '',
    labelOff: '',
    helperText: '',
    disabled: false,
    required: false,
    valid: true,
    invalid: false,
    validationMessage: '',
    events: '[]',
  },
  render: (props, context) => {
    const checked = parseBoolean(context?.state?.value ?? context?.state?.checked ?? props.value ?? props.checked)
    const required = parseBoolean(props.required)
    const validation = resolveValidation(checked, required)
    const helperText = normalizeString(props.helperText)
    const helperMessage = validation.invalid ? validation.message : helperText

    const labelVariant = normalizeSelectLabelVariant(props.labelVariant)
    const baseLabel = normalizeString(props.label)
    const labelOn = normalizeString(props.labelOn)
    const labelOff = normalizeString(props.labelOff)
    const resolvedLabel = checked ? labelOn || baseLabel : labelOff || baseLabel

    const commit = (nextChecked: boolean) => {
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
        context?.runActions?.('change', patch)
      }
    }

    const control = (
      <label className="flex items-center justify-between gap-3 text-sm">
        <span className="text-foreground">{resolvedLabel}</span>
        <Switch
          checked={checked}
          disabled={props.disabled}
          size="small"
          onCheckedChange={(nextChecked) => commit(Boolean(nextChecked))}
        />
      </label>
    )

    return (
      <div className="space-y-1">
        {labelVariant === 'default' ? control : null}
        {labelVariant === 'overlapping' ? (
          <div className="group relative pt-1">
            <label className="pointer-events-none absolute start-2 top-0 z-10 -translate-y-1/2 bg-background px-1 text-xs font-medium text-foreground">
              {baseLabel}
            </label>
            <div className="rounded-md border border-input bg-background p-2">{control}</div>
          </div>
        ) : null}
        {labelVariant === 'inset' ? (
          <div className="rounded-md border border-input bg-background p-2 shadow-xs">
            <label className="mb-1 block text-xs font-medium text-foreground">{baseLabel}</label>
            {control}
          </div>
        ) : null}
        {!['default', 'overlapping', 'inset'].includes(labelVariant) ? control : null}
        {helperMessage ? (
          <div className={cn('text-xs', validation.invalid ? 'text-destructive' : 'text-muted-foreground')}>
            {helperMessage}
          </div>
        ) : null}
      </div>
    )
  },
})
