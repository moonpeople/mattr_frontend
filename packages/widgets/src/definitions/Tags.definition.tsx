import { Badge } from 'ui'

import { normalizeArray, parseMaybeJson } from '../helpers'
import { createWidgetDefinition } from '../types'

export type TagsProps = {
  values: string
  allowWrap: boolean
  events: string
}

export const TagsDefinition = createWidgetDefinition<TagsProps>({
  type: 'Tags',
  label: 'Tags',
  category: 'data',
  description: 'Display a list of tags',
  defaultProps: {
    values: '["Tag 1","Tag 2","Tag 3"]',
    allowWrap: true,
    events: '[]',
  },
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
})
