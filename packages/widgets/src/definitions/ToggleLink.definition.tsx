import { createWidgetDefinition } from '../types'

export type ToggleLinkProps = {
  labelOn: string
  labelOff: string
  value: boolean
  underline: boolean
  disabled: boolean
  events: string
}

export const ToggleLinkDefinition = createWidgetDefinition<ToggleLinkProps>({
  type: 'ToggleLink',
  label: 'Toggle Link',
  category: 'navigation',
  description: 'Toggle link',
  defaultProps: {
    labelOn: 'Hide',
    labelOff: 'Show',
    value: false,
    underline: true,
    disabled: false,
    events: '[]',
  },
  render: (props, context) => {
    const value = Boolean(context?.state?.value ?? props.value)
    const label = value ? props.labelOn : props.labelOff
    const className = `${props.underline ? 'underline' : 'no-underline'} text-primary text-sm transition-colors hover:text-primary/80`

    return (
      <button
        type="button"
        className={`${className} ${props.disabled ? 'cursor-not-allowed text-muted-foreground opacity-60' : ''}`}
        disabled={props.disabled}
        onClick={() => {
          const next = !value
          context?.setState?.({ value: next })
          context?.runActions?.('change', { value: next })
        }}
      >
        {label}
      </button>
    )
  },
})
