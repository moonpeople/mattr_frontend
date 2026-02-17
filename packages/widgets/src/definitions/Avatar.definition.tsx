import { Avatar, AvatarFallback, AvatarImage } from 'ui'

import { createWidgetDefinition } from '../types'

export type AvatarProps = {
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
  const initials = parts
    .map((chunk) => chunk[0])
    .slice(0, 2)
    .join('')
  return initials.toUpperCase() || 'U'
}

export const AvatarDefinition = createWidgetDefinition<AvatarProps>({
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
  render: (props) => (
    <div className="flex items-center gap-3">
      <Avatar className={sizeClasses[props.size]}>
        {props.imageUrl ? <AvatarImage src={props.imageUrl} alt={props.name} /> : null}
        <AvatarFallback>{getInitials(props.name)}</AvatarFallback>
      </Avatar>
      {props.showDetails && (
        <div className="flex flex-col">
          <div className="text-sm font-medium text-foreground">{props.name || 'User'}</div>
          {props.subtitle && <div className="text-xs text-muted-foreground">{props.subtitle}</div>}
        </div>
      )}
    </div>
  ),
})
