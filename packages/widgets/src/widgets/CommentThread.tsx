import { Button, Input } from 'ui'

import type { WidgetDefinition } from '../types'
import { normalizeArray, normalizeString, parseMaybeJson } from '../helpers'

type Comment = {
  id?: string
  author?: string
  text?: string
  value?: string
  timestamp?: string
}

type CommentThreadProps = {
  title: string
  placeholder: string
  emptyTitle: string
  emptyDescription: string
  comments: string
  showEmptyState: boolean
}

const normalizeComments = (raw: unknown): Comment[] => {
  const parsed = parseMaybeJson(raw)
  const normalized = normalizeArray<Comment | string>(parsed, [])
  if (normalized.length === 0) {
    return []
  }
  if (typeof normalized[0] === 'string') {
    return (normalized as string[]).map((text) => ({ text }))
  }
  return normalized as Comment[]
}

export const CommentThreadWidget: WidgetDefinition<CommentThreadProps> = {
  type: 'CommentThread',
  label: 'Comment Thread',
  category: 'custom',
  description: 'Threaded comments',
  defaultProps: {
    title: 'Comment Thread',
    placeholder: 'Type a message',
    emptyTitle: 'No comments here yet',
    emptyDescription: 'Post your first comment',
    comments: '[]',
    showEmptyState: true,
  },
  fields: [
    { key: 'title', label: 'Title', type: 'text', placeholder: 'Comment Thread' },
    { key: 'placeholder', label: 'Placeholder', type: 'text', placeholder: 'Type a message' },
    { key: 'emptyTitle', label: 'Empty title', type: 'text', placeholder: 'No comments here yet' },
    { key: 'emptyDescription', label: 'Empty description', type: 'text', placeholder: 'Post your first comment' },
    { key: 'comments', label: 'Comments (JSON)', type: 'json', placeholder: '[{"text":"Hello"}]' },
    { key: 'showEmptyState', label: 'Show empty state', type: 'boolean' },
  ],
  render: (props, context) => {
    const stateComments = context?.state?.comments
    const comments = normalizeComments(stateComments ?? props.comments)
    const draft = normalizeString(context?.state?.draft ?? '', '')

    return (
      <div className="flex h-full flex-col rounded border border-foreground-muted/40 bg-surface-100">
        {props.title && (
          <div className="border-b border-foreground-muted/40 px-3 py-2 text-sm font-medium text-foreground">
            {props.title}
          </div>
        )}
        <div className="flex-1 space-y-2 overflow-auto px-3 py-2">
          {comments.length > 0 ? (
            comments.map((comment, index) => (
              <div key={comment.id ?? index} className="space-y-1 rounded bg-surface-200 px-2 py-1">
                <div className="text-xs font-medium text-foreground">{comment.author ?? 'User'}</div>
                <div className="text-sm text-foreground">{normalizeString(comment.text ?? comment.value, '')}</div>
                {comment.timestamp && <div className="text-[10px] text-foreground-muted">{comment.timestamp}</div>}
              </div>
            ))
          ) : props.showEmptyState ? (
            <div className="space-y-1 text-xs text-foreground-muted">
              <div className="font-medium">{props.emptyTitle}</div>
              <div>{props.emptyDescription}</div>
            </div>
          ) : null}
        </div>
        <div className="border-t border-foreground-muted/40 px-3 py-2">
          <div className="flex items-center gap-2">
            <Input
              placeholder={props.placeholder}
              value={draft}
              onChange={(event) => context?.setState?.({ draft: event.target.value })}
            />
            <Button
              type="secondary"
              size="small"
              htmlType="button"
              onClick={() => {
                const text = draft.trim()
                if (!text) {
                  return
                }
                const nextComment = {
                  id: `comment_${Date.now()}`,
                  text,
                  author: 'User',
                  timestamp: new Date().toLocaleString(),
                }
                const nextComments = [...comments, nextComment]
                context?.setState?.({ comments: nextComments, draft: '' })
                context?.runActions?.('submit', { comment: nextComment })
              }}
            >
              Post
            </Button>
          </div>
        </div>
      </div>
    )
  },
}
