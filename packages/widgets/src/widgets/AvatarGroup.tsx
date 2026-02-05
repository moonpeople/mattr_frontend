import { Avatar, AvatarFallback, AvatarImage } from 'ui'

import type { WidgetDefinition } from '../types'
import { normalizeArray, parseMaybeJson } from '../helpers'

type AvatarGroupItem = {
  name?: string
  src?: string
}

type AvatarGroupProps = {
  images: string
  fallbacks: string
  maxItems: number
  size: number
}

const normalizeItems = (raw: unknown): AvatarGroupItem[] => {
  const parsed = normalizeArray<AvatarGroupItem | string>(parseMaybeJson(raw), [])
  if (parsed.length === 0) {
    return []
  }
  if (typeof parsed[0] === 'string') {
    return (parsed as string[]).map((src) => ({ src }))
  }
  return parsed as AvatarGroupItem[]
}

const normalizeFallbacks = (raw: unknown): string[] => {
  const parsed = parseMaybeJson(raw)
  if (Array.isArray(parsed)) {
    return parsed.map((item) => String(item))
  }
  if (typeof raw === 'string') {
    const trimmed = raw.trim()
    if (!trimmed) {
      return []
    }
    const normalized = trimmed.replace(/'/g, '"')
    try {
      const parsedAlt = JSON.parse(normalized)
      if (Array.isArray(parsedAlt)) {
        return parsedAlt.map((item) => String(item))
      }
    } catch {
      return trimmed.split(',').map((item) => item.trim())
    }
  }
  return []
}

const getInitials = (value: string) => {
  const parts = value
    .split(' ')
    .map((chunk) => chunk.trim())
    .filter(Boolean)
  const initials = parts.map((chunk) => chunk[0]).slice(0, 2).join('')
  return initials.toUpperCase() || 'U'
}

export const AvatarGroupWidget: WidgetDefinition<AvatarGroupProps> = {
  type: 'AvatarGroup',
  label: 'Avatar Group',
  category: 'presentation',
  description: 'Group of avatars',
  defaultProps: {
    images: '[]',
    fallbacks: "['Hanson Deck','Sue Shei','Jason Response','Cher Actor','Erica Widget']",
    maxItems: 5,
    size: 32,
  },
  fields: [
    {
      key: 'images',
      label: 'Images (JSON)',
      type: 'json',
      placeholder: '[{\"src\":\"https://...\",\"name\":\"Name\"}]',
    },
    {
      key: 'fallbacks',
      label: 'Fallbacks (JSON)',
      type: 'json',
      placeholder: '[\"Hanson Deck\",\"Sue Shei\"]',
    },
    { key: 'maxItems', label: 'Max items', type: 'number', min: 1, max: 12, step: 1 },
    { key: 'size', label: 'Size', type: 'number', min: 20, max: 64, step: 4 },
  ],
  render: (props) => {
    const images = normalizeItems(props.images)
    const fallbacks = normalizeFallbacks(props.fallbacks)
    const items =
      images.length > 0
        ? images
        : fallbacks.map((name) => ({ name }))
    const maxItems = props.maxItems && props.maxItems > 0 ? props.maxItems : items.length
    const visible = items.slice(0, maxItems)
    const overflow = items.length - visible.length

    return (
      <div className="flex items-center -space-x-2">
        {visible.map((item, index) => {
          const name = item.name ?? fallbacks[index] ?? 'User'
          return (
            <Avatar
              key={`${name}-${index}`}
              className="border-2 border-background"
              style={{ height: props.size, width: props.size }}
            >
              {item.src ? <AvatarImage src={item.src} alt={name} /> : null}
              <AvatarFallback>{getInitials(name)}</AvatarFallback>
            </Avatar>
          )
        })}
        {overflow > 0 && (
          <Avatar
            className="border-2 border-background bg-muted text-xs"
            style={{ height: props.size, width: props.size }}
          >
            <AvatarFallback>{`+${overflow}`}</AvatarFallback>
          </Avatar>
        )}
      </div>
    )
  },
}
