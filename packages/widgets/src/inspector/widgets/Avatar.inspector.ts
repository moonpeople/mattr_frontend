import type { WidgetInspectorConfig } from '../../types'
import { buildInspectorConfig } from '../fieldRegistry'

const fieldKeys = ['name', 'subtitle', 'imageUrl', 'size', 'showDetails']

export const AvatarInspector: WidgetInspectorConfig = buildInspectorConfig(fieldKeys, {
  size: {
    type: 'select',
    options: [
      { label: 'Small', value: 'sm' },
      { label: 'Medium', value: 'md' },
      { label: 'Large', value: 'lg' },
    ],
  },
})
