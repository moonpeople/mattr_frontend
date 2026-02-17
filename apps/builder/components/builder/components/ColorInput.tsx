import type { PointerEvent as ReactPointerEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'

import { PopoverContent_Shadcn_, PopoverTrigger_Shadcn_, Popover_Shadcn_, cn } from 'ui'

type RgbaColor = { r: number; g: number; b: number; a: number }
type HsvColor = { h: number; s: number; v: number }

const COLOR_INPUT_HEX_REGEX =
  /^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{4}$|^[0-9a-fA-F]{6}$|^[0-9a-fA-F]{8}$/

const clampNumber = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

const expandHex = (value: string) => value.split('').map((char) => char + char).join('')

const parseHexColor = (value: string): RgbaColor | null => {
  const trimmed = value.trim().replace('#', '')
  if (!COLOR_INPUT_HEX_REGEX.test(trimmed)) {
    return null
  }
  let hex = trimmed
  if (hex.length === 3 || hex.length === 4) {
    hex = expandHex(hex)
  }
  let alpha = 1
  if (hex.length === 8) {
    alpha = parseInt(hex.slice(6, 8), 16) / 255
    hex = hex.slice(0, 6)
  }
  if (hex.length !== 6) {
    return null
  }
  const r = parseInt(hex.slice(0, 2), 16)
  const g = parseInt(hex.slice(2, 4), 16)
  const b = parseInt(hex.slice(4, 6), 16)
  return { r, g, b, a: clampNumber(alpha, 0, 1) }
}

const parseRgbChannel = (value: string) => {
  const trimmed = value.trim()
  if (!trimmed) {
    return null
  }
  if (trimmed.endsWith('%')) {
    const percent = Number(trimmed.replace('%', ''))
    if (Number.isNaN(percent)) {
      return null
    }
    return clampNumber(Math.round((percent / 100) * 255), 0, 255)
  }
  const num = Number(trimmed)
  if (Number.isNaN(num)) {
    return null
  }
  return clampNumber(Math.round(num), 0, 255)
}

const parseAlphaChannel = (value: string) => {
  const trimmed = value.trim()
  if (!trimmed) {
    return null
  }
  if (trimmed.endsWith('%')) {
    const percent = Number(trimmed.replace('%', ''))
    if (Number.isNaN(percent)) {
      return null
    }
    return clampNumber(percent / 100, 0, 1)
  }
  const num = Number(trimmed)
  if (Number.isNaN(num)) {
    return null
  }
  return clampNumber(num, 0, 1)
}

const parseRgbColor = (value: string): RgbaColor | null => {
  const match = value.match(/rgba?\((.*)\)/i)
  if (!match) {
    return null
  }
  const body = match[1]
    .replace(/\s*\/\s*/g, ',')
    .replace(/\s+/g, ' ')
    .trim()
  const parts = body.split(/[, ]+/).filter(Boolean)
  if (parts.length < 3) {
    return null
  }
  const r = parseRgbChannel(parts[0])
  const g = parseRgbChannel(parts[1])
  const b = parseRgbChannel(parts[2])
  if (r === null || g === null || b === null) {
    return null
  }
  const alpha = parts[3] ? parseAlphaChannel(parts[3]) ?? 1 : 1
  return { r, g, b, a: alpha }
}

const parseHslColor = (value: string): RgbaColor | null => {
  const match = value.match(/hsla?\((.*)\)/i)
  const raw = match ? match[1] : value
  const [triplet] = raw.split('/')
  const parts = triplet.trim().replace(/\s+/g, ' ').split(/[, ]+/).filter(Boolean)
  if (parts.length < 3) {
    return null
  }
  const h = Number(parts[0].replace('deg', ''))
  const s = Number(parts[1].replace('%', ''))
  const l = Number(parts[2].replace('%', ''))
  if ([h, s, l].some((num) => Number.isNaN(num))) {
    return null
  }
  const alpha =
    parts[3] && parts[3].trim() ? parseAlphaChannel(parts[3]) ?? 1 : 1
  const normalizedS = clampNumber(s / 100, 0, 1)
  const normalizedL = clampNumber(l / 100, 0, 1)
  const c = (1 - Math.abs(2 * normalizedL - 1)) * normalizedS
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = normalizedL - c / 2
  let r = 0
  let g = 0
  let b = 0
  if (h >= 0 && h < 60) {
    r = c
    g = x
  } else if (h < 120) {
    r = x
    g = c
  } else if (h < 180) {
    g = c
    b = x
  } else if (h < 240) {
    g = x
    b = c
  } else if (h < 300) {
    r = x
    b = c
  } else {
    r = c
    b = x
  }
  return {
    r: clampNumber(Math.round((r + m) * 255), 0, 255),
    g: clampNumber(Math.round((g + m) * 255), 0, 255),
    b: clampNumber(Math.round((b + m) * 255), 0, 255),
    a: alpha,
  }
}

const rgbToHex = (color: RgbaColor) =>
  [color.r, color.g, color.b]
    .map((channel) => channel.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()

const rgbToHsv = (color: RgbaColor): HsvColor => {
  const r = color.r / 255
  const g = color.g / 255
  const b = color.b / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const delta = max - min
  let h = 0
  if (delta !== 0) {
    if (max === r) {
      h = ((g - b) / delta) % 6
    } else if (max === g) {
      h = (b - r) / delta + 2
    } else {
      h = (r - g) / delta + 4
    }
    h *= 60
    if (h < 0) {
      h += 360
    }
  }
  const s = max === 0 ? 0 : delta / max
  return { h, s, v: max }
}

const hsvToRgb = (color: HsvColor): RgbaColor => {
  const h = color.h
  const s = clampNumber(color.s, 0, 1)
  const v = clampNumber(color.v, 0, 1)
  const c = v * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = v - c
  let r = 0
  let g = 0
  let b = 0
  if (h >= 0 && h < 60) {
    r = c
    g = x
  } else if (h < 120) {
    r = x
    g = c
  } else if (h < 180) {
    g = c
    b = x
  } else if (h < 240) {
    g = x
    b = c
  } else if (h < 300) {
    r = x
    b = c
  } else {
    r = c
    b = x
  }
  return {
    r: clampNumber(Math.round((r + m) * 255), 0, 255),
    g: clampNumber(Math.round((g + m) * 255), 0, 255),
    b: clampNumber(Math.round((b + m) * 255), 0, 255),
    a: 1,
  }
}

const parseColorValue = (value: string) => {
  const raw = value.trim()
  if (!raw || raw === 'Generated' || raw === 'No color') {
    return { raw, hex: '', alpha: 1, valid: false }
  }
  const hexParsed = parseHexColor(raw)
  if (hexParsed) {
    return { raw, hex: rgbToHex(hexParsed), alpha: hexParsed.a, valid: true }
  }
  const rgbParsed = parseRgbColor(raw) ?? parseHslColor(raw)
  if (rgbParsed) {
    return { raw, hex: rgbToHex(rgbParsed), alpha: rgbParsed.a, valid: true }
  }
  return { raw, hex: raw.replace('#', ''), alpha: 1, valid: false }
}

export const swatchFromValue = (value: string) => {
  if (!value) {
    return 'transparent'
  }
  const trimmed = value.trim()
  if (!trimmed) {
    return 'transparent'
  }
  if (trimmed === 'Generated' || trimmed === 'No color') {
    return 'transparent'
  }
  if (
    trimmed.startsWith('#') ||
    trimmed.startsWith('hsl(') ||
    trimmed.startsWith('hsla(') ||
    trimmed.startsWith('rgb(') ||
    trimmed.startsWith('rgba(') ||
    trimmed.startsWith('var(')
  ) {
    return trimmed
  }
  if (COLOR_INPUT_HEX_REGEX.test(trimmed)) {
    return `#${trimmed}`
  }
  return trimmed
}

type ColorInputProps = {
  value: string
  onChange: (next: string) => void
  placeholder?: string
  disabled?: boolean
  pickerMode?: 'popover' | 'inline'
}

export const ColorInput = ({
  value,
  onChange,
  placeholder,
  disabled = false,
  pickerMode = 'popover',
}: ColorInputProps) => {
  const [open, setOpen] = useState(false)
  const inlinePicker = pickerMode === 'inline'
  const parsed = useMemo(() => parseColorValue(value), [value])
  const fallback = useMemo(() => parseColorValue(placeholder ?? ''), [placeholder])
  const effective = parsed.valid ? parsed : fallback.valid ? fallback : null
  const [picker, setPicker] = useState<HsvColor>(() => {
    if (effective) {
      return rgbToHsv({
        r: parseInt(effective.hex.slice(0, 2), 16),
        g: parseInt(effective.hex.slice(2, 4), 16),
        b: parseInt(effective.hex.slice(4, 6), 16),
        a: effective.alpha,
      })
    }
    return { h: 210, s: 0.7, v: 0.6 }
  })
  const [alpha, setAlpha] = useState<number>(effective?.alpha ?? 1)
  const [opacityInput, setOpacityInput] = useState(
    `${Math.round(clampNumber(alpha, 0, 1) * 100)}%`
  )
  const [opacityFocused, setOpacityFocused] = useState(false)

  useEffect(() => {
    if (effective) {
      setPicker(
        rgbToHsv({
          r: parseInt(effective.hex.slice(0, 2), 16),
          g: parseInt(effective.hex.slice(2, 4), 16),
          b: parseInt(effective.hex.slice(4, 6), 16),
          a: effective.alpha,
        })
      )
      setAlpha(effective.alpha)
    }
  }, [effective?.hex, effective?.alpha])

  useEffect(() => {
    if (!opacityFocused) {
      setOpacityInput(`${Math.round(clampNumber(alpha, 0, 1) * 100)}%`)
    }
  }, [alpha, opacityFocused])

  const swatch = swatchFromValue(value || placeholder || '')
  const normalizedRaw = value.trim().replace('#', '')
  const isShortHex =
    COLOR_INPUT_HEX_REGEX.test(normalizedRaw) && normalizedRaw.length <= 4
  const displayHex = value
    ? isShortHex
      ? normalizedRaw.toUpperCase()
      : parsed.valid
        ? parsed.hex
        : parsed.raw.replace('#', '')
    : ''
  const pickerRgb = hsvToRgb(picker)

  const commitColor = (nextHsv: HsvColor, nextAlpha: number) => {
    const rgb = hsvToRgb(nextHsv)
    const hex = rgbToHex(rgb)
    const alphaHex =
      nextAlpha >= 0.999
        ? ''
        : Math.round(clampNumber(nextAlpha, 0, 1) * 255)
            .toString(16)
            .padStart(2, '0')
            .toUpperCase()
    onChange(`${hex}${alphaHex}`)
  }

  const handleHexChange = (nextValue: string) => {
    const raw = nextValue.trim()
    if (!raw) {
      onChange('')
      return
    }
    const normalized = raw.replace('#', '')
    if (COLOR_INPUT_HEX_REGEX.test(normalized)) {
      const upper = normalized.toUpperCase()
      if (upper.length === 6 && alpha < 0.999) {
        const alphaHex = Math.round(clampNumber(alpha, 0, 1) * 255)
          .toString(16)
          .padStart(2, '0')
          .toUpperCase()
        onChange(`${upper}${alphaHex}`)
        return
      }
      onChange(upper)
      return
    }
    onChange(raw)
  }

  const handleOpacityChange = (nextValue: string) => {
    const trimmed = nextValue.trim()
    setOpacityInput(nextValue)
    if (!trimmed) {
      return
    }
    const numeric = trimmed.endsWith('%') ? trimmed.replace('%', '') : trimmed
    if (!/^\d+(\.\d+)?$/.test(numeric)) {
      return
    }
    const parsedNumber = Number(numeric)
    if (Number.isNaN(parsedNumber)) {
      return
    }
    const nextAlpha = clampNumber(parsedNumber / 100, 0, 1)
    setAlpha(nextAlpha)
    commitColor(picker, nextAlpha)
  }

  const normalizeOpacityInput = () => {
    const trimmed = opacityInput.trim()
    if (!trimmed) {
      setAlpha(1)
      commitColor(picker, 1)
      setOpacityInput('100%')
      return
    }
    const numeric = trimmed.endsWith('%') ? trimmed.replace('%', '') : trimmed
    const parsedNumber = Number(numeric)
    if (Number.isNaN(parsedNumber)) {
      setOpacityInput(`${Math.round(clampNumber(alpha, 0, 1) * 100)}%`)
      return
    }
    const nextAlpha = clampNumber(parsedNumber / 100, 0, 1)
    setAlpha(nextAlpha)
    commitColor(picker, nextAlpha)
    setOpacityInput(`${Math.round(nextAlpha * 100)}%`)
  }

  const updateSaturation = (event: ReactPointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = clampNumber((event.clientX - rect.left) / rect.width, 0, 1)
    const y = clampNumber((event.clientY - rect.top) / rect.height, 0, 1)
    const next = { ...picker, s: x, v: 1 - y }
    setPicker(next)
    commitColor(next, alpha)
  }

  const updateHue = (event: ReactPointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = clampNumber((event.clientX - rect.left) / rect.width, 0, 1)
    const next = { ...picker, h: x * 360 }
    setPicker(next)
    commitColor(next, alpha)
  }

  const updateAlpha = (event: ReactPointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = clampNumber((event.clientX - rect.left) / rect.width, 0, 1)
    setAlpha(x)
    commitColor(picker, x)
  }

  const swatchPreview = (
    <span
      className="relative h-5 w-5 overflow-hidden rounded border border-foreground-muted/40"
      style={{
        backgroundImage:
          'linear-gradient(45deg, rgba(0,0,0,0.12) 25%, transparent 25%), linear-gradient(-45deg, rgba(0,0,0,0.12) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(0,0,0,0.12) 75%), linear-gradient(-45deg, transparent 75%, rgba(0,0,0,0.12) 75%)',
        backgroundSize: '8px 8px',
        backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px',
      }}
    >
      <span className="absolute inset-0" style={{ backgroundColor: swatch }} />
    </span>
  )

  const swatchTrigger = inlinePicker ? (
    <div
      className={cn(
        'flex h-full w-9 items-center justify-center border-r border-foreground-muted/30',
        disabled ? 'cursor-not-allowed' : ''
      )}
    >
      {swatchPreview}
    </div>
  ) : (
    <PopoverTrigger_Shadcn_ asChild>
      <button
        type="button"
        className={cn(
          'flex h-full w-9 items-center justify-center border-r border-foreground-muted/30',
          disabled ? 'cursor-not-allowed' : 'hover:bg-surface-200'
        )}
        disabled={disabled}
      >
        {swatchPreview}
      </button>
    </PopoverTrigger_Shadcn_>
  )

  const inputRow = (
    <div
      className={cn(
        'flex h-8 items-center overflow-hidden rounded-md border border-foreground-muted/30 bg-background',
        disabled && 'opacity-60'
      )}
    >
      {swatchTrigger}
      <input
        value={displayHex}
        onChange={(event) => handleHexChange(event.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        spellCheck={false}
        className="h-full w-24 bg-transparent px-2 text-[11px] font-medium text-foreground outline-none placeholder:text-foreground-muted"
      />
      <div className="h-5 w-px bg-foreground-muted/30" />
      <input
        value={opacityInput}
        onChange={(event) => handleOpacityChange(event.target.value)}
        disabled={disabled}
        onFocus={() => setOpacityFocused(true)}
        onBlur={() => {
          setOpacityFocused(false)
          normalizeOpacityInput()
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.currentTarget.blur()
          }
        }}
        inputMode="numeric"
        spellCheck={false}
        className="h-full w-12 bg-transparent px-2 text-right text-[11px] text-foreground outline-none"
      />
    </div>
  )

  const pickerPanel = (
    <div className="space-y-2">
      <div
        className="relative h-36 w-full touch-none overflow-hidden rounded-md"
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId)
          updateSaturation(event)
        }}
        onPointerMove={(event) => {
          if (event.buttons === 0) {
            return
          }
          updateSaturation(event)
        }}
      >
        <div
          className="absolute inset-0"
          style={{ backgroundColor: `hsl(${picker.h} 100% 50%)` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-white to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
        <div
          className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow"
          style={{
            left: `${picker.s * 100}%`,
            top: `${(1 - picker.v) * 100}%`,
            height: '12px',
            width: '12px',
          }}
        />
      </div>

      <div className="space-y-3">
        <div
          className="relative h-3 w-full cursor-pointer touch-none rounded-full"
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId)
            updateHue(event)
          }}
          onPointerMove={(event) => {
            if (event.buttons === 0) {
              return
            }
            updateHue(event)
          }}
        >
          <div className="absolute inset-0 rounded-full bg-[linear-gradient(to_right,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)]" />
          <div
            className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white bg-background shadow"
            style={{ left: `${(picker.h / 360) * 100}%`, height: '12px', width: '12px' }}
          />
        </div>

        <div
          className="relative h-3 w-full cursor-pointer touch-none rounded-full"
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId)
            updateAlpha(event)
          }}
          onPointerMove={(event) => {
            if (event.buttons === 0) {
              return
            }
            updateAlpha(event)
          }}
        >
          <div
            className="absolute inset-0 rounded-full"
            style={{
              backgroundImage:
                'linear-gradient(45deg, rgba(0,0,0,0.12) 25%, transparent 25%), linear-gradient(-45deg, rgba(0,0,0,0.12) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(0,0,0,0.12) 75%), linear-gradient(-45deg, transparent 75%, rgba(0,0,0,0.12) 75%)',
              backgroundSize: '8px 8px',
              backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px',
            }}
          />
          <div
            className="absolute inset-0 rounded-full"
            style={{
              backgroundImage: `linear-gradient(to right, rgba(${pickerRgb.r}, ${pickerRgb.g}, ${pickerRgb.b}, 0), rgba(${pickerRgb.r}, ${pickerRgb.g}, ${pickerRgb.b}, 1))`,
            }}
          />
          <div
            className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white bg-background shadow"
            style={{ left: `${alpha * 100}%`, height: '12px', width: '12px' }}
          />
        </div>
      </div>
    </div>
  )

  if (inlinePicker) {
    return (
      <div className="space-y-3">
        {inputRow}
        <div className="w-full space-y-3 rounded-lg border border-foreground-muted/30 bg-background p-3 shadow-lg">
          {pickerPanel}
        </div>
      </div>
    )
  }

  return (
    <Popover_Shadcn_
      open={open}
      onOpenChange={(next) => {
        if (disabled) {
          return
        }
        setOpen(next)
      }}
    >
      {inputRow}
      <PopoverContent_Shadcn_
        side="right"
        align="start"
        sideOffset={12}
        className="w-72 space-y-3 rounded-lg border border-foreground-muted/30 bg-background p-3 shadow-lg"
      >
        {pickerPanel}
      </PopoverContent_Shadcn_>
    </Popover_Shadcn_>
  )
}
