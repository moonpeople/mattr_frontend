import { useEffect, useState } from 'react'

import { createWidgetDefinition } from '../types'

const formatDuration = (totalMs: number) => {
  const totalSeconds = Math.max(0, Math.floor(totalMs / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const parts = [hours, minutes, seconds].map((value) => String(value).padStart(2, '0'))
  return parts.join(':')
}

export type TimerProps = {
  elapsedMs: number
  isRunning: boolean
  interval: number
  helperText: string
}

const TimerView = ({
  elapsedMs,
  isRunning,
  intervalMs,
}: {
  elapsedMs: number
  isRunning: boolean
  intervalMs: number
}) => {
  const [elapsed, setElapsed] = useState(elapsedMs)

  useEffect(() => {
    setElapsed(elapsedMs)
  }, [elapsedMs])

  useEffect(() => {
    if (!isRunning) {
      return undefined
    }
    const tick = Math.max(100, intervalMs)
    const id = window.setInterval(() => {
      setElapsed((prev) => prev + tick)
    }, tick)
    return () => window.clearInterval(id)
  }, [isRunning, intervalMs])

  return (
    <div className="rounded border border-border/40 bg-card px-3 py-2 text-center font-mono text-lg">
      {formatDuration(elapsed)}
    </div>
  )
}

export const TimerDefinition = createWidgetDefinition<TimerProps>({
  type: 'Timer',
  label: 'Timer',
  category: 'presentation',
  description: 'Elapsed time indicator',
  defaultProps: {
    elapsedMs: 0,
    isRunning: false,
    interval: 1000,
    helperText: '',
  },
  render: (props, context) => {
    const elapsedRaw = context?.state?.elapsedMs ?? props.elapsedMs
    const elapsed = typeof elapsedRaw === 'number' ? elapsedRaw : Number(elapsedRaw) || 0

    return (
      <div className="space-y-2">
        <TimerView elapsedMs={elapsed} isRunning={props.isRunning} intervalMs={props.interval} />
        <div className="text-xs text-muted-foreground">{props.isRunning ? 'Running' : 'Paused'}</div>
        {props.helperText && <div className="text-xs text-muted-foreground">{props.helperText}</div>}
      </div>
    )
  },
})
