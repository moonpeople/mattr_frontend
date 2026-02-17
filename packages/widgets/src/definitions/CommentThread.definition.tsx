import { Button, Input } from 'ui'

import { normalizeArray, normalizeString, parseMaybeJson } from '../helpers'
import { createWidgetDefinition } from '../types'

export type Comment = {
  id?: string
  author?: string
  text?: string
  value?: string
  timestamp?: string
}

export type CommentThreadProps = {
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

export const CommentThreadDefinition = createWidgetDefinition<CommentThreadProps>({
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
  render: (props, context) => {
    const stateComments = context?.state?.comments
    const comments = normalizeComments(stateComments ?? props.comments)
    const draft = normalizeString(context?.state?.draft ?? '', '')

    return (
      <div className="flex h-full flex-col rounded border border-border/40 bg-card">
        {props.title && (
          <div className="border-b border-border/40 px-3 py-2 text-sm font-medium text-foreground">
            {props.title}
          </div>
        )}
        <div className="flex-1 space-y-2 overflow-auto px-3 py-2">
          {comments.length > 0 ? (
            comments.map((comment, index) => (
              <div key={comment.id ?? index} className="space-y-1 rounded bg-muted px-2 py-1">
                <div className="text-xs font-medium text-foreground">{comment.author ?? 'User'}</div>
                <div className="text-sm text-foreground">{normalizeString(comment.text ?? comment.value, '')}</div>
                {comment.timestamp && <div className="text-[10px] text-muted-foreground">{comment.timestamp}</div>}
              </div>
            ))
          ) : props.showEmptyState ? (
            <div className="space-y-1 text-xs text-muted-foreground">
              <div className="font-medium">{props.emptyTitle}</div>
              <div>{props.emptyDescription}</div>
            </div>
          ) : null}
        </div>
        <div className="border-t border-border/40 px-3 py-2">
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
})
