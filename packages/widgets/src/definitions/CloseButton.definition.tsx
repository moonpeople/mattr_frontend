import { createWidgetDefinition } from '../types'
import { getWidgetButtonClassName, getWidgetButtonIcon, getWidgetButtonStyle } from './button-styles'

type CloseButtonVariant = 'default' | 'outline' | 'text' | 'secondary'
type CloseButtonSize = 'tiny' | 'small' | 'medium'

export type CloseButtonProps = {
  variant: CloseButtonVariant
  size: CloseButtonSize
  tooltipText: string
  disabled: boolean
  events: unknown[]
}

export const CloseButtonDefinition = createWidgetDefinition<CloseButtonProps>({
  type: 'CloseButton',
  label: 'Close Button',
  category: 'buttons',
  description: 'Icon-only close button',
  defaultProps: {
    variant: 'text',
    size: 'tiny',
    tooltipText: 'Close',
    disabled: false,
    events: [],
  },
  render: (props, context) => {
    const title = props.tooltipText?.trim() || 'Close'
    return (
      <button
        type="button"
        className={getWidgetButtonClassName({
          variant: props.variant,
          size: props.size,
          className: 'px-2',
        })}
        style={getWidgetButtonStyle({ variant: props.variant })}
        disabled={props.disabled}
        title={title}
        aria-label={title}
        onClick={() => context?.runActions?.('click')}
      >
        {getWidgetButtonIcon('x', context, 'text-current', 14)}
      </button>
    )
  },
})
