import type { CSSProperties } from 'react'

import {
  GLOBAL_WIDGET_STYLE_COLOR_KEYS,
  GLOBAL_WIDGET_STYLE_VAR_MAP,
} from 'widgets/inspector/widgetStyleFields'

const HSL_TRIPLET_RE = /^\d+(?:\.\d+)?\s+\d+(?:\.\d+)?%\s+\d+(?:\.\d+)?%$/
const HEX_RE = /^#?(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/
const VAR_REF_RE = /^var\((--[A-Za-z0-9-_]+)\)$/
const HSL_VAR_REF_RE = /^hsl\(\s*var\((--[A-Za-z0-9-_]+)\)\s*(?:\/[^)]*)?\)$/
const HSL_RE = /^hsl\((.*)\)$/
const RGB_RE = /^rgba?\((.*)\)$/

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

const toRounded = (value: number) => {
  const rounded = Math.round(value * 10) / 10
  return Number.isInteger(rounded) ? `${rounded}` : `${rounded}`
}

const normalizeHex = (raw: string) => {
  const normalized = raw.trim().replace('#', '')
  if (!HEX_RE.test(raw.trim())) {
    return ''
  }
  if (normalized.length === 3 || normalized.length === 4) {
    const expanded = normalized
      .split('')
      .map((char) => char + char)
      .join('')
    return `#${expanded.slice(0, 6)}`
  }
  if (normalized.length === 8) {
    return `#${normalized.slice(0, 6)}`
  }
  if (normalized.length === 6) {
    return `#${normalized}`
  }
  return ''
}

const hexToHslTriplet = (raw: string) => {
  const hex = normalizeHex(raw)
  if (!hex) {
    return ''
  }
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  let h = 0
  let s = 0
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      default:
        h = (r - g) / d + 4
        break
    }
    h *= 60
  }
  return `${toRounded(h)} ${toRounded(s * 100)}% ${toRounded(l * 100)}%`
}

const rgbToHslTriplet = (raw: string) => {
  const match = raw.trim().match(RGB_RE)
  if (!match) {
    return ''
  }
  const [triplet] = match[1].split('/')
  const channels = triplet
    .trim()
    .replace(/\s+/g, ' ')
    .split(/[, ]+/)
    .filter(Boolean)
    .slice(0, 3)
  if (channels.length !== 3) {
    return ''
  }
  const parseChannel = (value: string) => {
    const normalized = value.trim()
    if (!normalized) {
      return NaN
    }
    if (normalized.endsWith('%')) {
      const percent = Number(normalized.slice(0, -1))
      if (!Number.isFinite(percent)) {
        return NaN
      }
      return clamp(Math.round((percent / 100) * 255), 0, 255)
    }
    const numeric = Number(normalized)
    if (!Number.isFinite(numeric)) {
      return NaN
    }
    return clamp(Math.round(numeric), 0, 255)
  }
  const rInt = parseChannel(channels[0])
  const gInt = parseChannel(channels[1])
  const bInt = parseChannel(channels[2])
  if (![rInt, gInt, bInt].every((value) => Number.isFinite(value))) {
    return ''
  }
  const r = rInt / 255
  const g = gInt / 255
  const b = bInt / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  let h = 0
  let s = 0
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      default:
        h = (r - g) / d + 4
        break
    }
    h *= 60
  }
  return `${toRounded(h)} ${toRounded(s * 100)}% ${toRounded(l * 100)}%`
}

const normalizeHslTriplet = (raw: string) => {
  const normalized = raw.trim().replace(/deg/g, '')
  const [triplet] = normalized.split('/')
  const compact = triplet
    .replace(/,/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return HSL_TRIPLET_RE.test(compact) ? compact : ''
}

const toThemeColorValue = (raw: string) => {
  const value = raw.trim()
  if (!value) {
    return ''
  }

  const varMatch = value.match(VAR_REF_RE)
  if (varMatch) {
    return `var(${varMatch[1]})`
  }

  const hslVarMatch = value.match(HSL_VAR_REF_RE)
  if (hslVarMatch) {
    return `var(${hslVarMatch[1]})`
  }

  const directTriplet = normalizeHslTriplet(value)
  if (directTriplet) {
    return directTriplet
  }

  const hslMatch = value.match(HSL_RE)
  if (hslMatch) {
    const hslTriplet = normalizeHslTriplet(hslMatch[1])
    if (hslTriplet) {
      return hslTriplet
    }
  }

  const rgbTriplet = rgbToHslTriplet(value)
  if (rgbTriplet) {
    return rgbTriplet
  }

  const hexTriplet = hexToHslTriplet(value)
  if (hexTriplet) {
    return hexTriplet
  }

  return ''
}

const normalizeWidgetStyleValue = (key: string, raw: unknown) => {
  if (typeof raw !== 'string') {
    return ''
  }
  const trimmed = raw.trim()
  if (!trimmed) {
    return ''
  }
  if (GLOBAL_WIDGET_STYLE_COLOR_KEYS.has(key)) {
    return toThemeColorValue(trimmed)
  }
  return trimmed
}

export const resolveWidgetStyleScopeVars = (
  props: Record<string, unknown> | null | undefined
): CSSProperties | undefined => {
  if (!props) {
    return undefined
  }
  const cssVars: Record<string, string> = {}
  Object.entries(GLOBAL_WIDGET_STYLE_VAR_MAP).forEach(([propKey, cssVar]) => {
    const normalized = normalizeWidgetStyleValue(propKey, props[propKey])
    if (!normalized) {
      return
    }
    cssVars[cssVar] = normalized
  })
  return Object.keys(cssVars).length > 0 ? (cssVars as CSSProperties) : undefined
}
