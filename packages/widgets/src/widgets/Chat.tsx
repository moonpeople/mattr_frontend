import { Button, Input } from 'ui'

import type { WidgetDefinition } from '../types'
import { normalizeArray, normalizeString, parseMaybeJson } from '../helpers'

type ChatMessage = {
  id?: string
  text?: string
  value?: string
  role?: string
  sender?: string
}

type ChatProps = {
  title: string
  placeholder: string
  messages: string
  showEmptyState: boolean
}

const normalizeMessages = (raw: unknown): ChatMessage[] => {
  const parsed = parseMaybeJson(raw)
  const normalized = normalizeArray<ChatMessage | string>(parsed, [])
  if (normalized.length === 0) {
    return []
  }
  if (typeof normalized[0] === 'string') {
    return (normalized as string[]).map((text) => ({ text }))
  }
  return normalized as ChatMessage[]
}

export const ChatWidget: WidgetDefinition<ChatProps> = {
  type: 'Chat',
  label: 'Chat',
  category: 'custom',
  description: 'Chat interface',
  defaultProps: {
    title: 'Chat',
    placeholder: 'Type a message',
    messages: '[]',
    showEmptyState: true,
  },
  fields: [
    { key: 'title', label: 'Title', type: 'text', placeholder: 'Chat' },
    { key: 'placeholder', label: 'Placeholder', type: 'text', placeholder: 'Type a message' },
    { key: 'messages', label: 'Messages (JSON)', type: 'json', placeholder: '[{"text":"Hello"}]' },
    { key: 'showEmptyState', label: 'Show empty state', type: 'boolean' },
  ],
  render: (props, context) => {
    const stateMessages = context?.state?.messages
    const messages = normalizeMessages(stateMessages ?? props.messages)
    const draft = normalizeString(context?.state?.draft ?? '', '')

    const updateDraft = (value: string) => {
      context?.setState?.({ draft: value })
    }

    const sendMessage = () => {
      if (!draft.trim()) {
        return
      }
      const nextMessage = { id: `msg_${Date.now()}`, text: draft, role: 'user' }
      const nextMessages = [...messages, nextMessage]
      context?.setState?.({ messages: nextMessages, draft: '' })
      context?.runActions?.('send', { message: nextMessage })
    }

    return (
      <div className="flex h-full flex-col rounded border border-foreground-muted/40 bg-surface-100">
        <div className="border-b border-foreground-muted/40 px-3 py-2 text-sm font-medium text-foreground">
          {props.title}
        </div>
        <div className="flex-1 space-y-2 overflow-auto px-3 py-2">
          {messages.length > 0 ? (
            messages.map((message, index) => (
              <div key={message.id ?? index} className="rounded bg-surface-200 px-2 py-1 text-sm text-foreground">
                {normalizeString(message.text ?? message.value, '')}
              </div>
            ))
          ) : props.showEmptyState ? (
            <div className="text-xs text-foreground-muted">No messages here yet</div>
          ) : null}
        </div>
        <div className="border-t border-foreground-muted/40 px-3 py-2">
          <div className="flex items-center gap-2">
            <Input
              placeholder={props.placeholder}
              value={draft}
              onChange={(event) => updateDraft(event.target.value)}
            />
            <Button type="primary" size="small" htmlType="button" onClick={sendMessage}>
              Send
            </Button>
          </div>
        </div>
      </div>
    )
  },
}
