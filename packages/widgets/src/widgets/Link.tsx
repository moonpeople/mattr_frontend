import type { WidgetDefinition } from '../types'

type LinkProps = {
  text: string
  href: string
  underline: boolean
  newTab: boolean
  disabled: boolean
  events: string
}

export const LinkWidget: WidgetDefinition<LinkProps> = {
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
  fields: [
    { key: 'text', label: 'Text', type: 'text', placeholder: 'Link' },
    { key: 'href', label: 'URL', type: 'text', placeholder: 'https://...' },
    { key: 'underline', label: 'Underline', type: 'boolean' },
    { key: 'newTab', label: 'Open in new tab', type: 'boolean' },
    { key: 'disabled', label: 'Disabled', type: 'boolean' },
    {
      key: 'events',
      label: 'Events (JSON)',
      type: 'json',
      placeholder: '[{\"event\":\"click\",\"type\":\"query\",\"queryName\":\"onClick\"}]',
    },
  ],
  render: (props, context) => {
    const className = `${props.underline ? 'underline' : 'no-underline'} text-brand-600 text-sm`

    if (props.disabled) {
      return <span className={`${className} opacity-50`}>{props.text}</span>
    }

    return (
      <a
        href={props.href}
        target={props.newTab ? '_blank' : undefined}
        rel={props.newTab ? 'noreferrer' : undefined}
        className={className}
        onClick={() => context?.runActions?.('click', { href: props.href })}
      >
        {props.text}
      </a>
    )
  },
}
