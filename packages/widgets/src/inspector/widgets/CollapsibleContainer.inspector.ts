import type { WidgetInspectorConfig } from '../../types'
import { buildInspectorConfig } from '../fieldRegistry'

const fieldKeys = ['title', 'subtitle', 'open', 'padding', 'bordered', 'background', 'events']

export const CollapsibleContainerInspector: WidgetInspectorConfig = buildInspectorConfig(fieldKeys, {
  title: {
    placeholder: 'Section',
  },
  subtitle: {
    placeholder: 'Optional subtitle',
  },
  events: {
    section: 'Interaction',
    placeholder: '[{"event":"toggle","type":"query","queryName":"onToggle"}]',
  },
})

