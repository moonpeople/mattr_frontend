'use client'

import * as SliderPrimitive from '@radix-ui/react-slider'
import * as React from 'react'

import { cn } from 'ui'

import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip'

export type SliderThumbVariant = 'circle' | 'bar'
export type SliderTrackSize = 'sm' | 'md' | 'lg' | 'xl'

type SliderProps = React.ComponentProps<typeof SliderPrimitive.Root> & {
  showTooltip?: boolean
  tooltipContent?: (value: number) => React.ReactNode
  thumbVariant?: SliderThumbVariant
  trackSize?: SliderTrackSize
}

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  showTooltip = false,
  tooltipContent,
  thumbVariant = 'circle',
  trackSize = 'md',
  ...props
}: SliderProps) {
  const [internalValues, setInternalValues] = React.useState<number[]>(
    Array.isArray(value) ? value : Array.isArray(defaultValue) ? defaultValue : [min, max]
  )

  React.useEffect(() => {
    if (value !== undefined) {
      setInternalValues(Array.isArray(value) ? value : [value])
    }
  }, [value])

  const handleValueChange = (newValue: number[]) => {
    setInternalValues(newValue)
    props.onValueChange?.(newValue)
  }

  const [isTooltipOpen, setIsTooltipOpen] = React.useState(false)
  const activeThumbIndexRef = React.useRef<number | null>(null)

  const handlePointerDown = (index: number) => {
    if (!showTooltip) {
      return
    }
    activeThumbIndexRef.current = index
    setIsTooltipOpen(true)
  }

  const handlePointerUp = React.useCallback(() => {
    if (!showTooltip) {
      return
    }
    activeThumbIndexRef.current = null
    setIsTooltipOpen(false)
  }, [showTooltip])

  React.useEffect(() => {
    if (!showTooltip) {
      return
    }
    document.addEventListener('pointerup', handlePointerUp)
    return () => {
      document.removeEventListener('pointerup', handlePointerUp)
    }
  }, [handlePointerUp, showTooltip])

  const thumbBaseClass =
    thumbVariant === 'bar'
      ? 'h-6 w-4 rounded border shadow-sm outline-none ring-ring/50 transition-[color,box-shadow] hover:ring-4 focus-visible:ring-4 disabled:pointer-events-none disabled:opacity-50'
      : 'block size-4 shrink-0 rounded-full border shadow-sm outline-none ring-ring/50 transition-[color,box-shadow] hover:ring-4 focus-visible:ring-4 disabled:pointer-events-none disabled:opacity-50'

  const trackSizeClass =
    trackSize === 'sm' ? 4 : trackSize === 'lg' ? 8 : trackSize === 'xl' ? 10 : 6

  const orientation = props.orientation ?? 'horizontal'
  const isVertical = orientation === 'vertical'

  const trackStyle: React.CSSProperties = {
    backgroundColor: 'hsl(var(--muted, 210 40% 96.1%))',
    ...(isVertical ? { width: `${trackSizeClass}px` } : { height: `${trackSizeClass}px` }),
  }

  const rangeStyle: React.CSSProperties = {
    backgroundColor: 'hsl(var(--primary, 221.2 83.2% 53.3%))',
    ...(isVertical ? { width: '100%' } : { height: '100%' }),
  }

  const renderThumb = (current: number, index: number) => {
    const thumb = (
      <SliderPrimitive.Thumb
        className={thumbBaseClass}
        data-slot="slider-thumb"
        onPointerDown={() => handlePointerDown(index)}
        style={{
          borderColor: 'hsl(var(--primary, 221.2 83.2% 53.3%))',
          backgroundColor: 'hsl(var(--background, 0 0% 100%))',
        }}
      />
    )

    if (!showTooltip) {
      return thumb
    }

    const isActive = isTooltipOpen && activeThumbIndexRef.current === index

    return (
      <Tooltip open={isActive}>
        <TooltipTrigger asChild>{thumb}</TooltipTrigger>
        <TooltipContent
          className="px-2 py-1 text-xs"
          side={props.orientation === 'vertical' ? 'right' : 'top'}
          sideOffset={8}
        >
          <p>{tooltipContent ? tooltipContent(current) : current}</p>
        </TooltipContent>
      </Tooltip>
    )
  }

  return (
    <SliderPrimitive.Root
      className={cn(
        'relative flex touch-none select-none',
        isVertical ? 'h-full min-h-44 w-auto flex-col' : 'w-full items-center',
        'data-[disabled]:opacity-50',
        className
      )}
      data-slot="slider"
      defaultValue={defaultValue}
      max={max}
      min={min}
      onValueChange={handleValueChange}
      value={value}
      {...props}
    >
      <SliderPrimitive.Track
        className={cn(
          'relative grow overflow-hidden rounded-full',
          isVertical ? 'h-full' : 'w-full'
        )}
        data-slot="slider-track"
        style={trackStyle}
      >
        <SliderPrimitive.Range
          className="absolute"
          data-slot="slider-range"
          style={rangeStyle}
        />
      </SliderPrimitive.Track>

      {Array.from({ length: internalValues.length }, (_, index) => (
        <React.Fragment key={String(index)}>
          {renderThumb(internalValues[index] ?? min, index)}
        </React.Fragment>
      ))}
    </SliderPrimitive.Root>
  )
}

export { Slider }
