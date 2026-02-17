import { getWidgetIconComponent } from '../icon-library'
import { createWidgetDefinition } from '../types'

export type IconProps = {
  icon: 'star' | 'alert' | 'user' | 'settings' | 'check'
  size: number
  color: string
}

const resolveIcon = (icon: IconProps['icon'], iconLibrary?: string) =>
  getWidgetIconComponent(icon, iconLibrary) ?? getWidgetIconComponent(icon)

export const IconDefinition = createWidgetDefinition<IconProps>({
  type: 'Icon',
  label: 'Icon',
  category: 'presentation',
  description: 'Display an icon',
  defaultProps: {
    icon: 'star',
    size: 32,
    color: '#111827',
  },
  render: (props, context) => {
    const IconComponent = resolveIcon(props.icon, context?.iconLibrary)
    return (
      <div className="inline-flex items-center justify-center rounded-md border border-border/30 bg-card p-2">
        {IconComponent ? (
          <IconComponent width={props.size} height={props.size} style={{ color: props.color }} />
        ) : null}
      </div>
    )
  },
})
