import type { WidgetInspectorConfig } from '../../types'
import { buildInspectorConfig } from '../fieldRegistry'

const fieldKeys = ['title', 'placeholder', 'messages', 'showEmptyState']

export const ChatInspector: WidgetInspectorConfig = buildInspectorConfig(fieldKeys, {
  title: {
    placeholder: 'Chat',
  },
  placeholder: {
    placeholder: 'Type a message',
  },
  messages: {
    placeholder: '[{"text":"Hello"}]',
  },
})
