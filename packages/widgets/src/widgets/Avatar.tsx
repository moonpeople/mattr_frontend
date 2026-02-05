import { Avatar, AvatarFallback, AvatarImage } from 'ui'

import type { WidgetDefinition } from '../types'

type AvatarProps = {
  name: string
  subtitle: string
  imageUrl: string
  size: 'sm' | 'md' | 'lg'
  showDetails: boolean
}

const sizeClasses: Record<AvatarProps['size'], string> = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
}

const getInitials = (value: string) => {
  const parts = value
    .split(' ')
    .map((chunk) => chunk.trim())
    .filter(Boolean)
  const initials = parts.map((chunk) => chunk[0]).slice(0, 2).join('')
  return initials.toUpperCase() || 'U'
}

export const AvatarWidget: WidgetDefinition<AvatarProps> = {
  type: 'Avatar',
  label: 'Avatar',
  category: 'presentation',
  description: 'User avatar and name',
  defaultProps: {
    name: 'Mike',
    subtitle: 'mike@example.com',
    imageUrl: '',
    size: 'md',
    showDetails: true,
  },
  fields: [
    { key: 'name', label: 'Name', type: 'text', placeholder: 'User name' },
    { key: 'subtitle', label: 'Subtitle', type: 'text', placeholder: 'Email' },
    { key: 'imageUrl', label: 'Image URL', type: 'text', placeholder: 'https://...' },
    {
      key: 'size',
      label: 'Size',
      type: 'select',
      options: [
        { label: 'Small', value: 'sm' },
        { label: 'Medium', value: 'md' },
        { label: 'Large', value: 'lg' },
      ],
    },
    { key: 'showDetails', label: 'Show details', type: 'boolean' },
  ],
  render: (props) => {
    return (
      <div className="flex items-center gap-3">
        <Avatar className={sizeClasses[props.size]}>
          {props.imageUrl ? <AvatarImage src={props.imageUrl} alt={props.name} /> : null}
          <AvatarFallback>{getInitials(props.name)}</AvatarFallback>
        </Avatar>
        {props.showDetails && (
          <div className="flex flex-col">
            <div className="text-sm font-medium text-foreground">{props.name || 'User'}</div>
            {props.subtitle && (
              <div className="text-xs text-foreground-muted">{props.subtitle}</div>
            )}
          </div>
        )}
      </div>
    )
  },
}
