import type { WidgetInspectorConfig } from '../../types'
import { buildInspectorConfig } from '../fieldRegistry'

const fieldKeys = ['title', 'subtitle', 'description', 'href', 'newTab', 'variant', 'disabled', 'events']

export const LinkCardInspector: WidgetInspectorConfig = buildInspectorConfig(fieldKeys, {
  title: {
    placeholder: 'Documentation',
  },
  subtitle: {
    placeholder: 'Optional subtitle',
  },
  description: {
    placeholder: 'Open destination link',
  },
  href: {
    placeholder: 'https://example.com',
  },
  events: {
    section: 'Interaction',
    placeholder: '[{"event":"click","type":"query","queryName":"onClick"}]',
  },
})

