import { createWidgetDefinition } from '../types'

export type LinkProps = {
  text: string
  href: string
  underline: boolean
  newTab: boolean
  disabled: boolean
  events: string
}

export const LinkDefinition = createWidgetDefinition<LinkProps>({
  type: 'Link',
  label: 'Link',
  category: 'navigation',
  description: 'Text link',
  defaultProps: {
    text: 'Link',
    href: '#',
    underline: true,
    newTab: false,
    disabled: false,
    events: '[]',
  },
  render: (props, context) => {
    const className = `${props.underline ? 'underline' : 'no-underline'} text-primary text-sm transition-colors hover:text-primary/80`
    const href = props.href?.trim() || '#'

    if (props.disabled) {
      return <span className={`${className} cursor-not-allowed text-muted-foreground opacity-60`}>{props.text}</span>
    }

    return (
      <a
        href={href}
        target={props.newTab ? '_blank' : undefined}
        rel={props.newTab ? 'noreferrer' : undefined}
        className={className}
        onClick={(event) => {
          context?.runActions?.('click', { href })
          if (context?.mode === 'canvas') {
            event.preventDefault()
          }
        }}
      >
        {props.text}
      </a>
    )
  },
})
