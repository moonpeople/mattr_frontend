import { Badge } from 'ui'

import type { WidgetDefinition } from '../types'
import { normalizeArray, parseMaybeJson } from '../helpers'

type TagsProps = {
  values: string
  allowWrap: boolean
  events: string
}

export const TagsWidget: WidgetDefinition<TagsProps> = {
  type: 'Tags',
  label: 'Tags',
  category: 'data',
  description: 'Display a list of tags',
  defaultProps: {
    values: '["Tag 1","Tag 2","Tag 3"]',
    allowWrap: true,
    events: '[]',
  },
  fields: [
    {
      key: 'values',
      label: 'Tags (JSON)',
      type: 'json',
      placeholder: '[\"Tag 1\",\"Tag 2\"]',
    },
    { key: 'allowWrap', label: 'Allow wrap', type: 'boolean' },
    {
      key: 'events',
      label: 'Events (JSON)',
      type: 'json',
      placeholder: '[{\"event\":\"click\",\"type\":\"query\",\"queryName\":\"onTag\"}]',
    },
  ],
  render: (props, context) => {
    const parsed = normalizeArray<string>(parseMaybeJson(props.values), [])
    const tags = parsed.length > 0 ? parsed : ['Tag 1', 'Tag 2', 'Tag 3']

    return (
      <div className={`flex gap-2 ${props.allowWrap ? 'flex-wrap' : 'flex-nowrap'}`}>
        {tags.map((tag, index) => (
          <button
            key={`${tag}-${index}`}
            type="button"
            onClick={() => context?.runActions?.('click', { value: tag, index })}
          >
            <Badge className="normal-case text-xs">{tag}</Badge>
          </button>
        ))}
      </div>
    )
  },
}
