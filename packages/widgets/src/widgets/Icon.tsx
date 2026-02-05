import {
  AlertCircle,
  CheckCircle2,
  Settings,
  Star,
  User,
} from 'lucide-react'

import type { WidgetDefinition } from '../types'

type IconProps = {
  icon: 'star' | 'alert' | 'user' | 'settings' | 'check'
  size: number
  color: string
}

const iconMap = {
  star: Star,
  alert: AlertCircle,
  user: User,
  settings: Settings,
  check: CheckCircle2,
}

export const IconWidget: WidgetDefinition<IconProps> = {
  type: 'Icon',
  label: 'Icon',
  category: 'presentation',
  description: 'Display an icon',
  defaultProps: {
    icon: 'star',
    size: 32,
    color: '#111827',
  },
  fields: [
    {
      key: 'icon',
      label: 'Icon',
      type: 'select',
      options: [
        { label: 'Star', value: 'star' },
        { label: 'Alert', value: 'alert' },
        { label: 'User', value: 'user' },
        { label: 'Settings', value: 'settings' },
        { label: 'Check', value: 'check' },
      ],
    },
    { key: 'size', label: 'Size', type: 'number', min: 12, max: 128 },
    { key: 'color', label: 'Color', type: 'text', placeholder: '#111827' },
  ],
  render: (props) => {
    const IconComponent = iconMap[props.icon] ?? Star
    return (
      <div className="inline-flex items-center justify-center rounded-md border border-foreground-muted/30 bg-surface-100 p-2">
        <IconComponent size={props.size} color={props.color} />
      </div>
    )
  },
}
