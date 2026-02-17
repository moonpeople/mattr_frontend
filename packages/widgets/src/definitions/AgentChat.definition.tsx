import { Button, Input } from 'ui'

import { normalizeArray, normalizeString, parseMaybeJson } from '../helpers'
import { createWidgetDefinition } from '../types'

export type ChatMessage = {
  id?: string
  text?: string
  value?: string
  role?: string
  sender?: string
}

export type AgentChatProps = {
  title: string
  status: string
  messages: string
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

export const AgentChatDefinition = createWidgetDefinition<AgentChatProps>({
  type: 'AgentChat',
  label: 'Agent Chat',
  category: 'custom',
  description: 'Agent chat interface',
  defaultProps: {
    title: 'Agent Chat',
    status: 'idle',
    messages: '[]',
  },
  render: (props, context) => {
    const stateMessages = context?.state?.messages
    const messages = normalizeMessages(stateMessages ?? props.messages)
    const draft = normalizeString(context?.state?.draft ?? '', '')

    return (
      <div className="flex h-full flex-col rounded border border-border/40 bg-card">
        <div className="flex items-center justify-between border-b border-border/40 px-3 py-2 text-sm font-medium text-foreground">
          <span>{props.title}</span>
          <span className="text-xs text-muted-foreground">{props.status}</span>
        </div>
        <div className="flex-1 space-y-2 overflow-auto px-3 py-2">
          {messages.length > 0 ? (
            messages.map((message, index) => (
              <div
                key={message.id ?? index}
                className="rounded bg-muted px-2 py-1 text-sm text-foreground"
              >
                {normalizeString(message.text ?? message.value, '')}
              </div>
            ))
          ) : (
            <div className="text-xs text-muted-foreground">Agent is waiting for input</div>
          )}
        </div>
        <div className="border-t border-border/40 px-3 py-2">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Ask the agent"
              value={draft}
              onChange={(event) => context?.setState?.({ draft: event.target.value })}
            />
            <Button
              type="primary"
              size="small"
              htmlType="button"
              onClick={() => {
                const text = draft.trim()
                if (!text) {
                  return
                }
                const nextMessage = { id: `msg_${Date.now()}`, text, role: 'user' }
                const nextMessages = [...messages, nextMessage]
                context?.setState?.({ messages: nextMessages, draft: '' })
                context?.runActions?.('send', { message: nextMessage })
              }}
            >
              Send
            </Button>
          </div>
        </div>
      </div>
    )
  },
})
