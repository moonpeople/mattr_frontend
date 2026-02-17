import { createWidgetDefinition } from '../types'
import { getWidgetButtonClassName, getWidgetButtonStyle } from './button-styles'

export type ToggleButtonProps = {
  labelOn: string
  labelOff: string
  value: boolean
  disabled: boolean
  events: unknown[]
}

export const ToggleButtonDefinition = createWidgetDefinition<ToggleButtonProps>({
  type: 'ToggleButton',
  label: 'Toggle Button',
  category: 'buttons',
  description: 'Toggle button',
  defaultProps: {
    labelOn: 'Hide',
    labelOff: 'Show',
    value: false,
    disabled: false,
    events: [],
  },
  render: (props, context) => {
    const value = Boolean(context?.state?.value ?? props.value)
    return (
      <button
        type="button"
        className={getWidgetButtonClassName({
          variant: value ? 'primary' : 'outline',
          size: 'tiny',
          pressed: value,
          fullWidth: true,
        })}
        style={getWidgetButtonStyle({ variant: value ? 'primary' : 'outline' })}
        disabled={props.disabled}
        onClick={() => {
          const next = !value
          context?.setState?.({ value: next })
          context?.runActions?.('change', { value: next })
        }}
      >
        <span className="truncate">{value ? props.labelOn : props.labelOff}</span>
      </button>
    )
  },
})
