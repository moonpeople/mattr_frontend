import type { WidgetInspectorConfig } from '../../types'
import { buildInspectorConfig } from '../fieldRegistry'

const fieldKeys = ['title', 'placeholder', 'emptyTitle', 'emptyDescription', 'comments', 'showEmptyState']

export const CommentThreadInspector: WidgetInspectorConfig = buildInspectorConfig(fieldKeys, {
  title: {
    placeholder: 'Comment Thread',
  },
  placeholder: {
    placeholder: 'Type a message',
  },
  emptyTitle: {
    placeholder: 'No comments here yet',
  },
  emptyDescription: {
    placeholder: 'Post your first comment',
  },
  comments: {
    placeholder: '[{"text":"Hello"}]',
  },
})
