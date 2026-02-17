import type { WidgetInspectorConfig } from '../../types'
import { buildInspectorConfig } from '../fieldRegistry'

const fieldKeys = ['title', 'status', 'messages']

export const AgentChatInspector: WidgetInspectorConfig = buildInspectorConfig(fieldKeys, {
  title: {
    placeholder: 'Agent Chat',
  },
  status: {
    placeholder: 'idle',
  },
  messages: {
    placeholder: '[{"text":"Hello"}]',
  },
})
