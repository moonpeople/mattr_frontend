import type { WidgetInspectorConfig } from '../../types'
import { buildInspectorConfig } from '../fieldRegistry'

const fieldKeys = ['text', 'href', 'underline', 'newTab', 'disabled', 'events']

export const LinkInspector: WidgetInspectorConfig = buildInspectorConfig(fieldKeys, {
  text: {
    placeholder: 'Link',
  },
  href: {
    placeholder: 'https://...',
  },
  events: {
    section: 'Interaction',
    placeholder: '[{"event":"click","type":"query","queryName":"onClick"}]',
  },
})
