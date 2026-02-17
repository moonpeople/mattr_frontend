import { createWidgetDefinition } from '../types'
import { getWidgetButtonClassName, getWidgetButtonIcon, getWidgetButtonStyle } from './button-styles'

export type ButtonProps = {
  label: string
  variant: 'primary' | 'default' | 'secondary' | 'outline' | 'danger' | 'destructive' | 'ghost'
  size: 'tiny' | 'small' | 'medium'
  icon?: string
  loading: boolean
  disabled: boolean
  events: unknown[]
}

export const ButtonDefinition = createWidgetDefinition<ButtonProps>({
  type: 'Button',
  label: 'Button',
  category: 'buttons',
  description: 'Clickable button',
  defaultProps: {
    label: 'Click me',
    variant: 'primary',
    size: 'small',
    icon: 'none',
    loading: false,
    disabled: false,
    events: [],
  },
  render: (props, context) => {
    const isLoading = Boolean(props.loading)
    const iconNode = isLoading
      ? getWidgetButtonIcon('loader', context, 'animate-spin text-current', 14)
      : getWidgetButtonIcon(props.icon, context)
    return (
      <button
        type="button"
        className={getWidgetButtonClassName({
          variant: props.variant,
          size: props.size,
          fullWidth: true,
        })}
        style={getWidgetButtonStyle({ variant: props.variant })}
        disabled={Boolean(props.disabled) || isLoading}
        onClick={() => context?.runActions?.('click')}
      >
        {iconNode}
        <span className="truncate">{props.label}</span>
      </button>
    )
  },
})
