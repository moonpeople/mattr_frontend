import type { CSSProperties } from 'react'

import type { WidgetRenderContext } from '../types'
import { renderWidgetIcon } from '../icon-library'
import { cn } from 'ui'

export type WidgetButtonSize = 'tiny' | 'small' | 'medium'
export type WidgetButtonVariant =
  | 'primary'
  | 'default'
  | 'secondary'
  | 'outline'
  | 'text'
  | 'danger'
  | 'destructive'
  | 'ghost'
  | 'link'

const BASE_BUTTON_CLASSES =
  'inline-flex items-center justify-center rounded-md border font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50'

const SIZE_CLASSES: Record<WidgetButtonSize, string> = {
  tiny: 'h-7 min-h-7 px-2 text-xs gap-1.5',
  small: 'h-8 min-h-8 px-3 text-sm gap-2',
  medium: 'h-10 min-h-10 px-4 text-sm gap-2',
}

const VARIANT_CLASSES: Record<WidgetButtonVariant, string> = {
  primary: 'bg-primary text-primary-foreground border-primary hover:bg-primary/90',
  default: 'bg-background text-foreground border-input hover:bg-accent hover:text-accent-foreground',
  secondary: 'bg-secondary text-secondary-foreground border-secondary hover:bg-secondary/80',
  outline: 'bg-background text-foreground border-input hover:bg-accent hover:text-accent-foreground',
  text: 'bg-transparent text-foreground border-transparent hover:bg-accent hover:text-accent-foreground',
  danger: 'bg-destructive text-destructive-foreground border-destructive hover:bg-destructive/90',
  destructive: 'bg-destructive text-destructive-foreground border-destructive hover:bg-destructive/90',
  ghost: 'bg-transparent text-foreground border-transparent hover:bg-accent hover:text-accent-foreground',
  link: 'bg-transparent text-primary border-transparent underline-offset-4 hover:underline px-0 h-auto min-h-0',
}

const tokenColor = (token: string, fallback: string) => `hsl(var(${token}, ${fallback}))`

const VARIANT_STYLES: Record<WidgetButtonVariant, CSSProperties> = {
  primary: {
    backgroundColor: tokenColor('--primary', '221.2 83.2% 53.3%'),
    color: tokenColor('--primary-foreground', '210 40% 98%'),
    borderColor: tokenColor('--primary', '221.2 83.2% 53.3%'),
  },
  default: {
    backgroundColor: tokenColor('--background', '0 0% 100%'),
    color: tokenColor('--foreground', '222.2 84% 4.9%'),
    borderColor: tokenColor('--input', '214.3 31.8% 91.4%'),
  },
  secondary: {
    backgroundColor: tokenColor('--secondary', '210 40% 96.1%'),
    color: tokenColor('--secondary-foreground', '222.2 47.4% 11.2%'),
    borderColor: tokenColor('--secondary', '210 40% 96.1%'),
  },
  outline: {
    backgroundColor: tokenColor('--background', '0 0% 100%'),
    color: tokenColor('--foreground', '222.2 84% 4.9%'),
    borderColor: tokenColor('--input', '214.3 31.8% 91.4%'),
  },
  text: {
    backgroundColor: 'transparent',
    color: tokenColor('--foreground', '222.2 84% 4.9%'),
    borderColor: 'transparent',
  },
  danger: {
    backgroundColor: tokenColor('--destructive', '0 84.2% 60.2%'),
    color: tokenColor('--destructive-foreground', '210 40% 98%'),
    borderColor: tokenColor('--destructive', '0 84.2% 60.2%'),
  },
  destructive: {
    backgroundColor: tokenColor('--destructive', '0 84.2% 60.2%'),
    color: tokenColor('--destructive-foreground', '210 40% 98%'),
    borderColor: tokenColor('--destructive', '0 84.2% 60.2%'),
  },
  ghost: {
    backgroundColor: 'transparent',
    color: tokenColor('--foreground', '222.2 84% 4.9%'),
    borderColor: 'transparent',
  },
  link: {
    backgroundColor: 'transparent',
    color: tokenColor('--primary', '221.2 83.2% 53.3%'),
    borderColor: 'transparent',
  },
}

const normalizeVariant = (variant?: string): WidgetButtonVariant => {
  const value = (variant ?? 'default').trim().toLowerCase()
  if (value === 'primary') return 'primary'
  if (value === 'default') return 'default'
  if (value === 'secondary') return 'secondary'
  if (value === 'outline') return 'outline'
  if (value === 'text') return 'text'
  if (value === 'danger') return 'danger'
  if (value === 'destructive') return 'destructive'
  if (value === 'ghost') return 'ghost'
  if (value === 'link') return 'link'
  return 'default'
}

const normalizeSize = (size?: string): WidgetButtonSize => {
  const value = (size ?? 'small').trim().toLowerCase()
  if (value === 'tiny') return 'tiny'
  if (value === 'small') return 'small'
  if (value === 'medium') return 'medium'
  return 'small'
}

export const getWidgetButtonClassName = (options?: {
  variant?: string
  size?: string
  pressed?: boolean
  fullWidth?: boolean
  className?: string
}) => {
  const variant = normalizeVariant(options?.variant)
  const size = normalizeSize(options?.size)
  return cn(
    BASE_BUTTON_CLASSES,
    options?.fullWidth ? 'w-full max-w-full' : '',
    SIZE_CLASSES[size],
    VARIANT_CLASSES[variant],
    options?.pressed ? 'ring-2 ring-ring ring-offset-1' : '',
    options?.className
  )
}

export const getWidgetButtonStyle = (options?: {
  variant?: string
  style?: CSSProperties
}): CSSProperties => {
  const variant = normalizeVariant(options?.variant)
  return {
    ...VARIANT_STYLES[variant],
    ...options?.style,
  }
}

export const getWidgetButtonIcon = (
  iconName: string | undefined,
  context: WidgetRenderContext | undefined,
  className = 'text-current',
  size = 14
) => {
  if (!iconName || iconName === 'none') {
    return null
  }
  return renderWidgetIcon(iconName, {
    library: context?.iconLibrary,
    className,
    size,
  })
}
